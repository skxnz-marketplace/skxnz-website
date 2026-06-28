import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-sangria bg-sangria text-pearlcream shadow-[0_16px_28px_rgba(90,31,46,0.18)] hover:border-obsidian hover:bg-obsidian hover:text-pearlcream",
  secondary:
    "border-sandstone bg-pearlcream/90 text-sangria hover:border-teal/45 hover:bg-white hover:text-obsidian",
  ghost:
    "border-transparent bg-transparent text-sangria hover:border-sandstone hover:bg-pearlcream/90 hover:text-obsidian",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-[0.72rem]",
  md: "px-4 py-2 text-xs",
  lg: "px-5 py-2.5 text-xs",
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
