import type { CardProps } from "@/types/aruna";

const variantClasses = {
  default: "bg-pitch-raised",
  raised: "border border-accent bg-pitch-raised",
  danger: "border border-border-danger bg-negative-soft",
  success: "border border-border-success bg-pitch-raised",
};

const paddingClasses = {
  sm: "p-[20px]",
  default: "p-[24px]",
  lg: "p-[28px]",
};

export function Card({ children, variant = "default", padding = "default", className = "" }: CardProps) {
  return (
    <div
      className={[variantClasses[variant], paddingClasses[padding], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
