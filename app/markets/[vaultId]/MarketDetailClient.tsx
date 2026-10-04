"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { StatCard } from "@/components/aruna/StatCard";
import { DetailRow } from "@/components/aruna/DetailRow";
import { LineChart } from "@/components/aruna/charts/LineChart";
import { marketDetailCopy, marketsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc } from "@/lib/format";
import { daysElapsedSince, formatDuration, secondsUntil } from "@/lib/contracts/units";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";

// Day-by-day progress bar for the cohort, sized to its own tenor (not
// hardcoded to 7) with "now" placed on whichever day is actually current.
function buildDayLabels(startsAt: string, endsAt: string, daysElapsed: number): string[] {
  const tenorDays = Math.max(1, Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 86_400_000));
  return Array.from({ length: tenorDays }, (_, index) => {
    const day = index + 1;
    return day === daysElapsed + 1 ? `Day ${day} · now` : `Day ${day}`;
  });
}

export function MarketDetailClient({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading: vaultLoading } = useVault(vaultId);
  const { data: cohort } = useCohort(vaultId);

  if (vaultLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/markets")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading vault…</p>
      </div>
    );
  }

  if (!vault || !vault.hasVault) {
    notFound();
  }

  const daysElapsed = cohort ? daysElapsedSince(cohort.startsAt) : undefined;
  const timeLeft = cohort ? formatDuration(secondsUntil(cohort.endsAt)) : undefined;
  const dayLabels = cohort ? buildDayLabels(cohort.startsAt, cohort.endsAt, daysElapsed ?? 0) : [];
  const utilization = vault.totalCapitalUsdc > 0 ? vault.freeCapacityUsdc / vault.totalCapitalUsdc : 0;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/markets")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[16px]">
        <div>
          <Link href="/markets" className="text-[13px] text-foreground-muted">
            {marketDetailCopy.backLink}
          </Link>
          <h1 className="font-display text-[32px] lg:text-[38px] font-normal pt-[10px] flex items-center gap-[14px]">
            {vault.poolSymbols ? (
              <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} size={32} />
            ) : null}
            <span>
              {vault.poolLabel} · {vault.poolFeeTier}
            </span>
          </h1>
          <div className="font-mono text-[12px] text-foreground-muted pt-[6px]">
            {marketDetailCopy.meta(
              vault.poolAddress ?? "-",
              vault.currentSpotPrice !== null ? vault.currentSpotPrice.toFixed(2) : "-",
            )}
          </div>
        </div>
        <div className="flex gap-[12px]">
          <Button variant="ghost" href="/underwrite">
            {marketDetailCopy.underwriteThisVaultCta}
          </Button>
          <Button href="/protect">{marketDetailCopy.buyCoverCta}</Button>
        </div>
      </div>

      {cohort ? (
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[24px]">
          <Card>
            <div className="flex flex-col sm:flex-row justify-between gap-[8px]">
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {marketDetailCopy.cohortRangeLabel(
                  cohort.id,
                  new Date(cohort.startsAt).toUTCString().slice(0, 22),
                  new Date(cohort.endsAt).toUTCString().slice(0, 22),
                )}
              </div>
              {timeLeft && cohort.samplesTaken !== null && cohort.samplesTotal !== null ? (
                <div className="font-mono text-[13px] text-accent">
                  {marketDetailCopy.timeLeftLabel(timeLeft, cohort.samplesTaken, cohort.samplesTotal)}
                </div>
              ) : null}
            </div>
            <div className="flex gap-[4px] pt-[14px]">
              {dayLabels.map((_, index) => (
                <div
                  key={index}
                  className={`h-[10px] flex-grow rounded-progress ${
                    daysElapsed !== undefined && index < daysElapsed ? "bg-positive" : "bg-border"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between font-mono text-[11px] text-foreground-muted pt-[8px]">
              {dayLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
          </Card>
        </div>
      ) : null}

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[20px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[20px]">
          {vault.premiumIndication && cohort?.realizedVolPercent !== null && cohort?.realizedVolPercent !== undefined ? (
            <Card className="flex flex-col flex-grow">
              <div className="flex justify-between items-baseline">
                <span className="text-[16px] font-semibold">{marketDetailCopy.chartTitle}</span>
                <div className="flex gap-[18px] font-mono text-[12px]">
                  <span className="text-accent">{marketDetailCopy.chartLegendRealized(cohort.realizedVolPercent)}</span>
                  <span className="text-foreground-muted">{marketDetailCopy.chartLegendStrikesOnOffer}</span>
                </div>
              </div>
              <LineChart
                viewBoxWidth={700}
                viewBoxHeight={300}
                className="w-full h-[350px] pt-[16px]"
                ariaLabel={`Realized volatility rising to ${cohort.realizedVolPercent} percent against strike levels`}
                series={[
                  {
                    points: "40,245 110,232 180,214 250,186 320,178 390,160 460,148 530,140 600,134 640,131",
                    tone: "accent",
                    markerAtEnd: true,
                  },
                ]}
                thresholds={vault.premiumIndication.map((point) => ({
                  y: 1 - point.strikePercent / 60,
                  label: `${point.strikePercent}%`,
                }))}
                verticalMarkers={[{ x: 640 / 700, label: marketDetailCopy.axisNowLabel }]}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] border-t border-border pt-[18px] mt-auto">
                <StatCard label={marketDetailCopy.statLabels.lastTwapSample} value={cohort.lastSampleAt ? "08:31 UTC · 4 min ago" : "-"} />
                <StatCard
                  label={marketDetailCopy.statLabels.missedSamples}
                  value={cohort.missedSamples !== null ? String(cohort.missedSamples) : "-"}
                  valueTone="positive"
                />
                <StatCard
                  label={marketDetailCopy.statLabels.priorCohortsAvg}
                  value={cohort.priorCohortsAvgVolPercent !== null ? `${cohort.priorCohortsAvgVolPercent}%` : "-"}
                />
              </div>
            </Card>
          ) : (
            <Card className="flex-grow">
              <StatCard
                label={marketsCopy.tableHeaders[2]}
                value={cohort?.realizedVolPercent !== null && cohort?.realizedVolPercent !== undefined ? `${cohort.realizedVolPercent}%` : "-"}
                size="lg"
                valueTone="accent"
              />
            </Card>
          )}
        </div>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[20px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {marketDetailCopy.vaultCapacity.label}
            </div>
            <div className="flex items-baseline gap-[8px] pt-[10px]">
              <span className="font-mono text-[30px]">{formatUsdc(vault.freeCapacityUsdc)}</span>
              <span className="text-[13px] text-foreground-muted">{marketDetailCopy.vaultCapacity.freeUnit}</span>
            </div>
            <div className="pt-[14px]">
              <ProgressBar value={utilization} />
            </div>
            <div className="flex justify-between font-mono text-[12px] text-foreground-muted pt-[8px]">
              <span>{marketDetailCopy.vaultCapacity.reservedCaption(formatUsdc(vault.reservedCapacityUsdc))}</span>
              <span>{marketDetailCopy.vaultCapacity.totalCaption(formatUsdc(vault.totalCapitalUsdc))}</span>
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {marketDetailCopy.vaultCapacity.note}
            </div>
          </Card>

          {vault.premiumIndication ? (
            <Card className="flex-grow">
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {marketDetailCopy.premiumIndication.label}
              </div>
              <div className="pt-[12px]">
                {vault.premiumIndication.map((point, index) => (
                  <DetailRow
                    key={point.strikePercent}
                    label={marketDetailCopy.premiumIndication.strikeRowLabel(point.strikePercent)}
                    value={point.premiumPer10k.toFixed(2)}
                    divider={index < vault.premiumIndication!.length - 1}
                  />
                ))}
              </div>
              <div className="text-[13px] text-foreground-muted pt-[12px]">{marketDetailCopy.premiumIndication.note}</div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
