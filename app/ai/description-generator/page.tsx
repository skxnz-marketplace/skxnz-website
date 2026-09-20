import Link from "next/link";

import { DemoRoleGate } from "@/components/auth/demo-role-gate";
import { ProductDescriptionDemo } from "@/components/ai/product-description-demo";
import { PageIntro } from "@/components/sections/page-intro";
import { buttonVariants } from "@/components/ui/button";

export default function AIDescriptionGeneratorPage() {
  return (
    <DemoRoleGate
      allowedRoles={["buyer", "seller", "admin"]}
      areaLabel="AI description generator"
      helperText="AI placeholder tools are kept private during public MVP launch mode."
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <PageIntro
          headingLevel="h1"
          eyebrow="AI Description Generator"
          title="Rule-based product storytelling for the private SKXNZ catalog."
          description="This MVP placeholder tool turns structured product details into short copy, bullet highlights, and a care note using brand rules only. No real AI service is connected."
          actions={
            <>
              <Link
                href="/ai/title-generator"
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                Title Tool
              </Link>
              <Link
                href="/ai/video-prompt-generator"
                className={buttonVariants({ variant: "ghost", size: "lg" })}
              >
                Video Prompt Tool
              </Link>
            </>
          }
        />

        <ProductDescriptionDemo />
      </div>
    </DemoRoleGate>
  );
}
