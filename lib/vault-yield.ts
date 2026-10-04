import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import type { IndexerCohort } from "@/lib/indexer/types";

export interface CycleResult {
  cohortId: number;
  capitalUsdc: number;
  premiumsUsdc: number;
  claimsUsdc: number;
  // Premiums minus claims, what underwriters kept over the cycle.
  netUsdc: number;
  // Net over the cohort's capital, in percent. Null when no capital was at stake.
  percent: number | null;
}

export interface VaultYield {
  // The latest completed cycle, or null before any has completed.
  last: CycleResult | null;
  // Up to `window` most recent completed cycles, newest first.
  recent: CycleResult[];
  // How many of `recent` ended in a net loss.
  lossCount: number;
}

type CohortFacts = Pick<
  IndexerCohort,
  "cohortId" | "endsAt" | "finalized" | "policyCount" | "settledCount" | "totalCapital" | "premiumsCollected" | "claimsPaid"
>;

const usdc = (raw: string) => Number(formatUnits(BigInt(raw), USDC_DECIMALS));

// A cycle counts once it is over, finalized and every live policy is settled
// (the contract's SETTLED), and it had capital at stake. The running cohort and
// a funding cohort that already has deposits are not results yet, so they never
// count as "last cycle".
export function isCompletedCycle(cohort: CohortFacts, nowSeconds: number): boolean {
  return (
    cohort.finalized &&
    cohort.settledCount >= cohort.policyCount &&
    Number(cohort.endsAt) <= nowSeconds &&
    BigInt(cohort.totalCapital) > 0n
  );
}

export function summarizeYield(cohorts: readonly CohortFacts[], nowSeconds: number, window = 5): VaultYield {
  const recent = cohorts
    .filter((cohort) => isCompletedCycle(cohort, nowSeconds))
    .sort((a, b) => b.cohortId - a.cohortId)
    .slice(0, window)
    .map<CycleResult>((cohort) => {
      const capitalUsdc = usdc(cohort.totalCapital);
      const premiumsUsdc = usdc(cohort.premiumsCollected);
      const claimsUsdc = usdc(cohort.claimsPaid);
      const netUsdc = premiumsUsdc - claimsUsdc;
      return {
        cohortId: cohort.cohortId,
        capitalUsdc,
        premiumsUsdc,
        claimsUsdc,
        netUsdc,
        percent: capitalUsdc > 0 ? (netUsdc / capitalUsdc) * 100 : null,
      };
    });
  return { last: recent[0] ?? null, recent, lossCount: recent.filter((cycle) => cycle.netUsdc < 0).length };
}
