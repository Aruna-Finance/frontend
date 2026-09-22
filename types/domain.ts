export type CohortStatus = "FUNDING" | "ACTIVE" | "SETTLING" | "SETTLED";

export interface Cohort {
  id: number;
  vaultId: string;
  status: CohortStatus;
  startsAt: string;
  endsAt: string;
  samplesTaken: number | null;
  samplesTotal: number | null;
  lastSampleAt: string | null;
  missedSamples: number | null;
  realizedVolPercent: number | null;
  priorCohortsAvgVolPercent: number | null;
}

export interface PremiumIndicationPoint {
  strikePercent: number;
  premiumPer10k: number;
}

export interface CycleHistoryPoint {
  label: string;
  netResultUsdc: number | null;
  netResultPercent: number | null;
}

export interface Vault {
  id: string;
  poolLabel: string;
  poolFeeTier: string;
  chainLabel: string;
  poolAddress: string | null;
  hasVault: boolean;
  currentCohortId: number | null;
  totalCapitalUsdc: number;
  freeCapacityUsdc: number;
  reservedCapacityUsdc: number;
  policyCount: number;
  underwriterCount: number | null;
  utilizationPercent: number | null;
  premiumsCurrentCycleUsdc: number | null;
  premiumIndication: PremiumIndicationPoint[] | null;
  cycleHistory: CycleHistoryPoint[];
  cumulativeReturnPercent: number | null;
  lossCount: number | null;
}

export interface Position {
  tokenId: string;
  poolLabel: string;
  poolFeeTier: string;
  inRange: boolean | null;
  rangeLowerUsdc: number;
  rangeUpperUsdc: number;
  feesEarnedUsdc: number;
  valueUsdc: number;
  hasVaultForPool: boolean;
}

export interface PositionCover {
  id: string;
  positionId: string | null;
  vaultId: string;
  status: "active" | "paid_out" | "no_payout";
  strikePercent: number;
  breakevenPercent: number;
  capUsdc: number;
  premiumUsdc: number;
  payoutRateUsdc: number;
  netResultUsdc: number | null;
  finalRealizedVolPercent: number | null;
  settledAt: string | null;
}

export interface QuoteRequest {
  vaultId: string;
  strikePercent: number;
  coveredAmountUsdc: number;
}

export interface QuoteResult {
  strikePercent: number;
  premiumUsdc: number;
  fullCyclePremiumUsdc: number;
  breakevenPercent: number;
  capReachedAtPercent: number;
  maxPayoutUsdc: number;
  estPayoutIfVolHoldsUsdc: number;
  coveredSeconds: number;
}
