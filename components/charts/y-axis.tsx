"use client";

import { useYScale } from "./chart-context";

export interface YAxisProps {
  numTicks?: number;
  tickFormat?: (value: number) => string;
  yAxisId?: string | number;
}

export function YAxis({
  numTicks = 5,
  tickFormat = (v: number) => `$${v.toFixed(2)}`,
  yAxisId,
}: YAxisProps) {
  const yScale = useYScale(yAxisId);
  const ticks = yScale.ticks ? yScale.ticks(numTicks) : [];

  return (
    <g className="chart-y-axis">
      {ticks.map((tick) => {
        const y = yScale(tick);
        if (y == null || !Number.isFinite(y)) return null;
        return (
          <text
            key={tick}
            dominantBaseline="middle"
            style={{
              fontSize: 9,
              fill: "var(--chart-label, var(--chart-foreground-muted))",
              fontFamily: "IBM Plex Mono, ui-monospace, monospace",
            }}
            textAnchor="end"
            x={-6}
            y={y}
          >
            {tickFormat(tick)}
          </text>
        );
      })}
    </g>
  );
}

YAxis.displayName = "YAxis";
export default YAxis;
