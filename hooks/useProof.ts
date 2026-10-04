"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReadContracts } from "wagmi";
import { varianceAccumulatorAbi } from "@/lib/contracts/abis/varianceAccumulator";
import { deriveCohortId } from "@/lib/contracts/cohort-id";
import { varianceWadToVolPercent } from "@/lib/contracts/units";
import { realizedVarianceAnnualized } from "@/lib/contracts/variance";
import { indexerRequest } from "@/lib/indexer/client";
import { SAMPLES_QUERY } from "@/lib/indexer/queries";
import type { IndexerSample } from "@/lib/indexer/types";
import { useVaultsQuery } from "@/lib/indexer/useVaultsQuery";

export interface ProofSampleRow {
  index: number;
  timestamp: number;
  meanTick: number;
  deltaTick: number | null;
  // Formatted engineering notation (e.g. "2.400e-5"), or null for the first
  // row, which has nothing to take a return against yet.
  squaredLogReturn: string | null;
  // Raw running total (WAD) — for a page that needs to re-slice this against
  // a specific policy's own startSumSq/startIndex, not just display it.
  cumulativeSumSq: bigint;
}

export interface ProofData {
  vaultId: string;
  accumulator: `0x${string}`;
  rows: ProofSampleRow[];
  samplesRecorded: number;
  samplesTotal: number | null;
  sampleIntervalSeconds: number | null;
  gapCount: number | null;
  // Annualized over whatever the accumulator has actually observed so far —
  // not tied to a settled cohort, since none has settled yet.
  sumSquaredLogReturn: bigint;
  annualizedVariance: bigint;
  annualizedVolPercent: number;
  // The vault's current cohort, for the settlement-style summary card. All
  // genuinely 0 until a cohort has policies and finalizes — not a loading
  // artifact.
  currentCohortId: number;
  // False whenever there's no row yet (a cohort with zero activity can't be
  // finalized) — the annualized figure above is then a live, in-progress
  // extrapolation, not a settlement result, and should be labeled as such.
  finalized: boolean;
  policyCount: number;
  settledCount: number;
  paidCount: number;
  hitCapCount: number;
  claimsPaidRaw: bigint;
  // The actual span the annualized figure was extrapolated from — short
  // spans make that number noisy, and the UI says so rather than implying
  // precision it doesn't have.
  sampleWindowSeconds: number;
}

export interface UseProofResult {
  data: ProofData | undefined;
  isLoading: boolean;
  isError: boolean;
}

// increment is always a small positive fraction (a single step's r², WAD-
// scaled), so the exponent is always negative and toExponential's default
// "1.560e-3" form needs no cleanup.
function formatScientific(value: bigint, wad = 10n ** 18n): string {
  if (value === 0n) return "0";
  return (Number(value) / Number(wad)).toExponential(3);
}

// Everything the Proof page shows: the raw TWAP sample record (indexer,
// since it can be a long list) plus the small set of numbers that should
// stay live (sampleCount/gapStats straight off the accumulator contract,
// never left to lag).
export function useProof(vaultId: string): UseProofResult {
  const vaultsQuery = useVaultsQuery();
  const vault = vaultsQuery.data?.find((item) => item.address.toLowerCase() === vaultId.toLowerCase());
  const accumulator = vault?.accumulator as `0x${string}` | undefined;

  const liveStats = useReadContracts({
    contracts: accumulator
      ? [
          { address: accumulator, abi: varianceAccumulatorAbi, functionName: "sampleCount" as const },
          { address: accumulator, abi: varianceAccumulatorAbi, functionName: "gapStats" as const },
          { address: accumulator, abi: varianceAccumulatorAbi, functionName: "sampleInterval" as const },
        ]
      : [],
    query: { enabled: Boolean(accumulator) },
  });

  const samplesQuery = useQuery({
    queryKey: ["indexer", "samples", accumulator?.toLowerCase()],
    queryFn: () =>
      indexerRequest<{ samples: { items: IndexerSample[] } }, { accumulator: string; limit: number }>(SAMPLES_QUERY, {
        accumulator: accumulator!.toLowerCase(),
        limit: 1000,
      }),
    select: (result) => result.samples.items,
    enabled: Boolean(accumulator),
  });

  const data = useMemo((): ProofData | undefined => {
    if (!vault || !accumulator) return undefined;
    const samples = samplesQuery.data ?? [];

    const rows: ProofSampleRow[] = samples.map((sample, i) => ({
      index: sample.index,
      timestamp: sample.timestamp,
      meanTick: sample.avgTick,
      deltaTick: i === 0 ? null : sample.avgTick - samples[i - 1].avgTick,
      squaredLogReturn: i === 0 ? null : formatScientific(BigInt(sample.increment)),
      cumulativeSumSq: BigInt(sample.cumulativeSumSq),
    }));

    const latest = samples.at(-1);
    const first = samples[0];
    const sumSquaredLogReturn = latest ? BigInt(latest.cumulativeSumSq) : 0n;
    const elapsed = latest && first ? BigInt(Math.max(0, latest.timestamp - first.timestamp)) : 0n;
    const annualizedVariance = elapsed > 0n ? realizedVarianceAnnualized(sumSquaredLogReturn, elapsed) : 0n;

    const sampleCount = liveStats.data?.[0]?.result as number | undefined;
    const gapStats = liveStats.data?.[1]?.result as readonly [number, number] | undefined;
    const sampleInterval = liveStats.data?.[2]?.result as number | undefined;

    const currentCohortId = deriveCohortId(
      BigInt(vault.anchor),
      BigInt(vault.tenor),
      BigInt(Math.floor(new Date().getTime() / 1000)),
      BigInt(vault.gap),
    );
    const currentRow = vault.cohorts.items.find((item) => item.cohortId === currentCohortId);

    return {
      vaultId: vault.address,
      accumulator,
      rows,
      samplesRecorded: sampleCount ?? samples.length,
      samplesTotal: sampleInterval ? Math.round(vault.tenor / sampleInterval) : null,
      sampleIntervalSeconds: sampleInterval ?? null,
      gapCount: gapStats ? gapStats[0] : null,
      sumSquaredLogReturn,
      annualizedVariance,
      annualizedVolPercent: Math.round(varianceWadToVolPercent(annualizedVariance) * 10) / 10,
      currentCohortId,
      finalized: currentRow?.finalized ?? false,
      policyCount: currentRow?.policyCount ?? 0,
      settledCount: currentRow?.settledCount ?? 0,
      paidCount: currentRow?.paidCount ?? 0,
      hitCapCount: currentRow?.hitCapCount ?? 0,
      claimsPaidRaw: currentRow ? BigInt(currentRow.claimsPaid) : 0n,
      sampleWindowSeconds: Number(elapsed),
    };
  }, [vault, accumulator, samplesQuery.data, liveStats.data]);

  return {
    data,
    isLoading: vaultsQuery.isLoading || samplesQuery.isLoading || liveStats.isLoading,
    isError: vaultsQuery.isError || samplesQuery.isError || liveStats.isError,
  };
}
