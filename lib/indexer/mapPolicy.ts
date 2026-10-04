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

// Indexer v2 mirrors the contract's PolicyStatus. Anything else means the
// schema moved under us — fail loudly rather than render it as "active".
export function coverStatusOf(raw: Pick<IndexerPolicy, "status" | "payout">): PositionCover["status"] {
  switch (raw.status) {
    case "Active":
      return "active";
    case "Cancelled":
      return "cancelled";
    case "Refunded":
      return "refunded";
    case "Settled":
      return raw.payout !== null && BigInt(raw.payout) > 0n ? "paid_out" : "no_payout";
    default:
      throw new Error(`unknown policy status: ${String(raw.status)}`);
  }
}

// Only an Active policy is a running cover; Cancelled/Settled/Refunded are all over.
export const isActivePolicy = (raw: Pick<IndexerPolicy, "status">) => raw.status === "Active";
export const isSettledPolicy = (raw: Pick<IndexerPolicy, "status">) => raw.status === "Settled";
// The settlement screen shows a measured policy or a refunded one.
export const isFinalPolicy = (raw: Pick<IndexerPolicy, "status">) =>
  raw.status === "Settled" || raw.status === "Refunded";

// varNotional is "base token units paid per unit of excess variance (WAD)" —
// the same rate the payout formula (§7.2) multiplies against, which is what
// this field has always meant here.
export function mapPolicyToCover(raw: IndexerPolicy): PositionCover {
  const premiumUsdc = usdc(raw.premium);
  const payoutUsdc = raw.payout !== null ? usdc(raw.payout) : null;
  const status = coverStatusOf(raw);
  const refundUsdc = raw.status === "Refunded" ? usdc(raw.refund) : null;

  const cohortWindowSeconds =
    raw.cohortRef && !raw.cohortRef.finalSumSq
      ? null
      : raw.cohortRef
        ? Number(raw.cohortRef.endsAt) - Number(raw.cohortRef.startsAt)
        : null;
  const finalRealizedVolPercent =
    raw.status === "Settled" && raw.cohortRef?.finalSumSq && cohortWindowSeconds
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
    netResultUsdc:
      raw.status === "Settled"
        ? (payoutUsdc ?? 0) - premiumUsdc
        : raw.status === "Refunded"
          ? (refundUsdc ?? 0) - premiumUsdc
          : null,
    refundUsdc,
    finalRealizedVolPercent,
    settledAt: raw.settledAt ? new Date(Number(raw.settledAt) * 1000).toISOString() : null,
  };
}
