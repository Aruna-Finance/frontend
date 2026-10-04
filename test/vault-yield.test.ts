import { describe, expect, it } from "vitest";
import { isCompletedCycle, summarizeYield } from "@/lib/vault-yield";

// Raw USDC has 6 decimals: "25000000000000" is 25,000,000 USDC.
const NOW = 2_000_000;
const cohort = (cohortId: number, over: Partial<Parameters<typeof isCompletedCycle>[0]> = {}) => ({
  cohortId,
  endsAt: String(NOW - 1000),
  finalized: true,
  policyCount: 3,
  settledCount: 3,
  totalCapital: "25000000000000",
  premiumsCollected: "290084014",
  claimsPaid: "792178",
  ...over,
});

describe("isCompletedCycle", () => {
  it("is true once ended, finalized and fully settled", () => {
    expect(isCompletedCycle(cohort(6), NOW)).toBe(true);
  });

  it("is false while policies are still being settled", () => {
    expect(isCompletedCycle(cohort(6, { settledCount: 2 }), NOW)).toBe(false);
  });

  it("is false before the cohort has ended, even if a row says finalized", () => {
    expect(isCompletedCycle(cohort(6, { endsAt: String(NOW + 60) }), NOW)).toBe(false);
  });

  it("is false when not finalized", () => {
    expect(isCompletedCycle(cohort(6, { finalized: false }), NOW)).toBe(false);
  });

  it("is false when no capital was at stake", () => {
    expect(isCompletedCycle(cohort(6, { totalCapital: "0" }), NOW)).toBe(false);
  });
});

describe("summarizeYield", () => {
  it("takes the latest completed cycle as last, ignoring running and funding cohorts", () => {
    const rows = [
      cohort(6),
      cohort(10, { premiumsCollected: "233376316", claimsPaid: "808237" }),
      // Cohort 25 is running: capital and premiums but not finalized, and not ended.
      cohort(25, { finalized: false, endsAt: String(NOW + 1800), premiumsCollected: "141129000", claimsPaid: "0" }),
      // Cohort 26 only has deposits so far.
      cohort(26, { finalized: false, endsAt: String(NOW + 6000), policyCount: 0, settledCount: 0, premiumsCollected: "0", claimsPaid: "0" }),
    ];
    const result = summarizeYield(rows, NOW);
    expect(result.last?.cohortId).toBe(10);
    expect(result.recent.map((cycle) => cycle.cohortId)).toEqual([10, 6]);
  });

  it("computes net and percent of capital from premiums minus claims", () => {
    const result = summarizeYield([cohort(10, { premiumsCollected: "233376316", claimsPaid: "808237" })], NOW);
    expect(result.last?.premiumsUsdc).toBeCloseTo(233.376316, 6);
    expect(result.last?.claimsUsdc).toBeCloseTo(0.808237, 6);
    expect(result.last?.netUsdc).toBeCloseTo(232.568079, 6);
    expect(result.last?.percent).toBeCloseTo((232.568079 / 25_000_000) * 100, 8);
    expect(result.lossCount).toBe(0);
  });

  it("marks a cycle where claims beat premiums as a loss", () => {
    // Cohort 24 on the sandbox: 44.03 premiums in, 173.67 claims out, 100.6M capital.
    const result = summarizeYield(
      [cohort(24, { totalCapital: "100639631000000", premiumsCollected: "44030988", claimsPaid: "173665733" })],
      NOW,
    );
    expect(result.last?.netUsdc).toBeCloseTo(-129.634745, 5);
    expect(result.last?.percent).toBeLessThan(0);
    expect(result.lossCount).toBe(1);
  });

  it("returns newest first, limited to the window, with losses counted over that window only", () => {
    const rows = [
      cohort(1, { premiumsCollected: "0", claimsPaid: "5000000" }), // a loss, but outside the window
      cohort(2),
      cohort(3),
      cohort(4),
      cohort(5),
      cohort(6, { premiumsCollected: "1000000", claimsPaid: "9000000" }), // a loss inside the window
    ];
    const result = summarizeYield(rows, NOW, 5);
    expect(result.recent.map((cycle) => cycle.cohortId)).toEqual([6, 5, 4, 3, 2]);
    expect(result.lossCount).toBe(1);
  });

  it("returns an empty result before any cycle has completed", () => {
    expect(summarizeYield([], NOW)).toEqual({ last: null, recent: [], lossCount: 0 });
    const onlyRunning = [cohort(25, { finalized: false, endsAt: String(NOW + 1800) })];
    expect(summarizeYield(onlyRunning, NOW)).toEqual({ last: null, recent: [], lossCount: 0 });
  });

  it("does not depend on the order rows arrive in", () => {
    const rows = [cohort(10), cohort(6), cohort(8)];
    expect(summarizeYield(rows, NOW).recent.map((cycle) => cycle.cohortId)).toEqual([10, 8, 6]);
  });
});
