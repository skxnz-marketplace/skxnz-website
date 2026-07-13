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
