import type { Metadata } from "next";

import { AccessLayout } from "@/components/auth/access-layout";
import { AccessForm } from "@/components/auth/access-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AccessLayout>
      <AccessForm mode="forgot" />
    </AccessLayout>
  );
}
