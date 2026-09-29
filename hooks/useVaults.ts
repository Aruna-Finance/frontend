"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { indexerRequest } from "@/lib/indexer/client";
import { mapCohorts, mapVault } from "@/lib/indexer/mapVault";
import { VAULT_BY_ADDRESS_QUERY } from "@/lib/indexer/queries";
import type { IndexerVault } from "@/lib/indexer/types";
import { useVaultsQuery } from "@/lib/indexer/useVaultsQuery";
import type { Cohort, Vault } from "@/types/domain";

export interface UseVaultsResult {
  data: Vault[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useVaults(): UseVaultsResult {
  const query = useVaultsQuery();
  // Recomputed whenever the query's data changes (poll or refetch), not every
  // render — "now" here is "as of the last successful fetch", which is
  // precise enough for a list/history view.
  const data = useMemo(() => query.data?.map((raw) => mapVault(raw, new Date())), [query.data]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}

export interface UseVaultResult {
  data: Vault | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useVault(vaultId: string): UseVaultResult {
  const query = useVaultsQuery();
  const data = useMemo(() => {
    const raw = query.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
    return raw ? mapVault(raw, new Date()) : undefined;
  }, [query.data, vaultId]);
  return { data, isLoading: query.isLoading, isError: query.isError };
}

// Shared by every "by address" hook below so they dedupe onto one fetch (same
// query key) regardless of which one a page calls first.
function useVaultRawByAddress(vaultId: string) {
  return useQuery({
    queryKey: ["indexer", "vaultByAddress", vaultId.toLowerCase()],
    queryFn: () =>
      indexerRequest<{ vault: IndexerVault | null }, { address: string }>(VAULT_BY_ADDRESS_QUERY, {
        address: vaultId.toLowerCase(),
      }),
    select: (result) => result.vault,
    enabled: Boolean(vaultId),
  });
}

export interface UseVaultByAddressResult {
  data: Vault | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Like `useVault`, but not filtered by isTest — for pages reached by a vault
// address a wallet actually holds a policy or underwriting position in (my
// covers, my underwriting, a specific policy's own vault), which must resolve
// even for a vault that isn't publicly listed on /markets.
export function useVaultByAddress(vaultId: string): UseVaultByAddressResult {
  const query = useVaultRawByAddress(vaultId);
  const data = useMemo(() => (query.data ? mapVault(query.data, new Date()) : undefined), [query.data]);
  return { data, isLoading: query.isPending, isError: query.isError };
}

export interface UseCohortsByAddressResult {
  data: Cohort[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Like `useCohorts`, but sourced from the unfiltered `useVaultRawByAddress`
// above instead of the public (isTest: false) vault list.
export function useCohortsByAddress(vaultId: string): UseCohortsByAddressResult {
  const query = useVaultRawByAddress(vaultId);
  const data = useMemo(() => (query.data ? mapCohorts(query.data, new Date()) : undefined), [query.data]);
  return { data, isLoading: query.isPending, isError: query.isError };
}

export interface UseVaultRealizedVolResult {
  data: number | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Realized vol needs a separate accumulator-samples read (see the Proof page
// hook), which this hook intentionally doesn't do — returns "not available"
// rather than a stale or guessed number. Takes vaultId to keep the same call
// shape as every other per-vault hook here, ready for when it's implemented.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useVaultRealizedVol(_vaultId: string): UseVaultRealizedVolResult {
  return { data: undefined, isLoading: false, isError: false };
}
