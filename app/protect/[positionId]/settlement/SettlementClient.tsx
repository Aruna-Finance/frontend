"use client";

import { notFound } from "next/navigation";
import { formatUnits } from "viem";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { DetailRow } from "@/components/aruna/DetailRow";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { USDC_DECIMALS, formatVarianceWad } from "@/lib/contracts/units";
import { excessVariance, strikeAccumulated } from "@/lib/contracts/variance";
import { isFinalPolicy, mapPolicyToCover } from "@/lib/indexer/mapPolicy";
import { lpSettlementCopy } from "@/lib/content/copy";
import { usePoliciesByPosition } from "@/hooks/usePolicyByPosition";
import { useVaultByAddress } from "@/hooks/useVaults";

export function SettlementClient({ positionId }: { positionId: string }) {
  const { data: policies, isLoading } = usePoliciesByPosition(positionId);
  const raw = policies?.find(isFinalPolicy);
  const vault = useVaultByAddress(raw?.vault ?? "").data;

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading settlement…</p>
      </div>
    );
  }
  if (!raw) {
    notFound();
  }

  const cover = mapPolicyToCover(raw);
  const isPaidOut = cover.status === "paid_out";
  const isRefunded = cover.status === "refunded";
  const settledDate = cover.settledAt ? formatSettlementDate(cover.settledAt) : "—";

  const strikeAnnualized = BigInt(raw.strikeAnnualized);
  const startSumSq = raw.startSumSq !== null ? BigInt(raw.startSumSq) : 0n;
  const finalSumSq = raw.cohortRef?.finalSumSq ? BigInt(raw.cohortRef.finalSumSq) : startSumSq;
  const sumSqCovered = finalSumSq > startSumSq ? finalSumSq - startSumSq : 0n;
  const strikeAcc = strikeAccumulated(strikeAnnualized, BigInt(raw.coveredSeconds));
  const excess = excessVariance({ sumSqCovered, strikeAnnualized, coveredSeconds: BigInt(raw.coveredSeconds) });
  const premiumUsdc = Number(formatUnits(BigInt(raw.premium), USDC_DECIMALS));
  const payoutUsdc = raw.payout !== null ? Number(formatUnits(BigInt(raw.payout), USDC_DECIMALS)) : 0;
  const rawPayoutUsdc = Number(formatUnits((BigInt(raw.varNotional) * excess) / 10n ** 18n, USDC_DECIMALS));
  const capApplied = rawPayoutUsdc > payoutUsdc + 0.005;

  // No feed to read pool fees from for testnet tokens — this line in the
  // mock ("fees earned while covered") isn't reconstructable without a price
  // feed either, so it's left out rather than shown as a guessed number.
  const nextCohortId = vault?.fundingCohortId ?? raw.cohortId + 1;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px]">
        <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{lpSettlementCopy.heading(raw.cohortId)}</h1>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px]">
        <div className="max-w-[680px]">
          {isRefunded ? (
            <Card className="flex flex-col gap-[20px]">
              <div className="flex justify-between items-center flex-wrap gap-[8px]">
                <Badge label={lpSettlementCopy.badgeRefunded} tone="neutral" />
                <span className="font-mono text-[12px] text-foreground-muted">
                  {lpSettlementCopy.coverSettled(cover.id, settledDate)}
                </span>
              </div>

              <div>
                <div className="text-[13px] text-foreground-muted">{lpSettlementCopy.refundLabel}</div>
                <div className="flex items-baseline gap-[8px] pt-[4px]">
                  <span className="font-display text-[52px] lg:text-[56px] font-normal">
                    {formatUsdcDecimal(cover.refundUsdc ?? 0)}
                  </span>
                  <span className="text-[15px] text-foreground-muted">{lpSettlementCopy.unit}</span>
                </div>
              </div>

              <div className="bg-canvas rounded-control p-[18px] text-[15px] leading-[1.6]">
                {lpSettlementCopy.refundedBody}
              </div>

              <div className="flex gap-[12px] pt-[4px]">
                <Button variant="ghost" href={`/protect/${positionId}/quote`} className="flex-grow">
                  {lpSettlementCopy.ctaCoverAgain(nextCohortId)}
                </Button>
                <Button variant="ghost" href="/proof">
                  {lpSettlementCopy.ctaVerify}
                </Button>
              </div>
            </Card>
          ) : isPaidOut ? (
            <Card variant="success" className="flex flex-col gap-[20px]">
              <div className="flex justify-between items-center flex-wrap gap-[8px]">
                <Badge label={lpSettlementCopy.badgePaidOut} tone="positive" />
                <span className="font-mono text-[12px] text-foreground-muted">
                  {lpSettlementCopy.coverSettled(cover.id, settledDate)}
                </span>
              </div>

              <div>
                <div className="text-[13px] text-foreground-muted">{lpSettlementCopy.netResultLabel}</div>
                <div className="flex items-baseline gap-[8px] pt-[4px]">
                  <span className="font-display text-[52px] lg:text-[56px] font-normal text-positive">
                    +{formatUsdcDecimal(cover.netResultUsdc ?? 0)}
                  </span>
                  <span className="text-[15px] text-foreground-muted">{lpSettlementCopy.unit}</span>
                </div>
              </div>

              <div className="bg-canvas rounded-control p-[18px] text-[15px] leading-[1.6]">
                {lpSettlementCopy.paidOutBody(cover.finalRealizedVolPercent ?? 0, cover.strikePercent, cover.breakevenPercent)}
              </div>

              <div className="border-t border-border pt-[4px]">
                <DetailRow label={lpSettlementCopy.paidOutRows.finalRealizedVariance} value={formatVarianceWad(sumSqCovered)} />
                <DetailRow label={lpSettlementCopy.paidOutRows.strikeVariance} value={formatVarianceWad(strikeAcc)} />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.excessTimesRate(formatUsdc(cover.payoutRateUsdc))}
                  value={formatUsdcDecimal(rawPayoutUsdc)}
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.capApplied}
                  value={
                    capApplied
                      ? lpSettlementCopy.capAppliedYes(formatUsdcDecimal(cover.capUsdc))
                      : lpSettlementCopy.capAppliedNo(formatUsdcDecimal(cover.capUsdc))
                  }
                  valueTone="neutral"
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.premiumPaid}
                  value={formatUsdcDecimal(-premiumUsdc)}
                  divider={false}
                />
              </div>

              <div className="flex gap-[12px] pt-[4px]">
                <Button href={`/protect/${positionId}/quote`} className="flex-grow">
                  {lpSettlementCopy.ctaCoverAgain(nextCohortId)}
                </Button>
                <Button variant="ghost" href="/proof">
                  {lpSettlementCopy.ctaVerify}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-col gap-[20px]">
              <div className="flex justify-between items-center flex-wrap gap-[8px]">
                <Badge label={lpSettlementCopy.badgeNoPayout} tone="neutral" />
                <span className="font-mono text-[12px] text-foreground-muted">
                  {lpSettlementCopy.coverSettled(cover.id, settledDate)}
                </span>
              </div>

              <div>
                <div className="text-[13px] text-foreground-muted">{lpSettlementCopy.netResultLabel}</div>
                <div className="flex items-baseline gap-[8px] pt-[4px]">
                  <span className="font-display text-[52px] lg:text-[56px] font-normal text-negative">
                    -{formatUsdcDecimal(Math.abs(cover.netResultUsdc ?? 0))}
                  </span>
                  <span className="text-[15px] text-foreground-muted">{lpSettlementCopy.unit}</span>
                </div>
              </div>

              <div className="bg-canvas rounded-control p-[18px] text-[15px] leading-[1.6]">
                {lpSettlementCopy.noPayoutBody(cover.finalRealizedVolPercent ?? 0, cover.strikePercent)}
              </div>

              <div className="border-t border-border pt-[4px]">
                <DetailRow label={lpSettlementCopy.noPayoutRows.finalRealizedVariance} value={formatVarianceWad(sumSqCovered)} />
                <DetailRow label={lpSettlementCopy.noPayoutRows.strikeVariance} value={formatVarianceWad(strikeAcc)} />
                <DetailRow label={lpSettlementCopy.noPayoutRows.excess} value={lpSettlementCopy.excessNone} valueTone="neutral" />
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.capacityReleased}
                  value={formatUsdcDecimal(cover.capUsdc)}
                />
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.premiumPaid}
                  value={formatUsdcDecimal(-premiumUsdc)}
                  divider={false}
                />
              </div>

              <div className="flex gap-[12px] pt-[4px]">
                <Button variant="ghost" href={`/protect/${positionId}/quote`} className="flex-grow">
                  {lpSettlementCopy.ctaCoverAgain(nextCohortId)}
                </Button>
                <Button variant="ghost" href="/proof">
                  {lpSettlementCopy.ctaVerify}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
