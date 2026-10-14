import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "gold";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary shadow-sm hover:opacity-90",
  secondary: "bg-secondary text-white hover:opacity-90 dark:text-bg",
  gold: "bg-accent text-[#101827] shadow-sm hover:brightness-105",
  outline: "border border-line bg-surface text-ink hover:border-accent",
  ghost: "text-ink hover:bg-muted",
  danger: "bg-danger text-white hover:opacity-90 dark:text-bg",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center gap-2 rounded-full font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ variant, size, className = "", type = "button", ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
});
