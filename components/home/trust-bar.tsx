import { trustItems } from "@/lib/home-data";

export function TrustBar() {
  return (
    <section aria-label="Why SKXNZ" className="border-t border-black/6 bg-[#F4F1EC] py-6">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {trustItems.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#161616] text-sm text-[#F4F1EC]">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[0.74rem] font-bold text-[#161616]">{item.title}</p>
                <p className="text-[0.66rem] text-[#161616]/55">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
