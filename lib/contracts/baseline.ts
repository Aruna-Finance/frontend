// Indexer v2 leaves policy.startIndex/startSumSq null until settle, so a live
// projection has to resolve the baseline itself, with the contract's rule
// (CoverVault._baselineIndex): j = first sample with timestamp >= purchasedAt,
// baseline s = j + 1. The sample at s may not exist yet; then no returns count.
export interface BaselineSample {
  index: number;
  timestamp: number;
  cumulativeSumSq: bigint;
}

export interface PolicyBaseline {
  startIndex: number;
  startSumSq: bigint;
}

export function resolveBaseline(
  samples: readonly BaselineSample[],
  purchasedAt: number,
  settled?: { startIndex: number | null; startSumSq: bigint | null },
): PolicyBaseline | null {
  // After settle the contract's own values are authoritative.
  if (settled && settled.startIndex !== null && settled.startSumSq !== null) {
    return { startIndex: settled.startIndex, startSumSq: settled.startSumSq };
  }
  const first = samples.find((sample) => sample.timestamp >= purchasedAt);
  if (!first) return null;
  const target = first.index + 1;
  const baseline = samples.find((sample) => sample.index === target);
  return baseline ? { startIndex: baseline.index, startSumSq: baseline.cumulativeSumSq } : null;
}
