"use client";

import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { PairIcon } from "@/components/aruna/PairIcon";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { Table, TableRow } from "@/components/aruna/Table";
import { AppFooter } from "@/components/aruna/AppFooter";
import { marketsCopy, sharedNavCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDate, formatUsdc } from "@/lib/format";
import { daysElapsedSince, formatDuration, secondsUntil } from "@/lib/contracts/units";
import { useVaults, useVaultRealizedVol } from "@/hooks/useVaults";
import { useCohort, useCohorts } from "@/hooks/useCohort";
import type { TableColumn } from "@/types/aruna";
import type { Vault } from "@/types/domain";

const tableColumns: TableColumn[] = [
  { key: "pool", header: marketsCopy.tableHeaders[0], width: "minmax(220px, 1fr)" },
  { key: "cohort", header: marketsCopy.tableHeaders[1], width: "120px" },
  { key: "vol", header: marketsCopy.tableHeaders[2], width: "130px" },
  { key: "capital", header: marketsCopy.tableHeaders[3], width: "150px" },
  { key: "capacity", header: marketsCopy.tableHeaders[4], width: "190px" },
  { key: "policies", header: marketsCopy.tableHeaders[5], width: "110px" },
  { key: "action", header: marketsCopy.tableHeaders[6], width: "120px" },
];

// Whether this row gets the primary (vs. ghost) action button. There's only
// ever one vault worth highlighting today, so "the first one returned" is a
// fine stand-in for a real "featured vault" concept until there are several.
function VaultRow({ vault, isPrimary }: { vault: Vault; isPrimary: boolean }) {
  const realizedVol = useVaultRealizedVol(vault.id).data;
  const cohort = useCohort(vault.id).data;
  const dimmed = !vault.hasVault;
  const utilization = vault.hasVault && vault.totalCapitalUsdc > 0 ? vault.freeCapacityUsdc / vault.totalCapitalUsdc : 0;

  const poolCell = (
    <div className="flex items-center gap-[12px]">
      {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} /> : null}
      <div>
        <div className="text-[15px] font-semibold">{vault.poolLabel}</div>
        <div className="text-[12px] text-foreground-muted pt-[3px]">
          {vault.poolFeeTier} · {vault.chainLabel}
        </div>
      </div>
    </div>
  );

  const cohortCell = vault.currentCohortId ? (
    <span className="font-mono text-[14px]">
      #{vault.currentCohortId} · day {cohort ? daysElapsedSince(cohort.startsAt) : "—"}
    </span>
  ) : (
    <span className="font-mono text-[14px] text-foreground-muted">—</span>
  );

  const volCell = (
    <span
      className={`font-mono text-[14px] ${
        dimmed ? "text-foreground-muted" : realizedVol !== undefined && realizedVol >= 30 ? "text-accent" : "text-positive"
      }`}
    >
      {realizedVol !== undefined ? `${realizedVol}%` : "—"}
    </span>
  );

  const capitalCell = (
    <span className={`font-mono text-[14px] ${dimmed ? "text-foreground-muted" : ""}`}>
      {formatUsdc(vault.totalCapitalUsdc)}
    </span>
  );

  const capacityCell = vault.hasVault ? (
    <div>
      <div className="font-mono text-[14px]">{formatUsdc(vault.freeCapacityUsdc)}</div>
      <div className="pt-[6px] w-[140px]">
        <ProgressBar value={utilization} thickness="thin" tone={utilization < 0.1 ? "accent" : "positive"} />
      </div>
    </div>
  ) : (
    <span className="text-[13px] text-foreground-muted">{marketsCopy.noVaultYetLabel}</span>
  );

  const policiesCell = (
    <span className={`font-mono text-[14px] ${dimmed ? "text-foreground-muted" : ""}`}>{vault.policyCount}</span>
  );

  const actionCell = vault.hasVault ? (
    <Button href={`/markets/${vault.id}`} variant={isPrimary ? "primary" : "ghost"} size="sm">
      {marketsCopy.openCta}
    </Button>
  ) : (
    <Button href="/underwrite" variant="ghost" size="sm">
      {marketsCopy.seedCta}
    </Button>
  );

  return (
    <div className={dimmed ? "opacity-55" : undefined}>
      <TableRow
        columns={tableColumns}
        cells={[poolCell, cohortCell, volCell, capitalCell, capacityCell, policiesCell, actionCell]}
      />
    </div>
  );
}

export default function MarketsPage() {
  const { data: vaults, isLoading, isError } = useVaults();
  const featuredVaultId = vaults?.[0]?.id;
  const featuredCohort = useCohort(featuredVaultId ?? "").data;
  const nextCohort = useCohorts(featuredVaultId ?? "").data?.find((cohort) => cohort.status === "FUNDING");

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header
        variant="app"
        navLinks={withActiveNavLink("/markets")}
        extra={
          featuredCohort ? (
            <span className="inline-flex items-center h-[36px] px-[12px] border border-border font-mono text-[12px] text-foreground-secondary">
              {sharedNavCopy.cohortChip(featuredCohort.id, formatDuration(secondsUntil(featuredCohort.endsAt)))}
            </span>
          ) : null
        }
      />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[32px] flex flex-col md:flex-row justify-between md:items-end gap-[16px]">
        <div>
          <h1 className="font-display text-[36px] font-normal">{marketsCopy.heading}</h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px]">{marketsCopy.subtitle}</p>
        </div>
        <div className="flex gap-[8px]">
          <button
            type="button"
            className="h-[40px] px-[16px] rounded-control border border-accent bg-accent-soft text-foreground text-[13px] transition-all duration-300"
          >
            {marketsCopy.chainFilter.arbitrumOne}
          </button>
          <button
            type="button"
            className="h-[40px] px-[16px] rounded-control border border-border text-foreground-muted text-[13px] transition-all duration-300"
          >
            {marketsCopy.chainFilter.allChains}
          </button>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex-grow">
        {isError ? (
          <p className="text-[14px] text-negative pb-[16px]">Could not load markets from the indexer.</p>
        ) : null}
        {isLoading ? <p className="text-[14px] text-foreground-muted pb-[16px]">Loading markets…</p> : null}

        <Table columns={tableColumns}>
          {(vaults ?? []).map((vault) => (
            <VaultRow key={vault.id} vault={vault} isPrimary={vault.id === featuredVaultId} />
          ))}
        </Table>

        <div className="flex flex-col lg:flex-row gap-[20px] pt-[24px]">
          <Card className="flex-grow lg:min-w-0">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {marketsCopy.howCohortWorks.label}
            </div>
            <div className="text-[14.5px] leading-[1.65] text-foreground-secondary pt-[10px]">
              {marketsCopy.howCohortWorks.body}
            </div>
          </Card>
          {nextCohort ? (
            <Card className="w-full lg:w-[380px] lg:shrink-0">
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {marketsCopy.nextCohortOpens.label}
              </div>
              <div className="font-mono text-[22px] whitespace-nowrap pt-[8px]">
                {formatCohortDate(nextCohort.startsAt)}
              </div>
              <div className="text-[13px] text-foreground-muted pt-[6px]">
                {marketsCopy.nextCohortOpens.note(nextCohort.id)}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
