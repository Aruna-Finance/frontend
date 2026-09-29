import type { CohortStatus } from "@/types/domain";

// A cohort row only exists in the vault/indexer once something has happened
// in it (a deposit). The running/next cohort id is always derivable without
// one, straight from the vault's own anchor and tenor (confirmed by the SC
// team): cohortId = floor((now - anchor) / tenor). Do not assume anchor = 0 —
// only the main vault happens to have that value.
export function deriveCohortId(anchor: bigint, tenor: bigint, nowSeconds: bigint): number {
  return Number((nowSeconds - anchor) / tenor);
}

export interface CohortWindow {
  startsAt: string;
  endsAt: string;
}

// ISO start/end for a cohort id, derived the same way — works even before the
// cohort has a row (e.g. to show "next cohort opens <date>" while empty).
export function deriveCohortWindow(anchor: bigint, tenor: bigint, cohortId: number): CohortWindow {
  const start = anchor + BigInt(cohortId) * tenor;
  const end = anchor + BigInt(cohortId + 1) * tenor;
  return {
    startsAt: new Date(Number(start) * 1000).toISOString(),
    endsAt: new Date(Number(end) * 1000).toISOString(),
  };
}

// Cohort status is not a stored column (indexer or contract) — derive it from
// time and `finalized`, per the indexer README. SETTLING is the window after
// the cohort ends but before `finalize()`/`settleBatch()` have run.
export function deriveCohortStatus(window: CohortWindow, finalized: boolean, now: Date = new Date()): CohortStatus {
  if (now < new Date(window.startsAt)) return "FUNDING";
  if (now < new Date(window.endsAt)) return "ACTIVE";
  return finalized ? "SETTLED" : "SETTLING";
}
