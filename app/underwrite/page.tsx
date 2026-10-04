"use client";

import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { SectionHeader } from "@/components/aruna/SectionHeader";
import { AppFooter } from "@/components/aruna/AppFooter";
import { uwDepositCopy, uwVaultsCopy } from "@/lib/content/copy";
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

// One pool, one row, and the whole row is the link to that pool's deposit page.
// Four facts decide whether to open it: which cohort takes deposits and for how
// long, how the last completed cycle went, and how much capital the vault holds.
// No button or tooltip inside: both are interactive and cannot live inside a link.
// Deposits stay open through the settlement gap (they target the next cohort).
function PoolRow({ vault }: { vault: Vault }) {
  const { status, now } = useMarketStatus(vault.id);
  const last = useVaultYield(vault.id).data?.last ?? null;
  const closesIn = status ? formatDuration(status.deposit.closesAt - now) : null;
  const statLabel = "text-[11px] tracking-[0.07em] uppercase text-foreground-muted";

  return (
    <Link
      href={`/underwrite/${vault.id}/deposit`}
      className="group block text-foreground bg-pitch-raised border border-transparent hover:border-border transition-colors duration-200 p-[24px]"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-[20px] lg:gap-[28px]">
        <div className="flex items-center gap-[12px] lg:w-[290px] lg:shrink-0">
          {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
          <span className="text-[17px] font-semibold">
            {vault.poolLabel} · {vault.poolFeeTier}
          </span>
        </div>

        <dl className="grid grid-cols-2 lg:grid-cols-3 gap-x-[24px] gap-y-[18px] flex-grow min-w-0">
          <div>
            <dt className={statLabel}>{uwVaultsCopy.depositWindowLabel}</dt>
            <dd className="font-mono text-[16px] pt-[6px]">{status ? `Cohort ${status.deposit.cohortId}` : "–"}</dd>
            {closesIn ? <dd className="text-[12px] text-foreground-muted pt-[2px]">{uwDepositCopy.closesIn(closesIn)}</dd> : null}
          </div>
          <div>
            <dt className={statLabel}>{uwVaultsCopy.stats.lastCycle}</dt>
            <dd
              className={[
                "font-mono text-[16px] pt-[6px]",
                last && last.percent !== null ? (last.percent >= 0 ? "text-positive" : "text-negative") : "text-foreground-muted",
              ].join(" ")}
            >
              {last && last.percent !== null ? formatPercent(last.percent, { signed: true }) : uwVaultsCopy.stats.noCycleYet}
            </dd>
          </div>
          <div>
            <dt className={statLabel}>{uwVaultsCopy.stats.capital}</dt>
            <dd className="font-mono text-[16px] pt-[6px]">{formatCompact(vault.totalCapitalUsdc, "USDC")}</dd>
          </div>
        </dl>

        <span className="text-[14px] font-semibold text-accent lg:shrink-0 group-hover:translate-x-[2px] transition-transform duration-200">
          {uwVaultsCopy.rowCta} →
        </span>
      </div>
    </Link>
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
            <SectionHeader title={uwVaultsCopy.listTitle} />
            {listed.map((vault) => (
              <PoolRow key={vault.id} vault={vault} />
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
