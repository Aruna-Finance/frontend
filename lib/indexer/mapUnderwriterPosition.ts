import { formatUnits } from "viem";
import { USDC_DECIMALS } from "@/lib/contracts/units";
import type { UnderwriterPosition } from "@/types/domain";
import type { IndexerUnderwriterPosition } from "./types";

function usdc(raw: string): number {
  return Number(formatUnits(BigInt(raw), USDC_DECIMALS));
}

// Share and earnings use `principal`, never `deposit` - confirmed by the SC
// team: `deposit` mirrors the contract and goes to 0 after a roll/withdraw,
// which would make an underwriter who already exited look like they still
// hold a share of this cohort.
export function mapUnderwriterPosition(raw: IndexerUnderwriterPosition): UnderwriterPosition {
  const principalUsdc = usdc(raw.principal);
  const cohortCapitalUsdc = raw.cohortRef ? usdc(raw.cohortRef.totalCapital) : 0;
  const sharePercent = cohortCapitalUsdc > 0 ? (principalUsdc / cohortCapitalUsdc) * 100 : 0;
  const share = sharePercent / 100;

  const premiumsEarnedUsdc = raw.cohortRef ? share * usdc(raw.cohortRef.premiumsCollected) : 0;
  // Claims are a cost to underwriters - kept negative, matching how every
  // other claims figure in this app is signed (e.g. mockLastSettlement).
  const claimsAtCurrentPaceUsdc = raw.cohortRef ? -(share * usdc(raw.cohortRef.claimsPaid)) : 0;

  return {
    vaultId: raw.vault,
    cohortId: raw.cohortId,
    capitalCommittedUsdc: principalUsdc,
    sharePercent,
    premiumsEarnedUsdc,
    claimsAtCurrentPaceUsdc,
    markIfEndsHereUsdc: premiumsEarnedUsdc + claimsAtCurrentPaceUsdc,
  };
}
