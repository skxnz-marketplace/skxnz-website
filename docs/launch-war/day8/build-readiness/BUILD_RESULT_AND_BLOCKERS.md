# D8-A production build result and blockers

The first build failed because the package script used POSIX `NAME=value command` syntax, which Windows cannot execute. D8-A replaced it with a cross-platform Node launcher and removed the external Google-font fetch by using the already-installed local Syne package.

The final local build still fails under Windows because the reused dependency tree lacks `@next/swc-win32-x64-msvc` and provides only `@next/swc-wasm-nodejs`. Its WASM transform reports that the server-action plugin is unsupported when a client seller component reaches a server module that imports `next/headers`. This is a local Windows/WASM compiler limitation, not evidence that Vercel's Linux/native SWC build passed.

Fixed deterministic failures: cross-platform build invocation; no synchronous helper export from a `"use server"` module; and no Google Fonts fetch during build. Run the production build in an environment with native Next SWC and inspect its actual logs. Do not treat this Windows result as launch approval.
