// Test double for @/lib/supabase/admin. Uses the same chainable builder as
// the session client mock so the seller-fulfilment action's service-role
// UPDATE / audit-event INSERT can be scripted per test.

const { createMockSupabase } = require("../helpers/mock-supabase.cjs");

let currentAdminClient = null;

exports.__setAdminMockClient = (client) => {
  currentAdminClient = client;
};

// The real module exports `supabaseAdmin` — a client instance, not a factory.
Object.defineProperty(exports, "supabaseAdmin", {
  enumerable: true,
  get() {
    if (!currentAdminClient) {
      // Default: an "authenticated" admin with an empty resolver so tests
      // that never touch the admin client don't blow up on import.
      currentAdminClient = createMockSupabase({
        user: { id: "admin-mock", email: "admin@test.local" },
        resolve: () => ({ data: null, error: null }),
      });
    }
    return currentAdminClient;
  },
});
