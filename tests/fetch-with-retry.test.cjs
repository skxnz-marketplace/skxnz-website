// Retry helper regression suite: reads may retry on a thrown fetch, writes
// must go out exactly once (a replayed POST could duplicate a community post).

require("./bootstrap.cjs");

const { test } = require("node:test");
const assert = require("node:assert/strict");

const { fetchWithRetry } = require("./.build/lib/net/fetch-with-retry.js");

function flakyFetch(failures) {
  const calls = [];
  const fake = async (input, init) => {
    calls.push(init?.method ?? "GET");
    if (calls.length <= failures) throw new TypeError("fetch failed");
    return new Response("ok");
  };
  return { fake, calls };
}

async function withFetch(fake, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fake;
  try {
    return await run();
  } finally {
    globalThis.fetch = original;
  }
}

test("GET retries a connection-level failure", async () => {
  const { fake, calls } = flakyFetch(1);
  const res = await withFetch(fake, () => fetchWithRetry("https://x.test/a", undefined, { baseDelayMs: 1 }));
  assert.equal(res.status, 200);
  assert.equal(calls.length, 2);
});

for (const method of ["POST", "PATCH", "PUT", "DELETE"]) {
  test(`${method} is sent exactly once even when it throws`, async () => {
    const { fake, calls } = flakyFetch(1);
    await assert.rejects(
      withFetch(fake, () => fetchWithRetry("https://x.test/a", { method }, { baseDelayMs: 1 })),
      /fetch failed/,
    );
    assert.equal(calls.length, 1);
  });
}

test("an aborted read is not retried", async () => {
  const { fake, calls } = flakyFetch(5);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    withFetch(fake, () => fetchWithRetry("https://x.test/a", { signal: controller.signal }, { baseDelayMs: 1 })),
  );
  assert.equal(calls.length, 1);
});
