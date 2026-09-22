import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StatCard } from "@/components/aruna/StatCard";
import { BarHistoryChart } from "@/components/aruna/charts/BarHistoryChart";
import { uwVaultsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDateInline, formatUsdc } from "@/lib/format";
import { useVaults } from "@/hooks/useVaults";
import { useCohorts } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import type { BarHistoryBar } from "@/types/aruna";

const FEATURED_VAULT_ID = "weth-usdc-005";

export default function UnderwritePage() {
  const vaults = (useVaults().data ?? []).filter((vault) => vault.cycleHistory.length > 0);
  const wallet = useWallet();
  const nextCohort = useCohorts(FEATURED_VAULT_ID).data?.find((item) => item.status === "FUNDING");
  const nextCohortDate = nextCohort ? formatCohortDateInline(nextCohort.startsAt) : "";

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[30px] flex flex-col md:flex-row justify-between md:items-end gap-[12px]">
        <div>
          <h1 className="font-display text-[36px] font-normal">{uwVaultsCopy.heading}</h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[700px]">{uwVaultsCopy.subtitle}</p>
        </div>
        <Button variant="ghost" href={`/underwrite/${FEATURED_VAULT_ID}/dashboard`}>
          {uwVaultsCopy.myUnderwritingCta}
        </Button>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col gap-[16px] flex-grow">
        {vaults.map((vault) => {
          const magnitudes = vault.cycleHistory.map((cycle) => cycle.netResultUsdc ?? cycle.netResultPercent ?? 0);
          const trueMaxAbs = Math.max(...magnitudes.map((value) => Math.abs(value)));
          const maxAbs = trueMaxAbs > 0 ? trueMaxAbs : 1;
          const bars: BarHistoryBar[] = vault.cycleHistory.map((cycle, index) => ({
            label: cycle.label,
            height: Math.abs(magnitudes[index]) / maxAbs,
            tone: magnitudes[index] >= 0 ? "positive" : "negative",
          }));
          const isFeatured = vault.id === FEATURED_VAULT_ID;
          const meta =
            vault.id === "wsteth-weth-001"
              ? `${vault.underwriterCount ?? 0} underwriters · ${uwVaultsCopy.correlatedPairMeta}`
              : uwVaultsCopy.vaultMeta(vault.underwriterCount ?? 0, nextCohortDate);

          return (
            <Card key={vault.id} className="flex flex-col lg:flex-row gap-[24px] lg:items-center">
              <div className="flex-grow lg:min-w-0">
                <div className="flex items-center gap-[12px] flex-wrap">
                  <span className="text-[19px] font-semibold">
                    {vault.poolLabel} {vault.poolFeeTier}
                  </span>
                  {vault.currentCohortId ? (
                    <Badge label={uwVaultsCopy.cohortOpenBadge(vault.currentCohortId + 1)} tone="accent" />
                  ) : null}
                </div>
                <div className="font-mono text-[12px] text-foreground-muted pt-[6px]">{meta}</div>
                <div className="flex gap-[10px] pt-[16px] items-end flex-wrap">
                  <BarHistoryChart bars={bars} ariaLabel={`Cycle history for ${vault.poolLabel}`} />
                  <span className="font-mono text-[12px] text-foreground-muted pb-[6px]">
                    {uwVaultsCopy.historyCaption(vault.cumulativeReturnPercent ?? 0, vault.lossCount ?? 0)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] sm:gap-[24px] w-full lg:w-[460px] lg:shrink-0">
                <StatCard label={uwVaultsCopy.statLabels.capital} value={formatUsdc(vault.totalCapitalUsdc)} />
                <StatCard label={uwVaultsCopy.statLabels.utilization} value={`${vault.utilizationPercent ?? 0}%`} />
                <StatCard
                  label={uwVaultsCopy.statLabels.premiumsCycle(vault.currentCohortId ?? 0)}
                  value={formatUsdc(vault.premiumsCurrentCycleUsdc ?? 0)}
                  valueTone="positive"
                />
              </div>

              <Button href={`/underwrite/${vault.id}/deposit`} variant={isFeatured ? "primary" : "ghost"} className="lg:shrink-0">
                {uwVaultsCopy.depositCta}
              </Button>
            </Card>
          );
        })}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] mt-auto pt-[8px]">
          {uwVaultsCopy.infoCards.map((card) => (
            <Card key={card.title}>
              <div className="text-[15px] font-semibold">{card.title}</div>
              <div className="text-[14px] leading-[1.65] text-foreground-secondary pt-[8px]">{card.body}</div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
