// Test double for @/lib/supabase/server. The bootstrap require-hook resolves
// the real module specifier here, so the compiled server actions receive this
// client instead of a live Supabase connection. Tests install a per-case
// client via __setMockClient.

let currentClient = null;

exports.__setMockClient = (client) => {
  currentClient = client;
};

exports.createClient = async () => {
  if (!currentClient) {
    throw new Error("Test mock Supabase client not set — call __setMockClient first.");
  }
  return currentClient;
};
