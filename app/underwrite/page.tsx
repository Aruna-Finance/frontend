"use client";

import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { Tooltip } from "@/components/aruna/Tooltip";
import { SectionHeader } from "@/components/aruna/SectionHeader";
import { CohortHistory } from "@/components/aruna/CohortHistory";
import { AppFooter } from "@/components/aruna/AppFooter";
import { marketDetailCopy, uwVaultsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCompact, formatPercent } from "@/lib/format";
import { formatDuration } from "@/lib/contracts/units";
import { useVaults } from "@/hooks/useVaults";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { useVaultYield } from "@/hooks/useVaultYield";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useUnderwriterPositionsByWallet } from "@/hooks/useUnderwriterPositions";
import type { Vault } from "@/types/domain";

// The deposit window of one vault: which cohort takes deposits, how long it has,
// how the vault has done recently, and the risks, all next to the button that
// commits capital. Deposits stay open through the settlement gap (they target n+1).
function VaultDepositCard({ vault }: { vault: Vault }) {
  const { status, now } = useMarketStatus(vault.id);
  const yieldSummary = useVaultYield(vault.id).data;
  const last = yieldSummary?.last ?? null;
  const closesIn = status && now ? formatDuration(status.deposit.closesAt - now) : "–";
  const utilization = vault.utilizationPercent !== null ? vault.utilizationPercent / 100 : 0;

  return (
    <Card className="flex flex-col gap-[24px]">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-[16px]">
        <div className="min-w-0">
          <div className="flex items-center gap-[12px]">
            {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
            <Link href={`/markets/${vault.id}`} className="text-[18px] font-semibold text-foreground hover:text-accent transition-colors duration-200">
              {vault.poolLabel} · {vault.poolFeeTier}
            </Link>
          </div>
          <div className="text-[13px] text-foreground-secondary pt-[10px]">
            {status ? uwVaultsCopy.depositWindow.open(status.deposit.cohortId) : null}
            {status ? <span className="text-foreground-muted"> · {uwVaultsCopy.depositWindow.closesIn(closesIn)}</span> : null}
          </div>
        </div>
        <Button href={`/underwrite/${vault.id}/deposit`} className="md:shrink-0 md:w-[200px]">
          {uwVaultsCopy.depositCta}
        </Button>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-3 gap-[20px]">
        <div>
          <dt className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
            <Tooltip content={marketDetailCopy.underwrite.lastCycleHint}>{uwVaultsCopy.stats.lastCycle}</Tooltip>
          </dt>
          <dd
            className={[
              "font-mono text-[20px] pt-[6px]",
              last && last.percent !== null ? (last.percent >= 0 ? "text-positive" : "text-negative") : "text-foreground-muted",
            ].join(" ")}
          >
            {last && last.percent !== null ? formatPercent(last.percent, { signed: true }) : uwVaultsCopy.stats.noCycleYet}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{uwVaultsCopy.stats.capital}</dt>
          <dd className="font-mono text-[20px] pt-[6px]">{formatCompact(vault.totalCapitalUsdc, "USDC")}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{uwVaultsCopy.stats.utilization}</dt>
          <dd className="font-mono text-[20px] pt-[6px]">{formatPercent(vault.utilizationPercent)}</dd>
          <dd className="pt-[8px] max-w-[180px]">
            <ProgressBar value={utilization} thickness="thin" />
          </dd>
        </div>
      </dl>

      <div className="border-t border-border pt-[18px]">
        <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{uwVaultsCopy.risks.label}</div>
        <ul className="flex flex-col gap-[8px] pt-[10px]">
          {uwVaultsCopy.risks.items.map((item) => (
            <li key={item} className="text-[13.5px] leading-[1.6] text-foreground-secondary">
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border pt-[18px]">
        <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted pb-[8px]">
          {uwVaultsCopy.positions.recentCohorts}
        </div>
        <CohortHistory
          rows={yieldSummary?.recent ?? []}
          labels={marketDetailCopy.history.columns}
          emptyText={marketDetailCopy.history.empty}
        />
      </div>
    </Card>
  );
}

function MyPositions() {
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();
  const { data: positions, isLoading, isError } = useUnderwriterPositionsByWallet(address);
  const vaults = useVaults().data ?? [];
  const labelFor = (vaultId: string) => vaults.find((v) => v.id === vaultId)?.poolLabel ?? vaultId;

  if (!isConnected) {
    return (
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-[16px]">
        <div className="text-[15px] font-semibold">{uwVaultsCopy.positions.connectTitle}</div>
        <Button variant="ghost" onClick={walletModal.open}>
          {uwVaultsCopy.positions.connectCta}
        </Button>
      </Card>
    );
  }
  if (isLoading) return <p className="text-[14px] text-foreground-muted">Loading positions…</p>;
  if (isError) return <p className="text-[14px] text-negative">Could not load your positions from the indexer.</p>;
  if (!positions || positions.length === 0) {
    return (
      <Card className="flex flex-col gap-[8px]">
        <div className="text-[15px] font-semibold">{uwVaultsCopy.positions.emptyTitle}</div>
        <p className="text-[14px] leading-[1.6] text-foreground-secondary">{uwVaultsCopy.positions.emptyBody}</p>
      </Card>
    );
  }

  return (
    <Card padding="sm" className="flex flex-col">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-[12px] px-[4px] pb-[10px] text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
        <span>{uwVaultsCopy.positions.columns.market}</span>
        <span>{uwVaultsCopy.positions.columns.cohort}</span>
        <span className="text-right">{uwVaultsCopy.positions.columns.capital}</span>
        <span className="text-right">{uwVaultsCopy.positions.columns.share}</span>
        <span />
      </div>
      {positions.map((position) => (
        <div
          key={`${position.vaultId}-${position.cohortId}`}
          className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-[12px] px-[4px] py-[12px] border-t border-border items-center font-mono text-[13px]"
        >
          <span className="font-sans text-[14px] truncate">{labelFor(position.vaultId)}</span>
          <span>Cohort {position.cohortId}</span>
          <span className="text-right">{formatCompact(position.capitalCommittedUsdc, "USDC")}</span>
          <span className="text-right">{formatPercent(position.sharePercent)}</span>
          <Link href={`/underwrite/${position.vaultId}/dashboard`} className="text-accent hover:underline justify-self-end">
            {uwVaultsCopy.positions.viewCta}
          </Link>
        </div>
      ))}
    </Card>
  );
}

export default function UnderwritePage() {
  const { data: vaults, isLoading, isError } = useVaults();
  const listed = (vaults ?? []).filter((vault) => vault.hasVault);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[30px] flex flex-col md:flex-row justify-between md:items-end gap-[16px]">
        <div>
          <h1 className="font-display text-[36px] font-normal">{uwVaultsCopy.heading}</h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[720px]">{uwVaultsCopy.subtitle}</p>
        </div>
        <Button variant="ghost" href="/underwrite/positions">
          {uwVaultsCopy.myUnderwritingCta}
        </Button>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[28px] flex flex-col gap-[40px] flex-grow">
        {isError ? <p className="text-[14px] text-negative">{uwVaultsCopy.loadError}</p> : null}
        {isLoading ? <p className="text-[14px] text-foreground-muted">{uwVaultsCopy.loading}</p> : null}
        {!isLoading && !isError && listed.length === 0 ? (
          <p className="text-[14px] text-foreground-muted">{uwVaultsCopy.noMarkets}</p>
        ) : null}

        {listed.length > 0 ? (
          <section className="flex flex-col gap-[16px]">
            <SectionHeader title={uwVaultsCopy.depositWindow.sectionTitle} />
            {listed.map((vault) => (
              <VaultDepositCard key={vault.id} vault={vault} />
            ))}
          </section>
        ) : null}

        <section className="flex flex-col gap-[16px]">
          <SectionHeader title={uwVaultsCopy.positions.heading} />
          <MyPositions />
        </section>
      </div>
      <AppFooter />
    </div>
  );
}
