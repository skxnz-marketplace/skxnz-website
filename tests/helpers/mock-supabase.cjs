// Minimal chainable mock of the supabase-js query builder.
//
// Each `from(table)` call returns a builder that records every chained call
// ({ method, args }) and resolves through the test-supplied `resolve` handler
// when awaited (thenable) or terminated with single()/maybeSingle(). The
// handler receives { table, calls } and returns { data, error } — the same
// contract the real client resolves with, so the actions under test run their
// real logic against scripted data.

function createBuilder(table, resolve, log) {
  const calls = [];
  const builder = {};

  const record =
    (method) =>
    (...args) => {
      calls.push({ method, args });
      return builder;
    };

  for (const method of [
    "select",
    "insert",
    "update",
    "eq",
    "neq",
    "in",
    "gte",
    "lte",
    "gt",
    "lt",
    "order",
    "limit",
  ]) {
    builder[method] = record(method);
  }

  const finish = () => {
    const entry = { table, calls };
    if (log) log.push(entry);
    return Promise.resolve(resolve(entry));
  };

  builder.maybeSingle = () => {
    calls.push({ method: "maybeSingle", args: [] });
    return finish();
  };
  builder.single = () => {
    calls.push({ method: "single", args: [] });
    return finish();
  };
  // Thenable: `await builder` (insert without .select(), plain selects).
  builder.then = (onFulfilled, onRejected) => finish().then(onFulfilled, onRejected);

  return builder;
}

/**
 * @param {object} options
 * @param {{ id: string, email?: string } | null} options.user session user (null = signed out)
 * @param {(query: { table: string, calls: Array<{method: string, args: unknown[]}> }) => { data: unknown, error: unknown }} [options.resolve]
 * @param {Array} [options.log] receives every executed query for assertions
 */
function createMockSupabase({ user, resolve = () => ({ data: null, error: null }), log }) {
  return {
    auth: {
      getUser: async () =>
        user
          ? { data: { user }, error: null }
          : { data: { user: null }, error: { message: "not signed in" } },
    },
    from(table) {
      return createBuilder(table, resolve, log);
    },
  };
}

/** Find the first recorded call of a method in a query's chain. */
function findCall(query, method) {
  return query.calls.find((call) => call.method === method);
}

module.exports = { createMockSupabase, findCall };
