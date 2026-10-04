"use client";

import { resolveBaseline } from "@/lib/contracts/baseline";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useState } from "react";
import { formatUnits } from "viem";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StatCard } from "@/components/aruna/StatCard";
import { DetailRow } from "@/components/aruna/DetailRow";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { lpActiveCopy } from "@/lib/content/copy";
import { closeAreaPath, smoothLinePath } from "@/lib/chart-path";
import { usePoliciesByPosition } from "@/hooks/usePolicyByPosition";
import { useVaultByAddress } from "@/hooks/useVaults";
import { useProof } from "@/hooks/useProof";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useCancel } from "@/hooks/useCancel";
import { useCollectFees } from "@/hooks/useCollectFees";
import { isActivePolicy, mapPolicyToCover } from "@/lib/indexer/mapPolicy";
import { USDC_DECIMALS, formatDuration, secondsUntil, varianceWadToVolPercent } from "@/lib/contracts/units";
import { previewPayout, realizedVarianceAnnualized, strikeAccumulated } from "@/lib/contracts/variance";
import type { Address } from "viem";

// Chart geometry matches the original mockup's viewBox (0 0 700 300) so the
// grid lines/labels drawn around it don't need to move.
const CHART_LEFT = 44;
const CHART_RIGHT = 640;
const CHART_BOTTOM = 260;
const CHART_TOP = 20;

function scenarioTone(netUsdc: number) {
  if (netUsdc <= -100) return "text-negative";
  if (netUsdc < 0) return "text-foreground-secondary";
  return "text-positive";
}

export function ActiveClient({ positionId }: { positionId: string }) {
  // Right after buyCover the indexer can be a few blocks behind, so keep
  // polling until the Active policy shows up instead of 404ing.
  const [waitingForIndexer, setWaitingForIndexer] = useState(true);
  const { data: policies, isLoading: policiesLoading } = usePoliciesByPosition(positionId, {
    refetchInterval: waitingForIndexer ? 5_000 : false,
  });
  const raw = policies?.find(isActivePolicy);
  if (raw && waitingForIndexer) setWaitingForIndexer(false);
  const { data: vault, isLoading: vaultLoading } = useVaultByAddress(raw?.vault ?? "");
  const proof = useProof(raw?.vault ?? "").data;
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();
  const { cancel, isPending: cancelling } = useCancel();
  const { collectFees, isPending: collectingFees } = useCollectFees();

  if (policiesLoading || (raw && vaultLoading)) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading cover…</p>
      </div>
    );
  }
  if (!raw) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <div className="px-[24px] lg:px-[32px] pt-[32px] flex flex-col gap-[12px] text-[14px] text-foreground-muted">
          <p>No active cover found for position #{positionId} yet. A cover bought a moment ago appears here once the indexer catches up; this page keeps checking.</p>
          <Link href="/protect/covers" className="text-foreground underline">
            See all my covers
          </Link>
        </div>
      </div>
    );
  }
  if (!vault) {
    notFound();
  }

  const cover = mapPolicyToCover(raw);
  const strikeAnnualized = BigInt(raw.strikeAnnualized);
  const coveredSeconds = BigInt(raw.coveredSeconds);
  const proofSamples = proof?.rows ?? [];
  // v2 leaves the baseline null until settle; resolve it from the samples.
  const baseline = resolveBaseline(proofSamples, raw.purchasedAt);
  const startSumSq = baseline?.startSumSq ?? 0n;
  const varNotional = BigInt(raw.varNotional);
  const maxPayout = BigInt(raw.maxPayout);
  const premium = BigInt(raw.premium);
  const strikeAcc = strikeAccumulated(strikeAnnualized, coveredSeconds);

  const relevantSamples = baseline ? proofSamples.filter((row) => row.index >= baseline.startIndex) : [];
  const points = relevantSamples.map((row) => ({
    sumSqCovered: row.cumulativeSumSq > startSumSq ? row.cumulativeSumSq - startSumSq : 0n,
    timestamp: row.timestamp,
  }));
  const latest = points.at(-1);
  const currentSumSqCovered = latest?.sumSqCovered ?? 0n;

  // The mark extrapolates the variance accrued so far over the whole covered
  // window ("current pace"). Settling on the accrued figure alone would compare
  // a few minutes of variance against the strike for the full window and read
  // as a loss until the very end, however far above the strike realized vol is.
  const accruedSeconds = latest && points[0] ? BigInt(Math.max(0, latest.timestamp - points[0].timestamp)) : 0n;
  const paceSumSqCovered =
    accruedSeconds > 0n && accruedSeconds < coveredSeconds
      ? (currentSumSqCovered * coveredSeconds) / accruedSeconds
      : currentSumSqCovered;
  const currentPayout = previewPayout({ varNotional, maxPayout, sumSqCovered: paceSumSqCovered, strikeAnnualized, coveredSeconds });
  const currentPayoutUsdc = Number(formatUnits(currentPayout, USDC_DECIMALS));
  const premiumUsdc = Number(formatUnits(premium, USDC_DECIMALS));
  const netUsdc = currentPayoutUsdc - premiumUsdc;
  const inTheMoney = currentPayoutUsdc > 0;

  const boughtAtMs = new Date(Number(raw.boughtAt) * 1000).getTime();
  const nowMs = new Date().getTime();
  const elapsedSinceBought = Math.max(1, Math.floor((nowMs - boughtAtMs) / 1000));
  const currentAnnualizedVolPercent =
    Math.round(varianceWadToVolPercent(realizedVarianceAnnualized(currentSumSqCovered, BigInt(elapsedSinceBought))) * 10) / 10;
  const aboveStrikeByPts = Math.round((currentAnnualizedVolPercent - cover.strikePercent) * 10) / 10;
  const elapsedLabel = formatDuration((nowMs - boughtAtMs) / 1000);

  const samplesTakenForPolicy = relevantSamples.length;
  const samplesTotalForPolicy = proof?.sampleIntervalSeconds
    ? Math.max(1, Math.round(Number(coveredSeconds) / proof.sampleIntervalSeconds))
    : samplesTakenForPolicy;
  // Same rule as the accumulator's gapStats: a sample counts as missed only
  // when two consecutive samples are at least two intervals apart. Keepers
  // poke a few seconds late every time, so counting elapsed / interval would
  // report misses that never happened.
  const sampleInterval = proof?.sampleIntervalSeconds ?? 60;
  const missedSamples = relevantSamples.reduce((missed, row, i) => {
    if (i === 0) return missed;
    const gap = row.timestamp - relevantSamples[i - 1].timestamp;
    return gap >= 2 * sampleInterval ? missed + Math.floor(gap / sampleInterval) - 1 : missed;
  }, 0);

  // Four real, formula-derived reference points - not the mock's picked vol
  // levels, but the same shape: nothing owed, the point premium is covered,
  // where things stand today, and the payout cap.
  const breakevenExcess = varNotional > 0n ? (premium * 10n ** 18n) / varNotional : 0n;
  const capExcess = varNotional > 0n ? (maxPayout * 10n ** 18n) / varNotional : 0n;
  const scenarioPoints = [
    { label: "At strike", sumSqCovered: strikeAcc, isNow: false },
    { label: "Breakeven", sumSqCovered: strikeAcc + breakevenExcess, isNow: false },
    { label: "Now", sumSqCovered: currentSumSqCovered, isNow: true },
    { label: "At cap", sumSqCovered: strikeAcc + capExcess, isNow: false },
  ]
    .map((point) => {
      const payout = previewPayout({ varNotional, maxPayout, sumSqCovered: point.sumSqCovered, strikeAnnualized, coveredSeconds });
      const payoutUsdc = Number(formatUnits(payout, USDC_DECIMALS));
      return { ...point, netUsdc: payoutUsdc - premiumUsdc };
    })
    // "Now" can coincide with another point early on (e.g. still at/under
    // strike) - keep it, drop an exact duplicate elsewhere instead of
    // showing the same number twice.
    .filter((point, index, all) => point.isNow || !all.some((other, j) => j !== index && other.isNow && other.sumSqCovered === point.sumSqCovered));

  const maxDisplayValue = Math.max(
    ...[strikeAcc, strikeAcc + breakevenExcess, strikeAcc + capExcess, currentSumSqCovered].map((v) => Number(v)),
    1,
  ) * 1.1;
  const yFor = (value: bigint) => {
    const fraction = Math.min(1, Number(value) / maxDisplayValue);
    return CHART_BOTTOM - fraction * (CHART_BOTTOM - CHART_TOP);
  };
  const strikeY = yFor(strikeAcc);
  const breakevenY = yFor(strikeAcc + breakevenExcess);
  const capY = yFor(strikeAcc + capExcess);

  const chartPoints =
    points.length > 1
      ? points
          .map((point, i) => {
            const x = CHART_LEFT + (i / (points.length - 1)) * (CHART_RIGHT - CHART_LEFT);
            return `${x.toFixed(1)},${yFor(point.sumSqCovered).toFixed(1)}`;
          })
          .join(" ")
      : null;
  const realizedLinePath = chartPoints ? smoothLinePath(chartPoints) : null;

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const timeLeft = formatDuration(secondsUntil(cover.settledAt ?? new Date(boughtAtMs + Number(coveredSeconds) * 1000).toISOString()));

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <div className="flex items-center gap-[12px] flex-wrap">
            <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{lpActiveCopy.heading(cover.id)}</h1>
            {inTheMoney ? <Badge label={lpActiveCopy.badgeInTheMoney} tone="positive" /> : null}
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

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
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
              <line x1="44" y1={CHART_BOTTOM} x2="700" y2={CHART_BOTTOM} stroke="var(--chart-grid)" strokeWidth={1} />
              <line x1="44" y1={breakevenY} x2="700" y2={breakevenY} stroke="var(--chart-grid-breakeven)" strokeWidth={1} strokeDasharray="5 5" />
              <line x1="44" y1={strikeY} x2="700" y2={strikeY} stroke="var(--chart-grid-strike)" strokeWidth={1} strokeDasharray="5 5" />
              <text x="0" y={strikeY + 4} fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {cover.strikePercent}%
              </text>
              <text x="0" y={breakevenY + 4} fill="var(--color-positive)" fontSize={11} fontFamily="IBM Plex Mono">
                {cover.breakevenPercent}%
              </text>
              <text x="590" y={capY - 4} fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.payoutCapLabel}
              </text>
              <defs>
                <linearGradient id="active-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--color-accent)" stopOpacity={0.32} />
                  <stop offset="1" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              {realizedLinePath && chartPoints ? (
                <>
                  <path d={closeAreaPath(realizedLinePath, chartPoints, CHART_BOTTOM)} fill="url(#active-area-gradient)" stroke="none" />
                  <path
                    d={realizedLinePath}
                    fill="none"
                    stroke="var(--color-accent)"
                    strokeWidth={1}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle cx={CHART_RIGHT} cy={yFor(currentSumSqCovered)} r="4.5" fill="var(--color-accent)" />
                </>
              ) : (
                <text x="300" y="140" fill="var(--color-foreground-muted)" fontSize={12} fontFamily="IBM Plex Mono" textAnchor="middle">
                  Waiting for the first samples of this cover&apos;s window.
                </text>
              )}
              <line x1={CHART_RIGHT} y1="20" x2={CHART_RIGHT} y2="272" stroke="var(--chart-grid)" strokeWidth={1} />
              <text x={CHART_RIGHT - 40} y="288" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.axisNowLabel(elapsedLabel)}
              </text>
              <text x="52" y="288" fill="var(--color-foreground-muted)" fontSize={11} fontFamily="IBM Plex Mono">
                {lpActiveCopy.axisStartLabel}
              </text>
            </svg>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px] border-t border-border pt-[18px] mt-auto">
              <StatCard label={lpActiveCopy.statLabels.realizedVol} value={`${currentAnnualizedVolPercent}%`} valueTone="accent" />
              <StatCard label={lpActiveCopy.statLabels.aboveStrikeBy} value={`${aboveStrikeByPts >= 0 ? "+" : ""}${aboveStrikeByPts} pts`} />
              <StatCard label={lpActiveCopy.statLabels.samplesTaken} value={`${samplesTakenForPolicy} / ${samplesTotalForPolicy}`} />
              <StatCard label={lpActiveCopy.statLabels.missedSamples} value={String(missedSamples)} valueTone="positive" />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.scenarioLabel}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px] pt-[14px]">
              {scenarioPoints.map((entry) => (
                <div
                  key={entry.label}
                  className={`rounded-control p-[14px] ${
                    entry.isNow ? "border-[1.5px] border-accent bg-canvas" : "border border-border bg-canvas"
                  }`}
                >
                  <div className={`font-mono text-[13px] ${entry.isNow ? "text-accent" : "text-foreground-muted"}`}>
                    {entry.label}
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
              <span className={`font-mono text-[40px] ${netUsdc >= 0 ? "text-positive" : "text-negative"}`}>
                {netUsdc >= 0 ? "+" : ""}
                {formatUsdcDecimal(netUsdc)}
              </span>
              <span className="text-[14px] text-foreground-muted">{lpActiveCopy.markCard.unit}</span>
            </div>
            <div className="text-[14px] leading-[1.6] text-foreground-secondary">{lpActiveCopy.markCard.note}</div>
            <div className="border-t border-border pt-[16px]">
              <DetailRow label={lpActiveCopy.markCard.rows.gross} value={formatUsdcDecimal(currentPayoutUsdc)} />
              <DetailRow label={lpActiveCopy.markCard.rows.premiumPaid} value={formatUsdcDecimal(-premiumUsdc)} />
              <DetailRow
                label={lpActiveCopy.markCard.rows.maxLossRemaining}
                value={formatUsdcDecimal(premiumUsdc)}
                divider={false}
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-[14px]">
            <span className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.manageCover.label}
            </span>
            <div className="text-[14px] leading-[1.6] text-foreground-secondary">{lpActiveCopy.manageCover.note}</div>
            {!isConnected || !address ? (
              <Button type="button" variant="ghost" onClick={() => walletModal.open()}>
                Connect wallet
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={collectingFees || cancelling}
                  onClick={() =>
                    collectFees({ vault: vault.id as Address, policyId: BigInt(raw.policyId), recipient: address })
                  }
                >
                  {collectingFees ? "Collecting…" : lpActiveCopy.manageCover.collectFeesCta}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={collectingFees || cancelling}
                  onClick={() => cancel({ vault: vault.id as Address, policyId: BigInt(raw.policyId) })}
                >
                  {cancelling ? "Cancelling…" : lpActiveCopy.manageCover.cancelCta}
                </Button>
              </>
            )}
            <div className="text-[12.5px] leading-[1.6] text-negative">{lpActiveCopy.manageCover.cancelWarning}</div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpActiveCopy.oracleFeed.label}
            </div>
            <div className="pt-[10px]">
              {relevantSamples.length === 0 ? (
                <p className="text-[13px] text-foreground-muted py-[8px]">No samples recorded for this cover yet.</p>
              ) : (
                relevantSamples
                  .slice(-4)
                  .reverse()
                  .map((sample, index, all) => (
                    <div
                      key={sample.timestamp}
                      className={`flex justify-between py-[9px] ${index < all.length - 1 ? "border-b border-border-subtle" : ""}`}
                    >
                      <span className="font-mono text-[13px] text-foreground-secondary">
                        {new Date(sample.timestamp * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" })}{" "}
                        UTC
                      </span>
                      <span className="font-mono text-[13px]">
                        {lpActiveCopy.oracleFeed.tickPrefix} {formatUsdc(sample.meanTick)}
                      </span>
                    </div>
                  ))
              )}
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
