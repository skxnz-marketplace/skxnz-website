# Day 6 migration-chain status

| Migration | Status | Day 6 gate |
| --- | --- | --- |
| `0001_user_layer.sql` | Present | Must provide users, addresses, roles, and updated-at helper. |
| `0002_catalog_layer.sql` | Missing from authoritative local Git history | **Critical stop**: recover exact baseline before blank-project apply. |
| `0003_fix_admin_rls_helper.sql` | Present | Requires catalog policy compatibility and ADMIN helper review. |
| `0004_seller_product_lifecycle.sql` | Present | Requires catalog tables, seller ownership columns, and RLS. |
| `0005_commerce_layer.sql` | Present | Requires `products` with seller ownership. |
| `0006_fix_seller_order_item_rls.sql` | Present | Requires orders, order items, and products. |
| `0007_buyer_saved_items.sql` | Present | Independent table, still verify RLS/grants. |
| `0008_d1b_atomic_returns.sql` | Draft/unapplied | Requires commerce chain; use verify and isolation scripts. |
| `0009_seller_line_fulfilment.sql` | Draft/unapplied | Requires catalog seller ownership and commerce chain. |
| `0010_admin_commerce_atomic_actions.sql` | Draft/unapplied | Requires commerce returns/orders and ADMIN helper. |
| `0011_atomic_order_intent.sql` | Draft/unapplied | Requires addresses, commerce tables, products, and variants. |

The static dependency review finds no numbering collision: `0002` is the sole gap. It does prevent a trustworthy blank-project migration rehearsal and therefore blocks integration readiness.
