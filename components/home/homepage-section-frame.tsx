type HomepageSectionFrameProps = {
  number: string;
  tone?: "light" | "dark";
};

const slots = ["A", "B", "C", "D", "E", "F"];

export function HomepageSectionFrame({
  number,
  tone = "light",
}: HomepageSectionFrameProps) {
  const isDark = tone === "dark";

  return (
    <section
      aria-label={`Homepage shop section ${number}`}
      className={
        isDark
          ? "min-h-[86vh] bg-[#09090B] px-6 py-16 text-[#F4F1EC] sm:px-10 lg:px-16"
          : "min-h-[86vh] bg-[#F4F1EC] px-6 py-16 text-[#161616] sm:px-10 lg:px-16"
      }
    >
      <div className="mx-auto flex min-h-[70vh] w-full max-w-[1440px] flex-col gap-8">
        <div className="flex items-end justify-between gap-6 border-b border-current/10 pb-5">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.24em] opacity-55">
              Section {number}
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase leading-none tracking-[0.04em] sm:text-6xl">
              {number}
            </h2>
          </div>
          <p className="max-w-sm text-right text-xs font-bold uppercase tracking-[0.18em] opacity-55">
            Shop grid block
          </p>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="grid min-h-[460px] grid-cols-2 gap-4">
            {slots.slice(0, 4).map((slot) => (
              <div
                key={slot}
                className={
                  isDark
                    ? "flex items-end border border-white/10 bg-white/[0.035] p-5"
                    : "flex items-end border border-black/10 bg-white/45 p-5"
                }
              >
                <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] opacity-55">
                  {number}.{slot}
                </span>
              </div>
            ))}
          </div>

          <div className="grid gap-4">
            {slots.slice(4).map((slot) => (
              <div
                key={slot}
                className={
                  isDark
                    ? "flex min-h-[220px] items-end border border-white/10 bg-white/[0.035] p-5"
                    : "flex min-h-[220px] items-end border border-black/10 bg-white/45 p-5"
                }
              >
                <span className="text-[0.68rem] font-black uppercase tracking-[0.22em] opacity-55">
                  {number}.{slot}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
