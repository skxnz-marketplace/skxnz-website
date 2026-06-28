import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { ProductVideoPromptDemo } from "@/components/ai/product-video-prompt-demo";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function AIVideoPromptGeneratorPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer", "seller", "admin"]}
      areaLabel="AI video prompt generator"
      helperText="AI placeholder tools are kept private during public MVP launch mode."
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageIntro
          eyebrow="AI Video Prompt Generator"
          title="Rule-based launch prompt drafting for future product video workflows."
          description="This MVP placeholder tool builds a four-second product video prompt from seller inputs using fixed SKXNZ rules. No text-to-video model or render pipeline is live."
          actions={
            <>
              <Link
                href="/ai-tools/product-title"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Title Tool
              </Link>
              <Link
                href="/seller/products"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Seller Products
              </Link>
            </>
          }
        />

        <ProductVideoPromptDemo />
      </div>
    </DemoRoleGate>
  );
}
