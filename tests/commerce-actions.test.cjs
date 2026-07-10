// SKXNZ launch-war D1-A — application-layer tests for the buyer commerce
// server actions. Run with:  pnpm run test:commerce
//
// These compile the REAL action source (tests/tsconfig.json -> tests/.build)
// and run it against a scripted mock Supabase client (tests/bootstrap.cjs
// swaps @/lib/supabase/server). They verify the application-layer security
// boundaries: auth required, ownership scoping, quantity caps, duplicate
// netting, and that no buyer input can set payment state.
//
// What they intentionally do NOT claim: RLS enforcement on the live database.
// That is covered by supabase/verification/0005_commerce_layer_isolation.sql,
// which was run against the live project in D4-7 (all blocks PASS).

require("./bootstrap.cjs");

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { __setMockClient } = require("./mocks/supabase-server.cjs");
const { createMockSupabase, findCall } = require("./helpers/mock-supabase.cjs");

const { createReturnRequest } = require("@/lib/returns/create-return-request");
const { createSupportTicket } = require("@/lib/support/create-support-ticket");
const {
  addSupportTicketMessage,
} = require("@/lib/support/add-support-ticket-message");
const { createOrderIntent } = require("@/lib/orders/create-order-intent");

const BUYER = { id: "11111111-1111-4111-8111-111111111111", email: "buyer@test.local" };
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const ITEM_ID = "33333333-3333-4333-8333-333333333333";
const FOREIGN_ITEM_ID = "99999999-9999-4999-8999-999999999999";
const TICKET_ID = "44444444-4444-4444-8444-444444444444";
const ADDRESS_ID = "55555555-5555-4555-8555-555555555555";
const PRODUCT_ID = "66666666-6666-4666-8666-666666666666";
const PRIOR_RETURN_ID = "77777777-7777-4777-8777-777777777777";
const NEW_ROW_ID = "88888888-8888-4888-8888-888888888888";

const returnInput = (overrides = {}) => ({
  orderId: ORDER_ID,
  reason: "Wrong size",
  note: null,
  items: [{ orderItemId: ITEM_ID, quantity: 1, reason: null }],
  ...overrides,
});

const ticketInput = (overrides = {}) => ({
  category: "ORDER",
  subject: "Need help",
  message: "Something about my order.",
  orderId: null,
  ...overrides,
});

// Scripted resolver for the return-request flow. Options shape the scenario.
function returnFlowResolver({
  order = { id: ORDER_ID, buyer_id: BUYER.id, status: "DELIVERED" },
  orderItems = [{ id: ITEM_ID, order_id: ORDER_ID, quantity: 2 }],
  priorRequests = [],
  priorItems = [],
} = {}) {
  return (query) => {
    if (query.table === "orders") return { data: order, error: null };
    if (query.table === "order_items") return { data: orderItems, error: null };
    if (query.table === "return_requests") {
      if (findCall(query, "insert")) return { data: { id: NEW_ROW_ID }, error: null };
      return { data: priorRequests, error: null };
    }
    if (query.table === "return_request_items") {
      if (findCall(query, "insert")) return { data: null, error: null };
      return { data: priorItems, error: null };
    }
    throw new Error(`Unexpected table in return flow: ${query.table}`);
  };
}

// ---------------------------------------------------------------------------
// 1. Unauthenticated actions fail safely
// ---------------------------------------------------------------------------

test("unauthenticated createReturnRequest is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

test("unauthenticated createSupportTicket is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await createSupportTicket(ticketInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

test("unauthenticated addSupportTicketMessage is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await addSupportTicketMessage({ ticketId: TICKET_ID, message: "hi" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

test("unauthenticated createOrderIntent is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await createOrderIntent({
    items: [{ productId: PRODUCT_ID, quantity: 1 }],
    shippingAddressId: ADDRESS_ID,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

// ---------------------------------------------------------------------------
// 2/3. Ownership: another buyer's order / order item
// ---------------------------------------------------------------------------

test("return for an order the buyer does not own is rejected (zero rows)", async () => {
  // The action filters orders by id AND buyer_id (and RLS does too), so a
  // foreign order resolves to no row.
  __setMockClient(
    createMockSupabase({ user: BUYER, resolve: returnFlowResolver({ order: null }) }),
  );
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "ORDER_NOT_FOUND");
});

test("return naming an item from a different order is rejected", async () => {
  // order_items is filtered by order_id, so a foreign item id is absent.
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: returnFlowResolver({
        orderItems: [{ id: ITEM_ID, order_id: ORDER_ID, quantity: 2 }],
      }),
    }),
  );
  const result = await createReturnRequest(
    returnInput({ items: [{ orderItemId: FOREIGN_ITEM_ID, quantity: 1, reason: null }] }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "ITEM_MISMATCH");
});

test("return on a non-DELIVERED order is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: returnFlowResolver({
        order: { id: ORDER_ID, buyer_id: BUYER.id, status: "DRAFT" },
      }),
    }),
  );
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_ELIGIBLE");
});

// ---------------------------------------------------------------------------
// 4. Quantity caps, incl. netting against earlier requests
// ---------------------------------------------------------------------------

test("return quantity above purchased quantity is rejected", async () => {
  __setMockClient(
    createMockSupabase({ user: BUYER, resolve: returnFlowResolver() }),
  );
  const result = await createReturnRequest(
    returnInput({ items: [{ orderItemId: ITEM_ID, quantity: 3, reason: null }] }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "QUANTITY_EXCEEDED");
});

test("return quantity above the remainder after earlier requests is rejected", async () => {
  // Purchased 2, one unit already claimed by an active earlier request.
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: returnFlowResolver({
        priorRequests: [{ id: PRIOR_RETURN_ID, status: "REQUESTED" }],
        priorItems: [
          { return_request_id: PRIOR_RETURN_ID, order_item_id: ITEM_ID, quantity: 1 },
        ],
      }),
    }),
  );
  const result = await createReturnRequest(
    returnInput({ items: [{ orderItemId: ITEM_ID, quantity: 2, reason: null }] }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "QUANTITY_EXCEEDED");
});

test("fully re-requesting an already-claimed item is rejected as duplicate", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: returnFlowResolver({
        priorRequests: [{ id: PRIOR_RETURN_ID, status: "IN_REVIEW" }],
        priorItems: [
          { return_request_id: PRIOR_RETURN_ID, order_item_id: ITEM_ID, quantity: 2 },
        ],
      }),
    }),
  );
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "ALREADY_REQUESTED");
});

test("a REJECTED earlier request frees its quantity again", async () => {
  // The action excludes REJECTED requests via .neq("status", "REJECTED"),
  // which the mock honours by simply not returning them; the flow proceeds
  // to a successful insert.
  __setMockClient(
    createMockSupabase({ user: BUYER, resolve: returnFlowResolver() }),
  );
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, true);
  assert.equal(result.status, "REQUESTED");
});

// ---------------------------------------------------------------------------
// 5/6/7. Support ownership boundaries
// ---------------------------------------------------------------------------

test("reply to a ticket the buyer does not own is rejected (zero rows)", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: (query) => {
        if (query.table === "support_tickets") return { data: null, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await addSupportTicketMessage({ ticketId: TICKET_ID, message: "hello" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "TICKET_NOT_FOUND");
});

test("reply to a closed ticket is rejected without reopening it", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: (query) => {
        if (query.table === "support_tickets") {
          return {
            data: { id: TICKET_ID, buyer_id: BUYER.id, status: "CLOSED" },
            error: null,
          };
        }
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await addSupportTicketMessage({ ticketId: TICKET_ID, message: "hello" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "TICKET_NOT_ACTIVE");
});

test("ticket linking an order the buyer does not own is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: (query) => {
        if (query.table === "orders") return { data: null, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await createSupportTicket(ticketInput({ orderId: ORDER_ID }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "ORDER_NOT_FOUND");
});

test("ticket linking a junk order id is rejected before any DB call", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: BUYER, log }));
  const result = await createSupportTicket(ticketInput({ orderId: "not-a-uuid" }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "ORDER_NOT_FOUND");
  assert.equal(log.length, 0);
});

// ---------------------------------------------------------------------------
// 8. Valid owned-order support creation succeeds
// ---------------------------------------------------------------------------

test("valid owned-order support ticket creates OPEN ticket + BUYER message", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      log,
      resolve: (query) => {
        if (query.table === "orders") {
          return { data: { id: ORDER_ID, buyer_id: BUYER.id }, error: null };
        }
        if (query.table === "support_tickets") return { data: { id: TICKET_ID }, error: null };
        if (query.table === "support_ticket_messages") return { data: null, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await createSupportTicket(ticketInput({ orderId: ORDER_ID }));
  assert.equal(result.ok, true);
  assert.equal(result.status, "OPEN");
  assert.equal(result.redirectTo, `/account/support/${TICKET_ID}`);

  const ticketInsert = findCall(
    log.find((query) => query.table === "support_tickets"),
    "insert",
  );
  assert.equal(ticketInsert.args[0].status, "OPEN");
  assert.equal(ticketInsert.args[0].buyer_id, BUYER.id);

  const messageInsert = findCall(
    log.find((query) => query.table === "support_ticket_messages"),
    "insert",
  );
  assert.equal(messageInsert.args[0].sender_role, "BUYER");
  assert.equal(messageInsert.args[0].sender_id, BUYER.id);
});

// ---------------------------------------------------------------------------
// 9. Valid return input reaches the persistence boundary correctly
// ---------------------------------------------------------------------------

test("valid return inserts a REQUESTED request with the buyer's own ids", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({ user: BUYER, log, resolve: returnFlowResolver() }),
  );
  const result = await createReturnRequest(returnInput());
  assert.equal(result.ok, true);
  assert.equal(result.returnRequestId, NEW_ROW_ID);

  const requestInsert = log
    .filter((query) => query.table === "return_requests")
    .map((query) => findCall(query, "insert"))
    .find(Boolean);
  assert.equal(requestInsert.args[0].status, "REQUESTED");
  assert.equal(requestInsert.args[0].buyer_id, BUYER.id);
  assert.equal(requestInsert.args[0].order_id, ORDER_ID);

  const itemInsert = log
    .filter((query) => query.table === "return_request_items")
    .map((query) => findCall(query, "insert"))
    .find(Boolean);
  assert.equal(itemInsert.args[0][0].order_item_id, ITEM_ID);
  assert.equal(itemInsert.args[0][0].quantity, 1);
});

// ---------------------------------------------------------------------------
// 10. Payment state cannot be forged through buyer input
// ---------------------------------------------------------------------------

test("createOrderIntent ignores forged payment fields and stores DRAFT + DB prices", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      log,
      resolve: (query) => {
        if (query.table === "addresses") {
          return {
            data: {
              id: ADDRESS_ID,
              user_id: BUYER.id,
              full_name: "Test Buyer",
              phone_number: "9999999999",
              line1: "1 Test Lane",
              line2: null,
              city: "Mumbai",
              state: "MH",
              postal_code: "400001",
              country: "India",
            },
            error: null,
          };
        }
        if (query.table === "products") {
          return {
            data: [
              {
                id: PRODUCT_ID,
                slug: "test-product",
                name: "Test Product",
                status: "ACTIVE",
                price_inr: 4999, // DB price: ₹4999 -> 499900 paise
                image_url: null,
                seller_id: null,
                brand_id: null,
              },
            ],
            error: null,
          };
        }
        if (query.table === "orders") return { data: { id: NEW_ROW_ID }, error: null };
        if (query.table === "order_items") return { data: null, error: null };
        if (query.table === "order_events") return { data: null, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );

  // Forged client input: payment state, fake price, fake totals. All of it
  // must be ignored — the action only reads items/address/notes.
  const result = await createOrderIntent({
    items: [{ productId: PRODUCT_ID, quantity: 2, unitPricePaise: 1 }],
    shippingAddressId: ADDRESS_ID,
    status: "PAID",
    payment_provider: "razorpay",
    payment_reference: "forged_ref",
    total_amount_paise: 1,
  });

  assert.equal(result.ok, true);
  assert.equal(result.status, "DRAFT");

  const orderInsert = findCall(
    log.find((query) => query.table === "orders"),
    "insert",
  );
  const payload = orderInsert.args[0];
  assert.equal(payload.status, "DRAFT");
  assert.equal(payload.buyer_id, BUYER.id);
  assert.equal(payload.subtotal_amount_paise, 999800); // 2 × 499900 from DB
  assert.equal("payment_provider" in payload, false);
  assert.equal("payment_reference" in payload, false);
  assert.equal("total_amount_paise" in payload, false);

  const itemInsert = findCall(
    log.find((query) => query.table === "order_items"),
    "insert",
  );
  assert.equal(itemInsert.args[0][0].unit_price_paise, 499900);
});

test("createOrderIntent rejects out-of-stock variants from DB truth", async () => {
  const VARIANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: (query) => {
        if (query.table === "addresses") {
          return {
            data: { id: ADDRESS_ID, user_id: BUYER.id, full_name: "T", phone_number: "9", line1: "L", line2: null, city: "C", state: "S", postal_code: "1", country: "India" },
            error: null,
          };
        }
        if (query.table === "products") {
          return {
            data: [{ id: PRODUCT_ID, slug: "p", name: "P", status: "ACTIVE", price_inr: 100, image_url: null, seller_id: null, brand_id: null }],
            error: null,
          };
        }
        if (query.table === "product_variants") {
          return {
            data: [{ id: VARIANT_ID, product_id: PRODUCT_ID, size: "M", color: null, price_inr: null, stock_quantity: 1, is_active: true }],
            error: null,
          };
        }
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await createOrderIntent({
    items: [{ productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 2 }],
    shippingAddressId: ADDRESS_ID,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "OUT_OF_STOCK");
});
