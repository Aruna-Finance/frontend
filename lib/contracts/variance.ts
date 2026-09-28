import { SECONDS_PER_YEAR, WAD } from "./units";

// Mirrors the settlement maths in the contract design (§3.3, §6.1, §7.2).
// All integer, all rounding down, exactly as the contract does it, so a
// preview never promises a wei the contract will not pay.

// Annualized realized variance (WAD) over a window: sumSq × year / elapsed.
export function realizedVarianceAnnualized(sumSq: bigint, elapsedSeconds: bigint): bigint {
  if (elapsedSeconds <= 0n) return 0n;
  return (sumSq * SECONDS_PER_YEAR) / elapsedSeconds;
}

// cumulativeSumSq only grows (invariant I5); a smaller end value means the
// caller mixed up indices, so report no variance instead of a negative one.
export function sumSqCovered(endCumulativeSumSq: bigint, startSumSq: bigint): bigint {
  return endCumulativeSumSq > startSumSq ? endCumulativeSumSq - startSumSq : 0n;
}

// The strike is time-scaled: a 3-day cover owes 3/365 of the annual strike.
export function strikeAccumulated(strikeAnnualized: bigint, coveredSeconds: bigint): bigint {
  return (strikeAnnualized * coveredSeconds) / SECONDS_PER_YEAR;
}

export interface PayoutInput {
  varNotional: bigint;
  maxPayout: bigint;
  sumSqCovered: bigint;
  strikeAnnualized: bigint;
  coveredSeconds: bigint;
}

export function excessVariance(input: Pick<PayoutInput, "sumSqCovered" | "strikeAnnualized" | "coveredSeconds">): bigint {
  const strike = strikeAccumulated(input.strikeAnnualized, input.coveredSeconds);
  return input.sumSqCovered > strike ? input.sumSqCovered - strike : 0n;
}

// payout = min(maxPayout, varNotional × excess / WAD)
export function previewPayout(input: PayoutInput): bigint {
  const raw = (input.varNotional * excessVariance(input)) / WAD;
  return raw < input.maxPayout ? raw : input.maxPayout;
}
