"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { deriveCohortId } from "@/lib/contracts/cohort-id";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import { findOrSynthesizeCohort, mapCohorts } from "@/lib/indexer/mapVault";
import { useVaultsQuery } from "@/lib/indexer/useVaultsQuery";
import type { IndexerVault } from "@/lib/indexer/types";
import { useVaultRawByAddress } from "./useVaults";
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
      cohortId ??
      deriveCohortId(BigInt(raw.anchor), BigInt(raw.tenor), BigInt(Math.floor(now.getTime() / 1000)), BigInt(raw.gap));
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
// one - e.g. the FUNDING cohort taking deposits right now, one ahead of
// whatever's ACTIVE). All genuinely 0 when the cohort has no row yet, which
// for a FUNDING cohort just means nobody has deposited into it yet.
export function useCohortFinancials(vaultId: string, cohortId: number): UseCohortFinancialsResult {
  const query = useVaultsQuery();
  const data = useMemo(() => {
    const raw = query.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
    return raw ? financialsOf(raw, cohortId) : undefined;
  }, [query.data, vaultId, cohortId]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}

function financialsOf(raw: IndexerVault, cohortId: number): CohortFinancials {
  const row = raw.cohorts.items.find((item) => item.cohortId === cohortId);
  return {
    totalCapitalUsdc: row ? Number(formatUnits(BigInt(row.totalCapital), USDC_DECIMALS)) : 0,
    policyCount: row?.policyCount ?? 0,
    premiumsCollectedUsdc: row ? Number(formatUnits(BigInt(row.premiumsCollected), USDC_DECIMALS)) : 0,
  };
}

// The by-address variants below read the vault straight by its address, so they
// also work for a vault that is not on the official list (isTest). The pages
// reached from a pool's own link must open for any vault the visitor has the
// address of; the list-based hooks above only see official vaults.
export function useCohortByAddress(vaultId: string, cohortId: number): UseCohortResult {
  const query = useVaultRawByAddress(vaultId);
  const data = useMemo(
    () => (query.data ? findOrSynthesizeCohort(query.data, cohortId, new Date()) : undefined),
    [query.data, cohortId],
  );
  return { data, isLoading: query.isPending, isError: query.isError };
}

export function useCohortFinancialsByAddress(vaultId: string, cohortId: number): UseCohortFinancialsResult {
  const query = useVaultRawByAddress(vaultId);
  const data = useMemo(() => (query.data ? financialsOf(query.data, cohortId) : undefined), [query.data, cohortId]);
  return { data, isLoading: query.isPending, isError: query.isError };
}
