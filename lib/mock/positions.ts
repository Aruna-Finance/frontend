import type { Position, PositionCover } from "@/types/domain";

export const mockPositions: Position[] = [
  {
    tokenId: "482911",
    poolLabel: "WETH / USDC",
    poolFeeTier: "0.05%",
    inRange: true,
    rangeLowerUsdc: 3_050.0,
    rangeUpperUsdc: 3_650.0,
    feesEarnedUsdc: 214.6,
    valueUsdc: 40_183,
    hasVaultForPool: true,
  },
  {
    tokenId: "479204",
    poolLabel: "WETH / USDC",
    poolFeeTier: "0.05%",
    inRange: false,
    rangeLowerUsdc: 2_900.0,
    rangeUpperUsdc: 3_200.0,
    feesEarnedUsdc: 41.2,
    valueUsdc: 18_640,
    hasVaultForPool: true,
  },
  {
    tokenId: "491877",
    poolLabel: "ARB / USDC",
    poolFeeTier: "0.30%",
    inRange: null,
    rangeLowerUsdc: 0.62,
    rangeUpperUsdc: 0.98,
    feesEarnedUsdc: 88.05,
    valueUsdc: 9_320,
    hasVaultForPool: false,
  },
];

export const mockPositionCovers: PositionCover[] = [
  {
    id: "7741",
    positionId: "482911",
    vaultId: "weth-usdc-005",
    status: "active",
    strikePercent: 35,
    breakevenPercent: 37.1,
    capUsdc: 4_000.0,
    premiumUsdc: 380.0,
    payoutRateUsdc: 25_000,
    netResultUsdc: null,
    finalRealizedVolPercent: null,
    settledAt: null,
  },
  {
    id: "7742",
    positionId: null,
    vaultId: "weth-usdc-005",
    status: "no_payout",
    strikePercent: 35,
    breakevenPercent: 37.1,
    capUsdc: 4_000.0,
    premiumUsdc: 380.0,
    payoutRateUsdc: 25_000,
    netResultUsdc: -380.0,
    finalRealizedVolPercent: 31.4,
    settledAt: "2026-09-28T08:00:00Z",
  },
];

export const mockCoverPaidOutExample: PositionCover = {
  id: "7741",
  positionId: "482911",
  vaultId: "weth-usdc-005",
  status: "paid_out",
  strikePercent: 35,
  breakevenPercent: 37.1,
  capUsdc: 4_000.0,
  premiumUsdc: 380.0,
  payoutRateUsdc: 25_000,
  netResultUsdc: 2_032.5,
  finalRealizedVolPercent: 46.8,
  settledAt: "2026-09-28T08:00:00Z",
};

export const mockActiveCoverDetail = {
  coverId: "7741",
  positionId: "482911",
  vaultId: "weth-usdc-005",
  strikePercent: 35,
  breakevenPercent: 37.1,
  capUsdc: 4_000.0,
  aboveStrikeByPts: 6.2,
  samplesTaken: 144,
  samplesTotal: 336,
  missedSamples: 0,
  scenarioTable: [
    { finishVolPercent: 30, netUsdc: -380.0 },
    { finishVolPercent: 37, netUsdc: -25.0 },
    { finishVolPercent: 41.2, isNow: true, netUsdc: 800.0 },
    { finishVolPercent: 47, netUsdc: 2_032.5 },
    { finishVolPercent: 53, isCapFinish: true, netUsdc: 3_620.0 },
  ],
  markAtCurrentPace: {
    grossPayoutUsdc: 1_180.0,
    premiumPaidUsdc: -380.0,
    netUsdc: 800.0,
    maxLossRemainingUsdc: 380.0,
  },
  oracleFeed: [
    { timeUtc: "08:31", tick: 200_937 },
    { timeUtc: "08:01", tick: 200_884 },
    { timeUtc: "07:31", tick: 200_812 },
    { timeUtc: "07:01", tick: 200_795 },
  ],
};

export const mockCoverPaidOutBreakdown = {
  finalRealizedVariance: 0.219,
  strikeVariance: 0.1225,
  excessTimesPayoutRateUsdc: 2_412.5,
  capApplied: false,
  premiumPaidUsdc: -380.0,
};

export const mockCoverNoPayoutBreakdown = {
  finalRealizedVariance: 0.0986,
  strikeVariance: 0.1225,
  excess: null,
  capacityReleasedUsdc: 4_000.0,
  premiumPaidUsdc: -380.0,
  poolFeesEarnedUsdc: 214.6,
};

export const mockQuoteStrikeTable = [
  { strikePercent: 30, premiumUsdc: 520, fullCyclePremiumUsdc: 910, breakevenPercent: 33.3, capReachedAtPercent: 50.0, estPayoutIfVolHoldsUsdc: 1_472.5 },
  { strikePercent: 35, premiumUsdc: 380, fullCyclePremiumUsdc: 665, breakevenPercent: 37.1, capReachedAtPercent: 53.2, estPayoutIfVolHoldsUsdc: 800.0 },
  { strikePercent: 45, premiumUsdc: 185, fullCyclePremiumUsdc: 324, breakevenPercent: 45.8, capReachedAtPercent: 60.2, estPayoutIfVolHoldsUsdc: 0 },
  { strikePercent: 55, premiumUsdc: 95, fullCyclePremiumUsdc: 166, breakevenPercent: 55.3, capReachedAtPercent: 68.0, estPayoutIfVolHoldsUsdc: 0 },
];

export const mockQuoteDefaults = {
  positionId: "482911",
  vaultId: "weth-usdc-005",
  coveredAmountUsdc: 40_000,
  payoutRateUsdc: 25_000,
  maxPayoutUsdc: 4_000,
  capacityReservingUsdc: 4_000,
  capacityFreeUsdc: 427_500,
  // "3d 21h" sisa cohort 12 saat quote ini diambil di LPQuote.dc.html, dalam detik.
  coveredSecondsAtQuote: 334_800,
};
