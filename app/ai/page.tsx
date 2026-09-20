import type { Metadata } from "next";

import { SkxnzAssistantInlineChat } from "@/components/ai/skxnz-assistant-inline-chat";
import DotField from "@/components/reactbits/dot-field";
import Prism from "@/components/reactbits/prism";
import { dotFieldConfig, dotFieldWrapperOpacity, prismConfig } from "@/lib/reactbits-config";

const description =
  "SKXNZ's AI discovery experience — talk to the SKXNZ Assistant about futurewear, style, and the catalog.";

export const metadata: Metadata = {
  title: "SKXNZ AI",
  description,
  alternates: { canonical: "/ai" },
  openGraph: { type: "website", title: "SKXNZ AI", description, url: "/ai" },
};

// The SKXNZ AI screen: React Bits Prism with a DotField veil, restored from the
// July working tree, plus the SKXNZ Assistant chat surfaced inline (not just
// the floating widget) so this page is somewhere people can actually talk to
// it. Prism/DotField/chat are client components that only touch WebGL/canvas
// or state inside themselves, so this page itself stays a server component.
export default function AiLabPage() {
  return (
    // svh keeps the scene exactly one visible screen tall as mobile browser
    // chrome shows and hides; the min-height stops a landscape phone from
    // squashing it into a sliver.
    <div className="relative h-[calc(100svh-var(--skxnz-header-offset))] min-h-[560px] overflow-hidden bg-black">
      <h1 className="sr-only">SKXNZ AI</h1>
      <div className="absolute inset-0 z-0 opacity-100">
        <Prism
          animationType={prismConfig.animationType}
          timeScale={prismConfig.timeScale}
          scale={prismConfig.scale}
          height={prismConfig.height}
          baseWidth={prismConfig.baseWidth}
          noise={prismConfig.noise}
          glow={prismConfig.glow}
          hueShift={prismConfig.hueShift}
          colorFrequency={prismConfig.colorFrequency}
          steps={prismConfig.steps}
          maxFps={prismConfig.maxFps}
          saturation={prismConfig.saturation}
          transparent
          suspendWhenOffscreen
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ opacity: dotFieldWrapperOpacity }}
      >
        <DotField
          dotRadius={dotFieldConfig.dotRadius}
          dotSpacing={dotFieldConfig.dotSpacing}
          cursorForce={dotFieldConfig.cursorForce}
          cursorRadius={dotFieldConfig.cursorRadius}
          bulgeStrength={dotFieldConfig.bulgeStrength}
          glowRadius={dotFieldConfig.glowRadius}
          waveAmplitude={dotFieldConfig.waveAmplitude}
          sparkle={dotFieldConfig.sparkle}
          gradientFrom={dotFieldConfig.gradientFrom}
          gradientTo={dotFieldConfig.gradientTo}
          glowColor={dotFieldConfig.glowColor}
          bulgeOnly={dotFieldConfig.bulgeOnly}
        />
      </div>

      <div className="relative z-20 flex h-full flex-col items-center justify-center gap-6 px-4 py-10 sm:gap-8 sm:px-6">
        <p className="text-center text-pearlcream drop-shadow-[0_1px_8px_rgba(0,0,0,0.5)]">
          <span className="font-signal block text-lg font-extralight uppercase tracking-[0.6em] sm:text-xl sm:tracking-[0.75em]">
            SKXNZ
          </span>
          <span className="font-impact italic mt-2 block text-4xl font-bold uppercase tracking-[0.1em] sm:mt-3 sm:text-5xl sm:tracking-[0.14em]">
            Assistant
          </span>
        </p>
        <SkxnzAssistantInlineChat className="w-full max-w-xl" />
      </div>
    </div>
  );
}
