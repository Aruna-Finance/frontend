import { describe, expect, it } from "vitest";
import { FAUCET, faucetPlan, minPayoutFloor, positionAmounts, positionRange, type FaucetStepId } from "@/lib/demo/faucet";

const empty = { usdcBalance: 0n, wethBalance: 0n, usdcAllowance: 0n, wethAllowance: 0n };

describe("faucetPlan (R8)", () => {
  it("an empty wallet needs two mints, two approvals and the position, in that order", () => {
    expect(faucetPlan(empty).map((s) => s.id)).toEqual([
      "mintUsdc",
      "mintWeth",
      "approveUsdc",
      "approveWeth",
      "mintPosition",
    ]);
  });

  it("mints only the shortfall up to the target", () => {
    const plan = faucetPlan({ ...empty, usdcBalance: FAUCET.usdcTarget - 5n });
    expect(plan.find((s) => s.id === "mintUsdc")?.amount).toBe(5n);
  });

  it("skips mints when balances are at target and approvals when allowances suffice", () => {
    const plan = faucetPlan({
      usdcBalance: FAUCET.usdcTarget,
      wethBalance: FAUCET.wethTarget,
      usdcAllowance: FAUCET.positionAmount0,
      wethAllowance: FAUCET.positionAmount1,
    });
    expect(plan.map((s) => s.id)).toEqual(["mintPosition"]);
  });

  it("resumes after a failed step without repeating the ones already mined", () => {
    const done = new Set<FaucetStepId>(["mintUsdc", "mintWeth", "approveUsdc"]);
    expect(faucetPlan({ ...empty, done }).map((s) => s.id)).toEqual(["approveWeth", "mintPosition"]);
  });

  it("the position fits the funds the faucet hands out", () => {
    expect(FAUCET.positionAmount0).toBeLessThanOrEqual(FAUCET.usdcTarget);
    expect(FAUCET.positionAmount1).toBeLessThanOrEqual(FAUCET.wethTarget);
  });
});

describe("positionRange", () => {
  it("snaps to the tick spacing around the current tick (sandbox pool: tick -382, spacing 60)", () => {
    expect(positionRange(-382, 60, 1000)).toEqual({ tickLower: -1440, tickUpper: 600 });
  });

  it("always straddles the current tick", () => {
    for (const tick of [-382, -1, 0, 1, 59, 60, 61, 12345, -12345]) {
      const { tickLower, tickUpper } = positionRange(tick, 60, 1000);
      expect(tickLower).toBeLessThan(tick + 1);
      expect(tickUpper).toBeGreaterThan(tick);
      expect(tickLower % 60 === 0).toBe(true);
      expect(tickUpper % 60 === 0).toBe(true);
    }
  });

  it("floors a positive tick and a negative tick toward negative infinity", () => {
    expect(positionRange(59, 60, 60)).toEqual({ tickLower: -60, tickUpper: 60 });
    expect(positionRange(-1, 60, 60)).toEqual({ tickLower: -120, tickUpper: 0 });
  });
});

describe("minPayoutFloor", () => {
  it("is capacity over the policy cap", () => {
    // 1e14 capital, 80% utilization, 20 policies: the sandbox's 4e12 floor.
    expect(minPayoutFloor(100_000_000_000_000n, 8_000n, 20n)).toBe(4_000_000_000_000n);
    expect(minPayoutFloor(100_000_000_000_000n, 8_000n, 0n)).toBe(0n);
  });
});

describe("positionAmounts", () => {
  it("keeps the calibrated size when it already clears the floor with headroom", () => {
    expect(positionAmounts(4_000_000_000_000n)).toEqual({
      amount0: FAUCET.positionAmount0,
      amount1: FAUCET.positionAmount1,
    });
  });

  it("scales the position so its maxPayout clears a higher floor", () => {
    // A cohort holding 2e14 (a roll on top of a deposit) has an 8e12 floor.
    const floor = minPayoutFloor(200_439_501_622_875n, 8_000n, 20n);
    const { amount0, amount1 } = positionAmounts(floor);
    const maxPayout = (FAUCET.refMaxPayout * amount0) / FAUCET.positionAmount0;
    expect(maxPayout).toBeGreaterThanOrEqual((floor * 12_000n) / 10_000n);
    expect(amount1).toBe(amount0);
  });

  it("mints and approves enough for a scaled position", () => {
    const position = positionAmounts(10_000_000_000_000n);
    const plan = faucetPlan({ usdcBalance: 0n, wethBalance: 0n, usdcAllowance: 0n, wethAllowance: 0n, position });
    const step = (id: string) => plan.find((s) => s.id === id)?.amount ?? 0n;
    expect(step("mintWeth")).toBeGreaterThanOrEqual(position.amount1);
    expect(step("approveUsdc")).toBe(position.amount0);
    expect(step("approveWeth")).toBe(position.amount1);
  });
});
