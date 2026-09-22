export const mockProofSummary = {
  cohortId: 12,
  vaultId: "weth-usdc-005",
  poolAddress: "0xc31e…54a1",
  samplesRecorded: 336,
  samplesTotal: 336,
  gapCount: 0,
  finalRealizedVolPercent: 46.8,
  policiesSettled: 47,
  policiesPaidOut: 29,
  totalClaimsUsdc: 31_480.0,
  policiesHitCap: 0,
};

export const mockProofSampleRows = [
  { timeUtc: "21 Sep 08:00", meanTick: 200_412, deltaTick: null, squaredLogReturn: null },
  { timeUtc: "21 Sep 08:30", meanTick: 200_461, deltaTick: 49, squaredLogReturn: "2.400e-5" },
  { timeUtc: "21 Sep 09:00", meanTick: 200_388, deltaTick: -73, squaredLogReturn: "5.326e-5" },
  { timeUtc: "21 Sep 09:30", meanTick: 200_504, deltaTick: 116, squaredLogReturn: "1.345e-4" },
];

export const mockProofHiddenRowsCount = 331;

export const mockProofLastRow = {
  timeUtc: "28 Sep 08:00",
  meanTick: 201_947,
  deltaTick: 88,
  squaredLogReturn: "7.744e-5",
};

export const mockProofDerivation = {
  logReturnFormula: "log return per step = Δ tick × ln(1.0001)",
  varianceFormula: "realized variance = Σ (log return)² × (periods per year ÷ steps)",
  sumSquaredLogReturn: "4.1930e−3",
  sumSquaredLogReturnSteps: 335,
  annualizedVariance: 0.219,
  annualizedVolPercent: 46.8,
};

export const mockProofContracts = [
  { name: "ArunaFactory", address: "[ADDRESS]" },
  { name: "VarianceAccumulator", address: "[ADDRESS]" },
  { name: "CoverVault", address: "[ADDRESS]" },
  { name: "IPremiumPricer", address: "[ADDRESS]" },
  { name: "Uniswap v3 pool", address: "0xc31e…54a1" },
];
