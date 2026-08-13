import type { Metadata } from "next";

import { AccessLayout } from "@/components/auth/access-layout";
import { AccessForm } from "@/components/auth/access-form";
import { safeNextPath } from "@/lib/auth/safe-redirect";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  return (
    <AccessLayout>
      <AccessForm mode="signup" nextPath={safeNextPath(params.next)} />
    </AccessLayout>
  );
}
