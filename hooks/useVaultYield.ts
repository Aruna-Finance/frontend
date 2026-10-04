"use client";

import { useMemo } from "react";
import { summarizeYield, type VaultYield } from "@/lib/vault-yield";
import { useVaultRawByAddress } from "./useVaults";
import { useNowSeconds } from "./useNow";

// What underwriters earned in the vault's recent completed cycles, from the
// indexer's cohort rows. Re-evaluated every 30 s so a cycle that just ended and
// settled moves into "last cycle" without a reload.
export function useVaultYield(vaultId: string): { data: VaultYield | undefined; isLoading: boolean; isError: boolean } {
  const query = useVaultRawByAddress(vaultId);
  const now = useNowSeconds(30_000);
  const data = useMemo(
    () => (query.data ? summarizeYield(query.data.cohorts.items, now) : undefined),
    [query.data, now],
  );
  return { data, isLoading: query.isPending, isError: query.isError };
}
