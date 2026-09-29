import { formatUnits } from "viem";
import { breakevenVolPercent, realizedVarianceAnnualized } from "@/lib/contracts/variance";
import { USDC_DECIMALS, varianceWadToVolPercent } from "@/lib/contracts/units";
import type { PositionCover } from "@/types/domain";
import type { IndexerPolicy } from "./types";

function usdc(raw: string | null): number {
  return raw === null ? 0 : Number(formatUnits(BigInt(raw), USDC_DECIMALS));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

// varNotional is "base token units paid per unit of excess variance (WAD)" —
// the same rate the payout formula (§7.2) multiplies against, which is what
// this field has always meant here.
export function mapPolicyToCover(raw: IndexerPolicy): PositionCover {
  const premiumUsdc = usdc(raw.premium);
  const payoutUsdc = raw.payout !== null ? usdc(raw.payout) : null;
  const status: PositionCover["status"] = !raw.settled ? "active" : (payoutUsdc ?? 0) > 0 ? "paid_out" : "no_payout";

  const cohortWindowSeconds =
    raw.cohortRef && !raw.cohortRef.finalSumSq
      ? null
      : raw.cohortRef
        ? Number(raw.cohortRef.endsAt) - Number(raw.cohortRef.startsAt)
        : null;
  const finalRealizedVolPercent =
    raw.settled && raw.cohortRef?.finalSumSq && cohortWindowSeconds
      ? round1(
          varianceWadToVolPercent(
            realizedVarianceAnnualized(BigInt(raw.cohortRef.finalSumSq), BigInt(cohortWindowSeconds)),
          ),
        )
      : null;

  return {
    id: raw.policyId,
    positionId: raw.positionTokenId,
    vaultId: raw.vault,
    status,
    strikePercent: round1(varianceWadToVolPercent(BigInt(raw.strikeAnnualized))),
    breakevenPercent: round1(
      breakevenVolPercent({
        premium: BigInt(raw.premium),
        varNotional: BigInt(raw.varNotional),
        strikeAnnualized: BigInt(raw.strikeAnnualized),
        coveredSeconds: BigInt(raw.coveredSeconds),
      }),
    ),
    capUsdc: usdc(raw.maxPayout),
    premiumUsdc,
    payoutRateUsdc: usdc(raw.varNotional),
    netResultUsdc: raw.settled ? (payoutUsdc ?? 0) - premiumUsdc : null,
    finalRealizedVolPercent,
    settledAt: raw.settledAt ? new Date(Number(raw.settledAt) * 1000).toISOString() : null,
  };
}
