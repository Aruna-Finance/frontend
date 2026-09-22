"use client";

import { useState } from "react";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { StatCard } from "@/components/aruna/StatCard";
import { StepIndicator } from "@/components/aruna/StepIndicator";
import { lpQuoteCopy, stepIndicatorCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsd, formatUsdc } from "@/lib/format";
import { useQuote } from "@/hooks/useQuote";
import { mockQuoteDefaults, mockQuoteStrikeTable } from "@/lib/mock/positions";
import type { Position, Vault } from "@/types/domain";

interface QuoteClientProps {
  positionId: string;
  position: Position;
  vault: Vault;
  cohortId: number;
  timeLeft: string;
  realizedVolPercent: number | null;
  walletAddress?: string;
}

const chartGeometry: Record<number, { strikeX: number; breakevenX: number; points: string }> = {
  30: { strikeX: 210, breakevenX: 270, points: "50,200 210,200 470,48 690,48" },
  35: { strikeX: 280, breakevenX: 342, points: "50,200 280,200 520,48 690,48" },
  45: { strikeX: 420, breakevenX: 480, points: "50,200 420,200 610,48 690,48" },
  55: { strikeX: 545, breakevenX: 600, points: "50,200 545,200 672,48 690,48" },
};

const strikeOptions = mockQuoteStrikeTable.map((row) => row.strikePercent);

export function QuoteClient({
  positionId,
  position,
  vault,
  cohortId,
  timeLeft,
  realizedVolPercent,
  walletAddress,
}: QuoteClientProps) {
  const [strikePercent, setStrikePercent] = useState(35);
  const defaultCoverage = Math.round(position.valueUsdc / 1000) * 1000;
  const [coverageInput, setCoverageInput] = useState(String(defaultCoverage));
  const [activeQuick, setActiveQuick] = useState<"25" | "50" | "max" | null>("max");

  const quote = useQuote({ vaultId: vault.id, strikePercent, coveredAmountUsdc: defaultCoverage }).data;
  const geometry = chartGeometry[strikePercent] ?? chartGeometry[35];

  function pickQuick(kind: "25" | "50" | "max") {
    const fraction = kind === "25" ? 0.25 : kind === "50" ? 0.5 : 1;
    setCoverageInput(String(Math.round((position.valueUsdc * fraction) / 100) * 100));
    setActiveQuick(kind);
  }

  const utilization = vault.totalCapitalUsdc > 0 ? vault.reservedCapacityUsdc / vault.totalCapitalUsdc : 0;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={walletAddress} />

      <div className="px-[24px] lg:px-[32px] pt-[26px]">
        <StepIndicator
          steps={[stepIndicatorCopy.position, stepIndicatorCopy.cover, stepIndicatorCopy.confirm]}
          currentIndex={1}
        />
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-[8px] pt-[12px]">
          <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{lpQuoteCopy.heading}</h1>
          <div className="font-mono text-[13px] text-foreground-muted">
            {lpQuoteCopy.headerMeta(
              positionId,
              `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`,
              formatUsd(position.valueUsdc),
              cohortId,
              timeLeft,
            )}
          </div>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card>
            <label htmlFor="coverage" className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpQuoteCopy.coverageLabel}
            </label>
            <div className="flex flex-wrap gap-[12px] items-center pt-[12px]">
              <input
                id="coverage"
                type="text"
                value={Number(coverageInput).toLocaleString("en-US")}
                onChange={(event) => {
                  setCoverageInput(event.target.value.replace(/[^0-9]/g, ""));
                  setActiveQuick(null);
                }}
                className="h-[56px] w-full sm:w-auto sm:flex-grow px-[16px] rounded-button border border-border bg-canvas text-foreground font-mono text-[24px]"
              />
              <span className="font-mono text-[15px] text-foreground-muted">{lpQuoteCopy.unit}</span>
              {(["25", "50", "max"] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => pickQuick(kind)}
                  className={`h-[44px] px-[14px] rounded-control text-[13px] ${
                    activeQuick === kind ? "border border-accent bg-accent-soft text-foreground" : "border border-border text-foreground"
                  }`}
                >
                  {kind === "25" ? lpQuoteCopy.quickPct25 : kind === "50" ? lpQuoteCopy.quickPct50 : lpQuoteCopy.quickMax}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
              <span className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {lpQuoteCopy.strikeSectionLabel}
              </span>
              <span className="text-[12px] text-foreground-muted">{lpQuoteCopy.strikeSectionHint}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px] pt-[14px]">
              {strikeOptions.map((option) => {
                const row = mockQuoteStrikeTable.find((entry) => entry.strikePercent === option)!;
                const active = option === strikePercent;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStrikePercent(option)}
                    className={`flex flex-col items-start p-[16px] rounded-control text-left ${
                      active ? "border-[1.5px] border-accent bg-accent-soft" : "border border-border bg-canvas"
                    }`}
                  >
                    <span className="font-mono text-[22px] text-foreground">{option}%</span>
                    <span className="text-[12px] text-foreground-muted pt-[6px]">{lpQuoteCopy.premiumWord}</span>
                    <span className="font-mono text-[17px] text-foreground pt-[2px]">
                      {row.premiumUsdc.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary pt-[16px]">
              {lpQuoteCopy.strikeFootnote(timeLeft)}
            </div>
          </Card>

          <Card className="flex flex-col flex-grow">
            <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
              <span className="text-[16px] font-semibold">{lpQuoteCopy.payoutChartTitle}</span>
              <span className="font-mono text-[12px] text-foreground-muted">
                {lpQuoteCopy.payoutRateLabel(formatUsdc(mockQuoteDefaults.payoutRateUsdc))}
              </span>
            </div>
            {quote ? (
              <svg
                viewBox="0 0 700 240"
                preserveAspectRatio="none"
                className="w-full h-[290px] pt-[12px]"
                aria-label="Payout curve versus realized volatility"
              >
                <line x1="50" y1="200" x2="690" y2="200" stroke="var(--chart-grid)" strokeWidth={1} />
                <line x1="50" y1="20" x2="50" y2="200" stroke="var(--chart-grid)" strokeWidth={1} />
                <line x1="50" y1="48" x2="690" y2="48" stroke="var(--chart-grid-strike)" strokeWidth={1} strokeDasharray="5 5" />
                <text x="560" y="40" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                  {lpQuoteCopy.capLabel(formatUsdc(quote.maxPayoutUsdc))}
                </text>
                <polyline points={geometry.points} fill="none" stroke="var(--color-accent)" strokeWidth={3} />
                <line
                  x1={geometry.strikeX}
                  y1="20"
                  x2={geometry.strikeX}
                  y2="208"
                  stroke="var(--color-foreground-muted)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text x={geometry.strikeX - 28} y="224" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                  {lpQuoteCopy.strikeLabel(`${strikePercent}%`)}
                </text>
                <line
                  x1={geometry.breakevenX}
                  y1="20"
                  x2={geometry.breakevenX}
                  y2="208"
                  stroke="var(--color-positive)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <text x={geometry.breakevenX - 40} y="18" fill="var(--color-positive)" fontSize={11} fontFamily="IBM Plex Mono">
                  {lpQuoteCopy.breakevenLabel(`${quote.breakevenPercent}%`)}
                </text>
                <text x="20" y="204" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                  {lpQuoteCopy.axisZero}
                </text>
                <text x="300" y="237" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                  {lpQuoteCopy.axisXLabel}
                </text>
              </svg>
            ) : null}
            {quote ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] border-t border-border pt-[16px] mt-auto">
                <StatCard label={lpQuoteCopy.statLabels.breakevenVol} value={`${quote.breakevenPercent}%`} />
                <StatCard label={lpQuoteCopy.statLabels.capReachedAt} value={`${quote.capReachedAtPercent}%`} />
                <StatCard
                  label={lpQuoteCopy.statLabels.ifVolStaysAt(realizedVolPercent ?? 0)}
                  value={quote.estPayoutIfVolHoldsUsdc >= 0 ? `+${quote.estPayoutIfVolHoldsUsdc.toFixed(2)}` : quote.estPayoutIfVolHoldsUsdc.toFixed(2)}
                  valueTone="positive"
                />
              </div>
            ) : null}
          </Card>
        </div>

        <div className="w-full lg:w-[400px] lg:shrink-0 flex flex-col gap-[18px]">
          {quote ? (
            <Card variant="raised" className="flex flex-col gap-[18px]">
              <span className="text-[11px] tracking-[0.07em] uppercase text-accent">{lpQuoteCopy.quoteCard.label}</span>
              <div>
                <div className="text-[13px] text-foreground-muted">{lpQuoteCopy.quoteCard.youPayNow}</div>
                <div className="flex items-baseline gap-[8px] pt-[4px]">
                  <span className="font-mono text-[40px]">{quote.premiumUsdc.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  <span className="text-[14px] text-foreground-muted">{lpQuoteCopy.quoteCard.unit}</span>
                </div>
              </div>
              <div className="bg-canvas rounded-control p-[16px] text-[15px] leading-[1.6] text-foreground">
                {lpQuoteCopy.quoteCard.disclaimer}
              </div>
              <div>
                <DetailRow label={lpQuoteCopy.quoteCard.rows.coveredAmount} value={`${formatUsdc(defaultCoverage)} USDC`} />
                <DetailRow label={lpQuoteCopy.quoteCard.rows.strike} value={`${strikePercent}% vol`} />
                <DetailRow
                  label={lpQuoteCopy.quoteCard.rows.maxPayout}
                  value={`${formatUsdc(quote.maxPayoutUsdc)} USDC`}
                  valueTone="positive"
                />
                <DetailRow
                  label={lpQuoteCopy.quoteCard.rows.fullCyclePrice}
                  value={`${formatUsdc(quote.fullCyclePremiumUsdc)} USDC`}
                  valueTone="neutral"
                />
                <DetailRow label={lpQuoteCopy.quoteCard.rows.chargedFor} value={`${timeLeft} of 7d`} divider={false} />
              </div>
              <Button href={`/protect/${positionId}/confirm?strike=${strikePercent}`}>{lpQuoteCopy.quoteCard.cta}</Button>
            </Card>
          ) : null}

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpQuoteCopy.capacityCheck.label}
            </div>
            <div className="flex items-center gap-[10px] pt-[12px]">
              <span className="w-[8px] h-[8px] rounded-full bg-positive inline-block" />
              <span className="text-[14.5px] text-foreground">{lpQuoteCopy.capacityCheck.statusOk}</span>
            </div>
            <div className="pt-[14px]">
              <ProgressBar value={utilization} />
            </div>
            <div className="flex justify-between font-mono text-[12px] text-foreground-muted pt-[8px]">
              <span>{lpQuoteCopy.capacityCheck.reservingCaption(formatUsdc(quote?.maxPayoutUsdc ?? 0))}</span>
              <span>{lpQuoteCopy.capacityCheck.freeCaption(formatUsdc(vault.freeCapacityUsdc))}</span>
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {lpQuoteCopy.capacityCheck.note}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
