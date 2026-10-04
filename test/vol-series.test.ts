import { describe, expect, it } from "vitest";
import { chartGeometry, latestRealizedVol, realizedVolSeries, recentSamples, type VolPoint } from "@/lib/vol-series";

const WAD = 10n ** 18n;

describe("realizedVolSeries", () => {
  it("is empty until there are two samples to take a return from", () => {
    expect(realizedVolSeries([])).toEqual([]);
    expect(realizedVolSeries([{ timestamp: 100, cumulativeSumSq: 0n }])).toEqual([]);
  });

  it("annualizes the return accrued since the first sample", () => {
    // One 600 s span that adds r^2 = 1e-6: annualized variance = 1e-6 * 31536000 / 600,
    // i.e. vol = sqrt(that) ~= 22.9%.
    const step = WAD / 1_000_000n;
    const samples = [
      { timestamp: 1_000, cumulativeSumSq: 0n },
      { timestamp: 1_600, cumulativeSumSq: step },
    ];
    const [point] = realizedVolSeries(samples);
    expect(point.t).toBe(1_600);
    expect(point.volPercent).toBeCloseTo(22.9, 1);
  });

  it("drops points inside the minimum span, where a few seconds would blow up the scale", () => {
    const samples = [
      { timestamp: 1_000, cumulativeSumSq: 0n },
      { timestamp: 1_060, cumulativeSumSq: WAD / 1_000n },
      { timestamp: 1_600, cumulativeSumSq: WAD / 500n },
    ];
    expect(realizedVolSeries(samples).map((p) => p.t)).toEqual([1_600]);
    expect(realizedVolSeries(samples, { minSpanSeconds: 0 }).map((p) => p.t)).toEqual([1_060, 1_600]);
  });

  it("does not emit a point for a zero-length span", () => {
    const samples = [
      { timestamp: 1_000, cumulativeSumSq: 0n },
      { timestamp: 1_000, cumulativeSumSq: 5n },
    ];
    expect(realizedVolSeries(samples)).toEqual([]);
  });

  it("thins long histories to the requested number of points, keeping the ends", () => {
    const samples = Array.from({ length: 1_000 }, (_, i) => ({
      timestamp: 1_000 + i * 60,
      cumulativeSumSq: BigInt(i) * 1_000_000n,
    }));
    const series = realizedVolSeries(samples, { maxPoints: 50 });
    expect(series).toHaveLength(50);
    // Points start once the 600 s minimum span has passed (the tenth sample).
    expect(series[0].t).toBe(1_000 + 10 * 60);
    expect(series.at(-1)!.t).toBe(1_000 + 999 * 60);
  });

  it("keeps the full series when it is already short enough", () => {
    const samples = Array.from({ length: 30 }, (_, i) => ({
      timestamp: 1_000 + i * 60,
      cumulativeSumSq: BigInt(i) * 1_000_000n,
    }));
    // Samples 10..29 are at least 600 s after the first one.
    expect(realizedVolSeries(samples)).toHaveLength(20);
  });
});

describe("chartGeometry", () => {
  const points: VolPoint[] = [
    { t: 100, volPercent: 20 },
    { t: 200, volPercent: 40 },
    { t: 300, volPercent: 60 },
  ];

  it("places points left to right by time and higher vol higher up", () => {
    const { points: svg } = chartGeometry(points, [], 700, 300);
    const [a, b, c] = svg.split(" ").map((pair) => pair.split(",").map(Number));
    expect(a[0]).toBe(0);
    expect(c[0]).toBe(700);
    expect(c[1]).toBeLessThan(b[1]);
    expect(b[1]).toBeLessThan(a[1]);
  });

  it("uses one scale for vol and strikes so a line above a strike is above it", () => {
    const { points: svg, thresholds } = chartGeometry(points, [35, 55], 700, 300);
    const yVolAt60 = Number(svg.split(" ")[2].split(",")[1]);
    const strike55 = thresholds.find((t) => t.label === "55%")!;
    // 60% vol sits above the 55% strike line (smaller y = higher on screen).
    expect(yVolAt60).toBeLessThan(strike55.y * 300);
  });

  it("returns strike lines as fractions of the height, labelled in percent", () => {
    const { thresholds } = chartGeometry([], [30, 35], 700, 300);
    expect(thresholds.map((t) => t.label)).toEqual(["30%", "35%"]);
    for (const t of thresholds) {
      expect(t.y).toBeGreaterThan(0);
      expect(t.y).toBeLessThan(1);
    }
    // Lower strike sits lower on the chart (larger y).
    expect(thresholds[0].y).toBeGreaterThan(thresholds[1].y);
  });

  it("handles no data without dividing by zero", () => {
    const { points: svg, thresholds } = chartGeometry([], [], 700, 300);
    expect(svg).toBe("");
    expect(thresholds).toEqual([]);
  });

  it("draws a single point centred to the right edge rather than failing", () => {
    const { points: svg } = chartGeometry([{ t: 100, volPercent: 30 }], [], 700, 300);
    expect(svg.split(",")[0]).toBe("700");
  });
});

describe("recentSamples and latestRealizedVol", () => {
  const samples = Array.from({ length: 100 }, (_, i) => ({
    timestamp: 10_000 + i * 60,
    cumulativeSumSq: BigInt(i) * 1_000_000n,
  }));

  it("keeps only the samples inside the window", () => {
    const now = 10_000 + 99 * 60;
    const kept = recentSamples(samples, now, 3_600);
    expect(kept[0].timestamp).toBe(now - 3_600);
    expect(kept.at(-1)!.timestamp).toBe(now);
  });

  it("reads realized vol over the window, not from the start of history", () => {
    // The first sample of the window sets the baseline, so an old burst before
    // the window must not change the reading.
    const now = 10_000 + 99 * 60;
    const withBurst = [{ timestamp: 9_000, cumulativeSumSq: 0n }, ...samples.map((s) => ({ ...s, cumulativeSumSq: s.cumulativeSumSq + WAD }))];
    const fromWindow = latestRealizedVol(samples, now, 3_600);
    const withOldBurst = latestRealizedVol(withBurst, now, 3_600);
    expect(withOldBurst).toBeCloseTo(fromWindow!, 6);
  });

  it("is null while the window has too little sampling to annualize", () => {
    expect(latestRealizedVol(samples.slice(0, 3), 10_000 + 120, 3_600)).toBeNull();
  });
});
