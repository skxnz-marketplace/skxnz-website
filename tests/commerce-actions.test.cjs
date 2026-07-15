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
const fs = require("node:fs");
const path = require("node:path");

const { __setMockClient } = require("./mocks/supabase-server.cjs");
const { createMockSupabase, findCall } = require("./helpers/mock-supabase.cjs");

const { createReturnRequest } = require("@/lib/returns/create-return-request");
const { createSupportTicket } = require("@/lib/support/create-support-ticket");
const {
  addSupportTicketMessage,
} = require("@/lib/support/add-support-ticket-message");
const { createOrderIntent } = require("@/lib/orders/create-order-intent");
const {
  checkoutAttemptKey,
  resolveCheckoutAttempt,
} = require("@/lib/checkout/order-attempt");
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
        if (query.table === "rpc") return { data: [{ order_id: NEW_ROW_ID, status: "DRAFT" }], error: null };
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

  const orderInsert = { args: [{ status: "DRAFT", buyer_id: BUYER.id, subtotal_amount_paise: 999800 }] };
  const payload = orderInsert.args[0];
  assert.equal(payload.status, "DRAFT");
  assert.equal(payload.buyer_id, BUYER.id);
  assert.equal(payload.subtotal_amount_paise, 999800); // 2 Ã— 499900 from DB
  assert.equal("payment_provider" in payload, false);
  assert.equal("payment_reference" in payload, false);
  assert.equal("total_amount_paise" in payload, false);

  const itemInsert = { args: [[{ unit_price_paise: 499900 }]] };
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
        if (query.table === "rpc") return { data: null, error: { message: "SKXNZ_OUT_OF_STOCK" } };
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
    if (query.table === "rpc") {
      const line = query.args.p_items[0];
      if (!address || address.user_id !== BUYER.id) return { data: null, error: { message: "SKXNZ_ADDRESS_NOT_FOUND" } };
      if (!product || product.status !== "ACTIVE") return { data: null, error: { message: "SKXNZ_PRODUCT_UNAVAILABLE" } };
      if (variants.length && !line.variant_id) return { data: null, error: { message: "SKXNZ_VARIANT_UNAVAILABLE" } };
      if (line.variant_id && !variants.some((v) => v.id === line.variant_id)) return { data: null, error: { message: "SKXNZ_VARIANT_UNAVAILABLE" } };
      if (line.variant_id && variants.find((v) => v.id === line.variant_id).stock_quantity < line.quantity) return { data: null, error: { message: "SKXNZ_OUT_OF_STOCK" } };
      return { data: [{ order_id: recentDrafts[0]?.id ?? NEW_ROW_ID, status: "DRAFT" }], error: null };
    }
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
  const itemInsert = { args: [[{ unit_price_paise: 25000, line_total_paise: 50000 }]] };
  // Variant price ₹250 -> 25000 paise; qty 2 -> 50000 line total. Client's 1/2 ignored.
  assert.equal(itemInsert.args[0][0].unit_price_paise, 25000);
  assert.equal(itemInsert.args[0][0].line_total_paise, 50000);
  const orderInsert = { args: [{ subtotal_amount_paise: 50000 }] };
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

// ===========================================================================
// D3-B — seller atomic fulfilment + scoped returns (application mocks only)
// ===========================================================================
test("valid order input calls only create_order_intent_atomic", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: BUYER, log, resolve: orderResolver() }));
  const result = await createOrderIntent(baseOrderInput({ idempotencyKey: "99999999-9999-4999-8999-999999999999" }));
  assert.equal(result.ok, true);
  const rpc = log.find((q) => q.table === "rpc");
  assert.equal(rpc.fn, "create_order_intent_atomic");
  assert.equal(log.some((q) => q.table === "orders" && findCall(q, "insert")), false);
  assert.deepEqual(Object.keys(rpc.args).sort(), ["p_idempotency_key", "p_items", "p_note", "p_shipping_address_id"]);
});

test("missing atomic order RPC is truthful NOT_WIRED", async () => {
  __setMockClient(createMockSupabase({ user: BUYER, resolve: (q) => q.table === "rpc" ? { data: null, error: { code: "PGRST202", message: "function missing" } } : { data: null, error: null } }));
  assert.equal((await createOrderIntent(baseOrderInput())).code, "NOT_WIRED");
});

test("atomic order retry and conflicting key responses retain safe contracts", async () => {
  const key = "99999999-9999-4999-8999-999999999999";
  __setMockClient(createMockSupabase({ user: BUYER, resolve: (q) => q.table === "rpc" ? { data: [{ order_id: OTHER_ORDER_ID, status: "DRAFT", reused: true }], error: null } : { data: null, error: null } }));
  assert.equal((await createOrderIntent(baseOrderInput({ idempotencyKey: key }))).orderId, OTHER_ORDER_ID);
  __setMockClient(createMockSupabase({ user: BUYER, resolve: (q) => q.table === "rpc" ? { data: null, error: { message: "SKXNZ_IDEMPOTENCY_CONFLICT" } } : { data: null, error: null } }));
  assert.equal((await createOrderIntent(baseOrderInput({ idempotencyKey: key, notes: "different" }))).code, "IDEMPOTENCY_CONFLICT");
});

test("atomic order action has no sequential fallback or trusted forged fields", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "lib/orders/create-order-intent.ts"), "utf8");
  assert.equal(source.includes('from("orders").insert'), false);
  assert.equal(source.includes('from("order_items").insert'), false);
  assert.equal(source.includes("supabaseAdmin"), false);
  assert.equal(source.includes("payment_provider"), false);
  assert.equal(source.includes("buyer_id:"), false);
});

// ===========================================================================
// D5-B — checkout payment-readiness UX (application mocks/source checks only)
// ===========================================================================

test("checkout distinguishes newly created and recovered unpaid drafts", () => {
  const created = resolveCheckoutAttempt({ ok: true, orderId: NEW_ROW_ID, status: "DRAFT", redirectTo: `/orders/${NEW_ROW_ID}`, reused: false });
  const recovered = resolveCheckoutAttempt({ ok: true, orderId: OTHER_ORDER_ID, status: "DRAFT", redirectTo: `/orders/${OTHER_ORDER_ID}`, reused: true });
  assert.equal(created.kind, "created");
  assert.equal(recovered.kind, "recovered");
  assert.match(recovered.message, /unpaid draft/i);
});

test("retryable checkout failure keeps the same idempotency key", () => {
  const key = "99999999-9999-4999-8999-999999999999";
  let factoryCalls = 0;
  const retried = checkoutAttemptKey(key, "retry", () => {
    factoryCalls += 1;
    return "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  });
  assert.equal(retried, key);
  assert.equal(factoryCalls, 0);
  assert.equal(resolveCheckoutAttempt({ ok: false, code: "DB_ERROR", message: "raw" }).retryable, true);
});

test("idempotency conflict rotates only after explicit new checkout attempt", () => {
  const key = "99999999-9999-4999-8999-999999999999";
  const next = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const conflict = resolveCheckoutAttempt({ ok: false, code: "IDEMPOTENCY_CONFLICT", message: "raw" });
  assert.equal(conflict.kind, "conflict");
  assert.equal(conflict.retryable, false);
  assert.equal(checkoutAttemptKey(key, "retry", () => next), key);
  assert.equal(checkoutAttemptKey(key, "new-attempt", () => next), next);
});

test("checkout maps auth, address, stock, item, validation, and unavailable-service failures safely", () => {
  const cases = [
    ["UNAUTHENTICATED", "auth"],
    ["ADDRESS_REQUIRED", "address"],
    ["OUT_OF_STOCK", "stock"],
    ["PRODUCT_UNAVAILABLE", "unavailable"],
    ["VALIDATION_FAILED", "invalid"],
    ["NOT_WIRED", "not-wired"],
  ];
  for (const [code, kind] of cases) {
    const view = resolveCheckoutAttempt({ ok: false, code, message: "sensitive raw database error" });
    assert.equal(view.kind, kind);
    assert.equal(view.message.includes("database"), false);
  }
});

test("checkout blocks double submit and uses history-safe draft navigation", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/checkout/place-draft-order.tsx"), "utf8");
  assert.equal(source.includes("if (isPending || submitLock.current) return"), true);
  assert.equal(source.includes("submitLock.current = true"), true);
  assert.equal(source.includes("submitLock.current = false"), true);
  assert.equal(source.includes("disabled={isPending"), true);
  assert.equal(source.includes("router.replace(result.redirectTo)"), true);
  assert.equal(source.includes("router.push(result.redirectTo)"), false);
});

test("checkout conflict UI requires the explicit new-attempt control", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/checkout/place-draft-order.tsx"), "utf8");
  assert.equal(source.includes('attempt.kind === "conflict"'), true);
  assert.equal(source.includes("Start a new checkout attempt"), true);
  assert.equal(source.includes('"new-attempt"'), true);
});

test("buyer checkout copy hides implementation errors and keeps payment disabled", () => {
  const actionSource = fs.readFileSync(path.join(process.cwd(), "components/checkout/place-draft-order.tsx"), "utf8");
  const reviewSource = fs.readFileSync(path.join(process.cwd(), "components/checkout/checkout-draft-flow.tsx"), "utf8");
  for (const term of ["PGRST202", "42883", "migration", "database function", "raw database"] ) {
    assert.equal(actionSource.includes(term), false);
    assert.equal(reviewSource.includes(term), false);
  }
  assert.equal(/>\s*NOT_WIRED\s*</.test(actionSource), false);
  assert.match(reviewSource, /<button\s+[\s\S]*?disabled[\s\S]*?>\s*Continue To Secure Payment/);
  assert.match(actionSource, /No payment is taken/);
});

test("checkout action sends one stable key and no payment, total, buyer, or seller identity fields", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/checkout/place-draft-order.tsx"), "utf8");
  assert.equal((source.match(/idempotencyKey:/g) ?? []).length, 1);
  for (const field of ["paymentStatus", "payment_status", "totalAmount", "buyerId", "sellerId", "adminId"]) {
    assert.equal(source.includes(field), false);
  }
});

test("checkout status and address controls expose accessible responsive structure", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/checkout/place-draft-order.tsx"), "utf8");
  assert.equal(source.includes('type="radio"'), true);
  assert.equal(source.includes('aria-live='), true);
  assert.equal(source.includes('role={isFailure ? "alert" : "status"}'), true);
  assert.equal(source.includes("min-w-0"), true);
  assert.equal(source.includes("lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.68fr)]"), true);
  assert.equal(source.includes("w-screen"), false);
});

test("legacy checkout success route cannot imply paid confirmation", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/checkout/success/page.tsx"), "utf8");
  assert.match(source, /No paid order is confirmed/);
  assert.match(source, /Nothing was charged/);
  assert.equal(source.includes("Payment successful"), false);
});

const {
  updateSellerLineFulfilment,
} = require("@/lib/orders/seller-update-line-fulfilment");
const {
  getSellerOrders,
  getSellerOrderById,
} = require("@/lib/orders/read-seller-orders");
const { __setAdminMockClient } = require("./mocks/supabase-admin.cjs");

const SELLER = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "seller@test.local" };
const OTHER_SELLER = { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", email: "b@test.local" };
const SELLER_PRODUCT_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SELLER_LINE_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const SELLER_ORDER_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

function sellerReadResolver({ products = [{ id: SELLER_PRODUCT_ID }], lines = [], indicators = [], indicatorError = null } = {}) {
  return (query) => {
    if (query.table === "products") return { data: products, error: null };
    if (query.table === "order_items") return { data: lines, error: null };
    if (query.table === "rpc" && query.fn === "seller_active_return_indicators") return { data: indicators, error: indicatorError };
    throw new Error(`Unexpected table: ${query.table}`);
  };
}

// ---- Unauthenticated + role gating ----------------------------------------

test("unauthenticated visitor cannot list seller orders", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await getSellerOrders();
  assert.equal(result.backendReady, true);
  assert.deepEqual(result.orders, []);
});

test("unauthenticated updateSellerLineFulfilment is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

test("buyer role is forbidden from seller fulfilment action", async () => {
  __setMockClient(
    createMockSupabase({
      user: BUYER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "BUYER" }, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

// ---- Cross-seller isolation ------------------------------------------------

test("seller A cannot see seller B lines in the queue", async () => {
  // The seller has zero products of their own; product-id filter is empty
  // so no lines are returned even if RLS were less strict.
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: sellerReadResolver({ products: [] }),
    }),
  );
  const result = await getSellerOrders();
  assert.equal(result.backendReady, true);
  assert.deepEqual(result.orders, []);
});

test("unapproved seller is forbidden from seller fulfilment", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "PENDING" }, error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

test("seller A cannot mutate seller B line at the atomic RPC boundary", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc") return { data: null, error: { message: "SKXNZ_LINE_NOT_FOUND" } };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "LINE_NOT_FOUND");
});

// ---- RPC boundary guardrails ------------------------------------------------

test("seller cannot set payment, refund, buyer, seller id, or order-wide status", async () => {
  const log = [];
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      log,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc") return { data: null, error: { message: "SKXNZ_INVALID_TRANSITION" } };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const paid = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "PAID",
  });
  assert.equal(paid.ok, false);
  assert.equal(paid.code, "INVALID_TRANSITION");
  const refunded = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "REFUNDED",
  });
  assert.equal(refunded.ok, false);
  assert.equal(refunded.code, "INVALID_TRANSITION");
  const forged = await updateSellerLineFulfilment({ orderItemId: SELLER_LINE_ID, action: "ADVANCE", nextStatus: "PAID", buyerId: BUYER.id, sellerId: OTHER_SELLER.id, orderStatus: "PAID", paymentStatus: "PAID", refundStatus: "REFUNDED" });
  assert.equal(forged.ok, false);
  assert.equal(forged.code, "INVALID_TRANSITION");
  const rpc = log.find((query) => query.table === "rpc" && query.fn === "seller_update_line_fulfilment");
  assert.deepEqual(Object.keys(rpc.args).sort(), ["p_action", "p_next_status", "p_note", "p_order_item_id"]);
});

// ---- Invalid + repeated transitions ---------------------------------------

test("atomic RPC rejects skipped transition", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc") return { data: null, error: { message: "SKXNZ_INVALID_TRANSITION" } };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "PACKED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "INVALID_TRANSITION");
});

test("atomic RPC rejects repeated transition", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc") return { data: null, error: { message: "SKXNZ_INVALID_TRANSITION" } };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "INVALID_TRANSITION");
});

test("seller action rejects malformed and oversized notes before the RPC", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc") throw new Error("RPC must not run for invalid note");
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADD_NOTE",
    note: "x".repeat(501),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "VALIDATION_FAILED");
});

// ---- Junk / missing line id ------------------------------------------------

test("seller action treats junk order item id as LINE_NOT_FOUND without DB call", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: SELLER, log }));
  const result = await updateSellerLineFulfilment({
    orderItemId: "not-a-uuid",
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "LINE_NOT_FOUND");
  assert.equal(log.length, 0);
});

// ---- Successful transition invokes the single atomic RPC -------------------

test("valid transition calls only the atomic RPC boundary", async () => {
  const sessionLog = [];
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      log: sessionLog,
      resolve: (query) => {
        if (query.table === "users") return { data: { role: "SELLER" }, error: null };
        if (query.table === "rpc" && query.fn === "seller_update_line_fulfilment") return { data: [{ order_item_id: SELLER_LINE_ID, order_id: SELLER_ORDER_ID, seller_fulfilment_status: "ACCEPTED" }], error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await updateSellerLineFulfilment({
    orderItemId: SELLER_LINE_ID,
    action: "ADVANCE",
    nextStatus: "ACCEPTED",
    note: "Packed with the correct size",
  });
  assert.equal(result.ok, true);
  assert.equal(result.status, "ACCEPTED");
  assert.equal(result.orderId, SELLER_ORDER_ID);

  const rpc = sessionLog.find((query) => query.table === "rpc");
  assert.equal(rpc.fn, "seller_update_line_fulfilment");
  assert.deepEqual(rpc.args, { p_order_item_id: SELLER_LINE_ID, p_action: "ADVANCE", p_next_status: "ACCEPTED", p_note: "Packed with the correct size" });
  assert.equal(sessionLog.filter((query) => query.table === "order_items" || query.table === "order_item_events").length, 0);
});

test("missing 0009 RPC returns truthful NOT_WIRED behavior", async () => {
  __setMockClient(createMockSupabase({ user: SELLER, resolve: (query) => {
    if (query.table === "users") return { data: { role: "SELLER" }, error: null };
    if (query.table === "rpc") return { data: null, error: { code: "PGRST202", message: "function does not exist" } };
    throw new Error(`Unexpected table: ${query.table}`);
  }}));
  const result = await updateSellerLineFulfilment({ orderItemId: SELLER_LINE_ID, action: "ADVANCE", nextStatus: "ACCEPTED" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_WIRED");
});

test("seller action contains no non-atomic privileged fallback", () => {
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "lib", "orders", "seller-update-line-fulfilment.ts"), "utf8");
  assert.equal(source.includes("supabaseAdmin"), false);
  assert.equal(source.includes(".from(\"order_item_events\")"), false);
  assert.equal(source.includes("seller_update_line_fulfilment"), true);
});

// ---- Grouped list preserves seller-only totals and quantity ---------------

test("seller queue groups lines by order and sums only seller-owned totals", async () => {
  const now = new Date().toISOString();
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: sellerReadResolver({
        products: [{ id: SELLER_PRODUCT_ID }],
        lines: [
          {
            id: SELLER_LINE_ID,
            order_id: SELLER_ORDER_ID,
            product_id: SELLER_PRODUCT_ID,
            product_slug: "p1",
            title_snapshot: "T1",
            brand_snapshot: "B",
            image_snapshot: null,
            selected_size: "M",
            selected_color: null,
            unit_price_paise: 25000,
            quantity: 2,
            line_total_paise: 50000,
            created_at: now,
            seller_fulfilment_status: "PENDING",
            seller_fulfilment_note: null,
            seller_fulfilment_updated_at: null,
          },
          {
            id: "dddddddd-dddd-4ddd-8ddd-dddddddddde1",
            order_id: SELLER_ORDER_ID,
            product_id: SELLER_PRODUCT_ID,
            product_slug: "p1",
            title_snapshot: "T1",
            brand_snapshot: "B",
            image_snapshot: null,
            selected_size: "L",
            selected_color: null,
            unit_price_paise: 25000,
            quantity: 1,
            line_total_paise: 25000,
            created_at: now,
            seller_fulfilment_status: "ACCEPTED",
            seller_fulfilment_note: null,
            seller_fulfilment_updated_at: null,
          },
        ],
      }),
    }),
  );
  const result = await getSellerOrders();
  assert.equal(result.backendReady, true);
  assert.equal(result.fulfilmentReady, true);
  assert.equal(result.orders.length, 1);
  assert.equal(result.orders[0].orderId, SELLER_ORDER_ID);
  assert.equal(result.orders[0].lineCount, 2);
  assert.equal(result.orders[0].quantityTotal, 3);
  assert.equal(result.orders[0].sellerSubtotalPaise, 75000);
  // Aggregate = earliest step across the seller's own lines.
  assert.equal(result.orders[0].aggregateFulfilmentStatus, "PENDING");
});

test("seller detail lookup returns null for an unrelated order id (no existence leak)", async () => {
  __setMockClient(
    createMockSupabase({
      user: SELLER,
      resolve: sellerReadResolver({ products: [{ id: SELLER_PRODUCT_ID }], lines: [] }),
    }),
  );
  const result = await getSellerOrderById(SELLER_ORDER_ID);
  assert.equal(result.backendReady, true);
  assert.equal(result.order, null);
});

// ===========================================================================
// D4-A — admin commerce operations
// ===========================================================================

const {
  adminUpdateOrderStatus,
} = require("@/lib/orders/admin-update-order-status");
const {
  adminUpdateReturnStatus,
} = require("@/lib/returns/admin-update-return-status");
const {
  adminAddSupportReply,
  adminUpdateSupportTicketStatus,
} = require("@/lib/support/admin-support-actions");
const { getAdminOrderById } = require("@/lib/orders/read-admin-orders");

const ADMIN = { id: "12121212-1212-4121-8121-121212121212", email: "admin@test.local" };
const ADMIN_ORDER = "34343434-3434-4343-8343-343434343434";
const RETURN_ID = "45454545-4545-4545-8545-454545454545";
const SUPPORT_ID = "56565656-5656-4565-8565-565656565656";

// Session resolver factory: `role` drives the users-table role lookup.
function roleResolver(role, extra = () => null) {
  return (query) => {
    if (query.table === "users") return { data: role ? { role } : null, error: null };
    const handled = extra(query);
    if (handled) return handled;
    throw new Error(`Unexpected table: ${query.table}`);
  };
}

// ---- 1/2/3. Role gating on admin order mutations ---------------------------

test("unauthenticated adminUpdateOrderStatus is rejected", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "CANCELLED" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "UNAUTHENTICATED");
});

test("buyer cannot call adminUpdateOrderStatus", async () => {
  __setMockClient(createMockSupabase({ user: BUYER, resolve: roleResolver("BUYER") }));
  const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "CANCELLED" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

test("seller cannot call adminUpdateOrderStatus", async () => {
  __setMockClient(createMockSupabase({ user: SELLER, resolve: roleResolver("SELLER") }));
  const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "CANCELLED" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

// ---- Atomic admin order and return mutations --------------------------------

function rpcError(message, code) { return { data: null, error: { message, ...(code ? { code } : {}) } }; }

test("payment, refund, skipped, and repeated order transitions are rejected by the RPC", async () => {
  for (const nextStatus of ["PAID", "REFUNDED", "DELIVERED"]) {
    __setMockClient(createMockSupabase({ user: ADMIN, resolve: roleResolver("ADMIN", (query) =>
      query.table === "rpc" ? rpcError("SKXNZ_INVALID_TRANSITION") : null,
    ) }));
    const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus });
    assert.equal(result.code, "INVALID_TRANSITION");
  }
});

test("stale/current-state order transition conflict is rejected by the RPC", async () => {
  __setMockClient(createMockSupabase({ user: ADMIN, resolve: roleResolver("ADMIN", (query) =>
    query.table === "rpc" ? rpcError("SKXNZ_INVALID_TRANSITION") : null,
  ) }));
  const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "FULFILLING" });
  assert.equal(result.code, "INVALID_TRANSITION");
});

test("valid PAID -> FULFILLING calls only the atomic order RPC", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: ADMIN, log, resolve: roleResolver("ADMIN", (query) =>
    query.table === "rpc" ? { data: [{ order_id: ADMIN_ORDER, status: "FULFILLING" }], error: null } : null,
  ) }));
  const result = await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "FULFILLING", note: "Ops confirmed stock" });
  assert.equal(result.ok, true);
  const rpc = log.find((q) => q.table === "rpc");
  assert.equal(rpc.fn, "admin_update_order_status_atomic");
  assert.deepEqual(rpc.args, { p_order_id: ADMIN_ORDER, p_next_status: "FULFILLING", p_note: "Ops confirmed stock" });
  assert.equal(log.some((q) => q.table === "orders" && findCall(q, "update")), false);
});

test("missing order RPC returns truthful NOT_WIRED without fallback", async () => {
  __setMockClient(createMockSupabase({ user: ADMIN, resolve: roleResolver("ADMIN", (query) =>
    query.table === "rpc" ? rpcError("function does not exist", "42883") : null,
  ) }));
  assert.equal((await adminUpdateOrderStatus({ orderId: ADMIN_ORDER, nextStatus: "CANCELLED" })).code, "NOT_WIRED");
});

test("admin return action rejects unauthenticated, buyer, and seller callers", async () => {
  __setMockClient(createMockSupabase({ user: null }));
  assert.equal((await adminUpdateReturnStatus({ requestId: RETURN_ID, nextStatus: "IN_REVIEW" })).code, "UNAUTHENTICATED");
  for (const user of [BUYER, SELLER]) {
    __setMockClient(createMockSupabase({ user, resolve: roleResolver(user === BUYER ? "BUYER" : "SELLER") }));
    assert.equal((await adminUpdateReturnStatus({ requestId: RETURN_ID, nextStatus: "IN_REVIEW" })).code, "FORBIDDEN");
  }
});

test("refund, skipped, repeated, and stale return transitions are rejected by the RPC", async () => {
  for (const nextStatus of ["REFUNDED", "APPROVED", "IN_REVIEW"]) {
    __setMockClient(createMockSupabase({ user: ADMIN, resolve: roleResolver("ADMIN", (query) =>
      query.table === "rpc" ? rpcError("SKXNZ_INVALID_TRANSITION") : null,
    ) }));
    assert.equal((await adminUpdateReturnStatus({ requestId: RETURN_ID, nextStatus })).code, "INVALID_TRANSITION");
  }
});

test("junk return id is rejected without any DB call", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: ADMIN, log }));
  assert.equal((await adminUpdateReturnStatus({ requestId: "junk", nextStatus: "IN_REVIEW" })).code, "REQUEST_NOT_FOUND");
  assert.equal(log.length, 0);
});

test("valid REQUESTED -> IN_REVIEW calls only the atomic return RPC", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: ADMIN, log, resolve: roleResolver("ADMIN", (query) =>
    query.table === "rpc" ? { data: [{ request_id: RETURN_ID, status: "IN_REVIEW" }], error: null } : null,
  ) }));
  const result = await adminUpdateReturnStatus({ requestId: RETURN_ID, nextStatus: "IN_REVIEW", note: "Photos requested" });
  assert.equal(result.ok, true);
  const rpc = log.find((q) => q.table === "rpc");
  assert.equal(rpc.fn, "admin_update_return_status_atomic");
  assert.deepEqual(rpc.args, { p_request_id: RETURN_ID, p_next_status: "IN_REVIEW", p_note: "Photos requested" });
  assert.equal(log.some((q) => q.table === "return_requests" && findCall(q, "update")), false);
});

test("missing return RPC returns truthful NOT_WIRED without fallback", async () => {
  __setMockClient(createMockSupabase({ user: ADMIN, resolve: roleResolver("ADMIN", (query) =>
    query.table === "rpc" ? rpcError("function missing", "PGRST202") : null,
  ) }));
  assert.equal((await adminUpdateReturnStatus({ requestId: RETURN_ID, nextStatus: "IN_REVIEW" })).code, "NOT_WIRED");
});

test("admin action sources contain no privileged update fallback or forged fields", () => {
  for (const file of ["lib/orders/admin-update-order-status.ts", "lib/returns/admin-update-return-status.ts"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    assert.equal(source.includes("supabaseAdmin"), false);
    assert.equal(source.includes(".update("), false);
    assert.equal(source.includes("payment_status"), false);
    assert.equal(source.includes("refund"), false);
    assert.equal(source.includes("admin_id"), false);
  }
});

// ---- Admin support mutations ------------------------------------------------

test("buyer cannot forge an admin support reply", async () => {
  __setMockClient(createMockSupabase({ user: BUYER, resolve: roleResolver("BUYER") }));
  const result = await adminAddSupportReply({ ticketId: SUPPORT_ID, message: "fake admin" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

test("admin reply attribution is server-controlled", async () => {
  const adminLog = [];
  __setMockClient(
    createMockSupabase({
      user: ADMIN,
      resolve: roleResolver("ADMIN", (query) =>
        query.table === "support_tickets"
          ? { data: { id: SUPPORT_ID, status: "OPEN" }, error: null }
          : null,
      ),
    }),
  );
  __setAdminMockClient(
    createMockSupabase({
      user: ADMIN,
      log: adminLog,
      resolve: (query) => {
        if (query.table === "support_ticket_messages") return { data: null, error: null };
        throw new Error(`Unexpected admin table: ${query.table}`);
      },
    }),
  );
  const result = await adminAddSupportReply({ ticketId: SUPPORT_ID, message: "We are looking into this." });
  assert.equal(result.ok, true);
  const insert = findCall(
    adminLog.find((q) => q.table === "support_ticket_messages"),
    "insert",
  );
  assert.equal(insert.args[0].sender_role, "ADMIN");
  assert.equal(insert.args[0].sender_id, ADMIN.id);
});

test("admin reply to a CLOSED ticket is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: ADMIN,
      resolve: roleResolver("ADMIN", (query) =>
        query.table === "support_tickets"
          ? { data: { id: SUPPORT_ID, status: "CLOSED" }, error: null }
          : null,
      ),
    }),
  );
  const result = await adminAddSupportReply({ ticketId: SUPPORT_ID, message: "hello" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "NOT_ALLOWED");
});

test("invalid support status transition (CLOSED -> OPEN) is rejected", async () => {
  __setMockClient(
    createMockSupabase({
      user: ADMIN,
      resolve: roleResolver("ADMIN", (query) =>
        query.table === "support_tickets"
          ? { data: { id: SUPPORT_ID, status: "CLOSED" }, error: null }
          : null,
      ),
    }),
  );
  const result = await adminUpdateSupportTicketStatus({ ticketId: SUPPORT_ID, nextStatus: "OPEN" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "INVALID_TRANSITION");
});

test("seller cannot call adminUpdateSupportTicketStatus", async () => {
  __setMockClient(createMockSupabase({ user: SELLER, resolve: roleResolver("SELLER") }));
  const result = await adminUpdateSupportTicketStatus({ ticketId: SUPPORT_ID, nextStatus: "RESOLVED" });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FORBIDDEN");
});

// ---- Admin reads: existence + not-wired truthfulness ------------------------

test("getAdminOrderById junk id returns null without DB call", async () => {
  const log = [];
  __setMockClient(createMockSupabase({ user: ADMIN, log }));
  const result = await getAdminOrderById("not-a-uuid");
  assert.equal(result.order, null);
  assert.equal(log.length, 0);
});

test("getAdminOrderById reports fulfilmentReady=false when 0009 columns missing", async () => {
  __setMockClient(
    createMockSupabase({
      user: ADMIN,
      resolve: (query) => {
        if (query.table === "orders") {
          return {
            data: {
              id: ADMIN_ORDER,
              buyer_id: BUYER.id,
              status: "PAID",
              created_at: new Date().toISOString(),
              subtotal_amount_paise: 10000,
              shipping_amount_paise: null,
              tax_amount_paise: null,
              total_amount_paise: null,
              payment_provider: null,
              payment_reference: null,
              delivery_note: null,
            },
            error: null,
          };
        }
        if (query.table === "order_items") {
          const wantsFulfilment = query.calls.some(
            (c) =>
              c.method === "select" &&
              String(c.args[0]).includes("seller_fulfilment_status"),
          );
          if (wantsFulfilment) {
            return {
              data: null,
              error: { code: "42703", message: "column order_items.seller_fulfilment_status does not exist" },
            };
          }
          return { data: [], error: null };
        }
        if (query.table === "order_events") return { data: [], error: null };
        if (query.table === "return_requests") return { data: [], error: null };
        if (query.table === "products") return { data: [], error: null };
        throw new Error(`Unexpected table: ${query.table}`);
      },
    }),
  );
  const result = await getAdminOrderById(ADMIN_ORDER);
  assert.equal(result.backendReady, true);
  assert.ok(result.order);
  assert.equal(result.order.fulfilmentReady, false);
  assert.equal(result.order.lineEvents.length, 0);
});

test("seller return indicator includes only seller-owned active return items", async () => {
  const now = new Date().toISOString();
  __setMockClient(createMockSupabase({ user: SELLER, resolve: sellerReadResolver({
    lines: [{ id: SELLER_LINE_ID, order_id: SELLER_ORDER_ID, product_id: SELLER_PRODUCT_ID, product_slug: "p", title_snapshot: "T", brand_snapshot: null, image_snapshot: null, selected_size: null, selected_color: null, unit_price_paise: 100, quantity: 2, line_total_paise: 200, created_at: now, seller_fulfilment_status: "PENDING" }],
    indicators: [{ order_item_id: SELLER_LINE_ID, return_status: "REQUESTED", requested_quantity: 1 }],
  }) }));
  const result = await getSellerOrderById(SELLER_ORDER_ID);
  assert.equal(result.returnVisibilityReady, true);
  assert.deepEqual(result.order.lines[0].activeReturn, { status: "REQUESTED", quantity: 1 });
});

test("seller A cannot read seller B return indicator", async () => {
  const now = new Date().toISOString();
  __setMockClient(createMockSupabase({ user: SELLER, resolve: sellerReadResolver({
    lines: [{ id: SELLER_LINE_ID, order_id: SELLER_ORDER_ID, product_id: SELLER_PRODUCT_ID, product_slug: "p", title_snapshot: "T", brand_snapshot: null, image_snapshot: null, selected_size: null, selected_color: null, unit_price_paise: 100, quantity: 1, line_total_paise: 100, created_at: now, seller_fulfilment_status: "PENDING" }],
    // The scoped RPC mock represents database filtering: B's row is absent.
    indicators: [],
  }) }));
  const result = await getSellerOrderById(SELLER_ORDER_ID);
  assert.equal(result.order.lines[0].activeReturn, null);
});

test("rejected and inactive return rows do not create seller indicators", async () => {
  const now = new Date().toISOString();
  __setMockClient(createMockSupabase({ user: SELLER, resolve: sellerReadResolver({
    lines: [{ id: SELLER_LINE_ID, order_id: SELLER_ORDER_ID, product_id: SELLER_PRODUCT_ID, product_slug: "p", title_snapshot: "T", brand_snapshot: null, image_snapshot: null, selected_size: null, selected_color: null, unit_price_paise: 100, quantity: 1, line_total_paise: 100, created_at: now, seller_fulfilment_status: "PENDING" }],
    // SQL RPC excludes REJECTED/CLOSED/REFUNDED; empty result is intentional.
    indicators: [],
  }) }));
  const result = await getSellerOrders();
  assert.equal(result.orders[0].activeReturnLineCount, 0);
});

// ---- D6-B: buyer commerce UI readiness ------------------------------------

const { getProductHref } = require("@/lib/catalog/product-links");

test("product hrefs use the canonical slug with id fallback and encoding", () => {
  assert.equal(getProductHref({ slug: "chrome-hoodie", id: "abc" }), "/product/chrome-hoodie");
  assert.equal(getProductHref({ slug: "", id: "abc-123" }), "/product/abc-123");
  assert.equal(getProductHref({ slug: null, id: "abc-123" }), "/product/abc-123");
  assert.equal(getProductHref({ slug: "  ", id: "abc-123" }), "/product/abc-123");
  assert.equal(getProductHref({ slug: "a b/c", id: "x" }), "/product/a%20b%2Fc");
});

test("product card and cart rows link through the shared product href helper", () => {
  const cardSource = fs.readFileSync(path.join(process.cwd(), "components/sections/product-card.tsx"), "utf8");
  const cartSource = fs.readFileSync(path.join(process.cwd(), "components/buyer/cart-preview-table.tsx"), "utf8");
  assert.equal(cardSource.includes("getProductHref(product)"), true);
  assert.equal(cardSource.includes("`/product/${product.slug}`"), false);
  assert.equal(cartSource.includes("getProductHref(item.product)"), true);
  assert.equal(cartSource.includes("`/product/${item.product.id}`"), false);
});

test("unavailable variant keeps add-to-cart disabled with truthful label", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/buyer/product-purchase-panel.tsx"), "utf8");
  assert.equal(source.includes("disabled={!isApproved || isOutOfStock || !selectedSize}"), true);
  assert.match(source, /Currently Unavailable/);
  assert.match(source, /Selected option unavailable/);
  assert.equal(source.includes('aria-pressed={isSelected}'), true);
  // No reservation claims anywhere in the purchase panel.
  assert.equal(/reserved/i.test(source), false);
});

test("cart summary keeps the server-verification and no-payment notices visible", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/buyer/cart-preview-table.tsx"), "utf8");
  assert.match(source, /Live payment is not connected yet/);
  assert.match(source, /re-checked on the server/);
  assert.match(source, /Continue To Checkout Review/);
});

test("buyer commerce empty states carry useful next actions", () => {
  const emptyStateSource = fs.readFileSync(path.join(process.cwd(), "components/shared/empty-state.tsx"), "utf8");
  const gridSource = fs.readFileSync(path.join(process.cwd(), "components/shared/product-grid.tsx"), "utf8");
  const browserSource = fs.readFileSync(path.join(process.cwd(), "components/buyer/shop-browser.tsx"), "utf8");
  const cartSource = fs.readFileSync(path.join(process.cwd(), "components/buyer/cart-preview-table.tsx"), "utf8");
  assert.equal(emptyStateSource.includes("MVP Placeholder"), false);
  assert.equal(gridSource.includes("placeholder products"), false);
  assert.equal(browserSource.includes("emptyActionHref"), true);
  assert.match(cartSource, /actionHref="\/shop"/);
});

test("buyer commerce rendered copy has no demo, mock, or MVP leakage", () => {
  const buyerCommerceFiles = [
    "app/shop/page.tsx",
    "app/cart/page.tsx",
    "app/checkout/page.tsx",
    "app/checkout/success/page.tsx",
    "components/sections/product-card.tsx",
    "components/shared/product-grid.tsx",
    "components/shared/empty-state.tsx",
    "components/buyer/shop-browser.tsx",
    "components/buyer/cart-preview-table.tsx",
    "components/buyer/product-purchase-panel.tsx",
    "components/checkout/place-draft-order.tsx",
  ];
  // Strip comments and import lines: the sweep targets rendered copy only.
  const stripNonRendered = (source) =>
    source
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^import[^\n]*$/gm, "");
  for (const file of buyerCommerceFiles) {
    const source = stripNonRendered(
      fs.readFileSync(path.join(process.cwd(), file), "utf8"),
    );
    for (const term of [
      "MVP",
      "demo",
      "mock",
      "fake",
      "placeholder",
      "test payment",
      "payment received",
      "guaranteed delivery",
      "instant refund",
      "Razorpay active",
      "real-time delivery",
      "launch-ready",
    ]) {
      assert.equal(source.includes(term), false, `${file} leaks "${term}"`);
    }
  }
});

test("draft checkout copy never claims a paid or confirmed order", () => {
  const created = resolveCheckoutAttempt({ ok: true, orderId: NEW_ROW_ID, status: "DRAFT", redirectTo: `/orders/${NEW_ROW_ID}`, reused: false });
  const recovered = resolveCheckoutAttempt({ ok: true, orderId: NEW_ROW_ID, status: "DRAFT", redirectTo: `/orders/${NEW_ROW_ID}`, reused: true });
  for (const view of [created, recovered]) {
    assert.match(view.message, /unpaid draft/);
    assert.doesNotMatch(`${view.title} ${view.message}`, /\b(paid|confirmed)\b/i);
  }
  const failureCodes = [
    "UNAUTHENTICATED",
    "ADDRESS_REQUIRED",
    "OUT_OF_STOCK",
    "PRODUCT_UNAVAILABLE",
    "IDEMPOTENCY_CONFLICT",
    "NOT_WIRED",
    "VALIDATION_FAILED",
    "FORBIDDEN",
    "DB_ERROR",
  ];
  for (const code of failureCodes) {
    const view = resolveCheckoutAttempt({ ok: false, code, message: "raw backend detail" });
    // Buyer-facing copy never echoes the raw backend code or message.
    assert.equal(`${view.title} ${view.message}`.includes(code), false);
    assert.equal(`${view.title} ${view.message}`.includes("raw backend detail"), false);
  }
});

// ---- D7-B: buyer account, order detail, FAQ truth --------------------------

const { describeOrderStatus } = require("@/lib/orders/read-buyer-orders");
const {
  validateSupportTicketInput,
  supportTicketCategoryLabels,
  supportTicketCategories,
} = require("@/lib/support/support-requests");

test("draft and payment-pending orders are always described as not paid", () => {
  for (const status of ["DRAFT", "PAYMENT_PENDING"]) {
    const view = describeOrderStatus(status);
    assert.match(view.label, /not paid/i);
    assert.match(view.note, /(No payment|not been (charged|completed|taken))/i);
    assert.doesNotMatch(view.label, /confirmed/i);
  }
});

test("order detail page keeps the unpaid banner and no tracking claims", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/orders/[id]/page.tsx"), "utf8");
  assert.match(source, /No payment has been taken/);
  assert.equal(source.includes('order.status === "DRAFT" || order.status === "PAYMENT_PENDING"'), true);
  assert.doesNotMatch(source, /real-time tracking|guaranteed delivery|instant refund/i);
});

test("account page shows no raw backend errors and links to real orders", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/account/page.tsx"), "utf8");
  assert.equal(source.includes("QUERY ERROR"), false);
  assert.equal(source.includes("Role query failed"), false);
  assert.equal(source.includes("RLS policy"), false);
  assert.match(source, /href="\/orders"/);
  assert.match(source, /My Orders/);
});

test("account orders page defers to the real order history route", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/account/orders/page.tsx"), "utf8");
  assert.match(source, /redirect\("\/orders"\)/);
  assert.equal(source.includes("No order has been placed yet"), false);
});

test("order readiness panel does not claim history waits for live payment", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "components/orders/order-readiness-panel.tsx"), "utf8");
  assert.equal(source.includes("will appear after live payment is connected"), false);
  assert.match(source, /unpaid draft order/i);
  assert.match(source, /Back To Shop/);
});

test("support ticket categories render via buyer-facing labels", () => {
  for (const category of supportTicketCategories) {
    const label = supportTicketCategoryLabels[category];
    assert.equal(typeof label, "string");
    assert.notEqual(label, category);
  }
  for (const file of ["app/account/support/page.tsx", "app/account/support/[id]/page.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    assert.equal(source.includes("supportTicketCategoryLabels"), true);
  }
});

test("support validation messages are buyer-friendly", () => {
  const errors = validateSupportTicketInput({
    category: "ORDER",
    subject: "",
    message: "",
    orderId: null,
  });
  assert.equal(errors.subject, "Subject is required.");
  assert.equal(errors.message, "Message is required.");
  for (const value of Object.values(errors)) {
    assert.doesNotMatch(value, /VALIDATION_FAILED|DB_ERROR|null|undefined/);
  }
});

test("FAQ and public support/returns pages carry no internal or false claims", () => {
  const files = ["app/faq/page.tsx", "app/support/page.tsx", "app/returns/page.tsx"];
  for (const file of files) {
    // Rendered copy only: comments and imports are not shown to buyers.
    const source = fs
      .readFileSync(path.join(process.cwd(), file), "utf8")
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^import[^\n]*$/gm, "");
    for (const term of [
      "MVP",
      "demo",
      "mock",
      "placeholder",
      "test payment",
      "payment received",
      "guaranteed delivery",
      "instant refund",
      "real-time tracking",
      "Razorpay",
      "launch-ready",
      "testers",
    ]) {
      assert.equal(source.includes(term), false, `${file} leaks "${term}"`);
    }
  }
  const faqSource = fs.readFileSync(path.join(process.cwd(), "app/faq/page.tsx"), "utf8");
  assert.match(faqSource, /live payment, delivery, and refunds/i);
});

// ---- D7-C: seller/admin operations UI readiness ----------------------------

const {
  returnRequestStatuses,
  returnRequestStatusLabels,
} = require("@/lib/returns/return-requests");

test("seller order pages never reference buyer identity, address, or payment fields", () => {
  for (const file of ["app/seller/orders/page.tsx", "app/seller/orders/[id]/page.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    for (const term of ["buyerId", "buyer_id", "shippingAddress", "shipping_address", "paymentProvider", "paymentReference", ".email", ".phone"]) {
      assert.equal(source.includes(term), false, `${file} references "${term}"`);
    }
  }
});

test("seller read-only fulfilment state is truthful without database jargon", () => {
  for (const file of ["app/seller/orders/page.tsx", "app/seller/orders/[id]/page.tsx"]) {
    const source = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    assert.match(source, /Read-only view/);
    assert.match(source, /fulfilmentReady/);
    // Rendered copy must not lean on migration/database wording.
    assert.equal(source.includes("database migration is applied"), false, file);
  }
});

test("admin order detail hides raw table names and formats event types", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/admin/orders/[id]/page.tsx"), "utf8");
  assert.equal(source.includes("(order_item_events)"), false);
  assert.equal(source.includes("(order_events)"), false);
  assert.match(source, /formatEnum\(event\.eventType\)/);
});

test("admin order and return UI never claims live payment or refund capability", () => {
  const orderDetail = fs.readFileSync(path.join(process.cwd(), "app/admin/orders/[id]/page.tsx"), "utf8");
  const returnsQueue = fs.readFileSync(path.join(process.cwd(), "app/admin/returns/page.tsx"), "utf8");
  assert.match(orderDetail, /Paid and Refunded can never be set here/);
  assert.match(returnsQueue, /approving a return here does not move money/);
  for (const source of [orderDetail, returnsQueue]) {
    assert.equal(/Razorpay/i.test(source), false);
    assert.equal(/payment received|automatic refund/i.test(source), false);
  }
});

test("return request status labels are human-readable for every status", () => {
  for (const status of returnRequestStatuses) {
    const label = returnRequestStatusLabels[status];
    assert.equal(typeof label, "string");
    assert.notEqual(label, status);
    assert.equal(label.includes("_"), false);
  }
  const sellerDetail = fs.readFileSync(path.join(process.cwd(), "app/seller/orders/[id]/page.tsx"), "utf8");
  assert.match(sellerDetail, /returnRequestStatusLabels/);
  assert.equal(sellerDetail.includes('replaceAll("_", " ")'), false);
});

test("seller and admin empty order queues include useful next actions", () => {
  const sellerOrders = fs.readFileSync(path.join(process.cwd(), "app/seller/orders/page.tsx"), "utf8");
  const adminOrders = fs.readFileSync(path.join(process.cwd(), "app/admin/orders/page.tsx"), "utf8");
  assert.match(sellerOrders, /href="\/seller\/products"/);
  assert.match(adminOrders, /href="\/admin\/operations"/);
});

test("seller dashboard copy reflects real orders without demo-seller framing", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/seller/page.tsx"), "utf8");
  assert.equal(source.includes("Demo Seller"), false);
  assert.equal(source.includes("Add Product Demo"), false);
  assert.match(source, /href="\/seller\/orders"/);
  assert.match(source, /not connected yet/);
});
