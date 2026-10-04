import {
  deriveCohortId,
  deriveCohortStatus,
  deriveCohortWindow,
  isCohortSettled,
} from "@/lib/contracts/cohort-id";
import type { CohortStatus } from "@/types/domain";

// CoverVault.MIN_INTERVALS_LEFT: buyCover reverts within this many sample
// intervals of endsAt (too little time left for two post-baseline returns).
export const MIN_INTERVALS_LEFT = 5;

export interface CohortRowFacts {
  cohortId: number;
  finalized: boolean;
  settledCount: number;
  policyCount: number;
  totalCapital: bigint;
}

export interface CalendarFacts {
  anchor: bigint;
  tenor: bigint;
  gap: bigint;
  sampleInterval: number;
}

export type BoundaryKind = "starts" | "ends" | "buyCutoff";

export interface TimelineEntry {
  id: number;
  status: CohortStatus;
  startsAt: number;
  endsAt: number;
  // The next time-based change for this cohort; null once only a keeper
  // action (finalize / settle) moves it forward.
  boundary: { kind: BoundaryKind; at: number } | null;
  // ACTIVE only: the last moment buyCover still works.
  buyCutoffAt: number | null;
  policyCount: number;
  totalCapital: bigint;
}

const toSeconds = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

// Cohorts n-1, n, n+1 around now, where n = the calendar's current cohort (still
// n while it settles in the gap, with n+1 FUNDING). Cohort 0 has no predecessor.
export function buildTimeline(calendar: CalendarFacts, rows: readonly CohortRowFacts[], nowSeconds: number): TimelineEntry[] {
  const now = BigInt(nowSeconds);
  const n = deriveCohortId(calendar.anchor, calendar.tenor, now, calendar.gap);
  const ids = [n - 1, n, n + 1].filter((id) => id >= 0);

  return ids.map((id) => {
    const window = deriveCohortWindow(calendar.anchor, calendar.tenor, id, calendar.gap);
    const startsAt = toSeconds(window.startsAt);
    const endsAt = toSeconds(window.endsAt);
    const row = rows.find((item) => item.cohortId === id);
    // A cohort that never got capital has nothing to settle: the contract treats
    // it as SETTLED the moment it ends (SC-16).
    const settled = row ? row.totalCapital === 0n || isCohortSettled(row) : true;
    const status = deriveCohortStatus(window, settled, new Date(nowSeconds * 1000));
    const buyCutoffAt = endsAt - MIN_INTERVALS_LEFT * calendar.sampleInterval;

    let boundary: TimelineEntry["boundary"] = null;
    if (status === "FUNDING") boundary = { kind: "starts", at: startsAt };
    else if (status === "ACTIVE") {
      boundary = nowSeconds < buyCutoffAt ? { kind: "buyCutoff", at: buyCutoffAt } : { kind: "ends", at: endsAt };
    }

    return {
      id,
      status,
      startsAt,
      endsAt,
      boundary,
      buyCutoffAt: status === "ACTIVE" ? buyCutoffAt : null,
      policyCount: row?.policyCount ?? 0,
      totalCapital: row?.totalCapital ?? 0n,
    };
  });
}

export interface KeeperReadiness {
  pokeDue: boolean;
  // Seconds until the next poke is allowed (0 when due).
  secondsToPoke: number;
  // Oldest ended cohort that still needs keeperFinalize.
  finalizeCohort: number | null;
  // Oldest ended cohort with live policies left to settle, and how many.
  settleCohort: number | null;
  settleCount: number;
}

// What a keeper could usefully do right now. keeperPoke / keeperFinalize never
// revert when there is nothing to do (they just pay nothing), so this only
// decides which buttons to enable. lastSampleAt 0 means no sample yet.
export function keeperReadiness(
  calendar: CalendarFacts,
  rows: readonly CohortRowFacts[],
  lastSampleAt: number,
  nowSeconds: number,
): KeeperReadiness {
  const nextPokeAt = lastSampleAt === 0 ? 0 : lastSampleAt + calendar.sampleInterval;
  const pokeDue = nowSeconds >= nextPokeAt;

  const ended = rows
    .filter((row) => {
      const window = deriveCohortWindow(calendar.anchor, calendar.tenor, row.cohortId, calendar.gap);
      return nowSeconds >= toSeconds(window.endsAt) && row.totalCapital > 0n && !isCohortSettled(row);
    })
    .sort((a, b) => a.cohortId - b.cohortId);

  const finalizeCohort = ended.find((row) => !row.finalized)?.cohortId ?? null;
  const toSettle = ended.find((row) => row.policyCount > row.settledCount);
  return {
    pokeDue,
    secondsToPoke: pokeDue ? 0 : nextPokeAt - nowSeconds,
    finalizeCohort,
    settleCohort: toSettle?.cohortId ?? null,
    settleCount: toSettle ? toSettle.policyCount - toSettle.settledCount : 0,
  };
}
