import type { ProgressBarProps, Tone } from "@/types/aruna";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent",
  positive: "bg-positive",
  negative: "bg-negative",
  neutral: "bg-foreground-muted",
};

export function ProgressBar({ value, tone = "accent", thickness = "default", caption }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const trackClasses = thickness === "thin" ? "h-[5px] rounded-progress-thin" : "h-[8px] rounded-progress";

  return (
    <div>
      <div className={["bg-border", trackClasses].join(" ")}>
        <div className={[trackClasses, toneClasses[tone]].join(" ")} style={{ width: `${pct}%` }} />
      </div>
      {caption ? (
        <div className="flex justify-between font-mono text-[12px] text-foreground-muted pt-[8px]">
          <span>{caption.start}</span>
          <span>{caption.end}</span>
        </div>
      ) : null}
    </div>
  );
}
