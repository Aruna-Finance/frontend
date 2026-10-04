import { BaseError, ContractFunctionRevertedError, formatUnits } from "viem";
import { USDC_DECIMALS } from "./units";

// Friendly copy for every CoverVault custom error, confirmed against the real
// v2 ABI (`forge inspect CoverVault abi`, smart-contract commit 01dc2fb) and
// the SC team's earlier answers on the v0/v1 subset. Args are typed
// `unknown[]` here (decoded by viem from the ABI at the call site) and
// narrowed per error before use.
const messages: Record<string, (args: readonly unknown[]) => string> = {
  PositionWrongPool: () => "This position isn't in the pool this vault covers.",
  PositionNotOwned: () => "This position isn't owned by the connected wallet.",
  NoSamples: () => "No variance data yet for this pool. Try again once sampling has started.",
  NotActive: () => "This cohort isn't open for cover right now.",
  QuoteExpired: () => "This quote expired. Get a new one before confirming.",
  PremiumTooHigh: (args) => {
    const [premium, maxPremium] = args as [bigint, bigint];
    return `Premium moved to ${formatUnits(premium, USDC_DECIMALS)} USDC, above your limit of ${formatUnits(maxPremium, USDC_DECIMALS)}.`;
  },
  CapacityExceeded: () => "This vault doesn't have enough free capacity for this cover right now.",
  MaxPayoutOverflow: () => "This position is too large to cover right now.",
  NotFunding: () => "This cohort is no longer accepting deposits.",
  AlreadyFinalized: () => "This cohort has already been finalized.",
  NotExpiredYet: () => "This cohort hasn't ended yet.",
  NotSettled: () => "This cohort hasn't settled yet.",
  NotSettling: () => "This cohort isn't in settlement.",
  NothingToWithdraw: () => "There's nothing to withdraw for this cohort.",
  Reentrancy: () => "That request conflicted with another one in progress. Please retry.",
  TransferFailed: () => "The token transfer failed. Check your balance and allowance.",
  // v2 additions (buyCover / policy escrow / keeper paths).
  TooLateToBuy: () => "Too little time is left in this cohort to buy cover - try the next one.",
  ZeroLiquidity: () => "This position has no liquidity, so there's nothing to cover.",
  ZeroCapital: () => "This cohort has no underwriter capital yet, so it isn't selling cover.",
  BelowMinPayout: (args) => {
    const [, minPayout] = args as [bigint, bigint];
    return `This position is too small for this cohort - it needs a minimum payout of ${formatUnits(minPayout, USDC_DECIMALS)} USDC.`;
  },
  PolicyCapReached: () => "This cohort has hit its limit on live policies. Try again next cohort.",
  UnsolicitedPosition: () => "This position was never covered by this vault.",
  NotPolicyOwner: () => "This policy isn't owned by the connected wallet.",
  PolicyNotActive: () => "This cover isn't active anymore - it may already be cancelled or settled.",
  PositionNotHeld: () => "This vault isn't holding that position (it's already been returned or claimed).",
  NotParked: () => "There's no parked position to claim for this policy.",
  ZeroRecipient: () => "Pick a wallet address to receive this, not the zero address.",
  NothingToSettle: () => "There's nothing left to settle in this cohort.",
};

// Walks a caught error for a decoded CoverVault revert and returns copy a
// person can act on. Returns undefined for anything else (network errors,
// user rejection, ...) so callers fall back to their normal error handling.
export function getContractErrorMessage(error: unknown): string | undefined {
  if (!(error instanceof BaseError)) return undefined;
  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revert instanceof ContractFunctionRevertedError)) return undefined;
  const errorName = revert.data?.errorName;
  if (!errorName) return undefined;
  return messages[errorName]?.(revert.data?.args ?? []);
}

// `strikeAnnualized`, straight off-chain math no contract call needed:
// varNotionalFor a position must satisfy `reserved + maxPayout <= totalCapital
// * maxUtilizationBps / 10000` or the vault reverts CapacityExceeded. Lets the
// UI disable submit and say why before ever prompting the wallet.
export function hasCapacityFor(
  maxPayout: bigint,
  reserved: bigint,
  totalCapital: bigint,
  maxUtilizationBps: bigint,
): boolean {
  return reserved + maxPayout <= (totalCapital * maxUtilizationBps) / 10_000n;
}
