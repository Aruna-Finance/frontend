import type { LineChartProps, Tone } from "@/types/aruna";

const toneStroke: Record<Tone, string> = {
  accent: "var(--color-accent)",
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  neutral: "var(--chart-grid)",
};

export function LineChart({
  viewBoxWidth,
  viewBoxHeight,
  series,
  thresholds = [],
  ariaLabel,
  className,
}: LineChartProps) {
  return (
    <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} className={className} aria-label={ariaLabel}>
      {thresholds.map((threshold, index) => {
        const y = threshold.y * viewBoxHeight;
        return (
          <g key={index}>
            <line
              x1={0}
              y1={y}
              x2={viewBoxWidth}
              y2={y}
              stroke={threshold.tone ? toneStroke[threshold.tone] : "var(--chart-grid-strike)"}
              strokeWidth={1}
              strokeDasharray={threshold.dashed === false ? undefined : "4 4"}
            />
            {threshold.label ? (
              <text x={4} y={y - 6} fill="var(--color-foreground-muted)" fontSize={10} fontFamily="IBM Plex Mono">
                {threshold.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {series.map((line, index) => (
        <polyline
          key={index}
          points={line.points}
          fill="none"
          stroke={toneStroke[line.tone ?? "accent"]}
          strokeWidth={line.strokeWidth ?? 2.5}
        />
      ))}
    </svg>
  );
}
