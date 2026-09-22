import type { Cohort } from "@/types/domain";

export const mockCohorts: Cohort[] = [
  {
    id: 12,
    vaultId: "weth-usdc-005",
    status: "ACTIVE",
    startsAt: "2026-09-21T08:00:00Z",
    endsAt: "2026-09-28T08:00:00Z",
    samplesTaken: 144,
    samplesTotal: 336,
    lastSampleAt: "2026-09-24T08:31:00Z",
    missedSamples: 0,
    realizedVolPercent: 41.2,
    priorCohortsAvgVolPercent: 33.9,
  },
  {
    id: 13,
    vaultId: "weth-usdc-005",
    status: "FUNDING",
    startsAt: "2026-09-28T08:00:00Z",
    endsAt: "2026-10-05T08:00:00Z",
    samplesTaken: null,
    samplesTotal: null,
    lastSampleAt: null,
    missedSamples: null,
    realizedVolPercent: null,
    priorCohortsAvgVolPercent: null,
  },
  // Markets.dc.html shows every active vault on the same "#12 · day 3" —
  // this demo runs all pools on one shared cohort calendar, so these two
  // reuse cohort 12's timing/sampling with their own vault's realized vol.
  {
    id: 12,
    vaultId: "weth-usdc-030",
    status: "ACTIVE",
    startsAt: "2026-09-21T08:00:00Z",
    endsAt: "2026-09-28T08:00:00Z",
    samplesTaken: 144,
    samplesTotal: 336,
    lastSampleAt: "2026-09-24T08:31:00Z",
    missedSamples: 0,
    realizedVolPercent: 40.8,
    priorCohortsAvgVolPercent: null,
  },
  {
    id: 12,
    vaultId: "wsteth-weth-001",
    status: "ACTIVE",
    startsAt: "2026-09-21T08:00:00Z",
    endsAt: "2026-09-28T08:00:00Z",
    samplesTaken: 144,
    samplesTotal: 336,
    lastSampleAt: "2026-09-24T08:31:00Z",
    missedSamples: 0,
    realizedVolPercent: 4.6,
    priorCohortsAvgVolPercent: null,
  },
];

export const mockCohortTimeRemaining: Record<number, string> = {
  12: "3d 21h",
};

export const mockCohortDayLabels = [
  "Day 1",
  "Day 2",
  "Day 3 · now",
  "Day 4",
  "Day 5",
  "Day 6",
  "Settlement",
];

export const mockCohortDaysElapsed: Record<number, number> = {
  12: 3,
};
