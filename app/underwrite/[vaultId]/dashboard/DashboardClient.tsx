"use client";

import { notFound } from "next/navigation";
import { formatUnits } from "viem";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { StatCard } from "@/components/aruna/StatCard";
import { BarHistoryChart } from "@/components/aruna/charts/BarHistoryChart";
import { uwDashboardCopy, uwVaultsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { useVaultByAddress } from "@/hooks/useVaults";
import { useCohortDetail, type CohortDetailPolicy } from "@/hooks/useCohortDetail";
import { useProof } from "@/hooks/useProof";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { USDC_DECIMALS, daysElapsedSince, formatDuration, secondsUntil, volPercentToVarianceWad } from "@/lib/contracts/units";
import { previewPayout, strikeAccumulated } from "@/lib/contracts/variance";
import type { BarHistoryBar } from "@/types/aruna";

function usdc(value: bigint): number {
  return Number(formatUnits(value, USDC_DECIMALS));
}

// Total payout every policy in the cohort would owe if the whole cohort
// experienced one uniform annualized realized vol — used for the two
// hypothetical scenario rows (a real formula, not a mock-picked number).
function simulateVaultClaimsUsdc(policies: CohortDetailPolicy[], varianceWad: bigint): number {
  return policies.reduce((sum, policy) => {
    const sumSqCovered = strikeAccumulated(varianceWad, BigInt(policy.coveredSeconds));
    const payout = previewPayout({
      varNotional: policy.varNotional,
      maxPayout: policy.maxPayout,
      sumSqCovered,
      strikeAnnualized: policy.strikeAnnualized,
      coveredSeconds: BigInt(policy.coveredSeconds),
    });
    return sum + usdc(payout);
  }, 0);
}

function netTone(value: number) {
  return value >= 0 ? "text-positive" : "text-negative";
}

export function DashboardClient({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading: vaultLoading } = useVaultByAddress(vaultId);
  const activeCohortId = vault?.currentCohortId ?? undefined;
  const { data: cohort, isLoading: cohortLoading } = useCohortDetail(vaultId, activeCohortId);
  const { data: proof } = useProof(vaultId);
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();

  // Only wait on `cohortLoading` once `activeCohortId` is known — if the
  // vault never resolves one (no vault at all), that query stays disabled
  // (pending) forever, and waiting on it would spin indefinitely.
  if (vaultLoading || (activeCohortId !== undefined && cohortLoading)) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading dashboard…</p>
      </div>
    );
  }
  if (!vault || activeCohortId === undefined || !cohort) {
    notFound();
  }
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[16px] text-center">
          <p className="text-[15px] text-foreground-secondary">Connect the wallet you underwrote this vault with to see your position.</p>
          <Button type="button" onClick={() => walletModal.open()}>
            Connect wallet
          </Button>
        </div>
      </div>
    );
  }

  const position = cohort.positions.find((item) => item.wallet.toLowerCase() === address.toLowerCase());
  if (!position) {
    notFound();
  }

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const day = daysElapsedSince(cohort.startsAt) + 1;
  const totalDays = Math.max(1, Math.round(vault.tenorSeconds / 86_400));
  const timeLeft = formatDuration(secondsUntil(cohort.endsAt));
  const shareFraction = position.sharePercent / 100;

  const premiumsCollectedUsdc = usdc(cohort.premiumsCollectedRaw);
  const yourCapitalUsdc = usdc(position.principal);
  const yourPremiumsEarnedUsdc = shareFraction * premiumsCollectedUsdc;

  const hasPolicies = cohort.policyCount > 0 && cohort.strikeBuckets.length > 0;
  const proofRows = proof?.rows ?? [];

  const vaultClaimsAtPaceUsdc = hasPolicies
    ? cohort.policies.reduce((sum, policy) => {
        if (policy.settled) return sum + usdc(policy.payout ?? 0n);
        const relevant = proofRows.filter((row) => row.index >= policy.startIndex);
        const latest = relevant.at(-1);
        const sumSqCovered =
          latest && latest.cumulativeSumSq > policy.startSumSq ? latest.cumulativeSumSq - policy.startSumSq : 0n;
        const payout = previewPayout({
          varNotional: policy.varNotional,
          maxPayout: policy.maxPayout,
          sumSqCovered,
          strikeAnnualized: policy.strikeAnnualized,
          coveredSeconds: BigInt(policy.coveredSeconds),
        });
        return sum + usdc(payout);
      }, 0)
    : 0;
  const yourClaimsAtPaceUsdc = -(shareFraction * vaultClaimsAtPaceUsdc);
  const yourMarkIfEndsHereUsdc = yourPremiumsEarnedUsdc + yourClaimsAtPaceUsdc;

  const minStrike = hasPolicies
    ? cohort.strikeBuckets.reduce((min, b) => (b.strikeAnnualized < min.strikeAnnualized ? b : min))
    : null;
  const maxStrike = hasPolicies
    ? cohort.strikeBuckets.reduce((max, b) => (b.strikeAnnualized > max.strikeAnnualized ? b : max))
    : null;
  const currentVolPercent = proof?.annualizedVolPercent ?? 0;
  const nowVarianceWad = volPercentToVarianceWad(currentVolPercent) ?? 0n;

  const scenarioRows =
    hasPolicies && minStrike && maxStrike
      ? [
          { label: `At ${minStrike.strikePercent}%`, isCurrent: false, everyCapHit: false, vaultClaimsUsdc: 0 },
          {
            label: `Now · ${Math.round(currentVolPercent * 10) / 10}%`,
            isCurrent: true,
            everyCapHit: false,
            vaultClaimsUsdc: simulateVaultClaimsUsdc(cohort.policies, nowVarianceWad),
          },
          {
            label: `At ${maxStrike.strikePercent}%`,
            isCurrent: false,
            everyCapHit: false,
            vaultClaimsUsdc: simulateVaultClaimsUsdc(cohort.policies, maxStrike.strikeAnnualized),
          },
          {
            label: uwDashboardCopy.everyCapHitLabel,
            isCurrent: false,
            everyCapHit: true,
            vaultClaimsUsdc: usdc(cohort.totalMaxPayoutRaw),
          },
        ].map((row) => {
          const vaultNetUsdc = premiumsCollectedUsdc - row.vaultClaimsUsdc;
          return { ...row, vaultNetUsdc, yourNetUsdc: shareFraction * vaultNetUsdc };
        })
      : [];
  const maxClaims = Math.max(...scenarioRows.map((row) => row.vaultClaimsUsdc), 1);

  const totalCapacityWrittenUsdc = usdc(cohort.totalMaxPayoutRaw);

  const historyBars: BarHistoryBar[] = vault.cycleHistory.map((cycle) => {
    const magnitude = cycle.netResultUsdc ?? cycle.netResultPercent ?? 0;
    const maxAbs = Math.max(
      ...vault.cycleHistory.map((c) => Math.abs(c.netResultUsdc ?? c.netResultPercent ?? 0)),
      1,
    );
    return {
      label: cycle.label,
      height: Math.abs(magnitude) / maxAbs,
      tone: magnitude >= 0 ? "positive" : "negative",
    };
  });

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{uwDashboardCopy.heading(poolLabel)}</h1>
          <div className="font-mono text-[13px] text-foreground-muted pt-[8px]">
            {uwDashboardCopy.meta(activeCohortId, day, totalDays, Math.round(position.sharePercent * 100) / 100, formatUsdc(usdc(cohort.totalCapitalRaw)))}
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
            {uwDashboardCopy.settlesInLabel}
          </div>
          <div className="font-mono text-[30px] pt-[4px]">{timeLeft}</div>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[22px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <Card>
          <StatCard label={uwDashboardCopy.statLabels.capitalCommitted} value={formatUsdcDecimal(yourCapitalUsdc)} size="lg" />
        </Card>
        <Card>
          <StatCard
            label={uwDashboardCopy.statLabels.premiumsEarned}
            value={`+${formatUsdcDecimal(yourPremiumsEarnedUsdc)}`}
            valueTone="positive"
            size="lg"
          />
        </Card>
        <Card>
          <StatCard
            label={uwDashboardCopy.statLabels.claimsAtCurrentPace}
            value={formatUsdcDecimal(yourClaimsAtPaceUsdc)}
            valueTone={yourClaimsAtPaceUsdc < 0 ? "negative" : "neutral"}
            size="lg"
          />
        </Card>
        <Card variant="raised">
          <StatCard
            label={uwDashboardCopy.statLabels.markIfEndsHere}
            value={`${yourMarkIfEndsHereUsdc >= 0 ? "+" : ""}${formatUsdcDecimal(yourMarkIfEndsHereUsdc)}`}
            valueTone={yourMarkIfEndsHereUsdc >= 0 ? "positive" : "negative"}
            size="lg"
          />
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[20px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <Card className="flex-grow lg:min-w-0 flex flex-col">
          <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
            <span className="text-[16px] font-semibold">{uwDashboardCopy.scenarioTitle}</span>
            <span className="font-mono text-[12px] text-foreground-muted">
              {uwDashboardCopy.scenarioShare(Math.round(position.sharePercent * 100) / 100)}
            </span>
          </div>

          {scenarioRows.length === 0 ? (
            <p className="text-[14px] text-foreground-muted pt-[16px]">
              No policies have been written against this cohort yet — nothing to project.
            </p>
          ) : (
            <div className="overflow-x-auto pt-[16px]">
              <div className="min-w-[650px]">
                <div className="grid grid-cols-[130px_220px_150px_150px] gap-0 text-[11px] tracking-[0.07em] uppercase text-foreground-muted border-b border-border pb-[10px]">
                  {uwDashboardCopy.tableHeaders.map((header) => (
                    <div key={header}>{header}</div>
                  ))}
                </div>

                {scenarioRows.map((row) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-[130px_220px_150px_150px] items-center py-[13px] border-b border-border-subtle last:border-b-0 ${
                      row.isCurrent ? "bg-surface-row" : ""
                    }`}
                  >
                    <div className={`font-mono text-[15px] ${row.isCurrent ? "text-accent" : ""}`}>{row.label}</div>
                    <div className="flex items-center gap-[10px]">
                      <div className="h-[6px] rounded-progress-thin bg-border w-[140px]">
                        <div
                          className={`h-[6px] rounded-progress-thin ${row.everyCapHit ? "bg-[var(--chart-bar-critical)]" : "bg-accent"}`}
                          style={{ width: `${(row.vaultClaimsUsdc / maxClaims) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-[13px] text-foreground-muted">{formatUsdc(row.vaultClaimsUsdc)}</span>
                    </div>
                    <div className={`font-mono text-[15px] ${netTone(row.vaultNetUsdc)}`}>
                      {row.vaultNetUsdc >= 0 ? "+" : ""}
                      {formatUsdc(row.vaultNetUsdc)}
                    </div>
                    <div className={`font-mono text-[15px] ${netTone(row.yourNetUsdc)}`}>
                      {row.yourNetUsdc >= 0 ? "+" : ""}
                      {formatUsdcDecimal(row.yourNetUsdc)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[13px] text-foreground-muted pt-[16px] mt-auto">{uwDashboardCopy.scenarioFootnote}</div>
        </Card>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{uwDashboardCopy.bookLabel}</div>
            <div className="flex items-baseline gap-[8px] pt-[10px]">
              <span className="font-mono text-[28px]">{cohort.policyCount}</span>
              <span className="text-[13px] text-foreground-muted">
                {uwDashboardCopy.bookUnit(formatUsdc(totalCapacityWrittenUsdc))}
              </span>
            </div>
            <div className="pt-[14px]">
              {cohort.strikeBuckets.length === 0 ? (
                <p className="text-[13px] text-foreground-muted py-[8px]">No cover has been bought against this cohort yet.</p>
              ) : (
                cohort.strikeBuckets.map((row, index) => (
                  <div
                    key={row.strikeAnnualized.toString()}
                    className={`flex justify-between py-[10px] ${
                      index < cohort.strikeBuckets.length - 1 ? "border-b border-border-subtle" : ""
                    }`}
                  >
                    <span className="text-[14px] text-foreground-secondary">{uwDashboardCopy.strikeRowLabel(row.strikePercent)}</span>
                    <span className="font-mono text-[13px]">
                      {uwDashboardCopy.policiesCapacity(row.policyCount, formatUsdc(usdc(row.totalMaxPayout)))}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="flex-grow">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwDashboardCopy.historyLabel}
            </div>
            <div className="pt-[14px]">
              {historyBars.length === 0 ? (
                <p className="text-[13px] text-foreground-muted">No prior settled cycles for this vault yet.</p>
              ) : (
                <BarHistoryChart bars={historyBars} ariaLabel={`Cycle history for ${vault.poolLabel}`} />
              )}
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {vault.cumulativeReturnPercent !== null && vault.lossCount !== null
                ? uwVaultsCopy.historyCaption(Math.round(vault.cumulativeReturnPercent * 100) / 100, vault.lossCount)
                : "Not enough settled cycles yet to summarize."}
            </div>
          </Card>

          <Button variant="ghost" href={`/underwrite/${vaultId}/settlement`}>
            {uwDashboardCopy.seeLastSettlementCta}
          </Button>
        </div>
      </div>
    </div>
  );
}
