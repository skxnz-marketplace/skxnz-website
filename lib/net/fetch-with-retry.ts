// Retries a fetch on transient network-level failures only (the connection
// never completed — DNS hiccup, dropped socket, momentary resource
// starvation on the machine running the server). Never retries on an actual
// HTTP response, even an error one (401/500/etc are real answers from the
// server, not something a retry fixes) — only on fetch() itself throwing.
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: { retries?: number; baseDelayMs?: number } = {},
): Promise<Response> {
  const { retries = 2, baseDelayMs = 200 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((resolve) => setTimeout(resolve, baseDelayMs * 2 ** attempt));
    }
  }

  throw lastError;
}
