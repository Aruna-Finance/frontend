"use client";

import { useMemo } from "react";
import type { CalendarFacts, CohortRowFacts } from "@/lib/demo/timeline";
import { statusHeadline, summarizeMarket, type MarketStatus, type StatusHeadline } from "@/lib/market-status";
import { useVaultRawByAddress } from "./useVaults";
import { useNowSeconds } from "./useNow";

export interface UseMarketStatusResult {
  status: MarketStatus | undefined;
  headline: StatusHeadline | undefined;
  now: number;
  isLoading: boolean;
  isError: boolean;
}

// Calendar + cohort rows for one vault, turned into what each role needs to
// hear (can I buy cover, when do deposits close). The calendar comes from the
// vault's own parameters, so it is right even when the indexer lags; the rows
// only decide whether an ended cohort is still settling. Ticks every second.
export function useMarketStatus(vaultId: string): UseMarketStatusResult {
  const now = useNowSeconds();
  const query = useVaultRawByAddress(vaultId);
  const raw = query.data ?? undefined;

  const calendar = useMemo<CalendarFacts | undefined>(
    () =>
      raw
        ? { anchor: BigInt(raw.anchor), tenor: BigInt(raw.tenor), gap: BigInt(raw.gap), sampleInterval: raw.sampleInterval }
        : undefined,
    [raw],
  );
  const rows = useMemo<CohortRowFacts[]>(
    () =>
      (raw?.cohorts.items ?? []).map((item) => ({
        cohortId: item.cohortId,
        finalized: item.finalized,
        settledCount: item.settledCount,
        policyCount: item.policyCount,
        totalCapital: BigInt(item.totalCapital),
      })),
    [raw],
  );

  const status = calendar ? summarizeMarket(calendar, rows, now) : undefined;
  return {
    status,
    headline: status ? statusHeadline(status, now) : undefined,
    now,
    isLoading: query.isPending,
    isError: query.isError,
  };
}
