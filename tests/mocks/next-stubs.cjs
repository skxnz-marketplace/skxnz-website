// Test stubs for next/cache and next/navigation. The real implementations
// require a live Next.js request context; under node:test they would throw.
// revalidatePath is recorded (not executed) so tests can assert refresh
// intent without a server.

const revalidatedPaths = [];

exports.revalidatePath = (path) => {
  revalidatedPaths.push(path);
};

exports.__getRevalidatedPaths = () => revalidatedPaths;

exports.redirect = (url) => {
  const error = new Error(`NEXT_REDIRECT:${url}`);
  error.digest = `NEXT_REDIRECT;${url}`;
  throw error;
};

exports.notFound = () => {
  const error = new Error("NEXT_NOT_FOUND");
  error.digest = "NEXT_NOT_FOUND";
  throw error;
};

// next/headers stub. The rate-limit framework reads the caller IP from request
// headers inside Server Actions; under node:test there is no request scope.
// Tests set the headers explicitly so per-IP behaviour can be exercised
// deterministically instead of being skipped.
let mockHeaders = new Map();

exports.__setMockHeaders = (entries = {}) => {
  mockHeaders = new Map(
    Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value]),
  );
};

exports.headers = async () => ({
  get: (name) => mockHeaders.get(String(name).toLowerCase()) ?? null,
});
