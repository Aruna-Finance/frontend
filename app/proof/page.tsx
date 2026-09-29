"use client";

import { Header } from "@/components/aruna/Header";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { Table, TableRow } from "@/components/aruna/Table";
import { proofCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSampleTime, formatUsdc } from "@/lib/format";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { USDC_DECIMALS, formatDuration } from "@/lib/contracts/units";
import { formatUnits } from "viem";
import { useVaults } from "@/hooks/useVaults";
import { useProof } from "@/hooks/useProof";
import type { TableColumn } from "@/types/aruna";

const sampleColumns: TableColumn[] = [
  { key: "time", header: proofCopy.tableHeaders[0], width: "150px" },
  { key: "meanTick", header: proofCopy.tableHeaders[1], width: "130px" },
  { key: "deltaTick", header: proofCopy.tableHeaders[2], width: "130px" },
  { key: "squaredLogReturn", header: proofCopy.tableHeaders[3], width: "minmax(180px, 1fr)" },
];

// Every real contract this page's numbers come from — no ABIs here, just the
// addresses so anyone can look them up on the explorer themselves.
function contractsList(poolAddress: string | undefined) {
  return [
    { name: "ArunaFactory", address: arunaAddresses.arunaFactory },
    { name: "VarianceAccumulator", address: arunaAddresses.varianceAccumulator },
    { name: "CoverVault", address: arunaAddresses.coverVault },
    { name: "IPremiumPricer", address: arunaAddresses.premiumPricer },
    { name: "IPositionValuer", address: arunaAddresses.positionValuer },
    { name: "Uniswap v3 pool", address: poolAddress ?? arunaAddresses.pool },
  ];
}

export default function ProofPage() {
  const { data: vaults } = useVaults();
  const vaultId = vaults?.[0]?.id;
  const { data: proof, isLoading, isError } = useProof(vaultId ?? "");

  const rows = proof?.rows ?? [];
  const headRows = rows.slice(0, 4);
  const lastRow = rows.length > 5 ? rows.at(-1) : undefined;
  const hiddenCount = rows.length > 5 ? rows.length - headRows.length - 1 : 0;
  const middleRows = hiddenCount > 0 ? [] : rows.slice(4);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/proof")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <h1 className="font-display text-[30px] lg:text-[34px] font-normal">
            {proofCopy.heading(proof?.currentCohortId ?? 0)}
          </h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[760px]">{proofCopy.subtitle}</p>
        </div>
        <div className="flex gap-[10px]">
          <button type="button" className="h-[44px] px-[16px] rounded-control border border-border text-foreground text-[13px] transition-all duration-300">
            {proofCopy.downloadCsvCta}
          </button>
          <a
            href={`https://sepolia.arbiscan.io/address/${proof?.accumulator ?? arunaAddresses.varianceAccumulator}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-[44px] px-[16px] rounded-control border border-border text-foreground text-[13px] transition-all duration-300 inline-flex items-center"
          >
            {proofCopy.viewExplorerCta}
          </a>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <Card className="flex-grow lg:min-w-0 flex flex-col" padding="sm">
          <div className="flex justify-between items-baseline flex-wrap gap-[8px] px-[4px] pt-[2px]">
            <span className="text-[16px] font-semibold">{proofCopy.sampleTableTitle}</span>
            <span className="font-mono text-[12px] text-foreground-muted">
              {isLoading
                ? "Loading…"
                : proof
                  ? proofCopy.sampleTableMeta(proof.samplesRecorded, proof.samplesTotal ?? proof.samplesRecorded, proof.gapCount ?? 0)
                  : "—"}
            </span>
          </div>

          {isError ? <p className="text-[13px] text-negative px-[4px] pt-[8px]">Could not load samples from the indexer.</p> : null}
          {!isLoading && rows.length === 0 ? (
            <p className="text-[13px] text-foreground-muted px-[4px] pt-[8px]">
              No samples recorded yet — nobody has called poke() on this pool&apos;s accumulator.
            </p>
          ) : null}

          <div className="pt-[16px]">
            <Table columns={sampleColumns}>
              {[...headRows, ...middleRows].map((row) => (
                <TableRow
                  key={row.timestamp}
                  columns={sampleColumns}
                  cells={[
                    <span key="t" className="font-mono text-[13px] text-foreground-secondary">
                      {formatSampleTime(row.timestamp)}
                    </span>,
                    <span key="m" className="font-mono text-[13px]">
                      {row.meanTick.toLocaleString("en-US")}
                    </span>,
                    <span key="d" className="font-mono text-[13px] text-foreground-muted">
                      {row.deltaTick === null ? "—" : row.deltaTick > 0 ? `+${row.deltaTick}` : row.deltaTick}
                    </span>,
                    <span key="s" className="font-mono text-[13px] text-foreground-muted">
                      {row.squaredLogReturn ?? "—"}
                    </span>,
                  ]}
                />
              ))}
              {hiddenCount > 0 ? (
                <TableRow
                  columns={sampleColumns}
                  cells={[
                    <span key="t" className="font-mono text-[13px] text-foreground-muted">
                      …
                    </span>,
                    <span key="m" className="font-mono text-[13px] text-foreground-muted">
                      …
                    </span>,
                    <span key="d" className="font-mono text-[13px] text-foreground-muted">
                      …
                    </span>,
                    <span key="s" className="font-mono text-[13px] text-foreground-muted">
                      {proofCopy.hiddenRows(hiddenCount)}
                    </span>,
                  ]}
                />
              ) : null}
              {lastRow ? (
                <TableRow
                  columns={sampleColumns}
                  cells={[
                    <span key="t" className="font-mono text-[13px] text-foreground-secondary">
                      {formatSampleTime(lastRow.timestamp)}
                    </span>,
                    <span key="m" className="font-mono text-[13px]">
                      {lastRow.meanTick.toLocaleString("en-US")}
                    </span>,
                    <span key="d" className="font-mono text-[13px] text-foreground-muted">
                      {lastRow.deltaTick !== null && lastRow.deltaTick > 0 ? `+${lastRow.deltaTick}` : lastRow.deltaTick}
                    </span>,
                    <span key="s" className="font-mono text-[13px] text-foreground-muted">
                      {lastRow.squaredLogReturn ?? "—"}
                    </span>,
                  ]}
                />
              ) : null}
            </Table>
          </div>

          {proof && rows.length > 0 ? (
            <div className="bg-surface-row rounded-control p-[20px] mt-[20px]">
              <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
                {proofCopy.derivationLabel}
              </div>
              <div className="font-mono text-[13px] leading-[2] text-foreground-secondary pt-[10px]">
                <div>log return per step = Δ tick × ln(1.0001)</div>
                <div>realized variance = Σ (log return)² × (periods per year ÷ steps)</div>
                <div>
                  Σ (log return)² = {formatUnits(proof.sumSquaredLogReturn, 18)} over {rows.length} steps
                </div>
                <div className="text-foreground">
                  annualized variance = {Number(formatUnits(proof.annualizedVariance, 18)).toFixed(4)} → volatility ={" "}
                  {proof.annualizedVolPercent}%
                </div>
              </div>
              <div className="text-[13px] text-foreground-muted pt-[12px] leading-[1.6]">{proofCopy.derivationFootnote}</div>
            </div>
          ) : null}
        </Card>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card variant="raised">
            <span className="text-[11px] tracking-[0.07em] uppercase text-accent">
              {proof?.finalized ? proofCopy.resultLabel : proofCopy.resultLabelInProgress}
            </span>
            <div className="flex items-baseline gap-[8px] pt-[10px]">
              <span className="font-mono text-[38px]">{proof ? proof.annualizedVolPercent : "—"}%</span>
              <span className="text-[13px] text-foreground-muted">{proofCopy.unit}</span>
            </div>
            {proof && !proof.finalized && rows.length > 0 ? (
              <div className="text-[12.5px] text-foreground-muted pt-[6px]">
                {proofCopy.inProgressCaption(rows.length, formatDuration(proof.sampleWindowSeconds))}
              </div>
            ) : null}
            <div className="pt-[12px]">
              <DetailRow label={proofCopy.rows.policiesSettled} value={String(proof?.settledCount ?? 0)} />
              <DetailRow label={proofCopy.rows.paidOut} value={String(proof?.paidCount ?? 0)} />
              <DetailRow
                label={proofCopy.rows.totalClaims}
                value={formatUsdc(proof ? Number(formatUnits(proof.claimsPaidRaw, USDC_DECIMALS)) : 0)}
              />
              <DetailRow label={proofCopy.rows.hitTheirCap} value={String(proof?.hitCapCount ?? 0)} divider={false} />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{proofCopy.contractsLabel}</div>
            <div className="flex flex-col gap-[12px] pt-[14px]">
              {contractsList(vaults?.[0]?.poolAddress ?? undefined).map((contract) => (
                <div key={contract.name}>
                  <div className="text-[13px] text-foreground-secondary">{contract.name}</div>
                  <div className="font-mono text-[12px] text-accent pt-[3px] break-all">{contract.address}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="flex-grow">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{proofCopy.whyTwap.label}</div>
            <div className="text-[14px] leading-[1.7] text-foreground-secondary pt-[10px]">{proofCopy.whyTwap.body}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
