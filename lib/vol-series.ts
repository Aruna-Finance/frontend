import { varianceWadToVolPercent } from "@/lib/contracts/units";
import { realizedVarianceAnnualized } from "@/lib/contracts/variance";

export interface VolSample {
  timestamp: number;
  // Running sum of squared log returns since the accumulator started (WAD).
  cumulativeSumSq: bigint;
}

export interface VolPoint {
  // Unix seconds.
  t: number;
  volPercent: number;
}

export interface VolSeriesOptions {
  // Long histories are thinned to this many points so the chart stays light.
  maxPoints?: number;
  // Early on, a few returns over a few seconds annualize to an extreme number
  // that would set the whole chart's scale. Points inside this span are dropped.
  minSpanSeconds?: number;
}

// Realized vol as it stood after each sample, measured from the first sample.
// Points before two samples exist are dropped: one sample has no return to
// annualize.
export function realizedVolSeries(samples: readonly VolSample[], options: VolSeriesOptions = {}): VolPoint[] {
  const { maxPoints = 120, minSpanSeconds = 600 } = options;
  if (samples.length < 2) return [];
  const first = samples[0];
  const all: VolPoint[] = [];
  for (let i = 1; i < samples.length; i++) {
    const elapsed = samples[i].timestamp - first.timestamp;
    if (elapsed < minSpanSeconds || elapsed <= 0) continue;
    const sumSq = samples[i].cumulativeSumSq - first.cumulativeSumSq;
    all.push({
      t: samples[i].timestamp,
      volPercent: varianceWadToVolPercent(realizedVarianceAnnualized(sumSq, BigInt(elapsed))),
    });
  }
  if (all.length <= maxPoints) return all;
  const step = (all.length - 1) / (maxPoints - 1);
  return Array.from({ length: maxPoints }, (_, i) => all[Math.round(i * step)]);
}

export interface ChartGeometry {
  // SVG "x,y" pairs in viewBox units, for LineChart's series.
  points: string;
  // Strike lines as fractions of the chart height (LineChart's threshold unit).
  thresholds: { y: number; label: string }[];
}

// Maps vol points and strike levels onto one shared vertical scale, so a line
// sitting above a strike line means realized vol is above that strike. The top
// of the scale is the larger of the highest vol and the highest strike, with
// headroom so the peak is not pinned to the edge.
export function chartGeometry(
  points: readonly VolPoint[],
  strikesPercent: readonly number[],
  width: number,
  height: number,
): ChartGeometry {
  const topValue = Math.max(0, ...points.map((p) => p.volPercent), ...strikesPercent) * 1.15 || 1;
  const yFor = (volPercent: number) => (1 - volPercent / topValue) * height;
  const t0 = points[0]?.t ?? 0;
  const t1 = points[points.length - 1]?.t ?? 1;
  const span = Math.max(1, t1 - t0);
  const xFor = (t: number) => (points.length < 2 ? width : ((t - t0) / span) * width);

  return {
    points: points.map((p) => `${round(xFor(p.t))},${round(yFor(p.volPercent))}`).join(" "),
    thresholds: strikesPercent.map((strike) => ({ y: yFor(strike) / height, label: `${strike}%` })),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

// The samples that fall inside the last `windowSeconds` (one cohort's tenor for
// the market pages). Realized vol is read over this window, not over the whole
// history since the accumulator was deployed, so an old burst of movement does
// not keep showing as this market's current volatility.
export function recentSamples(samples: readonly VolSample[], nowSeconds: number, windowSeconds: number): VolSample[] {
  const from = nowSeconds - windowSeconds;
  return samples.filter((sample) => sample.timestamp >= from);
}

// Realized vol at the latest sample inside the window, or null while there is
// not yet enough sampling in the window to annualize.
export function latestRealizedVol(samples: readonly VolSample[], nowSeconds: number, windowSeconds: number): number | null {
  const series = realizedVolSeries(recentSamples(samples, nowSeconds, windowSeconds));
  return series.length > 0 ? series[series.length - 1].volPercent : null;
}
