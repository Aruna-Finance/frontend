import type { CardProps } from "@/types/aruna";

const variantClasses = {
  default: "border border-border bg-surface",
  raised: "border-[1.5px] border-accent bg-surface-raised",
  danger: "border border-border-danger bg-negative-soft",
  success: "border border-border-success bg-surface",
};

const paddingClasses = {
  sm: "p-[20px]",
  default: "p-[24px]",
  lg: "p-[28px]",
};

export function Card({ children, variant = "default", padding = "default", className = "" }: CardProps) {
  return (
    <div
      className={["rounded-card", variantClasses[variant], paddingClasses[padding], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
