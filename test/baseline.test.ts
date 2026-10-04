import { describe, expect, it } from "vitest";
import { resolveBaseline, type BaselineSample } from "@/lib/contracts/baseline";

const samples: BaselineSample[] = [0, 1, 2, 3, 4].map((i) => ({
  index: i,
  timestamp: 1000 + i * 60,
  cumulativeSumSq: BigInt(i * 10),
}));

describe("resolveBaseline", () => {
  it("a purchase between samples baselines one sample after the next sample", () => {
    // purchasedAt 1070: first sample >= is index 2 (t=1120), baseline index 3.
    expect(resolveBaseline(samples, 1070)).toEqual({ startIndex: 3, startSumSq: 30n });
  });

  it("a purchase exactly on a sample uses that sample as j", () => {
    // t=1060 is index 1, so baseline index 2.
    expect(resolveBaseline(samples, 1060)).toEqual({ startIndex: 2, startSumSq: 20n });
  });

  it("a purchase before the first sample baselines at index 1", () => {
    expect(resolveBaseline(samples, 900)).toEqual({ startIndex: 1, startSumSq: 10n });
  });

  it("returns null while the baseline sample has not been recorded yet", () => {
    // first >= 1230 is index 4 (t=1240); baseline 5 does not exist yet.
    expect(resolveBaseline(samples, 1230)).toBeNull();
    expect(resolveBaseline(samples, 5000)).toBeNull();
    expect(resolveBaseline([], 1000)).toBeNull();
  });

  it("settled values from the contract win over the recomputed ones", () => {
    expect(resolveBaseline(samples, 1070, { startIndex: 3, startSumSq: 999n })).toEqual({
      startIndex: 3,
      startSumSq: 999n,
    });
  });

  it("a refunded policy (startIndex only) falls back to recomputation", () => {
    expect(resolveBaseline(samples, 1070, { startIndex: 3, startSumSq: null })).toEqual({
      startIndex: 3,
      startSumSq: 30n,
    });
  });
});
