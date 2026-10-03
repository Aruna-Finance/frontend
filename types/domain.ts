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
  // [token0Symbol, token1Symbol] for a pair icon, in the same display order
  // as poolLabel. null when the pool isn't one of the known/curated ones.
  poolSymbols: readonly [string, string] | null;
  chainLabel: string;
  poolAddress: string | null;
  currentSpotPrice: number | null;
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
  // The contract's own ceiling on reserved capacity, as a fraction of total
  // capital (e.g. 8000 = 80%) — the real, worst-case bound on how much of a
  // deposit could ever be claimed against, independent of what's happened so
  // far in any one cohort.
  maxUtilizationBps: number;
  // Cycle length in seconds — the production design is 7 days, but a test
  // vault can run a much shorter tenor, so pages showing "day X of N" derive
  // N from this instead of assuming 7.
  tenorSeconds: number;
}

export interface Position {
  tokenId: string;
  poolLabel: string;
  poolFeeTier: string;
  inRange: boolean | null;
  // null where a USD figure would need a price feed that doesn't exist for
  // testnet tokens (see E8) — never a guessed number. Populated by the mock
  // data (lib/mock/positions.ts, used by the still-fully-mock Quote/Confirm
  // flow); the real usePositions() leaves all four null and reports raw
  // token amounts below instead.
  rangeLowerUsdc: number | null;
  rangeUpperUsdc: number | null;
  feesEarnedUsdc: number | null;
  valueUsdc: number | null;
  hasVaultForPool: boolean;
  // Real, on-chain, no price attached — what's actually in the position.
  // token0/1Amount (current split of the liquidity) need the pool's current
  // tick, so they're only set for positions matched to a real vault; fees
  // owed don't need a tick and are set whenever the token symbols are known.
  token0Symbol: string | null;
  token1Symbol: string | null;
  token0Amount: number | null;
  token1Amount: number | null;
  token0FeesOwed: number | null;
  token1FeesOwed: number | null;
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
  vault: string;
  cohortId: number;
  positionTokenId: bigint;
  strikePercent: number;
}

// v2: no partial cover (varNotional is derived entirely from the position,
// not a chosen amount), so there's no coveredAmountUsdc/fullCyclePremiumUsdc
// here — quote() itself already prices exactly the remaining cohort window.
// Raw (bigint) fields are kept alongside the formatted ones because Confirm
// needs exact units for buyCover's maxPremium, not a rounded display number.
export interface QuoteResult {
  strikePercent: number;
  strikeAnnualized: bigint;
  premiumUsdc: number;
  premiumRaw: bigint;
  varNotionalRaw: bigint;
  maxPayoutUsdc: number;
  maxPayoutRaw: bigint;
  coveredSeconds: number;
  breakevenPercent: number;
  capReachedAtPercent: number;
}

export interface UnderwriterPosition {
  vaultId: string;
  cohortId: number;
  capitalCommittedUsdc: number;
  sharePercent: number;
  premiumsEarnedUsdc: number;
  claimsAtCurrentPaceUsdc: number;
  markIfEndsHereUsdc: number;
}
