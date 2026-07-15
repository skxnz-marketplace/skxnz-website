# Day 6 browser QA checklist

- Verify anonymous catalog read either shows approved ACTIVE catalog data or the existing truthful preview/fallback state.
- Verify a buyer can create a DRAFT order only after the atomic RPC is installed; a missing RPC leaves checkout non-complete and explains that nothing was created or charged.
- Verify retry uses a fresh per-attempt idempotency key and compatible retry shows the existing draft safely.
- Verify seller A cannot open or alter Seller B fulfilment line or return indicator.
- Verify admin order/return controls are read-only with a truthful unavailable state until `0010` is applied.
- Verify no UI says payment succeeded, refund completed, shipment booked, or delivery provider confirmed without its corresponding real server-side integration.
- Keyboard-test checkout error/retry states, focus movement, labels, contrast, narrow viewport, and touch layout.

Capture browser version, viewport, role, route, and screenshot/video reference outside this repository. Stop on any unauthorized data exposure or misleading completion message.
