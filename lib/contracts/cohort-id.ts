import type { CohortStatus } from "@/types/domain";

// A cohort row only exists in the vault/indexer once something has happened
// in it (a deposit). The running/next cohort id is always derivable without
// one, straight from the vault's own anchor, tenor, and gap (confirmed by the
// SC team, v2 design §4.4): cohortId = floor((now - anchor) / (tenor + gap)).
// Do not assume anchor = 0 - only the old v0 main vault happened to have that
// value. `gap` is required on purpose: a caller that forgets it silently
// targets the wrong cohort (the sandbox runs tenor 3600 + gap 600). Indexer v2
// exposes it as `vault.gap`; on-chain it is `gap()`.
// Before the anchor nothing has started yet, so the first cohort (0) is the one.
export function deriveCohortId(anchor: bigint, tenor: bigint, nowSeconds: bigint, gap: bigint): number {
  if (nowSeconds < anchor) return 0;
  return Number((nowSeconds - anchor) / (tenor + gap));
}

// The cohort a deposit must target: the first one whose window has not started
// yet. While cohort n is ACTIVE or settling in the gap that is n+1; before the
// anchor it is cohort 0.
export function fundingTarget(anchor: bigint, tenor: bigint, nowSeconds: bigint, gap: bigint): number {
  if (nowSeconds < anchor) return 0;
  return deriveCohortId(anchor, tenor, nowSeconds, gap) + 1;
}

// Where a settled cohort's capital can roll to: n+1 while it is still FUNDING
// (the gap, or n+1 not started), n+2 once n+1 has started. Never at or behind
// `fromCohort`.
export function rollTarget(fromCohort: number, anchor: bigint, tenor: bigint, nowSeconds: bigint, gap: bigint): number {
  return Math.max(fundingTarget(anchor, tenor, nowSeconds, gap), fromCohort + 1);
}

export interface CohortWindow {
  startsAt: string;
  endsAt: string;
}

// ISO start/end for a cohort id, derived the same way - works even before the
// cohort has a row (e.g. to show "next cohort opens <date>" while empty).
// v2: endsAt(n) = startsAt(n) + tenor (NOT startsAt(n+1) - there's a gap
// between them where the cohort settles and LPs are unprotected, design §4.6).
export function deriveCohortWindow(anchor: bigint, tenor: bigint, cohortId: number, gap: bigint): CohortWindow {
  const start = anchor + BigInt(cohortId) * (tenor + gap);
  const end = start + tenor;
  return {
    startsAt: new Date(Number(start) * 1000).toISOString(),
    endsAt: new Date(Number(end) * 1000).toISOString(),
  };
}

// Cohort status is not a stored column (indexer or contract) - derive it from
// time and `finalized`, per the indexer README. SETTLING is the gap window
// after the cohort's tenor ends but before it's fully settled (v2 design
// §4.1/§4.6) - LPs are NOT protected during this window, even though the
// next cohort may already be FUNDING.
export function deriveCohortStatus(window: CohortWindow, settled: boolean, now: Date = new Date()): CohortStatus {
  if (now < new Date(window.startsAt)) return "FUNDING";
  if (now < new Date(window.endsAt)) return "ACTIVE";
  return settled ? "SETTLED" : "SETTLING";
}

// The contract reaches SETTLED only once the cohort is finalized AND every live
// policy has been settled (a finalized cohort with policies left is still
// SETTLING; withdraw and roll revert until then). The indexer does not store
// the status, so it is derived from these three mirrored columns.
export function isCohortSettled(row: { finalized: boolean; settledCount: number; policyCount: number }): boolean {
  return row.finalized && row.settledCount >= row.policyCount;
}
