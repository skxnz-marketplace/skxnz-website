import { cn } from "@/lib/cn";
import { getAiDisclaimerCopy } from "@/src/lib/ai/safety";

type AIDisclaimerProps = {
  className?: string;
};

export function AIDisclaimer({ className }: AIDisclaimerProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-sangria/20 bg-sangria/10 p-4 text-sm leading-6 text-silver",
      className,
    )}
  >
      {getAiDisclaimerCopy()}
    </div>
  );
}
