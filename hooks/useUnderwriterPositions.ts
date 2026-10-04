"use client";

import { useQuery } from "@tanstack/react-query";
import { indexerRequest } from "@/lib/indexer/client";
import { mapUnderwriterPosition } from "@/lib/indexer/mapUnderwriterPosition";
import { UNDERWRITER_POSITIONS_BY_WALLET_QUERY } from "@/lib/indexer/queries";
import type { IndexerUnderwriterPosition } from "@/lib/indexer/types";
import type { UnderwriterPosition } from "@/types/domain";

export interface UseUnderwriterPositionsByWalletResult {
  data: UnderwriterPosition[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Every cohort a wallet has ever put capital into, across every vault - the
// contract itself has no "all positions for this wallet" query.
export function useUnderwriterPositionsByWallet(wallet: string | undefined): UseUnderwriterPositionsByWalletResult {
  const query = useQuery({
    queryKey: ["indexer", "underwriterPositionsByWallet", wallet?.toLowerCase()],
    queryFn: () =>
      indexerRequest<{ underwriterPositions: { items: IndexerUnderwriterPosition[] } }, { wallet: string }>(
        UNDERWRITER_POSITIONS_BY_WALLET_QUERY,
        { wallet: wallet!.toLowerCase() },
      ),
    select: (result) => result.underwriterPositions.items.map(mapUnderwriterPosition),
    enabled: Boolean(wallet),
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
