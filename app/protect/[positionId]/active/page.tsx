import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StatCard } from "@/components/aruna/StatCard";
import { DetailRow } from "@/components/aruna/DetailRow";
import { usePosition } from "@/hooks/usePosition";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { lpActiveCopy } from "@/lib/content/copy";
import { getActiveCoverForPosition, mockActiveCoverDetail } from "@/lib/mock/positions";
import { mockCohortDaysElapsed, mockCohortTimeRemaining } from "@/lib/mock/cohorts";

function scenarioLabel(entry: (typeof mockActiveCoverDetail.scenarioTable)[number]) {
  if (entry.isCapFinish) return `${entry.finishVolPercent}%+`;
  if (entry.isNow) return `${entry.finishVolPercent}% now`;
  return `${entry.finishVolPercent}%`;
}

function scenarioTone(netUsdc: number) {
  if (netUsdc <= -100) return "text-negative";
  if (netUsdc < 0) return "text-foreground-secondary";
  return "text-positive";
}

export default async function LPActivePage(props: PageProps<"/protect/[positionId]/active">) {
  const { positionId } = await props.params;

  const cover = getActiveCoverForPosition(positionId);
  if (!cover) {
    notFound();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const position = usePosition(positionId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(cover.vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohort = useCohort(cover.vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  if (!position || !vault || !cohort) {
    notFound();
  }

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const dayElapsed = mockCohortDaysElapsed[cohort.id] ?? 0;
  const timeLeft = mockCohortTimeRemaining[cohort.id] ?? "";

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <div className="flex items-center gap-[12px] flex-wrap">
            <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{lpActiveCopy.heading(cover.coverId)}</h1>
            <Badge label={lpActiveCopy.badgeInTheMoney} tone="positive" />
          </div>
          <div className="font-mono text-[13px] text-foreground-muted pt-[8px]">
            {lpActiveCopy.meta(positionId, poolLabel, cover.strikePercent, formatUsdcDecimal(cover.capUsdc))}
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
            {lpActiveCopy.settlesInLabel}
          </div>
          <div className="font-mono text-[30px] pt-[4px]">{timeLeft}</div>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card className="flex flex-col flex-grow">
            <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
              <span className="text-[16px] font-semibold">{lpActiveCopy.chartTitle}</span>
              <div className="flex gap-[18px] font-mono text-[12px]">
                <span className="text-accent">{lpActiveCopy.legendRealized}</span>
                <span className="text-foreground-muted">{lpActiveCopy.legendStrike(cover.strikePercent)}</span>
                <span className="text-positive">{lpActiveCopy.legendBreakeven(cover.breakevenPercent)}</span>
              </div>
            </div>
            <svg
              viewBox="0 0 700 300"
              preserveAspectRatio="none"
              className="w-full h-[350px] pt-[14px]"
              aria-label="Realized volatility above strike and breakeven"
            >
              <line x1="44" y1="260" x2="700" y2="260" stroke="var(--chart-grid)" strokeWidth={1} />
              <line x1="44" y1="150" x2="700" y2="150" stroke="var(--chart-grid-neutral)" strokeWidth={1} strokeDasharray="5 5" />
              <line x1="44" y1="128" x2="700" y2="128" stroke="var(--chart-grid-breakeven)" strokeWidth={1} strokeDasharray="5 5" />
              <line x1="44" y1="40" x2="700" y2="40" stroke="var(--chart-grid-strike)" strokeWidth={1} strokeDasharray="5 5" />
              <text x="0" y="154" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {cover.strikePercent}%
              </text>
              <text x="0" y="132" fill="var(--color-positive)" fontSize={11} fontFamily="IBM Plex Mono">
                {cover.breakevenPercent}%
              </text>
              <text x="590" y="36" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.payoutCapLabel}
              </text>
              <polyline
                points="44,260 120,246 196,228 272,200 348,190 424,168 500,152 576,124 620,112 640,108"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
              />
              <circle cx="640" cy="108" r="4.5" fill="var(--color-accent)" />
              <line x1="640" y1="20" x2="640" y2="272" stroke="var(--chart-grid)" strokeWidth={1} />
              <text x="600" y="288" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.axisNowLabel(dayElapsed)}
              </text>
              <text x="52" y="288" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.axisStartLabel}
              </text>
            </svg>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] border-t border-border pt-[18px] mt-auto">
              <StatCard
                label={lpActiveCopy.statLabels.realizedVol}
                value={cohort.realizedVolPercent !== null ? `${cohort.realizedVolPercent}%` : "—"}
                valueTone="accent"
              />
              <StatCard label={lpActiveCopy.statLabels.aboveStrikeBy} value={`${cover.aboveStrikeByPts} pts`} />
              <StatCard label={lpActiveCopy.statLabels.samplesTaken} value={`${cover.samplesTaken} / ${cover.samplesTotal}`} />
              <StatCard label={lpActiveCopy.statLabels.missedSamples} value={String(cover.missedSamples)} valueTone="positive" />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.scenarioLabel}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-[12px] pt-[14px]">
              {cover.scenarioTable.map((entry) => (
                <div
                  key={entry.finishVolPercent}
                  className={`rounded-control p-[14px] ${
                    entry.isNow ? "border-[1.5px] border-accent bg-canvas" : "border border-border bg-canvas"
                  }`}
                >
                  <div className={`font-mono text-[15px] ${entry.isNow ? "text-accent" : "text-foreground-muted"}`}>
                    {scenarioLabel(entry)}
                  </div>
                  <div className={`font-mono text-[17px] pt-[6px] ${scenarioTone(entry.netUsdc)}`}>
                    {entry.netUsdc >= 0 ? "+" : ""}
                    {formatUsdcDecimal(entry.netUsdc)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[13px] text-foreground-muted pt-[12px]">{lpActiveCopy.scenarioFootnote}</div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card variant="raised" className="flex flex-col gap-[16px]">
            <span className="text-[11px] tracking-[0.07em] uppercase text-accent">{lpActiveCopy.markCard.label}</span>
            <div className="flex items-baseline gap-[8px]">
              <span className="font-mono text-[40px] text-positive">
                +{formatUsdcDecimal(cover.markAtCurrentPace.netUsdc)}
              </span>
              <span className="text-[14px] text-foreground-muted">{lpActiveCopy.markCard.unit}</span>
            </div>
            <div className="text-[14px] leading-[1.6] text-foreground-secondary">{lpActiveCopy.markCard.note}</div>
            <div className="border-t border-border pt-[16px]">
              <DetailRow label={lpActiveCopy.markCard.rows.gross} value={formatUsdcDecimal(cover.markAtCurrentPace.grossPayoutUsdc)} />
              <DetailRow
                label={lpActiveCopy.markCard.rows.premiumPaid}
                value={formatUsdcDecimal(cover.markAtCurrentPace.premiumPaidUsdc)}
              />
              <DetailRow
                label={lpActiveCopy.markCard.rows.maxLossRemaining}
                value={formatUsdcDecimal(cover.markAtCurrentPace.maxLossRemainingUsdc)}
                divider={false}
              />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.oracleFeed.label}
            </div>
            <div className="pt-[10px]">
              {cover.oracleFeed.map((sample, index) => (
                <div
                  key={sample.timeUtc}
                  className={`flex justify-between py-[9px] ${
                    index < cover.oracleFeed.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <span className="font-mono text-[13px] text-foreground-secondary">{sample.timeUtc} UTC</span>
                  <span className="font-mono text-[13px]">
                    {lpActiveCopy.oracleFeed.tickPrefix} {formatUsdc(sample.tick)}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/proof" className="inline-block text-[13px] text-foreground-muted pt-[14px]">
              {lpActiveCopy.oracleFeed.fullRecordLink}
            </Link>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.atSettlement.label}
            </div>
            <div className="text-[14px] leading-[1.65] text-foreground-secondary pt-[10px]">
              {lpActiveCopy.atSettlement.body}
            </div>
            <Button variant="ghost" href={`/protect/${positionId}/settlement`} className="w-full mt-[16px]">
              {lpActiveCopy.atSettlement.cta}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
