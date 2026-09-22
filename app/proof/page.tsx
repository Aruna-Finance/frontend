import { Header } from "@/components/aruna/Header";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { Table, TableRow } from "@/components/aruna/Table";
import { proofCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatUsdc } from "@/lib/format";
import { useWallet } from "@/hooks/useWallet";
import {
  mockProofContracts,
  mockProofDerivation,
  mockProofHiddenRowsCount,
  mockProofLastRow,
  mockProofSampleRows,
  mockProofSummary,
} from "@/lib/mock/proof";
import type { TableColumn } from "@/types/aruna";

const sampleColumns: TableColumn[] = [
  { key: "time", header: proofCopy.tableHeaders[0], width: "150px" },
  { key: "meanTick", header: proofCopy.tableHeaders[1], width: "130px" },
  { key: "deltaTick", header: proofCopy.tableHeaders[2], width: "130px" },
  { key: "squaredLogReturn", header: proofCopy.tableHeaders[3], width: "minmax(180px, 1fr)" },
];

export default function ProofPage() {
  const wallet = useWallet();

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/proof")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <h1 className="font-display text-[30px] lg:text-[34px] font-normal">
            {proofCopy.heading(mockProofSummary.cohortId)}
          </h1>
          <p className="text-[15px] text-foreground-secondary pt-[8px] max-w-[760px]">{proofCopy.subtitle}</p>
        </div>
        <div className="flex gap-[10px]">
          <button type="button" className="h-[44px] px-[16px] rounded-control border border-border text-foreground text-[13px]">
            {proofCopy.downloadCsvCta}
          </button>
          <button type="button" className="h-[44px] px-[16px] rounded-control border border-border text-foreground text-[13px]">
            {proofCopy.viewExplorerCta}
          </button>
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <Card className="flex-grow lg:min-w-0 flex flex-col" padding="sm">
          <div className="flex justify-between items-baseline flex-wrap gap-[8px] px-[4px] pt-[2px]">
            <span className="text-[16px] font-semibold">{proofCopy.sampleTableTitle}</span>
            <span className="font-mono text-[12px] text-foreground-muted">
              {proofCopy.sampleTableMeta(mockProofSummary.samplesRecorded, mockProofSummary.samplesTotal, mockProofSummary.gapCount)}
            </span>
          </div>

          <div className="pt-[16px]">
            <Table columns={sampleColumns}>
              {mockProofSampleRows.map((row) => (
                <TableRow
                  key={row.timeUtc}
                  columns={sampleColumns}
                  cells={[
                    <span key="t" className="font-mono text-[13px] text-foreground-secondary">
                      {row.timeUtc}
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
                    {proofCopy.hiddenRows(mockProofHiddenRowsCount)}
                  </span>,
                ]}
              />
              <TableRow
                columns={sampleColumns}
                cells={[
                  <span key="t" className="font-mono text-[13px] text-foreground-secondary">
                    {mockProofLastRow.timeUtc}
                  </span>,
                  <span key="m" className="font-mono text-[13px]">
                    {mockProofLastRow.meanTick.toLocaleString("en-US")}
                  </span>,
                  <span key="d" className="font-mono text-[13px] text-foreground-muted">
                    +{mockProofLastRow.deltaTick}
                  </span>,
                  <span key="s" className="font-mono text-[13px] text-foreground-muted">
                    {mockProofLastRow.squaredLogReturn}
                  </span>,
                ]}
              />
            </Table>
          </div>

          <div className="bg-surface-row rounded-control p-[20px] mt-[20px]">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {proofCopy.derivationLabel}
            </div>
            <div className="font-mono text-[13px] leading-[2] text-foreground-secondary pt-[10px]">
              <div>{mockProofDerivation.logReturnFormula}</div>
              <div>{mockProofDerivation.varianceFormula}</div>
              <div>
                Σ (log return)² = {mockProofDerivation.sumSquaredLogReturn} over {mockProofDerivation.sumSquaredLogReturnSteps} steps
              </div>
              <div className="text-foreground">
                annualized variance = {mockProofDerivation.annualizedVariance} → volatility = {mockProofDerivation.annualizedVolPercent}%
              </div>
            </div>
            <div className="text-[13px] text-foreground-muted pt-[12px] leading-[1.6]">{proofCopy.derivationFootnote}</div>
          </div>

          <div className="text-[13px] text-foreground-muted pt-[16px] px-[4px] mt-auto">{proofCopy.placeholderFootnote}</div>
        </Card>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card variant="raised">
            <span className="text-[11px] tracking-[0.07em] uppercase text-accent">{proofCopy.resultLabel}</span>
            <div className="flex items-baseline gap-[8px] pt-[10px]">
              <span className="font-mono text-[38px]">{mockProofSummary.finalRealizedVolPercent}%</span>
              <span className="text-[13px] text-foreground-muted">{proofCopy.unit}</span>
            </div>
            <div className="pt-[12px]">
              <DetailRow label={proofCopy.rows.policiesSettled} value={String(mockProofSummary.policiesSettled)} />
              <DetailRow label={proofCopy.rows.paidOut} value={String(mockProofSummary.policiesPaidOut)} />
              <DetailRow label={proofCopy.rows.totalClaims} value={formatUsdc(mockProofSummary.totalClaimsUsdc)} />
              <DetailRow label={proofCopy.rows.hitTheirCap} value={String(mockProofSummary.policiesHitCap)} divider={false} />
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">{proofCopy.contractsLabel}</div>
            <div className="flex flex-col gap-[12px] pt-[14px]">
              {mockProofContracts.map((contract) => (
                <div key={contract.name}>
                  <div className="text-[13px] text-foreground-secondary">{contract.name}</div>
                  <div className="font-mono text-[13px] text-accent pt-[3px]">{contract.address}</div>
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
