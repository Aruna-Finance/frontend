import { formatUnits } from "viem";
import {
  deriveCohortId,
  deriveCohortStatus,
  deriveCohortWindow,
  fundingTarget,
  isCohortSettled,
  type CohortWindow,
} from "@/lib/contracts/cohort-id";
import { chainLabel, derivePoolInfo } from "@/lib/contracts/pool-label";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import type { Cohort, CycleHistoryPoint, Vault } from "@/types/domain";
import type { IndexerCohort, IndexerVault } from "./types";

function usdcToNumber(raw: string): number {
  return Number(formatUnits(BigInt(raw), USDC_DECIMALS));
}

// Fields with no real source yet stay null/empty rather than guessed:
// currentSpotPrice and premiumIndication need a price feed / `previewPremium`
// (both open product decisions, E4/E8), and per-cohort realized vol needs a
// separate accumulator-samples read the vault list doesn't do.
const EMPTY_COHORT_EXTRAS = {
  samplesTaken: null,
  samplesTotal: null,
  lastSampleAt: null,
  missedSamples: null,
  realizedVolPercent: null,
  priorCohortsAvgVolPercent: null,
} as const;

function mapCohortRow(row: IndexerCohort, vaultId: string, now: Date): Cohort {
  const window: CohortWindow = {
    startsAt: new Date(Number(row.startsAt) * 1000).toISOString(),
    endsAt: new Date(Number(row.endsAt) * 1000).toISOString(),
  };
  return {
    id: row.cohortId,
    vaultId,
    status: deriveCohortStatus(window, isCohortSettled(row), now),
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    ...EMPTY_COHORT_EXTRAS,
  };
}

// A cohort only gets a row once someone has deposited into it. Before that
// (or for a future cohort nobody has funded yet) it's still fully
// describable from the vault's own schedule — this is what makes an empty
// "next cohort opens <date>" card possible instead of just hiding it.
function synthesizeCohort(vaultId: string, anchor: bigint, tenor: bigint, gap: bigint, cohortId: number, now: Date): Cohort {
  const window = deriveCohortWindow(anchor, tenor, cohortId, gap);
  return {
    id: cohortId,
    vaultId,
    status: deriveCohortStatus(window, false, now),
    startsAt: window.startsAt,
    endsAt: window.endsAt,
    ...EMPTY_COHORT_EXTRAS,
  };
}

export function findOrSynthesizeCohort(raw: IndexerVault, cohortId: number, now: Date): Cohort {
  const row = raw.cohorts.items.find((item) => item.cohortId === cohortId);
  if (row) return mapCohortRow(row, raw.address, now);
  return synthesizeCohort(raw.address, BigInt(raw.anchor), BigInt(raw.tenor), BigInt(raw.gap), cohortId, now);
}

// History + the always-derivable next cohort (never has a row yet, since
// nobody can deposit into a cohort before the vault reaches it), so a page
// looking for "the upcoming FUNDING cohort" always finds one.
export function mapCohorts(raw: IndexerVault, now: Date): Cohort[] {
  const gap = BigInt(raw.gap);
  const currentId = deriveCohortId(BigInt(raw.anchor), BigInt(raw.tenor), BigInt(Math.floor(now.getTime() / 1000)), gap);
  const real = raw.cohorts.items.map((row) => mapCohortRow(row, raw.address, now));
  const hasCurrent = real.some((c) => c.id === currentId);
  const next = synthesizeCohort(raw.address, BigInt(raw.anchor), BigInt(raw.tenor), gap, currentId + 1, now);
  const current = hasCurrent ? [] : [synthesizeCohort(raw.address, BigInt(raw.anchor), BigInt(raw.tenor), gap, currentId, now)];
  return [...real, ...current, next];
}

export function mapVault(raw: IndexerVault, now: Date): Vault {
  const anchor = BigInt(raw.anchor);
  const tenor = BigInt(raw.tenor);
  const nowSeconds = BigInt(Math.floor(now.getTime() / 1000));
  const gap = BigInt(raw.gap);
  const currentCohortId = deriveCohortId(anchor, tenor, nowSeconds, gap);
  const currentRow = raw.cohorts.items.find((item) => item.cohortId === currentCohortId);
  const { poolLabel, poolFeeTier, symbols: poolSymbols } = derivePoolInfo(raw.pool);

  const totalCapitalUsdc = currentRow ? usdcToNumber(currentRow.totalCapital) : 0;
  const reservedCapacityUsdc = currentRow ? usdcToNumber(currentRow.reserved) : 0;
  // What buyCover can actually still reserve, per the contract's own rule
  // (confirmed by the SC team): reserved + maxPayout <= totalCapital *
  // maxUtilizationBps / 10000 — not the whole uncommitted balance.
  const capacityCeilingUsdc = (totalCapitalUsdc * raw.maxUtilizationBps) / 10_000;
  const freeCapacityUsdc = Math.max(0, capacityCeilingUsdc - reservedCapacityUsdc);

  const history = raw.cohorts.items
    .filter((item) => item.cohortId !== currentCohortId)
    .sort((a, b) => a.cohortId - b.cohortId)
    .slice(-6);
  const cycleHistory: CycleHistoryPoint[] = history.map((item) => {
    const netResultUsdc = usdcToNumber(item.premiumsCollected) - usdcToNumber(item.claimsPaid);
    const cohortCapital = usdcToNumber(item.totalCapital);
    return {
      label: `C${item.cohortId}`,
      netResultUsdc,
      netResultPercent: cohortCapital > 0 ? (netResultUsdc / cohortCapital) * 100 : null,
    };
  });
  const percentages = cycleHistory
    .map((point) => point.netResultPercent)
    .filter((value): value is number => value !== null);

  return {
    id: raw.address,
    poolLabel,
    poolFeeTier,
    poolSymbols,
    chainLabel,
    poolAddress: raw.pool,
    // No price feed yet (E8 unresolved) — null, not a guessed number.
    currentSpotPrice: null,
    hasVault: true,
    currentCohortId,
    fundingCohortId: fundingTarget(anchor, tenor, nowSeconds, gap),
    totalCapitalUsdc,
    freeCapacityUsdc,
    reservedCapacityUsdc,
    policyCount: currentRow?.policyCount ?? 0,
    underwriterCount: currentRow?.underwriterCount ?? 0,
    utilizationPercent: totalCapitalUsdc > 0 ? (reservedCapacityUsdc / totalCapitalUsdc) * 100 : null,
    premiumsCurrentCycleUsdc: currentRow ? usdcToNumber(currentRow.premiumsCollected) : 0,
    // Needs `previewPremium`, which doesn't exist on-chain yet (E4).
    premiumIndication: null,
    cycleHistory,
    cumulativeReturnPercent: percentages.length > 0 ? percentages.reduce((sum, value) => sum + value, 0) : null,
    lossCount: cycleHistory.length > 0 ? cycleHistory.filter((point) => (point.netResultUsdc ?? 0) < 0).length : null,
    maxUtilizationBps: raw.maxUtilizationBps,
    tenorSeconds: raw.tenor,
  };
}
