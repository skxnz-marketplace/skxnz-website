import type { Metadata } from "next";

import DotField from "@/components/reactbits/dot-field";
import Prism from "@/components/reactbits/prism";
import { dotFieldConfig, dotFieldWrapperOpacity, prismConfig } from "@/lib/reactbits-config";

export const metadata: Metadata = {
  title: "SKXNZ AI",
};

// The SKXNZ AI screen: React Bits Prism with a DotField veil, restored from the
// July working tree. Both effects are client components that only touch
// WebGL/canvas inside effects, so this page itself stays a server component.
export default function AiLabPage() {
  return (
    // svh keeps the scene exactly one visible screen tall as mobile browser
    // chrome shows and hides; the min-height stops a landscape phone from
    // squashing it into a sliver.
    <div className="relative h-[calc(100svh-var(--skxnz-header-offset))] min-h-[420px] overflow-hidden bg-black">
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
    </div>
  );
}
