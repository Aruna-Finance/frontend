import type { CohortStatus } from "@/types/domain";

// A cohort row only exists in the vault/indexer once something has happened
// in it (a deposit). The running/next cohort id is always derivable without
// one, straight from the vault's own anchor, tenor, and gap (confirmed by the
// SC team, v2 design §4.4): cohortId = floor((now - anchor) / (tenor + gap)).
// Do not assume anchor = 0 — only the old v0 main vault happened to have that
// value. `gap` defaults to 0n for v0/indexer-backed callers that don't carry
// a gap field yet (indexer v2 isn't live); a v2 vault read directly on-chain
// should pass its real `gap()`.
export function deriveCohortId(anchor: bigint, tenor: bigint, nowSeconds: bigint, gap: bigint = 0n): number {
  return Number((nowSeconds - anchor) / (tenor + gap));
}

export interface CohortWindow {
  startsAt: string;
  endsAt: string;
}

// ISO start/end for a cohort id, derived the same way — works even before the
// cohort has a row (e.g. to show "next cohort opens <date>" while empty).
// v2: endsAt(n) = startsAt(n) + tenor (NOT startsAt(n+1) — there's a gap
// between them where the cohort settles and LPs are unprotected, design §4.6).
export function deriveCohortWindow(anchor: bigint, tenor: bigint, cohortId: number, gap: bigint = 0n): CohortWindow {
  const start = anchor + BigInt(cohortId) * (tenor + gap);
  const end = start + tenor;
  return {
    startsAt: new Date(Number(start) * 1000).toISOString(),
    endsAt: new Date(Number(end) * 1000).toISOString(),
  };
}

// Cohort status is not a stored column (indexer or contract) — derive it from
// time and `finalized`, per the indexer README. SETTLING is the gap window
// after the cohort's tenor ends but before it's fully settled (v2 design
// §4.1/§4.6) — LPs are NOT protected during this window, even though the
// next cohort may already be FUNDING.
export function deriveCohortStatus(window: CohortWindow, finalized: boolean, now: Date = new Date()): CohortStatus {
  if (now < new Date(window.startsAt)) return "FUNDING";
  if (now < new Date(window.endsAt)) return "ACTIVE";
  return finalized ? "SETTLED" : "SETTLING";
}
