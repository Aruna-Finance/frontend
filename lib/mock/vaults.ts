import type { Vault } from "@/types/domain";

export const mockVaults: Vault[] = [
  {
    id: "weth-usdc-005",
    poolLabel: "WETH / USDC",
    poolFeeTier: "0.05%",
    chainLabel: "Arbitrum One",
    poolAddress: "0xc31e…54a1",
    currentSpotPrice: 3412.8,
    hasVault: true,
    currentCohortId: 12,
    totalCapitalUsdc: 1_240_000,
    freeCapacityUsdc: 427_500,
    reservedCapacityUsdc: 812_500,
    policyCount: 47,
    underwriterCount: 14,
    utilizationPercent: 65.5,
    premiumsCurrentCycleUsdc: 18_420,
    premiumIndication: [
      { strikePercent: 30, premiumPer10k: 227.5 },
      { strikePercent: 35, premiumPer10k: 166.25 },
      { strikePercent: 45, premiumPer10k: 80.94 },
      { strikePercent: 55, premiumPer10k: 41.56 },
    ],
    cycleHistory: [
      { label: "C06", netResultUsdc: 1_420, netResultPercent: null },
      { label: "C07", netResultUsdc: 2_040, netResultPercent: null },
      { label: "C08", netResultUsdc: 880, netResultPercent: null },
      { label: "C09", netResultUsdc: -760, netResultPercent: null },
      { label: "C10", netResultUsdc: 2_300, netResultPercent: null },
      { label: "C11", netResultUsdc: 1_240, netResultPercent: null },
    ],
    cumulativeReturnPercent: 3.57,
    lossCount: 1,
  },
  {
    id: "weth-usdc-030",
    poolLabel: "WETH / USDC",
    poolFeeTier: "0.30%",
    chainLabel: "Arbitrum One",
    poolAddress: null,
    currentSpotPrice: null,
    hasVault: true,
    currentCohortId: 12,
    totalCapitalUsdc: 312_000,
    freeCapacityUsdc: 18_400,
    reservedCapacityUsdc: 293_600,
    policyCount: 21,
    underwriterCount: null,
    utilizationPercent: null,
    premiumsCurrentCycleUsdc: null,
    premiumIndication: null,
    cycleHistory: [],
    cumulativeReturnPercent: null,
    lossCount: null,
  },
  {
    id: "wsteth-weth-001",
    poolLabel: "wstETH / WETH",
    poolFeeTier: "0.01%",
    chainLabel: "Arbitrum One",
    poolAddress: null,
    currentSpotPrice: null,
    hasVault: true,
    currentCohortId: 12,
    totalCapitalUsdc: 480_000,
    freeCapacityUsdc: 455_300,
    reservedCapacityUsdc: 24_700,
    policyCount: 6,
    underwriterCount: 5,
    utilizationPercent: 5.1,
    premiumsCurrentCycleUsdc: 940,
    premiumIndication: null,
    // Mockup only gives relative bar heights for this vault (no dollar
    // labels, unlike weth-usdc-005's history) — netResultPercent below is
    // those heights (14/11/16/12/9/15px) scaled so they sum to the known
    // +1.18% cumulative, not a claimed precise per-cycle dollar return.
    cycleHistory: [
      { label: "C06", netResultUsdc: null, netResultPercent: 0.21 },
      { label: "C07", netResultUsdc: null, netResultPercent: 0.17 },
      { label: "C08", netResultUsdc: null, netResultPercent: 0.25 },
      { label: "C09", netResultUsdc: null, netResultPercent: 0.18 },
      { label: "C10", netResultUsdc: null, netResultPercent: 0.14 },
      { label: "C11", netResultUsdc: null, netResultPercent: 0.23 },
    ],
    cumulativeReturnPercent: 1.18,
    lossCount: 0,
  },
  {
    id: "arb-usdc-030",
    poolLabel: "ARB / USDC",
    poolFeeTier: "0.30%",
    chainLabel: "Arbitrum One",
    poolAddress: null,
    currentSpotPrice: null,
    hasVault: false,
    currentCohortId: null,
    totalCapitalUsdc: 0,
    freeCapacityUsdc: 0,
    reservedCapacityUsdc: 0,
    policyCount: 0,
    underwriterCount: null,
    utilizationPercent: null,
    premiumsCurrentCycleUsdc: null,
    premiumIndication: null,
    cycleHistory: [],
    cumulativeReturnPercent: null,
    lossCount: null,
  },
];

export const mockVaultRealizedVolPercent: Record<string, number> = {
  "weth-usdc-005": 41.2,
  "weth-usdc-030": 40.8,
  "wsteth-weth-001": 4.6,
  "arb-usdc-030": 68.3,
};

// Wallet-level facts for the deposit flow — the same wallet regardless of
// which vault you're depositing into, so these don't belong on any one
// vault's position.
export const mockUnderwriterWallet = {
  walletBalanceUsdc: 512_400,
  minimumDepositUsdc: 1_000,
  // Worst case at the 200,000 USDC baseline deposit, weth-usdc-005's pace —
  // the deposit page scales this by (amount / baseline) for any vault, so
  // it's illustrative rather than a per-vault-fitted figure.
  worstCaseUsdc: -131_048,
};

export interface UnderwriterPosition {
  vaultId: string;
  cohortId: number;
  capitalCommittedUsdc: number;
  sharePercent: number;
  premiumsEarnedUsdc: number;
  claimsAtCurrentPaceUsdc: number;
  markIfEndsHereUsdc: number;
}

// One entry per vault the demo wallet has committed capital to — the "My
// underwriting" list and each vault's dashboard both resolve against this
// array instead of a single hardcoded position, so having capital in more
// than one vault at once is a normal, supported state.
export const mockUnderwriterPositions: UnderwriterPosition[] = [
  {
    vaultId: "weth-usdc-005",
    cohortId: 12,
    capitalCommittedUsdc: 200_000,
    sharePercent: 16.13,
    premiumsEarnedUsdc: 2_970.97,
    claimsAtCurrentPaceUsdc: -1_554.84,
    markIfEndsHereUsdc: 1_416.13,
  },
  {
    // 60,000 of wsteth-weth-001's 480,000 total capital (12.5% share) —
    // premiums/mark derived from that vault's own premiumsCurrentCycleUsdc
    // (940) rather than reused from weth-usdc-005's numbers.
    vaultId: "wsteth-weth-001",
    cohortId: 12,
    capitalCommittedUsdc: 60_000,
    sharePercent: 12.5,
    premiumsEarnedUsdc: 117.5,
    claimsAtCurrentPaceUsdc: 0,
    markIfEndsHereUsdc: 117.5,
  },
];

export function getUnderwriterPositionForVault(vaultId: string) {
  return mockUnderwriterPositions.find((item) => item.vaultId === vaultId);
}

export const mockVaultScenarioTable = [
  { volFinishPercent: 35.0, isAtOrBelow: true, vaultClaimsUsdc: 0, vaultNetUsdc: 18_420, yourNetUsdc: 2_970.97 },
  { volFinishPercent: 41.2, isCurrent: true, vaultClaimsUsdc: 9_640, vaultNetUsdc: 8_780, yourNetUsdc: 1_416.13 },
  { volFinishPercent: 47.0, vaultClaimsUsdc: 31_480, vaultNetUsdc: -13_060, yourNetUsdc: -2_106.45 },
  { volFinishPercent: 55.0, vaultClaimsUsdc: 78_200, vaultNetUsdc: -59_780, yourNetUsdc: -9_641.94 },
  { volFinishPercent: null, everyCapHit: true, vaultClaimsUsdc: 812_500, vaultNetUsdc: -794_080, yourNetUsdc: -131_048 },
];

export const mockVaultStrikeBreakdown = [
  { strikePercent: 30, policyCount: 6, capacityWrittenUsdc: 94_000 },
  { strikePercent: 35, policyCount: 23, capacityWrittenUsdc: 418_500 },
  { strikePercent: 45, policyCount: 13, capacityWrittenUsdc: 216_000 },
  { strikePercent: 55, policyCount: 5, capacityWrittenUsdc: 84_000 },
];

export const mockLastSettlement = {
  vaultId: "weth-usdc-005",
  cohortId: 12,
  outcome: "losing_cycle" as const,
  finalRealizedVolPercent: 46.8,
  settledAt: "2026-09-28T08:00:00Z",
  capitalAtOpenUsdc: 1_240_000,
  premiumsCollectedUsdc: 18_420,
  claimsPaidUsdc: -31_480,
  cycleResultPercent: -1.05,
  policiesPaidOut: 29,
  policiesSettled: 47,
  priorLosingCohortId: 9,
  claimsSplit: [
    { label: "0x7a4c…9f21 · you", sharePercent: 16.13, premiumsUsdc: 2_970.97, claimsUsdc: -5_077.42, isYou: true },
    { label: "0x1d90…44c8", sharePercent: 28.23, premiumsUsdc: 5_199.97, claimsUsdc: -8_886.8 },
    { label: "0xb302…7e15", sharePercent: 12.1, premiumsUsdc: 2_228.82, claimsUsdc: -3_809.08 },
    { label: "11 others", sharePercent: 43.54, premiumsUsdc: 8_020.24, claimsUsdc: -13_706.7 },
  ],
  returnedToYouUsdc: 197_893.55,
  yourCapitalUsdc: 200_000,
  yourPremiumsUsdc: 2_970.97,
  yourClaimsUsdc: -5_077.42,
  yourNetUsdc: -2_106.45,
};
