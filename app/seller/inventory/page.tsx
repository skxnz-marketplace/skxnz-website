import Link from "next/link";

import { DataTable } from "@/components/sections/data-table";
import { StatusBadge } from "@/components/sections/status-badge";
import { SellerDashboardShell } from "@/components/seller/seller-dashboard-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sellerInventoryRows } from "@/lib/data/dashboards";

export default function SellerInventoryPage() {
  return (
    <SellerDashboardShell
      eyebrow="Inventory demo"
      title="Variant visibility"
      description="Read-only SKU and stock visibility for seller workflow testing. Stock edits, imports, database writes, and live publishing are intentionally offline."
      actions={
        <>
          <Link
            href="/seller/products"
            className={buttonVariants({ variant: "primary", size: "lg" })}
          >
            Add Product Demo
          </Link>
          <Link
            href="/seller/orders"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Orders
          </Link>
        </>
      }
    >
      <div className="space-y-6">
        <DataTable
          eyebrow="Seller Ops"
          title="Inventory table"
          description="Use this surface later for stock edits, low-stock warnings, and imports. For now it stays read-only and seeded with mock data."
          columns={["SKU", "Product", "Variant", "Stock", "Status", "Updated"]}
          rows={sellerInventoryRows.map((row) => ({
            id: row.sku,
            cells: [
              row.sku,
              row.product,
              row.variant,
              row.stock,
              <StatusBadge key={`${row.sku}-status`} label={row.status} />,
              row.updatedAt,
            ],
          }))}
        />

        <Card className="rounded-[30px] border-[rgba(58,8,24,0.12)] bg-[var(--skxnz-surface)] p-5 text-sm leading-7 text-stone">
          Inventory edits are not persisted yet. This table exists to lock down the
          seller-side information architecture before database wiring and authentication.
        </Card>
      </div>
    </SellerDashboardShell>
  );
}
