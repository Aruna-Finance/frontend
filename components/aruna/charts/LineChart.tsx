import type { LineChartProps, Tone } from "@/types/aruna";

const toneStroke: Record<Tone, string> = {
  accent: "var(--color-accent)",
  positive: "var(--color-positive)",
  negative: "var(--color-negative)",
  neutral: "var(--chart-grid)",
};

function lastPoint(points: string): { x: number; y: number } | null {
  const last = points.trim().split(/\s+/).pop();
  if (!last) return null;
  const [x, y] = last.split(",").map(Number);
  if (Number.isNaN(x) || Number.isNaN(y)) return null;
  return { x, y };
}

export function LineChart({
  viewBoxWidth,
  viewBoxHeight,
  series,
  thresholds = [],
  verticalMarkers = [],
  ariaLabel,
  className,
}: LineChartProps) {
  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      preserveAspectRatio="none"
      className={className}
      aria-label={ariaLabel}
    >
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
      {verticalMarkers.map((marker, index) => {
        const x = marker.x * viewBoxWidth;
        return (
          <g key={index}>
            <line x1={x} y1={viewBoxHeight * 0.05} x2={x} y2={viewBoxHeight * 0.9} stroke="var(--chart-grid)" strokeWidth={1} />
            {marker.label ? (
              <text
                x={x - 24}
                y={viewBoxHeight * 0.96}
                fill="var(--color-foreground-muted)"
                fontSize={10}
                fontFamily="IBM Plex Mono"
              >
                {marker.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {series.map((line, index) => {
        const stroke = toneStroke[line.tone ?? "accent"];
        const marker = line.markerAtEnd ? lastPoint(line.points) : null;
        return (
          <g key={index}>
            <polyline points={line.points} fill="none" stroke={stroke} strokeWidth={line.strokeWidth ?? 2.5} />
            {marker ? <circle cx={marker.x} cy={marker.y} r={4.5} fill={stroke} /> : null}
          </g>
        );
      })}
    </svg>
  );
}
