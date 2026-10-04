"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { varianceAccumulatorAbi } from "@/lib/contracts/abis/varianceAccumulator";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { indexerRequest } from "@/lib/indexer/client";
import { KEEPER_EVENTS_QUERY } from "@/lib/indexer/queries";
import type { IndexerKeeperEvent } from "@/lib/indexer/types";
import { buildTimeline, keeperReadiness, type CalendarFacts, type CohortRowFacts } from "@/lib/demo/timeline";
import { useVaultRawByAddress } from "./useVaults";
import { useNowSeconds } from "./useNow";

export const demoVault = arunaAddresses.coverVault;

// Everything the demo console reads about the sandbox market: calendar,
// cohort rows, the accumulator's last sample (from the chain, so the poke
// button is accurate to the second), and recent keeper events.
export function useDemoMarket() {
  const now = useNowSeconds();
  const vaultQuery = useVaultRawByAddress(demoVault);
  const lastSample = useReadContract({
    address: arunaAddresses.varianceAccumulator,
    abi: varianceAccumulatorAbi,
    functionName: "lastSampleAt",
    query: { refetchInterval: 15_000 },
  });
  const events = useQuery({
    queryKey: ["indexer", "keeperEvents", demoVault.toLowerCase()],
    queryFn: () =>
      indexerRequest<{ keeperEvents: { items: IndexerKeeperEvent[] } }, { vault: string; limit: number }>(
        KEEPER_EVENTS_QUERY,
        { vault: demoVault.toLowerCase(), limit: 6 },
      ),
    select: (result) => result.keeperEvents.items,
    refetchInterval: 20_000,
  });

  const raw = vaultQuery.data ?? undefined;
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

  const lastSampleAt = typeof lastSample.data === "number" ? lastSample.data : undefined;
  const timeline = calendar ? buildTimeline(calendar, rows, now) : undefined;
  const readiness =
    calendar && lastSampleAt !== undefined ? keeperReadiness(calendar, rows, lastSampleAt, now) : undefined;

  return {
    now,
    policyCap: raw?.policyCap,
    timeline,
    readiness,
    events: events.data ?? [],
    isLoading: vaultQuery.isPending,
    isError: vaultQuery.isError,
    refetchLastSample: lastSample.refetch,
  };
}
