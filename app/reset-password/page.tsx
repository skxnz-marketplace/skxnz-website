import type { Metadata } from "next";

import { AccessLayout } from "@/components/auth/access-layout";
import { ResetGate } from "@/components/auth/reset-gate";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <AccessLayout>
      <ResetGate />
    </AccessLayout>
  );
}
