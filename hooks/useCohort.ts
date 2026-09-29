"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { deriveCohortId } from "@/lib/contracts/cohort-id";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import { findOrSynthesizeCohort, mapCohorts } from "@/lib/indexer/mapVault";
import { useVaultsQuery } from "@/lib/indexer/useVaultsQuery";
import type { Cohort } from "@/types/domain";

export interface UseCohortResult {
  data: Cohort | undefined;
  isLoading: boolean;
  isError: boolean;
}

// No cohortId -> the cohort currently running for this vault, derived from
// its own anchor/tenor. A cohort that hasn't had any deposit yet still
// resolves to a real (empty) object instead of undefined, so pages don't
// need a separate "no activity" branch on top of their normal empty state.
export function useCohort(vaultId: string, cohortId?: number): UseCohortResult {
  const query = useVaultsQuery();
  const data = useMemo(() => {
    const raw = query.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
    if (!raw) return undefined;
    const now = new Date();
    const targetId =
      cohortId ?? deriveCohortId(BigInt(raw.anchor), BigInt(raw.tenor), BigInt(Math.floor(now.getTime() / 1000)));
    return findOrSynthesizeCohort(raw, targetId, now);
  }, [query.data, vaultId, cohortId]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}

export interface UseCohortsResult {
  data: Cohort[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Every cohort the indexer has a row for, plus the always-derivable current
// and next cohort so a page can always find "the upcoming FUNDING one".
export function useCohorts(vaultId: string): UseCohortsResult {
  const query = useVaultsQuery();
  const data = useMemo(() => {
    const raw = query.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
    return raw ? mapCohorts(raw, new Date()) : undefined;
  }, [query.data, vaultId]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}

export interface CohortFinancials {
  totalCapitalUsdc: number;
  policyCount: number;
  premiumsCollectedUsdc: number;
}

export interface UseCohortFinancialsResult {
  data: CohortFinancials | undefined;
  isLoading: boolean;
  isError: boolean;
}

// The money side of one specific cohort (not necessarily the vault's current
// one — e.g. the FUNDING cohort taking deposits right now, one ahead of
// whatever's ACTIVE). All genuinely 0 when the cohort has no row yet, which
// for a FUNDING cohort just means nobody has deposited into it yet.
export function useCohortFinancials(vaultId: string, cohortId: number): UseCohortFinancialsResult {
  const query = useVaultsQuery();
  const data = useMemo(() => {
    const raw = query.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
    if (!raw) return undefined;
    const row = raw.cohorts.items.find((item) => item.cohortId === cohortId);
    return {
      totalCapitalUsdc: row ? Number(formatUnits(BigInt(row.totalCapital), USDC_DECIMALS)) : 0,
      policyCount: row?.policyCount ?? 0,
      premiumsCollectedUsdc: row ? Number(formatUnits(BigInt(row.premiumsCollected), USDC_DECIMALS)) : 0,
    };
  }, [query.data, vaultId, cohortId]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}
