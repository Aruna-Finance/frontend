// Raw GraphQL response shapes, matching indexer/ponder.schema.ts field names
// exactly. Every bigint/money field comes back as a string (see indexer
// README) — callers must parse with BigInt, never Number, to keep precision.

export interface IndexerCohort {
  cohortId: number;
  startsAt: string;
  endsAt: string;
  totalCapital: string;
  reserved: string;
  premiumsCollected: string;
  claimsPaid: string;
  totalVarNotional: string;
  totalMaxPayout: string;
  policyCount: number;
  settledCount: number;
  paidCount: number;
  noPayoutCount: number;
  hitCapCount: number;
  underwriterCount: number;
  finalized: boolean;
  startIndex: number | null;
  endIndex: number | null;
  finalSumSq: string | null;
  finalizedAt: string | null;
}

export interface IndexerVault {
  address: string;
  pool: string;
  accumulator: string;
  settlementToken: string;
  tenor: number;
  anchor: string;
  maxUtilizationBps: number;
  maxExcessVariance: string;
  isTest: boolean;
  cohorts: { items: IndexerCohort[] };
}

export type IndexerPolicyStatus = "Active" | "Cancelled" | "Settled" | "Refunded";

export interface IndexerPolicy {
  vault: string;
  policyId: string;
  cohortId: number;
  owner: string;
  positionTokenId: string;
  premium: string;
  maxPayout: string;
  varNotional: string;
  strikeAnnualized: string;
  coveredSeconds: number;
  purchasedAt: number;
  // Null until the contract measures the policy at settle (Refunded keeps startIndex only).
  startIndex: number | null;
  startSumSq: string | null;
  status: IndexerPolicyStatus;
  payout: string | null;
  refund: string | null;
  payoutParked: boolean;
  refundParked: boolean;
  nftParked: boolean;
  boughtAt: string;
  settledAt: string | null;
  cohortRef: { startsAt: string; endsAt: string; finalized: boolean; finalSumSq: string | null } | null;
}

export interface IndexerUnderwriterPosition {
  vault: string;
  cohortId: number;
  wallet: string;
  deposit: string;
  principal: string;
  rolledIn: string;
  rolledOut: string;
  withdrawnNet: string;
  cohortRef: {
    startsAt: string;
    endsAt: string;
    totalCapital: string;
    premiumsCollected: string;
    claimsPaid: string;
    finalized: boolean;
  } | null;
}

export interface IndexerStrikeBucket {
  strikeAnnualized: string;
  policyCount: number;
  totalVarNotional: string;
  totalMaxPayout: string;
  totalPremium: string;
}

export interface IndexerCohortPosition {
  wallet: string;
  principal: string;
  deposit: string;
  rolledIn: string;
  rolledOut: string;
  withdrawnNet: string;
}

export interface IndexerCohortPolicy {
  policyId: string;
  owner: string;
  premium: string;
  maxPayout: string;
  varNotional: string;
  strikeAnnualized: string;
  coveredSeconds: number;
  purchasedAt: number;
  startIndex: number | null;
  startSumSq: string | null;
  status: IndexerPolicyStatus;
  payout: string | null;
  refund: string | null;
}

// One specific cohort's own row plus its sub-relations — the singular
// `cohort(vault, cohortId)` query, not the `vault.cohorts` history list.
export interface IndexerCohortDetail {
  startsAt: string;
  endsAt: string;
  totalCapital: string;
  reserved: string;
  premiumsCollected: string;
  claimsPaid: string;
  totalVarNotional: string;
  totalMaxPayout: string;
  policyCount: number;
  settledCount: number;
  paidCount: number;
  noPayoutCount: number;
  hitCapCount: number;
  finalized: boolean;
  finalSumSq: string | null;
  finalizedAt: string | null;
  strikeBuckets: { items: IndexerStrikeBucket[] };
  positions: { items: IndexerCohortPosition[] };
  policies: { items: IndexerCohortPolicy[] };
}

export interface IndexerSample {
  index: number;
  timestamp: number;
  avgTick: number;
  cumulativeSumSq: string;
  increment: string;
}
