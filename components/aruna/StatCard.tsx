import type { StatCardProps, Tone } from "@/types/aruna";

const toneClasses: Record<Tone, string> = {
  accent: "text-accent",
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground",
};

const sizeClasses = {
  default: "text-[20px]",
  lg: "text-[26px]",
};

export function StatCard({
  label,
  value,
  valueTone = "neutral",
  size = "default",
  className = "",
}: StatCardProps) {
  return (
    <div className={className}>
      <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{label}</div>
      <div className={["font-mono pt-[6px]", sizeClasses[size], toneClasses[valueTone]].join(" ")}>
        {value}
      </div>
    </div>
  );
}
