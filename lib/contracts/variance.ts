import { SECONDS_PER_YEAR, WAD, varianceWadToVolPercent } from "./units";

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
// Rounded UP (mulDivUp), matching CoverVault.sol exactly - the contract rounds
// this up so the strike threshold is a touch harder to cross (design §9.2).
export function strikeAccumulated(strikeAnnualized: bigint, coveredSeconds: bigint): bigint {
  const numerator = strikeAnnualized * coveredSeconds;
  return (numerator + SECONDS_PER_YEAR - 1n) / SECONDS_PER_YEAR;
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

// The realized vol (annualized, %) at which payout would exactly equal what
// was paid for the policy - the inverse of previewPayout at payout = premium.
// Display only, and only meaningful below the cap (maxPayout > premium);
// callers should treat a result at/above the strike's own vol as "never
// breaks even below the cap" rather than trusting the number blindly.
// The realized vol (annualized, %) at which the payout saturates at
// `maxPayout` - purely a function of the quote's own output, no live
// accumulator read needed. Display only.
export function capReachedVolPercent(input: {
  varNotional: bigint;
  maxPayout: bigint;
  strikeAnnualized: bigint;
  coveredSeconds: bigint;
}): number {
  if (input.varNotional <= 0n || input.coveredSeconds <= 0n) return 0;
  const capExcess = (BigInt(input.maxPayout) * WAD) / input.varNotional;
  const capSumSq = strikeAccumulated(input.strikeAnnualized, input.coveredSeconds) + capExcess;
  const capAnnualized = realizedVarianceAnnualized(capSumSq, input.coveredSeconds);
  return varianceWadToVolPercent(capAnnualized);
}

export function breakevenVolPercent(input: {
  premium: bigint;
  varNotional: bigint;
  strikeAnnualized: bigint;
  coveredSeconds: bigint;
}): number {
  if (input.varNotional <= 0n || input.coveredSeconds <= 0n) return 0;
  const breakevenExcess = (input.premium * WAD) / input.varNotional;
  const breakevenSumSq = strikeAccumulated(input.strikeAnnualized, input.coveredSeconds) + breakevenExcess;
  const breakevenAnnualized = realizedVarianceAnnualized(breakevenSumSq, input.coveredSeconds);
  return varianceWadToVolPercent(breakevenAnnualized);
}
