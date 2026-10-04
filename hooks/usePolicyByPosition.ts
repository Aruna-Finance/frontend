"use client";

import { useQuery } from "@tanstack/react-query";
import { indexerRequest } from "@/lib/indexer/client";
import { POLICIES_BY_POSITION_QUERY } from "@/lib/indexer/queries";
import type { IndexerPolicy } from "@/lib/indexer/types";

export interface UsePoliciesByPositionResult {
  data: IndexerPolicy[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Every policy ever bought against one Uniswap position - closes the gap the
// contract can't answer directly (it only stores policy -> position, not the
// reverse). A position can have more than one policy across cohorts, so this
// is a list; callers pick the unsettled one (Active) or a settled one
// (Settlement). Returns the raw indexer shape (string-encoded bigints) so
// callers can both run it through mapPolicyToCover for the summary fields
// and read the raw fields for a page-specific breakdown.
export function usePoliciesByPosition(
  positionTokenId: string,
  options: { refetchInterval?: number | false } = {},
): UsePoliciesByPositionResult {
  const query = useQuery({
    queryKey: ["indexer", "policiesByPosition", positionTokenId],
    queryFn: () =>
      indexerRequest<{ policys: { items: IndexerPolicy[] } }, { positionTokenId: string }>(
        POLICIES_BY_POSITION_QUERY,
        { positionTokenId },
      ),
    select: (result) => result.policys.items,
    enabled: Boolean(positionTokenId),
    refetchInterval: options.refetchInterval,
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
