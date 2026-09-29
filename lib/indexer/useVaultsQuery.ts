"use client";

import { useQuery } from "@tanstack/react-query";
import { indexerRequest } from "./client";
import { VAULTS_QUERY } from "./queries";
import type { IndexerVault } from "./types";

// Single shared query backing every vault/cohort hook (useVaults, useVault,
// useCohort, useCohorts, ...), so switching between pages that need the same
// data doesn't refetch it — react-query dedupes by this query key.
export function useVaultsQuery() {
  return useQuery({
    queryKey: ["indexer", "vaults"],
    queryFn: () => indexerRequest<{ vaults: { items: IndexerVault[] } }>(VAULTS_QUERY),
    select: (result) => result.vaults.items,
    // The indexer can lag the chain by a few blocks; this is a list/history
    // view, not a transaction screen, so a short poll is enough to feel live
    // without hammering it.
    refetchInterval: 30_000,
  });
}
