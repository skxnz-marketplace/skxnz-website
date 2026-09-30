// Retries a fetch on transient network-level failures only (the connection
// never completed — DNS hiccup, dropped socket, momentary resource
// starvation on the machine running the server). Never retries on an actual
// HTTP response, even an error one (401/500/etc are real answers from the
// server, not something a retry fixes) — only on fetch() itself throwing.
//
// READS ONLY. A thrown fetch does not prove the request never reached the
// server: a socket can drop after the write landed. Replaying a POST/PATCH/
// DELETE could duplicate a community post or any other side effect, so any
// non-GET/HEAD request goes out exactly once. Writes that must survive a
// flaky connection need their own idempotency key, not this helper.
const RETRYABLE_METHODS = new Set(["GET", "HEAD"]);

function requestMethod(input: RequestInfo | URL, init?: RequestInit): string {
  const method = init?.method ?? (input instanceof Request ? input.method : "GET");
  return method.toUpperCase();
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  if (!RETRYABLE_METHODS.has(requestMethod(input, init))) return fetch(input, init);

  const { retries = 2, baseDelayMs = 200 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      // A caller-aborted request (timeout, navigation) is final, not transient.
      if (attempt === retries || init?.signal?.aborted) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }

  throw lastError;
}
