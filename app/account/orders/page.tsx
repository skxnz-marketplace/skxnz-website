import { redirect } from "next/navigation";

// D7-B: /orders is the single source of truth for buyer order history (real
// DB rows, draft orders labeled unpaid). This page previously rendered a
// hard-coded "no order has been placed yet" state even when draft orders
// existed, so it now redirects instead of showing stale copy.
export default function AccountOrdersPage() {
  redirect("/orders");
}
