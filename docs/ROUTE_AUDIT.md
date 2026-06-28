# SKXNZ Route Audit

| Route | Area | Status | Notes | Must test before launch |
| --- | --- | --- | --- | --- |
| `/` | Buyer | Built | Homepage with buyer, AI stylist, and seller entry points. | Yes |
| `/login` | Shared | Placeholder | Demo role selector only. Real authentication is not connected. | Yes |
| `/shop` | Buyer | Built | Approved products only in current mock or local state flow. | Yes |
| `/product/[id]` | Buyer | Built | Dynamic product detail route with selectors and cart action in MVP mode. | Yes |
| `/cart` | Buyer | Placeholder | Cart flow works in local state only. Checkout is not live. | Yes |
| `/wishlist` | Buyer | Placeholder | Wishlist works in local state only. | Yes |
| `/orders` | Buyer | Placeholder | Buyer order history uses mock or local lifecycle data. | Yes |
| `/returns` | Buyer | Placeholder | Return request flow is MVP-only and not connected to real refunds. | Yes |
| `/account` | Buyer | Placeholder | Buyer profile is demo-only. Real authentication is not connected. | Yes |
| `/support` | Buyer | Placeholder | Support intake writes to browser-local MVP state only. | Yes |
| `/sell` | Seller | Placeholder | Seller onboarding form works in MVP mode only. | Yes |
| `/seller` | Seller | Built | Seller dashboard and onboarding status are visible. | Yes |
| `/seller/products` | Seller | Placeholder | Product submission and review state are local or mock only. | Yes |
| `/seller/orders` | Seller | Placeholder | Seller order lifecycle view is mock or local only. | Yes |
| `/admin` | Admin | Built | Admin dashboard is reachable and visually consistent. | Yes |
| `/admin/sellers` | Admin | Placeholder | Seller approval actions are local or mock only. | Yes |
| `/admin/products` | Admin | Placeholder | Product approval actions are local or mock only. | Yes |
| `/admin/orders` | Admin | Placeholder | Order management is visible, but payments and refunds are not live. | Yes |
| `/admin/returns` | Admin | Placeholder | Return and refund review is visible, but refund processing is not live. | Yes |
| `/admin/support` | Admin | Placeholder | Support queue uses local or mock ticket data. | Yes |
| `/ai-stylist` | Shared | Placeholder | Rule-based AI stylist demo only. | No |
| `/ai-tools/product-title` | Shared | Placeholder | Rule-based title generator only. | No |
| `/ai-tools/product-description` | Shared | Placeholder | Rule-based description generator only. | No |
| `/ai-tools/product-video-prompt` | Shared | Placeholder | Rule-based video prompt generator only. | No |
| `/about` | Shared | Built | Brand and private MVP context route. | No |
| `/contact` | Shared | Placeholder | Contact route is present, but live messaging is not connected. | No |
