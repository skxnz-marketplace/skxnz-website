"use client";

import { useState } from "react";

import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { DataTable } from "@/components/sections/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { demoAdminUsers, type DemoAdminUser } from "@/lib/data/admin";

export function AdminUsersTable() {
  const [selectedUser, setSelectedUser] = useState<DemoAdminUser | null>(
    demoAdminUsers[0] ?? null,
  );

  return (
    <div className="space-y-6">
      <DataTable
        eyebrow="Users"
        title="Demo user list"
        description="User visibility is internal/demo only. Real authentication, role permissions, and private user data storage are not connected yet."
        columns={[
          "Name",
          "Email",
          "Role",
          "Wishlist Count",
          "Orders Count",
          "Status",
          "View Profile",
        ]}
        rows={demoAdminUsers.map((user) => ({
          id: user.id,
          cells: [
            user.name,
            user.email,
            user.role,
            user.wishlistCount.toString(),
            user.ordersCount.toString(),
            <AdminStatusBadge
              key={`${user.id}-status`}
              label={user.status}
              tone={user.status === "Demo Active" ? "success" : "info"}
            />,
            <Button
              key={`${user.id}-view`}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(user)}
            >
              View Profile
            </Button>,
          ],
        }))}
      />

      {selectedUser ? (
        <Card className="section-border rounded-[32px] p-6 sm:p-8">
          <p className="text-[0.68rem] uppercase tracking-[0.24em] text-teal">
            User Profile Demo
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-[0.14em] text-pearl">
            {selectedUser.name}
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Email", selectedUser.email],
              ["City", selectedUser.city],
              ["Wishlist", `${selectedUser.wishlistCount} demo saves`],
              ["Orders", `${selectedUser.ordersCount} demo orders`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] p-5 text-sm leading-6 text-silver"
              >
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-teal">
                  {label}
                </p>
                <p className="mt-2 break-words text-pearl">{value}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-7 text-silver">
            Profile actions are read-only in this admin foundation. Production
            role-based access, audit logging, and private data policy must be added
            before real user management goes live.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
