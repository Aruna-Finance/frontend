"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { varianceWadToVolPercent } from "@/lib/contracts/units";
import { indexerRequest } from "@/lib/indexer/client";
import { COHORT_DETAIL_QUERY } from "@/lib/indexer/queries";
import type { IndexerCohortDetail, IndexerPolicyStatus } from "@/lib/indexer/types";

export interface CohortDetailStrikeBucket {
  strikeAnnualized: bigint;
  strikePercent: number;
  policyCount: number;
  totalVarNotional: bigint;
  totalMaxPayout: bigint;
  totalPremium: bigint;
}

export interface CohortDetailPosition {
  wallet: string;
  principal: bigint;
  deposit: bigint;
  rolledIn: bigint;
  rolledOut: bigint;
  withdrawnNet: bigint;
  // principal / cohort.totalCapital - never `deposit` (see indexer README).
  sharePercent: number;
}

export interface CohortDetailPolicy {
  policyId: string;
  owner: string;
  premium: bigint;
  maxPayout: bigint;
  varNotional: bigint;
  strikeAnnualized: bigint;
  coveredSeconds: number;
  purchasedAt: number;
  startIndex: number | null;
  startSumSq: bigint | null;
  status: IndexerPolicyStatus;
  payout: bigint | null;
}

export interface CohortDetail {
  vaultId: string;
  cohortId: number;
  startsAt: string;
  endsAt: string;
  totalCapitalRaw: bigint;
  reservedRaw: bigint;
  premiumsCollectedRaw: bigint;
  claimsPaidRaw: bigint;
  totalVarNotionalRaw: bigint;
  totalMaxPayoutRaw: bigint;
  policyCount: number;
  settledCount: number;
  paidCount: number;
  noPayoutCount: number;
  hitCapCount: number;
  finalized: boolean;
  // Window bracket (sample indices), locked at finalize.
  startIndex: number | null;
  endIndex: number | null;
  finalSumSq: bigint | null;
  finalizedAt: string | null;
  strikeBuckets: CohortDetailStrikeBucket[];
  positions: CohortDetailPosition[];
  policies: CohortDetailPolicy[];
}

export interface UseCohortDetailResult {
  data: CohortDetail | undefined;
  isLoading: boolean;
  isError: boolean;
}

// The book (strike buckets + underwriter positions + policies) for one
// specific cohort - the singular `cohort(vault, cohortId)` query, distinct
// from `useCohort`'s per-vault history list. Undefined when nobody has
// deposited into this cohort yet (it has no row at all, same rule as every
// other cohort lookup here).
export function useCohortDetail(vaultId: string, cohortId: number | undefined): UseCohortDetailResult {
  const query = useQuery({
    queryKey: ["indexer", "cohortDetail", vaultId.toLowerCase(), cohortId],
    queryFn: () =>
      indexerRequest<{ cohort: IndexerCohortDetail | null }, { vault: string; cohortId: number }>(
        COHORT_DETAIL_QUERY,
        { vault: vaultId.toLowerCase(), cohortId: cohortId! },
      ),
    select: (result) => result.cohort,
    enabled: Boolean(vaultId) && cohortId !== undefined,
  });

  const data = useMemo((): CohortDetail | undefined => {
    const raw = query.data;
    if (!raw || cohortId === undefined) return undefined;
    const totalCapitalRaw = BigInt(raw.totalCapital);

    return {
      vaultId,
      cohortId,
      startsAt: new Date(Number(raw.startsAt) * 1000).toISOString(),
      endsAt: new Date(Number(raw.endsAt) * 1000).toISOString(),
      totalCapitalRaw,
      reservedRaw: BigInt(raw.reserved),
      premiumsCollectedRaw: BigInt(raw.premiumsCollected),
      claimsPaidRaw: BigInt(raw.claimsPaid),
      totalVarNotionalRaw: BigInt(raw.totalVarNotional),
      totalMaxPayoutRaw: BigInt(raw.totalMaxPayout),
      policyCount: raw.policyCount,
      settledCount: raw.settledCount,
      paidCount: raw.paidCount,
      noPayoutCount: raw.noPayoutCount,
      hitCapCount: raw.hitCapCount,
      finalized: raw.finalized,
      startIndex: raw.startIndex,
      endIndex: raw.endIndex,
      finalSumSq: raw.finalSumSq !== null ? BigInt(raw.finalSumSq) : null,
      finalizedAt: raw.finalizedAt ? new Date(Number(raw.finalizedAt) * 1000).toISOString() : null,
      strikeBuckets: raw.strikeBuckets.items.map((item) => ({
        strikeAnnualized: BigInt(item.strikeAnnualized),
        strikePercent: Math.round(varianceWadToVolPercent(BigInt(item.strikeAnnualized)) * 10) / 10,
        policyCount: item.policyCount,
        totalVarNotional: BigInt(item.totalVarNotional),
        totalMaxPayout: BigInt(item.totalMaxPayout),
        totalPremium: BigInt(item.totalPremium),
      })),
      positions: raw.positions.items.map((item) => {
        const principal = BigInt(item.principal);
        return {
          wallet: item.wallet,
          principal,
          deposit: BigInt(item.deposit),
          rolledIn: BigInt(item.rolledIn),
          rolledOut: BigInt(item.rolledOut),
          withdrawnNet: BigInt(item.withdrawnNet),
          sharePercent: totalCapitalRaw > 0n ? (Number(principal) / Number(totalCapitalRaw)) * 100 : 0,
        };
      }),
      policies: raw.policies.items.map((item) => ({
        policyId: item.policyId,
        owner: item.owner,
        premium: BigInt(item.premium),
        maxPayout: BigInt(item.maxPayout),
        varNotional: BigInt(item.varNotional),
        strikeAnnualized: BigInt(item.strikeAnnualized),
        coveredSeconds: item.coveredSeconds,
        purchasedAt: item.purchasedAt,
        startIndex: item.startIndex,
        startSumSq: item.startSumSq !== null ? BigInt(item.startSumSq) : null,
        status: item.status,
        payout: item.payout !== null ? BigInt(item.payout) : null,
      })),
    };
  }, [query.data, vaultId, cohortId]);

  // `isPending` (not `isLoading`): stays true for the whole stretch where
  // `cohortId` is still undefined and this query is disabled, not just while
  // actively fetching - so a caller gating on it never reads a one-render gap
  // between "cohortId just resolved" and "fetch actually started" as done.
  return { data, isLoading: query.isPending, isError: query.isError };
}
