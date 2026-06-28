import { Button } from "@/components/ui/button";

type CommunityHeroProps = {
  onCreatePost: () => void;
  onExploreSignals: () => void;
};

export function CommunityHero({
  onCreatePost,
  onExploreSignals,
}: CommunityHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-[rgba(58,8,24,0.12)] bg-[linear-gradient(135deg,var(--skxnz-obsidian),var(--skxnz-maroon-deep),var(--skxnz-maroon))] text-[var(--skxnz-text-light)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.16),transparent_27%),radial-gradient(circle_at_18%_82%,rgba(217,70,239,0.13),transparent_32%)]" />
      <div className="absolute right-[-8rem] top-[-8rem] h-72 w-72 rounded-full border border-white/10 bg-white/[0.035] blur-sm" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-16">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.08)] px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.22em] text-[var(--skxnz-glint)]">
              Beta
            </span>
            <span className="text-[0.66rem] font-black uppercase tracking-[0.28em] text-white/58">
              Post the fit. Tag the signal.
            </span>
          </div>

          <h1 className="mt-5 max-w-[12ch] break-words font-display text-[2.7rem] uppercase leading-[0.9] tracking-[0.05em] sm:text-6xl lg:text-7xl">
            Signal Community
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/76 sm:text-base">
            A private MVP space for SKXNZ style posts, product-tagged looks,
            saved signals, and moderation-ready community testing.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button type="button" size="lg" onClick={onCreatePost}>
              Create Post
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={onExploreSignals}>
              Explore Signals
            </Button>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 self-end sm:grid-cols-2">
          {[
            ["Tagged products", "SKXNZ catalog only"],
            ["Local saves", "Stored locally for now"],
            ["Reports", "Prepared for review demo"],
            ["Moderation", "Required before public launch"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-[26px] border border-white/12 bg-white/[0.075] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur"
            >
              <p className="text-[0.62rem] font-black uppercase tracking-[0.22em] text-white/50">
                {label}
              </p>
              <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-white/86">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
