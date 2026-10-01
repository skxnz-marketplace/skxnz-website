// Test double for @/lib/supabase/public-catalog (the cookie-less publishable-key
// client used by lib/catalog/public-catalog.ts). Each `from(table)` returns a
// chainable builder that records calls and resolves through the handler a test
// installs with setPublicCatalogHandler({ table, calls }) => { data, error }.

let handler = () => ({ data: [], error: null });

function setPublicCatalogHandler(next) {
  handler = next;
}

function createBuilder(table) {
  const calls = [];
  const builder = {};
  for (const method of ["select", "eq", "in", "order", "limit", "not", "or", "abortSignal"]) {
    builder[method] = (...args) => {
      calls.push({ method, args });
      return builder;
    };
  }
  const finish = () => Promise.resolve(handler({ table, calls }));
  // Like the real client: maybeSingle() resolves to one row or null.
  builder.maybeSingle = () => {
    calls.push({ method: "maybeSingle", args: [] });
    return finish().then((result) =>
      Array.isArray(result.data) ? { ...result, data: result.data[0] ?? null } : result,
    );
  };
  builder.then = (onFulfilled, onRejected) => finish().then(onFulfilled, onRejected);
  return builder;
}

module.exports = {
  createPublicCatalogClient: () => ({ from: (table) => createBuilder(table) }),
  setPublicCatalogHandler,
};
