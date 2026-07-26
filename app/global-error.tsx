"use client";

import { useEffect } from "react";

// Last-resort boundary: catches failures in the root layout itself, so it must
// render its own <html>/<body> and must not depend on app components, the
// design system, or global CSS — any of those could be what failed. Inline
// styles only, on purpose.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#101006",
          color: "#F4F1EC",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "36rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.68rem",
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              opacity: 0.66,
            }}
          >
            SKXNZ
          </p>
          <h1
            style={{
              margin: "1rem 0 0",
              fontSize: "clamp(1.75rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Signal lost.
          </h1>
          <p
            style={{
              margin: "1rem 0 0",
              fontSize: "0.95rem",
              lineHeight: 1.7,
              opacity: 0.78,
            }}
          >
            The site failed to load. Nothing you were doing was charged or
            submitted. Reload to try again.
          </p>
          {error.digest ? (
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.68rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                opacity: 0.55,
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              padding: "0.85rem 2rem",
              borderRadius: "999px",
              border: "1px solid rgba(244,241,236,0.24)",
              background: "#F4F1EC",
              color: "#101006",
              fontSize: "0.8rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
