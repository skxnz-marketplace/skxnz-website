import { BuyerAiAssistantPanel } from "@/components/ai/buyer-ai-assistant-panel";
import { AiOutfitBuilderPanel } from "@/components/ai/ai-outfit-builder-panel";
import { AiTryOnRoadmapCard } from "@/components/ai/ai-try-on-roadmap-card";

export function AiPhaseOneStudio() {
  return (
    <div className="space-y-5">
      <BuyerAiAssistantPanel />
      <AiOutfitBuilderPanel />
      <AiTryOnRoadmapCard />
    </div>
  );
}
