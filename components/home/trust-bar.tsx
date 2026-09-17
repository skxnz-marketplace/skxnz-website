import { trustItems } from "@/lib/home-data";

export function TrustBar() {
  return (
    <section aria-label="Why SKXNZ" className="border-t border-black/6 bg-[#F4F1EC] py-12 sm:py-16">
      <div className="w-full px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 min-[360px]:grid-cols-2 sm:gap-x-8 sm:gap-y-6 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-12">
          {trustItems.map((item) => (
            <div key={item.title} className="flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#161616] text-base text-[#F4F1EC]">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[0.82rem] font-bold text-[#161616]">{item.title}</p>
                <p className="mt-0.5 text-[0.72rem] text-[#161616]/55">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
