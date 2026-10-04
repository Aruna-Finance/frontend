import { describe, expect, it } from "vitest";
import type { CalendarFacts, CohortRowFacts } from "@/lib/demo/timeline";
import { MIN_INTERVALS_LEFT } from "@/lib/demo/timeline";
import { statusHeadline, summarizeMarket } from "@/lib/market-status";

// The sandbox calendar: 1h tenor, 10m settlement gap, 60s samples.
const calendar: CalendarFacts = { anchor: 1_790_000_000n, tenor: 3600n, gap: 600n, sampleInterval: 60 };
const start = (n: number) => Number(calendar.anchor) + n * 4200;
const end = (n: number) => start(n) + 3600;
const cutoff = (n: number) => end(n) - MIN_INTERVALS_LEFT * calendar.sampleInterval;

const row = (cohortId: number, over: Partial<CohortRowFacts> = {}): CohortRowFacts => ({
  cohortId,
  finalized: false,
  settledCount: 0,
  policyCount: 0,
  totalCapital: 1_000_000n,
  ...over,
});

describe("summarizeMarket: cover side", () => {
  it("mid-cohort: cover is open until the buy cutoff, in the running cohort", () => {
    const status = summarizeMarket(calendar, [row(5)], start(5) + 1800);
    expect(status.phase).toBe("active");
    expect(status.currentCohortId).toBe(5);
    expect(status.cover).toEqual({ canBuy: true, cohortId: 5, reason: "open", buyUntil: cutoff(5), opensAt: null });
  });

  it("after the cutoff but before the end: no cover, next cohort named", () => {
    const status = summarizeMarket(calendar, [row(5)], cutoff(5) + 10);
    expect(status.phase).toBe("active");
    expect(status.cover.canBuy).toBe(false);
    expect(status.cover.reason).toBe("cutoff");
    expect(status.cover.buyUntil).toBeNull();
    expect(status.cover.opensAt).toBe(start(6));
  });

  it("exactly at the cutoff cover is closed", () => {
    expect(summarizeMarket(calendar, [row(5)], cutoff(5)).cover.canBuy).toBe(false);
    expect(summarizeMarket(calendar, [row(5)], cutoff(5) - 1).cover.canBuy).toBe(true);
  });

  // Covers AE5.
  it("in the settlement gap: settling, no cover, covers resume when n+1 starts", () => {
    const status = summarizeMarket(calendar, [row(5)], end(5) + 120);
    expect(status.phase).toBe("gap");
    expect(status.currentCohortId).toBe(5);
    expect(status.cover).toEqual({ canBuy: false, cohortId: 6, reason: "gap", buyUntil: null, opensAt: start(6) });
  });

  it("before the anchor: cohort 0 has not started, no cover yet", () => {
    const status = summarizeMarket(calendar, [], Number(calendar.anchor) - 500);
    expect(status.phase).toBe("not_started");
    expect(status.currentCohortId).toBe(0);
    expect(status.cover.canBuy).toBe(false);
    expect(status.cover.reason).toBe("not_started");
    expect(status.cover.opensAt).toBe(start(0));
  });
});

describe("summarizeMarket: deposit side", () => {
  it("while n is active, deposits go to n+1 and close when it starts", () => {
    const status = summarizeMarket(calendar, [row(5)], start(5) + 1800);
    expect(status.deposit).toEqual({ cohortId: 6, closesAt: start(6) });
  });

  // Covers AE5: underwrite stays available through the gap.
  it("in the gap deposits still target n+1", () => {
    const status = summarizeMarket(calendar, [row(5)], end(5) + 120);
    expect(status.deposit).toEqual({ cohortId: 6, closesAt: start(6) });
  });

  // Covers AE4: once n+1 has started, the window moves on to n+2.
  it("once the next cohort has started, deposits target the one after it", () => {
    const status = summarizeMarket(calendar, [row(5)], start(6) + 300);
    expect(status.currentCohortId).toBe(6);
    expect(status.deposit).toEqual({ cohortId: 7, closesAt: start(7) });
  });

  it("the deposit window is never already over: closesAt is always ahead of now", () => {
    for (const offset of [-500, 0, 1, 1800, 3299, 3300, 3599, 3600, 3601, 4199, 4200, 4201]) {
      const now = start(5) + offset;
      expect(summarizeMarket(calendar, [], now).deposit.closesAt).toBeGreaterThan(now);
    }
  });

  it("before the anchor deposits target cohort 0", () => {
    const status = summarizeMarket(calendar, [], Number(calendar.anchor) - 500);
    expect(status.deposit).toEqual({ cohortId: 0, closesAt: start(0) });
  });

  it("an ended cohort with no capital is not left in a settling state by its rows", () => {
    // No row for the running cohort: the calendar alone decides the phase.
    const status = summarizeMarket(calendar, [], start(5) + 600);
    expect(status.phase).toBe("active");
    expect(status.cover.canBuy).toBe(true);
  });
});

describe("statusHeadline", () => {
  it("names the cover cutoff while cover is open", () => {
    const now = start(5) + 1800;
    const headline = statusHeadline(summarizeMarket(calendar, [row(5)], now), now);
    expect(headline.tag).toBe("Active");
    expect(headline.tone).toBe("positive");
    expect(headline.text).toBe("Cover sales close in 25m");
  });

  it("says sales are closed and when the next cohort opens after the cutoff", () => {
    const now = cutoff(5) + 60;
    const headline = statusHeadline(summarizeMarket(calendar, [row(5)], now), now);
    expect(headline.tag).toBe("Active");
    expect(headline.text).toBe("Cover sales closed · next cohort in 14m");
  });

  it("says settling with a countdown to the next cohort in the gap", () => {
    const now = end(5) + 120;
    const headline = statusHeadline(summarizeMarket(calendar, [row(5)], now), now);
    expect(headline).toEqual({ tag: "Settling", tone: "accent", text: "Next cohort opens in 8m" });
  });

  // Covers AE2: a 1h tenor never reads as days.
  it("never mentions days or weeks for a one-hour tenor", () => {
    for (const now of [start(5) + 10, cutoff(5) + 10, end(5) + 10, Number(calendar.anchor) - 100]) {
      const text = statusHeadline(summarizeMarket(calendar, [row(5)], now), now).text;
      expect(text).not.toMatch(/\bday|week|7-day/i);
    }
  });

  it("a day-scale tenor reads in days and hours", () => {
    const weekly: CalendarFacts = { anchor: 1_790_000_000n, tenor: 604_800n, gap: 86_400n, sampleInterval: 1800 };
    const now = Number(weekly.anchor) + 86_400;
    const text = statusHeadline(summarizeMarket(weekly, [], now), now).text;
    expect(text).toMatch(/Cover sales close in 5d/);
  });
});
