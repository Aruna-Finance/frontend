import type { DetailRowProps, Tone } from "@/types/aruna";

const toneClasses: Record<Tone, string> = {
  accent: "text-accent",
  positive: "text-positive",
  negative: "text-negative",
  neutral: "text-foreground",
};

export function DetailRow({ label, value, valueTone = "neutral", divider = true }: DetailRowProps) {
  return (
    <div
      className={["flex items-center justify-between py-[10px]", divider ? "border-b border-border" : ""]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="text-[14px] text-foreground-secondary">{label}</span>
      <span className={["font-mono text-[14px]", toneClasses[valueTone]].join(" ")}>{value}</span>
    </div>
  );
}
