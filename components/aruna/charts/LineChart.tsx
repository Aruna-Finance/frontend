import { useId } from "react";
import { closeAreaPath, parsePoints, smoothLinePath } from "@/lib/chart-path";
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
  verticalMarkers = [],
  ariaLabel,
  className,
}: LineChartProps) {
  // useId output can contain characters that are unsafe inside url(#...).
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // Labels and end dots are plain HTML positioned by percentage, not SVG
  // <text>/<circle>: the viewBox is stretched non-uniformly
  // (preserveAspectRatio="none", needed so the line fills wide/short
  // containers without letterboxing), which would squash glyphs and turn
  // circles into ellipses. The inner box below has no padding, so its
  // percentages line up exactly with the SVG even when `className` adds some.
  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="relative w-full h-full">
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
            const linePath = smoothLinePath(line.points);
            const areaPath = closeAreaPath(linePath, line.points, viewBoxHeight);
            const gradientId = `${uid}-area-${index}`;
            return (
              <g key={index}>
                {areaPath ? (
                  <>
                    <defs>
                      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0" stopColor={stroke} stopOpacity={0.3} />
                        <stop offset="1" stopColor={stroke} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
                  </>
                ) : null}
                <path
                  d={linePath}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={line.strokeWidth ?? 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
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
        {series.map((line, index) => {
          if (!line.markerAtEnd) return null;
          const points = parsePoints(line.points);
          const end = points[points.length - 1];
          if (!end) return null;
          return (
            <span
              key={`end-${index}`}
              className="absolute w-[8px] h-[8px] rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(end.x / viewBoxWidth) * 100}%`,
                top: `${(end.y / viewBoxHeight) * 100}%`,
                backgroundColor: toneStroke[line.tone ?? "accent"],
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
