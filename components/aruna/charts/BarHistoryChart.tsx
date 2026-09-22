import type { BarHistoryChartProps, Tone } from "@/types/aruna";

const toneClasses: Record<Tone, string> = {
  accent: "bg-accent",
  positive: "bg-[var(--chart-bar-positive)]",
  negative: "bg-[var(--chart-bar-negative)]",
  neutral: "bg-foreground-muted",
};

export function BarHistoryChart({ bars, ariaLabel }: BarHistoryChartProps) {
  return (
    <div role="img" aria-label={ariaLabel} className="flex gap-[8px] items-end">
      {bars.map((bar, index) => (
        <div key={index} className="flex flex-col items-center gap-[6px]">
          <div
            className={["w-[30px] rounded-[3px]", toneClasses[bar.tone ?? "positive"]].join(" ")}
            style={{ height: `${Math.max(4, bar.height * 48)}px` }}
          />
          <span className="font-mono text-[10px] text-foreground-muted">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
