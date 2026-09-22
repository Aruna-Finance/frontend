import { notFound } from "next/navigation";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { StatCard } from "@/components/aruna/StatCard";
import { BarHistoryChart } from "@/components/aruna/charts/BarHistoryChart";
import { uwDashboardCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { useVault } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { mockCohortDaysElapsed, mockCohortTimeRemaining } from "@/lib/mock/cohorts";
import { mockUnderwriterPosition, mockVaultScenarioTable, mockVaultStrikeBreakdown } from "@/lib/mock/vaults";
import type { BarHistoryBar } from "@/types/aruna";

function scenarioLabel(entry: (typeof mockVaultScenarioTable)[number]) {
  if (entry.everyCapHit) return uwDashboardCopy.everyCapHitLabel;
  if (entry.isAtOrBelow) return `≤ ${entry.volFinishPercent!.toFixed(1)}%`;
  if (entry.isCurrent) return `${entry.volFinishPercent}% now`;
  return `${entry.volFinishPercent!.toFixed(1)}%`;
}

function netTone(value: number) {
  return value >= 0 ? "text-positive" : "text-negative";
}

export default async function UWDashboardPage(props: PageProps<"/underwrite/[vaultId]/dashboard">) {
  const { vaultId } = await props.params;

  if (vaultId !== mockUnderwriterPosition.vaultId) {
    notFound();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohort = useCohort(vaultId, mockUnderwriterPosition.cohortId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  if (!vault || !cohort) {
    notFound();
  }

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const day = mockCohortDaysElapsed[cohort.id] ?? 0;
  const timeLeft = mockCohortTimeRemaining[cohort.id] ?? "";
  const maxClaims = Math.max(...mockVaultScenarioTable.map((row) => row.vaultClaimsUsdc));

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

  const totalCapacityWritten = mockVaultStrikeBreakdown.reduce((sum, row) => sum + row.capacityWrittenUsdc, 0);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <h1 className="font-display text-[30px] lg:text-[34px] font-normal">{uwDashboardCopy.heading(poolLabel)}</h1>
          <div className="font-mono text-[13px] text-foreground-muted pt-[8px]">
            {uwDashboardCopy.meta(cohort.id, day, mockUnderwriterPosition.sharePercent, formatUsdc(vault.totalCapitalUsdc))}
          </div>
        </div>
        <div className="text-left md:text-right">
          <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
            {uwDashboardCopy.settlesInLabel}
          </div>
          <div className="font-mono text-[30px] pt-[4px]">{timeLeft}</div>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] pt-[22px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">
        <Card>
          <StatCard label={uwDashboardCopy.statLabels.capitalCommitted} value={formatUsdcDecimal(mockUnderwriterPosition.capitalCommittedUsdc)} size="lg" />
        </Card>
        <Card>
          <StatCard
            label={uwDashboardCopy.statLabels.premiumsEarned}
            value={`+${formatUsdcDecimal(mockUnderwriterPosition.premiumsEarnedUsdc)}`}
            valueTone="positive"
            size="lg"
          />
        </Card>
        <Card>
          <StatCard
            label={uwDashboardCopy.statLabels.claimsAtCurrentPace}
            value={formatUsdcDecimal(mockUnderwriterPosition.claimsAtCurrentPaceUsdc)}
            valueTone="negative"
            size="lg"
          />
        </Card>
        <Card variant="raised">
          <StatCard
            label={uwDashboardCopy.statLabels.markIfEndsHere}
            value={`+${formatUsdcDecimal(mockUnderwriterPosition.markIfEndsHereUsdc)}`}
            valueTone="positive"
            size="lg"
          />
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[20px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <Card className="flex-grow lg:min-w-0 flex flex-col">
          <div className="flex justify-between items-baseline flex-wrap gap-[8px]">
            <span className="text-[16px] font-semibold">{uwDashboardCopy.scenarioTitle}</span>
            <span className="font-mono text-[12px] text-foreground-muted">
              {uwDashboardCopy.scenarioShare(mockUnderwriterPosition.sharePercent)}
            </span>
          </div>

          <div className="overflow-x-auto pt-[16px]">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-[130px_220px_150px_150px] gap-0 text-[11px] tracking-[0.07em] uppercase text-foreground-muted border-b border-border pb-[10px]">
                {uwDashboardCopy.tableHeaders.map((header) => (
                  <div key={header}>{header}</div>
                ))}
              </div>

              {mockVaultScenarioTable.map((row) => (
                <div
                  key={scenarioLabel(row)}
                  className={`grid grid-cols-[130px_220px_150px_150px] items-center py-[13px] border-b border-border-subtle last:border-b-0 ${
                    row.isCurrent ? "bg-surface-row" : ""
                  }`}
                >
                  <div className={`font-mono text-[15px] ${row.isCurrent ? "text-accent" : ""}`}>{scenarioLabel(row)}</div>
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

          <div className="text-[13px] text-foreground-muted pt-[16px] mt-auto">{uwDashboardCopy.scenarioFootnote}</div>
        </Card>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{uwDashboardCopy.bookLabel}</div>
            <div className="flex items-baseline gap-[8px] pt-[10px]">
              <span className="font-mono text-[28px]">{vault.policyCount}</span>
              <span className="text-[13px] text-foreground-muted">
                {uwDashboardCopy.bookUnit(formatUsdc(totalCapacityWritten))}
              </span>
            </div>
            <div className="pt-[14px]">
              {mockVaultStrikeBreakdown.map((row, index) => (
                <div
                  key={row.strikePercent}
                  className={`flex justify-between py-[10px] ${
                    index < mockVaultStrikeBreakdown.length - 1 ? "border-b border-border-subtle" : ""
                  }`}
                >
                  <span className="text-[14px] text-foreground-secondary">{uwDashboardCopy.strikeRowLabel(row.strikePercent)}</span>
                  <span className="font-mono text-[13px]">
                    {uwDashboardCopy.policiesCapacity(row.policyCount, formatUsdc(row.capacityWrittenUsdc))}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex-grow">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwDashboardCopy.historyLabel}
            </div>
            <div className="pt-[14px]">
              <BarHistoryChart bars={historyBars} ariaLabel={`Cycle history for ${vault.poolLabel}`} />
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary border-t border-border mt-[16px] pt-[14px]">
              {uwDashboardCopy.historyFootnote}
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
