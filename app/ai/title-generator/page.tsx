import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { ProductTitleDemo } from "@/components/ai/product-title-demo";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function AITitleGeneratorPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer", "seller", "admin"]}
      areaLabel="AI product title generator"
      helperText="AI placeholder tools are kept private during public MVP launch mode."
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageIntro
          eyebrow="AI Product Title Generator"
          title="Rule-based title concepts for premium SKXNZ product naming."
          description="This is an MVP placeholder tool, not a live AI API. It uses deterministic brand rules to turn product inputs into premium SKXNZ-style title options."
          actions={
            <>
              <Link
                href="/ai-tools/product-description"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Description Tool
              </Link>
              <Link
                href="/ai-stylist"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                AI Stylist
              </Link>
            </>
          }
        />

        <ProductTitleDemo />
      </div>
    </DemoRoleGate>
  );
}
