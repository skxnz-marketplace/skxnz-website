import type { Metadata } from "next";

import { AccessLayout } from "@/components/auth/access-layout";
import { AccessForm } from "@/components/auth/access-form";
import { safeNextPath } from "@/lib/auth/safe-redirect";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  // A callback/link failure arrives as ?auth=error — show ONE generic line, no
  // raw provider text, and nothing that reveals whether an account exists.
  const linkError = params.auth === "error" || params.error != null;

  return (
    <AccessLayout>
      {linkError && (
        <p
          role="alert"
          className="mb-5 rounded-xl border border-[#ff8fb0]/40 bg-[#ff8fb0]/10 px-4 py-3 text-[0.82rem] text-[#ffc2d4]"
        >
          That link didn&apos;t work or has expired. Sign in below, or request a new link.
        </p>
      )}
      <AccessForm mode="login" nextPath={nextPath} />
    </AccessLayout>
  );
}
