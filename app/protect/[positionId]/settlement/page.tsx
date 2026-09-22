import { notFound } from "next/navigation";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { DetailRow } from "@/components/aruna/DetailRow";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { usePosition } from "@/hooks/usePosition";
import { useCohort } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { lpSettlementCopy } from "@/lib/content/copy";
import { getSettledCoverForPosition } from "@/lib/mock/positions";

// Two settled covers are modeled in this demo: #482911 paid out (#7741),
// #479204 did not (#7742) — the mockup shows both outcomes side by side for
// documentation, but its own subtitle says only one ever renders for a real
// policy, so each position resolves to its own single outcome here.
export default async function LPSettlementPage(props: PageProps<"/protect/[positionId]/settlement">) {
  const { positionId } = await props.params;

  const settled = getSettledCoverForPosition(positionId);
  if (!settled || !settled.cover.settledAt) {
    notFound();
  }

  const { cover } = settled;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const position = usePosition(positionId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohort = useCohort(cover.vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  if (!position || !cohort) {
    notFound();
  }

  const settledDate = formatSettlementDate(cover.settledAt!);
  const nextCohortId = cohort.id + 1;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[28px]">
        <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{lpSettlementCopy.heading(cohort.id)}</h1>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px]">
        <div className="max-w-[680px]">
          {settled.kind === "paid_out" ? (
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
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.finalRealizedVariance}
                  value={settled.breakdown.finalRealizedVariance.toFixed(4)}
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.strikeVariance}
                  value={settled.breakdown.strikeVariance.toFixed(4)}
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.excessTimesRate(formatUsdc(cover.payoutRateUsdc))}
                  value={formatUsdcDecimal(settled.breakdown.excessTimesPayoutRateUsdc)}
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.capApplied}
                  value={lpSettlementCopy.capAppliedNo(formatUsdcDecimal(cover.capUsdc))}
                  valueTone="neutral"
                />
                <DetailRow
                  label={lpSettlementCopy.paidOutRows.premiumPaid}
                  value={formatUsdcDecimal(settled.breakdown.premiumPaidUsdc)}
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
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.finalRealizedVariance}
                  value={settled.breakdown.finalRealizedVariance.toFixed(4)}
                />
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.strikeVariance}
                  value={settled.breakdown.strikeVariance.toFixed(4)}
                />
                <DetailRow label={lpSettlementCopy.noPayoutRows.excess} value={lpSettlementCopy.excessNone} valueTone="neutral" />
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.capacityReleased}
                  value={formatUsdcDecimal(settled.breakdown.capacityReleasedUsdc)}
                />
                <DetailRow
                  label={lpSettlementCopy.noPayoutRows.premiumPaid}
                  value={formatUsdcDecimal(settled.breakdown.premiumPaidUsdc)}
                  divider={false}
                />
              </div>

              <div className="bg-canvas rounded-control p-[16px] text-[13.5px] leading-[1.6] text-foreground-secondary">
                {lpSettlementCopy.feesNote(formatUsdcDecimal(settled.breakdown.poolFeesEarnedUsdc))}
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
