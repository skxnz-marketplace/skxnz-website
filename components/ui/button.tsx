import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  inverse:
    "border-pearlcream/30 bg-transparent text-pearlcream visited:text-pearlcream hover:border-pearlcream hover:bg-pearlcream hover:text-softblack focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pearlcream focus-visible:ring-offset-2 focus-visible:ring-offset-sangria",
  primary:
    "border-sangria bg-sangria text-pearlcream shadow-[0_16px_28px_rgba(90,31,46,0.18)] hover:border-obsidian hover:bg-obsidian hover:text-pearlcream",
  secondary:
    "border-sandstone bg-pearlcream/90 text-sangria hover:border-teal/45 hover:bg-white hover:text-obsidian",
  ghost:
    "border-transparent bg-transparent text-sangria hover:border-sandstone hover:bg-pearlcream/90 hover:text-obsidian",
};

// Minimum touch target is 44px on the md/lg sizes (min-h), and label sizes are
// legible rather than micro — a "large" CTA reading at 12px was the main reason
// buttons felt unfinished next to the rest of the page.
const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3.5 py-2 text-[0.78rem]",
  md: "min-h-[44px] px-5 py-2.5 text-[0.84rem]",
  lg: "min-h-[48px] px-7 py-3 text-[0.9rem]",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex min-w-0 max-w-full items-center justify-center overflow-hidden break-words rounded-full border text-center font-semibold uppercase tracking-[0.075em] whitespace-normal leading-tight transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}
