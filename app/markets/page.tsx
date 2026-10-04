"use client";

import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Badge } from "@/components/aruna/Badge";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { Tooltip } from "@/components/aruna/Tooltip";
import { HowItWorks } from "@/components/aruna/HowItWorks";
import { AppFooter } from "@/components/aruna/AppFooter";
import { marketsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCompact, formatPercent } from "@/lib/format";
import { useVaults } from "@/hooks/useVaults";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { usePricingVol } from "@/hooks/usePricingVol";
import { useProof } from "@/hooks/useProof";
import { useVaultYield } from "@/hooks/useVaultYield";
import type { Vault } from "@/types/domain";

function FieldLabel({ label, hint }: { label: string; hint?: string }) {
  const text = <span className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{label}</span>;
  return hint ? <Tooltip content={hint}>{text}</Tooltip> : text;
}

// One market, one card on every width. Desktop lays the name, four facts and the
// two actions in a row; mobile stacks them, with the facts in a two-column grid.
function MarketRow({ vault }: { vault: Vault }) {
  const { headline } = useMarketStatus(vault.id);
  const pricingVol = usePricingVol(vault.id);
  const realized = useProof(vault.id).data?.annualizedVolPercent;
  const cycle = useVaultYield(vault.id).data?.last ?? null;

  if (!vault.hasVault) {
    return (
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px] opacity-70">
        <div className="flex items-center gap-[12px]">
          {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
          <div>
            <div className="text-[15px] font-semibold">{vault.poolLabel}</div>
            <div className="text-[12px] text-foreground-muted pt-[3px]">{marketsCopy.noVaultLabel}</div>
          </div>
        </div>
        <Button href="/underwrite" variant="ghost" size="sm">
          {marketsCopy.underwriteToLaunchCta}
        </Button>
      </Card>
    );
  }

  const utilization = vault.totalCapitalUsdc > 0 ? vault.reservedCapacityUsdc / vault.totalCapitalUsdc : 0;

  return (
    <Card className="flex flex-col lg:flex-row lg:items-center gap-[20px] lg:gap-[28px]">
      <div className="flex items-center gap-[12px] lg:w-[240px] lg:shrink-0">
        {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
        <div className="min-w-0">
          <Link href={`/markets/${vault.id}`} className="text-[16px] font-semibold text-foreground hover:text-accent transition-colors duration-200">
            {vault.poolLabel}
          </Link>
          <div className="text-[12px] text-foreground-muted pt-[3px]">
            {vault.poolFeeTier} · {vault.chainLabel}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[18px] flex-grow min-w-0">
        <div className="min-w-0">
          <dt>
            <FieldLabel label={marketsCopy.fieldLabels.status} />
          </dt>
          <dd className="pt-[6px] flex flex-col items-start gap-[6px]">
            {headline ? <Badge label={headline.tag} tone={headline.tone} /> : <span className="text-[13px] text-foreground-muted">–</span>}
            {headline ? <span className="text-[13px] text-foreground-secondary">{headline.text}</span> : null}
          </dd>
        </div>

        <div className="min-w-0">
          <dt>
            <FieldLabel label={marketsCopy.fieldLabels.pricingVol} hint={marketsCopy.hints.pricingVol} />
          </dt>
          <dd className="font-mono text-[16px] pt-[6px]">{formatPercent(pricingVol.volPercent)}</dd>
          <dt className="pt-[10px]">
            <FieldLabel label={marketsCopy.fieldLabels.realizedVol} hint={marketsCopy.hints.realizedVol} />
          </dt>
          <dd className="font-mono text-[16px] pt-[4px] text-foreground-secondary">{formatPercent(realized)}</dd>
        </div>

        <div className="min-w-0">
          <dt>
            <FieldLabel label={marketsCopy.fieldLabels.capacity} hint={marketsCopy.hints.capacity} />
          </dt>
          <dd className="font-mono text-[16px] pt-[6px] truncate">
            {formatCompact(vault.freeCapacityUsdc, "USDC")}
          </dd>
          <dd className="text-[12px] text-foreground-muted pt-[2px]">
            {marketsCopy.capacityOf(formatCompact(vault.totalCapitalUsdc, "USDC"))}
          </dd>
          <dd className="pt-[8px] max-w-[160px]">
            <ProgressBar value={utilization} thickness="thin" />
          </dd>
        </div>

        <div className="min-w-0">
          <dt>
            <FieldLabel label={marketsCopy.fieldLabels.lastCycle} hint={marketsCopy.hints.lastCycle} />
          </dt>
          {cycle && cycle.percent !== null ? (
            <>
              <dd className={["font-mono text-[16px] pt-[6px]", cycle.percent >= 0 ? "text-positive" : "text-negative"].join(" ")}>
                {formatPercent(cycle.percent, { signed: true })}
              </dd>
              <dd className="text-[12px] text-foreground-muted pt-[2px]">Cohort {cycle.cohortId}</dd>
            </>
          ) : (
            <dd className="text-[13px] text-foreground-muted pt-[6px]">{marketsCopy.noCompletedCycle}</dd>
          )}
        </div>
      </dl>

      <div className="flex gap-[10px] lg:shrink-0 lg:flex-col">
        <Button href="/protect" variant="primary" size="sm" className="flex-1 lg:flex-none lg:w-[180px]">
          {marketsCopy.protectCta}
        </Button>
        <Button href={`/underwrite/${vault.id}/deposit`} variant="ghost" size="sm" className="flex-1 lg:flex-none lg:w-[180px]">
          {marketsCopy.underwriteCta}
        </Button>
      </div>
    </Card>
  );
}

export default function MarketsPage() {
  const { data: vaults, isLoading, isError } = useVaults();

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/markets")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[32px]">
        <h1 className="font-display text-[36px] font-normal">{marketsCopy.heading}</h1>
        <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[700px]">{marketsCopy.subtitle}</p>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[28px] flex flex-col gap-[16px] flex-grow">
        {isError ? <p className="text-[14px] text-negative">Could not load markets from the indexer.</p> : null}
        {isLoading ? <p className="text-[14px] text-foreground-muted">Loading markets…</p> : null}
        {!isLoading && !isError && (vaults ?? []).length === 0 ? (
          <p className="text-[14px] text-foreground-muted">No market is listed yet.</p>
        ) : null}

        {(vaults ?? []).map((vault) => (
          <MarketRow key={vault.id} vault={vault} />
        ))}

        <div className="pt-[12px]">
          <HowItWorks
            heading={marketsCopy.howItWorks.heading}
            steps={marketsCopy.howItWorks.steps.map((step) => ({ ...step }))}
            storageKey={marketsCopy.howItWorksStorageKey}
          />
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
