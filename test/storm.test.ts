import { describe, expect, it } from "vitest";
import {
  STORM,
  canContinue,
  chooseDirection,
  needsTokenTopUp,
  pokeDue,
  stormStep,
  type StormDeps,
  type SwapDirection,
} from "@/lib/demo/storm";

function fakeDeps(over: Partial<StormDeps> & { tick?: number; last?: number } = {}) {
  const calls: string[] = [];
  const deps: StormDeps = {
    now: () => 1_000,
    sampleInterval: 60,
    refTick: -382,
    readTick: async () => over.tick ?? -382,
    readLastSampleAt: async () => over.last ?? 0,
    poke: async () => void calls.push("poke"),
    swap: async (d: SwapDirection) => void calls.push(`swap:${d}`),
    ...over,
  };
  return { deps, calls };
}

describe("chooseDirection", () => {
  it("pushes down above the reference tick and up at or below it", () => {
    expect(chooseDirection(-380, -382)).toBe("down");
    expect(chooseDirection(-382, -382)).toBe("up");
    expect(chooseDirection(-385, -382)).toBe("up");
  });

  it("oscillates around the reference instead of drifting (6 swaps of ~3 ticks)", () => {
    let tick = -382;
    const seen: SwapDirection[] = [];
    for (let i = 0; i < 6; i++) {
      const d = chooseDirection(tick, -382);
      seen.push(d);
      tick += d === "up" ? 3 : -3;
    }
    expect(seen).toEqual(["up", "down", "up", "down", "up", "down"]);
    expect(Math.abs(tick - -382)).toBeLessThanOrEqual(3);
  });

  it("pulls the tick back after it drifted (another visitor, or fee asymmetry)", () => {
    let tick = -340;
    for (let i = 0; i < 20; i++) tick += chooseDirection(tick, -382) === "up" ? 3 : -3;
    expect(Math.abs(tick - -382)).toBeLessThan(6);
  });
});

describe("stormStep (R9)", () => {
  it("pokes when a sample is due, then swaps", async () => {
    const { deps, calls } = fakeDeps({ last: 900 });
    const result = await stormStep(deps);
    expect(calls).toEqual(["poke", "swap:up"]);
    expect(result).toEqual({ poked: true, direction: "up" });
  });

  it("still swaps when a keeper already poked this interval", async () => {
    const { deps, calls } = fakeDeps({ last: 990 });
    await stormStep(deps);
    expect(calls).toEqual(["swap:up"]);
  });

  it("steers the swap by the live tick", async () => {
    const { deps, calls } = fakeDeps({ last: 990, tick: -379 });
    await stormStep(deps);
    expect(calls).toEqual(["swap:down"]);
  });

  it("surfaces a failed swap to the caller", async () => {
    const { deps } = fakeDeps({
      last: 990,
      swap: async () => {
        throw new Error("insufficient funds");
      },
    });
    await expect(stormStep(deps)).rejects.toThrow("insufficient funds");
  });
});

describe("pokeDue / budget checks", () => {
  it("pokeDue is true with no sample yet and once an interval has passed", () => {
    expect(pokeDue(0, 60, 1_000)).toBe(true);
    expect(pokeDue(940, 60, 1_000)).toBe(true);
    expect(pokeDue(941, 60, 1_000)).toBe(false);
  });

  it("stops below the gas floor", () => {
    expect(canContinue(STORM.minGasWei)).toBe(true);
    expect(canContinue(STORM.minGasWei - 1n)).toBe(false);
  });

  it("tops up tokens when fewer than four swaps remain", () => {
    expect(needsTokenTopUp(STORM.swapIn * 4n)).toBe(false);
    expect(needsTokenTopUp(STORM.swapIn * 4n - 1n)).toBe(true);
  });
});
