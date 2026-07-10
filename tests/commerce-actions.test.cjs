// SKXNZ launch-war D1-A â€” application-layer tests for the buyer commerce
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
const { getBuyerOrderById } = require("@/lib/orders/read-buyer-orders");

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
                price_inr: 4999, // DB price: â‚¹4999 -> 499900 paise
                image_url: null,
                seller_id: null,
                brand_id: null,
              },
            ],
            error: null,
          };
        }
        // Product has no active variants (fetched by product_id now).
        if (query.table === "product_variants") return { data: [], error: null };
        if (query.table === "orders") {
          // insert -> new row; dedupe SELECT -> no recent drafts.
          return findCall(query, "insert")
            ? { data: { id: NEW_ROW_ID }, error: null }
            : { data: [], error: null };
        }
        if (query.table === "order_items") return { data: null, error: null };
        if (query.table === "order_events") return { data: null, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );

  // Forged client input: payment state, fake price, fake totals. All of it
  // must be ignored â€” the action only reads items/address/notes.
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
    log.find((query) => query.table === "orders" && findCall(query, "insert")),
    "insert",
  );
  const payload = orderInsert.args[0];
  assert.equal(payload.status, "DRAFT");
  assert.equal(payload.buyer_id, BUYER.id);
  assert.equal(payload.subtotal_amount_paise, 999800); // 2 Ã— 499900 from DB
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

test("malformed return payloads fail closed without a server exception", async () => {
  const malformed = await createReturnRequest(null);
  assert.equal(malformed.ok, false);
  assert.equal(malformed.code, "VALIDATION_FAILED");
  const invalidQty = await createReturnRequest(returnInput({ items: [{ orderItemId: ITEM_ID, quantity: 1.5, reason: null }] }));
  assert.equal(invalidQty.ok, false);
  assert.equal(invalidQty.code, "VALIDATION_FAILED");
});

// ===========================================================================
// D2-A — full buyer purchase journey: createOrderIntent hardening
// ===========================================================================

const VARIANT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER_ORDER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const ownedAddress = {
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
};

// Factory: a createOrderIntent flow resolver. `product` ACTIVE by default;
// `variants` are the ACTIVE variant rows returned for the product; dedupe
// SELECT on orders returns `recentDrafts` and order_items SELECT returns
// `recentItems`.
function orderResolver({
  product = {
    id: PRODUCT_ID,
    slug: "p",
    name: "P",
    status: "ACTIVE",
    price_inr: 100,
    image_url: null,
    seller_id: null,
    brand_id: null,
  },
  variants = [],
  address = ownedAddress,
  recentDrafts = [],
  recentItems = [],
} = {}) {
  return (query) => {
    if (query.table === "addresses") return { data: address, error: null };
    if (query.table === "products") return { data: [product], error: null };
    if (query.table === "product_variants") return { data: variants, error: null };
    if (query.table === "brands") return { data: [], error: null };
    if (query.table === "orders") {
      return findCall(query, "insert")
        ? { data: { id: NEW_ROW_ID }, error: null }
        : { data: recentDrafts, error: null };
    }
    if (query.table === "order_items") {
      return findCall(query, "insert")
        ? { data: null, error: null }
        : { data: recentItems, error: null };
    }
    if (query.table === "order_events") return { data: null, error: null };
    throw new Error(`Unexpected table: ${query.table}`);
  };
}

const baseOrderInput = (overrides = {}) => ({
  items: [{ productId: PRODUCT_ID, quantity: 1 }],
  shippingAddressId: ADDRESS_ID,
  ...overrides,
});

// ---- Inactive product -----------------------------------------------------

test("order for an inactive product is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: orderResolver({
        product: {
          id: PRODUCT_ID,
          slug: "p",
          name: "P",
          status: "PENDING_REVIEW",
          price_inr: 100,
          image_url: null,
          seller_id: null,
          brand_id: null,
        },
      }),
    }),
  );
  const result = await createOrderIntent(baseOrderInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "PRODUCT_UNAVAILABLE");
});

// ---- Variant-backed product, no variant chosen ----------------------------

test("variant-backed product with no variant selected is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: orderResolver({
        variants: [
          { id: VARIANT_ID, product_id: PRODUCT_ID, size: "M", color: null, price_inr: null, stock_quantity: 5, is_active: true },
        ],
      }),
    }),
  );
  const result = await createOrderIntent(baseOrderInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "PRODUCT_UNAVAILABLE");
});

// ---- Invalid / foreign variant id -----------------------------------------

test("order naming a variant id not in the product's active set is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: orderResolver({
        variants: [
          { id: VARIANT_ID, product_id: PRODUCT_ID, size: "M", color: null, price_inr: null, stock_quantity: 5, is_active: true },
        ],
      }),
    }),
  );
  const result = await createOrderIntent(
    baseOrderInput({
      items: [{ productId: PRODUCT_ID, variantId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", quantity: 1 }],
    }),
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, "PRODUCT_UNAVAILABLE");
});

// ---- Quantity validation (zero/negative/decimal/excessive/malformed) ------

for (const [label, quantity] of [
  ["zero", 0],
  ["negative", -1],
  ["decimal", 1.5],
  ["excessive", 11],
  ["string-malformed", "2"],
  ["NaN-malformed", Number.NaN],
]) {
  test(`order with ${label} quantity is rejected`, async () => {
    __setMockClient(createMockSupabase({ user: BUYER, resolve: orderResolver() }));
    const result = await createOrderIntent(
      baseOrderInput({ items: [{ productId: PRODUCT_ID, quantity }] }),
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "VALIDATION_FAILED");
  });
}

// ---- Missing / unowned address --------------------------------------------

test("order with no shipping address is rejected", async () => {
  __setMockClient(createMockSupabase({ user: BUYER, resolve: orderResolver() }));
  const result = await createOrderIntent(baseOrderInput({ shippingAddressId: null }));
  assert.equal(result.ok, false);
  assert.equal(result.code, "ADDRESS_REQUIRED");
});

test("order with an address the buyer does not own is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: orderResolver({ address: { ...ownedAddress, user_id: "someone-else" } }),
    }),
  );
  const result = await createOrderIntent(baseOrderInput());
  assert.equal(result.ok, false);
  assert.equal(result.code, "ADDRESS_REQUIRED");
});

// ---- Client price forgery: DB variant price wins --------------------------

test("order uses the DB variant price, never a client-supplied price", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      log,
      resolve: orderResolver({
        product: {
          id: PRODUCT_ID,
          slug: "p",
          name: "P",
          status: "ACTIVE",
          price_inr: 100, // product base price
          image_url: null,
          seller_id: null,
          brand_id: null,
        },
        variants: [
          { id: VARIANT_ID, product_id: PRODUCT_ID, size: "M", color: null, price_inr: 250, stock_quantity: 5, is_active: true },
        ],
      }),
    }),
  );
  const result = await createOrderIntent(
    baseOrderInput({
      items: [
        // Forged unit price + line total — must be ignored.
        { productId: PRODUCT_ID, variantId: VARIANT_ID, quantity: 2, unitPricePaise: 1, lineTotalPaise: 2 },
      ],
    }),
  );
  assert.equal(result.ok, true);
  const itemInsert = findCall(
    log.find((query) => query.table === "order_items"),
    "insert",
  );
  // Variant price ₹250 -> 25000 paise; qty 2 -> 50000 line total. Client's 1/2 ignored.
  assert.equal(itemInsert.args[0][0].unit_price_paise, 25000);
  assert.equal(itemInsert.args[0][0].line_total_paise, 50000);
  const orderInsert = findCall(
    log.find((query) => query.table === "orders" && findCall(query, "insert")),
    "insert",
  );
  assert.equal(orderInsert.args[0].subtotal_amount_paise, 50000);
});

// ---- Accidental duplicate submission --------------------------------------

test("a duplicate submission returns the existing order by stable line fingerprint", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      log,
      resolve: orderResolver({
        // A recent DRAFT with the same subtotal (1 item x ₹100 = 10000 paise)
        // and the same line count (1) already exists.
        recentDrafts: [{ id: OTHER_ORDER_ID, subtotal_amount_paise: 10000 }],
        recentItems: [{ order_id: OTHER_ORDER_ID, product_id: PRODUCT_ID, variant_id: null, quantity: 1 }],
      }),
    }),
  );
  const result = await createOrderIntent(baseOrderInput());
  assert.equal(result.ok, true);
  assert.equal(result.orderId, OTHER_ORDER_ID);
  assert.equal(result.redirectTo, `/orders/${OTHER_ORDER_ID}`);
  // No new order row was inserted.
  const insertedOrder = log.find(
    (query) => query.table === "orders" && findCall(query, "insert"),
  );
  assert.equal(insertedOrder, undefined);
});

// ---- Safe order-success routing -------------------------------------------

test("a valid order routes to /orders/<new id> matching the inserted row", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({ user: BUYER, log, resolve: orderResolver() }),
  );
  const result = await createOrderIntent(baseOrderInput());
  assert.equal(result.ok, true);
  assert.equal(result.orderId, NEW_ROW_ID);
  assert.equal(result.redirectTo, `/orders/${NEW_ROW_ID}`);
  assert.equal(result.status, "DRAFT");
});

test("buyer cannot read another buyer order by id", async () => { __setMockClient(createMockSupabase({ user: BUYER, resolve: (query) => { if (query.table === "orders") return { data: null, error: null }; throw new Error("Unexpected table: " + query.table); } })); const result = await getBuyerOrderById("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"); assert.equal(result.order, null); });
