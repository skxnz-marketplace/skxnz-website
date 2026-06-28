import { cn } from "@/lib/cn";

type AdminStatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

const toneClasses = {
  neutral: "border-white/12 bg-white/[0.07] text-white/76",
  success: "border-[rgba(34,211,238,0.34)] bg-[rgba(34,211,238,0.10)] text-[var(--skxnz-glint)]",
  warning: "border-[rgba(185,125,90,0.38)] bg-[rgba(185,125,90,0.14)] text-[#f5d0b8]",
  danger: "border-[rgba(217,70,239,0.30)] bg-[rgba(217,70,239,0.10)] text-[#f4c2ff]",
  info: "border-[rgba(139,92,246,0.34)] bg-[rgba(139,92,246,0.12)] text-[#d9d0ff]",
};

export function AdminStatusBadge({
  label,
  tone = "neutral",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full rounded-full border px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em]",
        toneClasses[tone],
      )}
    >
      <span className="line-clamp-1 break-words">{label}</span>
    </span>
  );
}
