"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { formatUnits } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { DetailRow } from "@/components/aruna/DetailRow";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { StatCard } from "@/components/aruna/StatCard";
import { StepIndicator } from "@/components/aruna/StepIndicator";
import { lpQuoteCopy, stepIndicatorCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatTokenNumber, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { closeAreaPath, roundedCornerPath } from "@/lib/chart-path";
import { arunaMarkets } from "@/lib/contracts/addresses";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { derivePoolInfo } from "@/lib/contracts/pool-label";
import { USDC_DECIMALS, formatDuration, secondsUntil } from "@/lib/contracts/units";
import { usePosition } from "@/hooks/usePosition";
import { useQuote } from "@/hooks/useQuote";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { STRIKE_OPTIONS } from "@/lib/contracts/strikes";


const COHORT_STATUS_NAMES = ["FUNDING", "ACTIVE", "SETTLING", "SETTLED"] as const;

export function QuoteClient({ positionId }: { positionId: string }) {
  const [strikePercent, setStrikePercent] = useState<number>(35);
  const market = arunaMarkets[0];
  const pool = derivePoolInfo(market.pool);
  const poolLabel = `${pool.poolLabel} ${pool.poolFeeTier}`;

  const { data: position, owner, isLoading: positionLoading } = usePosition(positionId);
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();

  const vaultReads = useReadContracts({
    contracts: [
      { address: market.vault, abi: coverVaultAbi, functionName: "currentCohortId" as const },
      { address: market.vault, abi: coverVaultAbi, functionName: "sampleInterval" as const },
      { address: market.vault, abi: coverVaultAbi, functionName: "maxUtilizationBps" as const },
    ],
  });
  const currentCohortId = vaultReads.data?.[0]?.result as number | undefined;
  const sampleIntervalSeconds = vaultReads.data?.[1]?.result as number | undefined;
  const maxUtilizationBps = vaultReads.data?.[2]?.result as number | undefined;

  const cohortQuery = useReadContract({
    address: market.vault,
    abi: coverVaultAbi,
    functionName: "cohort",
    args: currentCohortId !== undefined ? [currentCohortId] : undefined,
    query: { enabled: currentCohortId !== undefined },
  });
  const cohort = cohortQuery.data;

  let positionTokenId: bigint | undefined;
  try {
    positionTokenId = BigInt(positionId);
  } catch {
    positionTokenId = undefined;
  }

  const quote = useQuote({
    vault: market.vault,
    cohortId: currentCohortId ?? 0,
    positionTokenId: positionTokenId ?? 0n,
    strikePercent,
  });

  if (positionLoading || vaultReads.isLoading || cohortQuery.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading position…</p>
      </div>
    );
  }
  if (!position || !position.hasVaultForPool || currentCohortId === undefined || !cohort) {
    notFound();
  }
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[16px] text-center">
          <p className="text-[15px] text-foreground-secondary">Connect the wallet that owns position #{positionId} to get a quote.</p>
          <Button type="button" onClick={() => walletModal.open()}>
            Connect wallet
          </Button>
        </div>
      </div>
    );
  }
  if (!owner || owner.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[12px] text-center">
          <p className="text-[15px] text-foreground-secondary">
            Position #{positionId} isn&apos;t owned by the connected wallet.
          </p>
          <Button variant="ghost" href="/protect">
            ← Pick a different position
          </Button>
        </div>
      </div>
    );
  }

  const statusName = COHORT_STATUS_NAMES[cohort.status] ?? "UNKNOWN";
  const isSellable = statusName === "ACTIVE";
  const timeLeft = formatDuration(secondsUntil(new Date(Number(cohort.endsAt) * 1000).toISOString()));
  const sampleIntervalLabel = sampleIntervalSeconds ? formatDuration(sampleIntervalSeconds) : "sample";

  const availableCapacity = maxUtilizationBps !== undefined ? (cohort.totalCapital * BigInt(maxUtilizationBps)) / 10_000n : 0n;
  const freeCapacityUsdc = Number(formatUnits(availableCapacity > cohort.reserved ? availableCapacity - cohort.reserved : 0n, USDC_DECIMALS));
  const totalCapacityUsdc = Number(formatUnits(availableCapacity, USDC_DECIMALS));
  const utilization = totalCapacityUsdc > 0 ? 1 - freeCapacityUsdc / totalCapacityUsdc : 0;
  const hasCapacity = quote.data ? quote.data.maxPayoutUsdc <= freeCapacityUsdc : true;

  // Flat at 0 to the strike, a straight ramp to the cap, flat at the cap
  // after - the real shape of min(maxPayout, varNotional × excess / WAD),
  // scaled dynamically from this quote's own strike/cap instead of a
  // hardcoded per-strike lookup table.
  const axisMax = quote.data ? Math.max(quote.data.capReachedAtPercent * 1.08, strikePercent * 1.2) : strikePercent * 2;
  const xFor = (percent: number) => 50 + Math.min(1, percent / axisMax) * (690 - 50);
  const strikeX = xFor(strikePercent);
  const breakevenX = quote.data ? xFor(quote.data.breakevenPercent) : strikeX;
  const capX = quote.data ? xFor(quote.data.capReachedAtPercent) : 690;
  const payoutPoints = `50,200 ${strikeX.toFixed(1)},200 ${capX.toFixed(1)},48 690,48`;
  const payoutPath = roundedCornerPath(payoutPoints, 18);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[26px]">
        <StepIndicator
          steps={[stepIndicatorCopy.position, stepIndicatorCopy.cover, stepIndicatorCopy.confirm]}
          currentIndex={1}
        />
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-[8px] pt-[12px]">
          <div className="flex items-center gap-[12px] flex-wrap">
            {position.token0Symbol && position.token1Symbol ? (
              <PairIcon symbol0={position.token0Symbol} symbol1={position.token1Symbol} />
            ) : null}
            <h1 className="font-display text-[32px] lg:text-[36px] font-normal">{lpQuoteCopy.heading}</h1>
          </div>
          <div className="font-mono text-[13px] text-foreground-muted">
            {lpQuoteCopy.headerMeta(positionId, poolLabel, currentCohortId, timeLeft)}
          </div>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          {!isSellable ? (
            <Card variant="danger">
              <p className="text-[14px] text-negative-soft-foreground">
                {lpQuoteCopy.notActiveNote} (cohort {currentCohortId} is {statusName}.)
              </p>
            </Card>
          ) : null}

          <Card>
            <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
              <span className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {lpQuoteCopy.strikeSectionLabel}
              </span>
              <span className="text-[12px] text-foreground-muted">{lpQuoteCopy.strikeSectionHint}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px] pt-[14px]">
              {STRIKE_OPTIONS.map((option) => {
                const active = option === strikePercent;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStrikePercent(option)}
                    className={`flex flex-col items-start p-[16px] rounded-control text-left transition-all duration-300 ${
                      active ? "border-[1.5px] border-accent bg-accent-soft" : "border border-border bg-canvas"
                    }`}
                  >
                    <span className="font-mono text-[22px] text-foreground">{option}%</span>
                    <span className="text-[12px] text-foreground-muted pt-[6px]">{lpQuoteCopy.premiumWord}</span>
                    <span className="font-mono text-[17px] text-foreground pt-[2px]">
                      {active && quote.data ? formatUsdcDecimal(quote.data.premiumUsdc) : "-"}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary pt-[16px]">
              {lpQuoteCopy.strikeFootnote(sampleIntervalLabel, timeLeft)}
            </div>
          </Card>

          <Card className="flex flex-col flex-grow">
            <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
              <span className="text-[16px] font-semibold">{lpQuoteCopy.payoutChartTitle}</span>
              {quote.data ? (
                <span className="font-mono text-[12px] text-foreground-muted">
                  {lpQuoteCopy.payoutRateLabel(formatUsdc(Number(formatUnits(quote.data.varNotionalRaw, USDC_DECIMALS))))}
                </span>
              ) : null}
            </div>
            {quote.isLoading ? (
              <p className="text-[13px] text-foreground-muted pt-[16px]">Loading quote…</p>
            ) : quote.errorMessage ? (
              <p className="text-[13px] text-negative pt-[16px]">{quote.errorMessage}</p>
            ) : quote.data ? (
              <>
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
                    {lpQuoteCopy.capLabel(formatUsdc(quote.data.maxPayoutUsdc))}
                  </text>
                  <defs>
                    <linearGradient id="quote-area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.32} />
                      <stop offset="1" stopColor="var(--color-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <path d={closeAreaPath(payoutPath, payoutPoints, 200)} fill="url(#quote-area-gradient)" stroke="none" />
                  <path
                    d={payoutPath}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <line x1={strikeX} y1="20" x2={strikeX} y2="208" stroke="var(--color-foreground-muted)" strokeWidth={1} strokeDasharray="3 4" />
                  <text x={strikeX - 28} y="224" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                    {lpQuoteCopy.strikeLabel(`${strikePercent}%`)}
                  </text>
                  <line x1={breakevenX} y1="20" x2={breakevenX} y2="208" stroke="var(--color-positive)" strokeWidth={1} strokeDasharray="3 4" />
                  <text x={breakevenX - 40} y="18" fill="var(--color-positive)" fontSize={11} fontFamily="IBM Plex Mono">
                    {lpQuoteCopy.breakevenLabel(`${quote.data.breakevenPercent}%`)}
                  </text>
                  <text x="20" y="204" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                    {lpQuoteCopy.axisZero}
                  </text>
                  <text x="300" y="237" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                    {lpQuoteCopy.axisXLabel}
                  </text>
                </svg>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] border-t border-border pt-[16px] mt-auto">
                  <StatCard label={lpQuoteCopy.statLabels.breakevenVol} value={`${quote.data.breakevenPercent}%`} />
                  <StatCard label={lpQuoteCopy.statLabels.capReachedAt} value={`${quote.data.capReachedAtPercent}%`} />
                </div>
              </>
            ) : null}
          </Card>
        </div>

        <div className="w-full lg:w-[400px] lg:shrink-0 flex flex-col gap-[18px]">
          {quote.data ? (
            <Card variant="raised" className="flex flex-col gap-[18px]">
              <span className="text-[11px] tracking-[0.07em] uppercase text-accent">{lpQuoteCopy.quoteCard.label}</span>
              <div>
                <div className="text-[13px] text-foreground-muted">{lpQuoteCopy.quoteCard.youPayNow}</div>
                <div className="flex items-baseline gap-[8px] pt-[4px]">
                  <span className="font-mono text-[40px]">{formatUsdcDecimal(quote.data.premiumUsdc)}</span>
                  <span className="text-[14px] text-foreground-muted">{lpQuoteCopy.quoteCard.unit}</span>
                </div>
              </div>
              <div className="bg-canvas rounded-control p-[16px] text-[15px] leading-[1.6] text-foreground">
                {lpQuoteCopy.quoteCard.disclaimer}
              </div>
              <div>
                <DetailRow label={lpQuoteCopy.quoteCard.rows.strike} value={`${strikePercent}% vol`} />
                <DetailRow
                  label={lpQuoteCopy.quoteCard.rows.maxPayout}
                  value={`${formatUsdc(quote.data.maxPayoutUsdc)} USDC`}
                  valueTone="positive"
                />
                <DetailRow label={lpQuoteCopy.quoteCard.rows.chargedFor} value={timeLeft} divider={false} />
              </div>
              <Button
                href={isSellable && hasCapacity ? `/protect/${positionId}/confirm?strike=${strikePercent}` : undefined}
                disabled={!isSellable || !hasCapacity}
              >
                {lpQuoteCopy.quoteCard.cta}
              </Button>
            </Card>
          ) : null}

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpQuoteCopy.capacityCheck.label}
            </div>
            <div className="flex items-center gap-[10px] pt-[12px]">
              <span className={`w-[8px] h-[8px] rounded-full inline-block ${hasCapacity ? "bg-positive" : "bg-negative"}`} />
              <span className="text-[14.5px] text-foreground">
                {hasCapacity ? lpQuoteCopy.capacityCheck.statusOk : lpQuoteCopy.capacityCheck.statusNotEnough}
              </span>
            </div>
            <div className="pt-[14px]">
              <ProgressBar value={utilization} />
            </div>
            <div className="flex justify-between font-mono text-[12px] text-foreground-muted pt-[8px]">
              <span>{lpQuoteCopy.capacityCheck.reservingCaption(formatUsdc(quote.data?.maxPayoutUsdc ?? 0))}</span>
              <span>{lpQuoteCopy.capacityCheck.freeCaption(formatUsdc(freeCapacityUsdc))}</span>
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {lpQuoteCopy.capacityCheck.note}
            </div>
          </Card>

          {position.token0Amount !== null && position.token1Amount !== null ? (
            <Card>
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">THIS POSITION</div>
              <div className="pt-[10px] font-mono text-[14px]">
                {formatTokenNumber(position.token0Amount)} {position.token0Symbol}
              </div>
              <div className="font-mono text-[14px]">
                {formatTokenNumber(position.token1Amount)} {position.token1Symbol}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
