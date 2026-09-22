import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { ProgressBar } from "@/components/aruna/ProgressBar";
import { Table, TableRow } from "@/components/aruna/Table";
import { marketsCopy, sharedNavCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDate, formatUsdc } from "@/lib/format";
import { useVaults, useVaultRealizedVol } from "@/hooks/useVaults";
import { useCohort, useCohorts } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { mockCohortDaysElapsed, mockCohortTimeRemaining } from "@/lib/mock/cohorts";
import type { TableColumn } from "@/types/aruna";
import type { Vault } from "@/types/domain";

const FEATURED_VAULT_ID = "weth-usdc-005";

const tableColumns: TableColumn[] = [
  { key: "pool", header: marketsCopy.tableHeaders[0], width: "minmax(220px, 1fr)" },
  { key: "cohort", header: marketsCopy.tableHeaders[1], width: "120px" },
  { key: "vol", header: marketsCopy.tableHeaders[2], width: "130px" },
  { key: "capital", header: marketsCopy.tableHeaders[3], width: "150px" },
  { key: "capacity", header: marketsCopy.tableHeaders[4], width: "190px" },
  { key: "policies", header: marketsCopy.tableHeaders[5], width: "110px" },
  { key: "action", header: marketsCopy.tableHeaders[6], width: "120px" },
];

function VaultRow({ vault }: { vault: Vault }) {
  const realizedVol = useVaultRealizedVol(vault.id).data;
  const dimmed = !vault.hasVault;
  const utilization = vault.hasVault && vault.totalCapitalUsdc > 0 ? vault.freeCapacityUsdc / vault.totalCapitalUsdc : 0;

  const poolCell = (
    <div>
      <div className="text-[15px] font-semibold">{vault.poolLabel}</div>
      <div className="text-[12px] text-foreground-muted pt-[3px]">
        {vault.poolFeeTier} · {vault.chainLabel}
      </div>
    </div>
  );

  const cohortCell = vault.currentCohortId ? (
    <span className="font-mono text-[14px]">
      #{vault.currentCohortId} · day {mockCohortDaysElapsed[vault.currentCohortId] ?? "—"}
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
    <Button href={`/markets/${vault.id}`} variant={vault.id === FEATURED_VAULT_ID ? "primary" : "ghost"} size="sm">
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
  const vaults = useVaults().data ?? [];
  const featuredCohort = useCohort(FEATURED_VAULT_ID).data;
  const nextCohort = useCohorts(FEATURED_VAULT_ID)
    .data?.find((cohort) => cohort.status === "FUNDING");
  const wallet = useWallet();

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header
        variant="app"
        navLinks={withActiveNavLink("/markets")}
        walletAddress={wallet.address}
        extra={
          featuredCohort ? (
            <span className="inline-flex items-center h-[36px] px-[12px] rounded-control border border-border font-mono text-[12px] text-foreground-secondary">
              {sharedNavCopy.cohortChip(featuredCohort.id, mockCohortTimeRemaining[featuredCohort.id] ?? "")}
            </span>
          ) : null
        }
      />

      <div className="px-[24px] lg:px-[32px] pt-[32px] flex flex-col md:flex-row justify-between md:items-end gap-[16px]">
        <div>
          <h1 className="font-display text-[36px] font-normal">{marketsCopy.heading}</h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px]">{marketsCopy.subtitle}</p>
        </div>
        <div className="flex gap-[8px]">
          <button
            type="button"
            className="h-[40px] px-[16px] rounded-control border border-accent bg-accent-soft text-foreground text-[13px]"
          >
            {marketsCopy.chainFilter.arbitrumOne}
          </button>
          <button
            type="button"
            className="h-[40px] px-[16px] rounded-control border border-border text-foreground-muted text-[13px]"
          >
            {marketsCopy.chainFilter.allChains}
          </button>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex-grow">
        <Table columns={tableColumns}>
          {vaults.map((vault) => (
            <VaultRow key={vault.id} vault={vault} />
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
    </div>
  );
}
