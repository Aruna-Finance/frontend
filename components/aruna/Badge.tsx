import type { BadgeProps, Tone } from "@/types/aruna";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent-soft text-accent",
  positive: "bg-positive-soft text-positive",
  negative: "bg-negative-soft text-negative",
  neutral: "bg-border text-foreground-secondary",
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center h-[24px] px-[10px] rounded-badge font-mono text-[11px]",
        toneClasses[tone],
      ].join(" ")}
    >
      {label}
    </span>
  );
}
