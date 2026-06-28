import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getTryOnConsentCopy } from "@/src/lib/ai/safety";

export function AiTryOnRoadmapCard() {
  return (
    <Card className="section-border rounded-[36px] p-6 sm:p-8">
      <Badge>Future Try-On</Badge>
      <h2 className="mt-4 font-display text-2xl uppercase tracking-[0.14em] text-obsidian">
        Phase 3 route stub prepared, not active.
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-obsidian/75">
        Future try-on uses reserved backend job routes only. Personal photo upload,
        storage, and image generation stay disabled until consent, retention, and delete
        controls are fully approved.
      </p>
      <div className="mt-5 rounded-[24px] border border-sandstone/80 bg-white/80 p-4 text-sm leading-6 text-obsidian/70">
        {getTryOnConsentCopy()}
      </div>
    </Card>
  );
}
