import { notFound } from "next/navigation";

// Seller recruitment is not shown on the public/buyer site — the founder
// decided the seller side stays a fully private, seller-only area (no
// public application surface for now). This route 404s rather than
// redirecting, so it doesn't silently resurface as a working page.
export default function SellPage(): never {
  notFound();
}
