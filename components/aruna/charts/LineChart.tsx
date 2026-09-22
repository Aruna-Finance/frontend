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
  // Labels are plain HTML positioned by percentage, not SVG <text> — the
  // chart's viewBox is stretched non-uniformly (preserveAspectRatio="none",
  // needed so the line fills wide/short containers without letterboxing),
  // which would otherwise squash or stretch glyph shapes on any screen
  // whose aspect ratio doesn't match the viewBox's own W:H ratio.
  return (
    <div className={`relative ${className ?? ""}`}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        preserveAspectRatio="none"
        className="block w-full h-full"
        aria-label={ariaLabel}
      >
        {thresholds.map((threshold, index) => (
          <line
            key={index}
            x1={0}
            y1={threshold.y * viewBoxHeight}
            x2={viewBoxWidth}
            y2={threshold.y * viewBoxHeight}
            stroke={threshold.tone ? toneStroke[threshold.tone] : "var(--chart-grid-strike)"}
            strokeWidth={1}
            strokeDasharray={threshold.dashed === false ? undefined : "4 4"}
          />
        ))}
        {verticalMarkers.map((marker, index) => (
          <line
            key={index}
            x1={marker.x * viewBoxWidth}
            y1={viewBoxHeight * 0.05}
            x2={marker.x * viewBoxWidth}
            y2={viewBoxHeight * 0.9}
            stroke="var(--chart-grid)"
            strokeWidth={1}
          />
        ))}
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

      {thresholds.map((threshold, index) =>
        threshold.label ? (
          <span
            key={index}
            className="absolute left-[4px] -translate-y-full font-mono text-[10px] text-foreground-muted whitespace-nowrap"
            style={{ top: `${threshold.y * 100}%` }}
          >
            {threshold.label}
          </span>
        ) : null,
      )}
      {verticalMarkers.map((marker, index) =>
        marker.label ? (
          <span
            key={index}
            className="absolute -translate-x-1/2 font-mono text-[10px] text-foreground-muted whitespace-nowrap"
            style={{ left: `${marker.x * 100}%`, bottom: "4%" }}
          >
            {marker.label}
          </span>
        ) : null,
      )}
    </div>
  );
}
