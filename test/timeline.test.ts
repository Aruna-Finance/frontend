import { describe, expect, it } from "vitest";
import { buildTimeline, keeperReadiness, MIN_INTERVALS_LEFT, type CalendarFacts, type CohortRowFacts } from "@/lib/demo/timeline";

const calendar: CalendarFacts = { anchor: 1_790_000_000n, tenor: 3600n, gap: 600n, sampleInterval: 60 };
const start = (n: number) => Number(calendar.anchor) + n * 4200;
const row = (cohortId: number, over: Partial<CohortRowFacts> = {}): CohortRowFacts => ({
  cohortId,
  finalized: false,
  settledCount: 0,
  policyCount: 0,
  totalCapital: 1_000_000n,
  ...over,
});

describe("buildTimeline (R11)", () => {
  it("mid-cohort: n-1 settled, n active, n+1 funding", () => {
    const now = start(5) + 1800;
    const entries = buildTimeline(calendar, [row(4, { finalized: true })], now);
    expect(entries.map((e) => [e.id, e.status])).toEqual([
      [4, "SETTLED"],
      [5, "ACTIVE"],
      [6, "FUNDING"],
    ]);
  });

  it("the active cohort counts down to the buy cutoff first, then to its end", () => {
    const early = buildTimeline(calendar, [], start(5) + 600).find((e) => e.id === 5)!;
    expect(early.buyCutoffAt).toBe(start(5) + 3600 - MIN_INTERVALS_LEFT * 60);
    expect(early.boundary).toEqual({ kind: "buyCutoff", at: early.buyCutoffAt });

    const late = buildTimeline(calendar, [], start(5) + 3500).find((e) => e.id === 5)!;
    expect(late.boundary).toEqual({ kind: "ends", at: start(5) + 3600 });
  });

  it("a funding cohort counts down to its start", () => {
    const next = buildTimeline(calendar, [], start(5) + 100).find((e) => e.id === 6)!;
    expect(next.boundary).toEqual({ kind: "starts", at: start(6) });
  });

  it("in the gap n is settling (no time boundary), n+1 funding, and the window does not skip ahead", () => {
    const now = start(5) + 3600 + 100;
    const entries = buildTimeline(calendar, [row(5, { policyCount: 2 })], now);
    expect(entries.map((e) => [e.id, e.status])).toEqual([
      [4, "SETTLED"],
      [5, "SETTLING"],
      [6, "FUNDING"],
    ]);
    expect(entries.find((e) => e.id === 5)!.boundary).toBeNull();
  });

  it("an ended cohort that never had capital reads SETTLED, not SETTLING", () => {
    const now = start(5) + 3700;
    const entries = buildTimeline(calendar, [row(5, { totalCapital: 0n })], now);
    expect(entries.find((e) => e.id === 5)!.status).toBe("SETTLED");
  });

  it("an unseen cohort is synthesized from the calendar", () => {
    const entries = buildTimeline(calendar, [], start(5) + 100);
    expect(entries.find((e) => e.id === 6)).toMatchObject({ policyCount: 0, totalCapital: 0n });
  });

  it("cohort 0 has no predecessor", () => {
    const entries = buildTimeline(calendar, [], Number(calendar.anchor) + 10);
    expect(entries.map((e) => e.id)).toEqual([0, 1]);
  });
});

describe("keeperReadiness (R10)", () => {
  it("poke is due once a sample interval has passed, with a countdown before", () => {
    const now = start(5) + 1000;
    expect(keeperReadiness(calendar, [], now - 30, now)).toMatchObject({ pokeDue: false, secondsToPoke: 30 });
    expect(keeperReadiness(calendar, [], now - 60, now)).toMatchObject({ pokeDue: true, secondsToPoke: 0 });
    expect(keeperReadiness(calendar, [], 0, now).pokeDue).toBe(true);
  });

  it("finalize only after endsAt and only while not finalized", () => {
    const rows = [row(5, { policyCount: 2 })];
    expect(keeperReadiness(calendar, rows, 0, start(5) + 1000).finalizeCohort).toBeNull();
    expect(keeperReadiness(calendar, rows, 0, start(5) + 3600).finalizeCohort).toBe(5);
    expect(keeperReadiness(calendar, [row(5, { policyCount: 2, finalized: true })], 0, start(5) + 3700).finalizeCohort).toBeNull();
  });

  it("settle needs an ended cohort with live policies left, reporting how many", () => {
    const rows = [row(5, { finalized: true, policyCount: 3, settledCount: 1 })];
    expect(keeperReadiness(calendar, rows, 0, start(5) + 3700)).toMatchObject({ settleCohort: 5, settleCount: 2 });
    expect(keeperReadiness(calendar, rows, 0, start(5) + 1000).settleCohort).toBeNull();
  });

  it("a fully settled or never-capitalized cohort needs nothing", () => {
    const done = row(5, { finalized: true, policyCount: 2, settledCount: 2 });
    const empty = row(6, { totalCapital: 0n });
    const result = keeperReadiness(calendar, [done, empty], 0, start(7));
    expect(result).toMatchObject({ finalizeCohort: null, settleCohort: null, settleCount: 0 });
  });

  it("targets the oldest pending cohort first", () => {
    const rows = [
      row(5, { finalized: true, policyCount: 1, settledCount: 0 }),
      row(4, { finalized: true, policyCount: 1, settledCount: 0 }),
    ];
    expect(keeperReadiness(calendar, rows, 0, start(6) + 3700).settleCohort).toBe(4);
  });
});
