import { notFound } from "next/navigation";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StatCard } from "@/components/aruna/StatCard";
import { DetailRow } from "@/components/aruna/DetailRow";
import { Table, TableRow } from "@/components/aruna/Table";
import { uwSettlementCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { useVault } from "@/hooks/useVaults";
import { useCohorts } from "@/hooks/useCohort";
import { useWallet } from "@/hooks/useWallet";
import { mockLastSettlement } from "@/lib/mock/vaults";
import type { TableColumn } from "@/types/aruna";

const claimsSplitColumns: TableColumn[] = [
  { key: "underwriter", header: uwSettlementCopy.claimsSplitHeaders[0], width: "minmax(180px, 1fr)" },
  { key: "share", header: uwSettlementCopy.claimsSplitHeaders[1], width: "140px" },
  { key: "premiums", header: uwSettlementCopy.claimsSplitHeaders[2], width: "140px" },
  { key: "claims", header: uwSettlementCopy.claimsSplitHeaders[3], width: "140px" },
];

export default async function UWSettlementPage(props: PageProps<"/underwrite/[vaultId]/settlement">) {
  const { vaultId } = await props.params;

  if (vaultId !== mockLastSettlement.vaultId) {
    notFound();
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const vault = useVault(vaultId).data;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const cohorts = useCohorts(vaultId).data ?? [];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const wallet = useWallet();

  const fundingCohort = cohorts.find((item) => item.status === "FUNDING");

  if (!vault || !fundingCohort) {
    notFound();
  }

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const settledDate = formatSettlementDate(mockLastSettlement.settledAt);
  const premiums = mockLastSettlement.premiumsCollectedUsdc;
  const claims = Math.abs(mockLastSettlement.claimsPaidUsdc);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} walletAddress={wallet.address} />

      <div className="px-[24px] lg:px-[32px] pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <div className="flex items-center gap-[12px] flex-wrap">
            <h1 className="font-display text-[30px] lg:text-[34px] font-normal">
              {uwSettlementCopy.heading(mockLastSettlement.cohortId)}
            </h1>
            <Badge label={uwSettlementCopy.badgeLosingCycle} tone="negative" />
          </div>
          <div className="font-mono text-[13px] text-foreground-muted pt-[8px]">
            {uwSettlementCopy.meta(poolLabel, mockLastSettlement.finalRealizedVolPercent, settledDate)}
          </div>
        </div>
        <Button variant="ghost" href="/proof">
          {uwSettlementCopy.verifyCta}
        </Button>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwSettlementCopy.cycleLabel}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[20px] pt-[18px]">
              <StatCard label={uwSettlementCopy.statLabels.capitalAtOpen} value={formatUsdc(mockLastSettlement.capitalAtOpenUsdc)} />
              <StatCard
                label={uwSettlementCopy.statLabels.premiumsCollected}
                value={`+${formatUsdc(mockLastSettlement.premiumsCollectedUsdc)}`}
                valueTone="positive"
              />
              <StatCard
                label={uwSettlementCopy.statLabels.claimsPaid}
                value={formatUsdc(mockLastSettlement.claimsPaidUsdc)}
                valueTone="negative"
              />
              <StatCard
                label={uwSettlementCopy.statLabels.cycleResult}
                value={`${mockLastSettlement.cycleResultPercent}%`}
                valueTone="negative"
              />
            </div>
            <div className="flex gap-[3px] pt-[22px]">
              <div className="h-[34px] rounded-l-progress bg-[var(--chart-bar-positive)]" style={{ flexGrow: premiums }} />
              <div className="h-[34px] rounded-r-progress bg-[var(--chart-bar-negative)]" style={{ flexGrow: claims }} />
            </div>
            <div className="flex justify-between pt-[8px] font-mono text-[12px] text-foreground-muted">
              <span>{uwSettlementCopy.splitPremiumsIn}</span>
              <span>{uwSettlementCopy.splitClaimsOut}</span>
            </div>
            <div className="text-[14px] leading-[1.65] text-foreground-secondary border-t border-border mt-[18px] pt-[16px]">
              {uwSettlementCopy.cycleFootnote(
                mockLastSettlement.policiesPaidOut,
                mockLastSettlement.policiesSettled,
                mockLastSettlement.priorLosingCohortId,
              )}
            </div>
          </Card>

          <Card className="flex-grow" padding="sm">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted px-[4px] pt-[2px]">
              {uwSettlementCopy.claimsSplitLabel}
            </div>
            <div className="pt-[16px]">
              <Table columns={claimsSplitColumns}>
                {mockLastSettlement.claimsSplit.map((row) => (
                  <TableRow
                    key={row.label}
                    columns={claimsSplitColumns}
                    highlighted={Boolean(row.isYou)}
                    cells={[
                      <span key="u" className={`font-mono text-[14px] ${row.isYou ? "text-accent" : "text-foreground-secondary"}`}>
                        {row.label}
                      </span>,
                      <span key="s" className="font-mono text-[14px]">
                        {row.sharePercent}%
                      </span>,
                      <span key="p" className="font-mono text-[14px] text-positive">
                        +{formatUsdcDecimal(row.premiumsUsdc)}
                      </span>,
                      <span key="c" className="font-mono text-[14px] text-negative">
                        {formatUsdcDecimal(row.claimsUsdc)}
                      </span>,
                    ]}
                  />
                ))}
              </Table>
            </div>
            <div className="text-[13px] text-foreground-muted px-[4px] pt-[14px]">{uwSettlementCopy.claimsSplitFootnote}</div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card variant="raised" className="flex flex-col gap-[16px]">
            <span className="text-[11px] tracking-[0.07em] uppercase text-accent">{uwSettlementCopy.returnedLabel}</span>
            <div className="flex items-baseline gap-[8px]">
              <span className="font-mono text-[34px]">{formatUsdcDecimal(mockLastSettlement.returnedToYouUsdc)}</span>
              <span className="text-[13px] text-foreground-muted">{uwSettlementCopy.unit}</span>
            </div>
            <div>
              <DetailRow label={uwSettlementCopy.rows.capital} value={formatUsdcDecimal(mockLastSettlement.yourCapitalUsdc)} />
              <DetailRow
                label={uwSettlementCopy.rows.premiums}
                value={`+${formatUsdcDecimal(mockLastSettlement.yourPremiumsUsdc)}`}
                valueTone="positive"
              />
              <DetailRow
                label={uwSettlementCopy.rows.claims}
                value={formatUsdcDecimal(mockLastSettlement.yourClaimsUsdc)}
                valueTone="negative"
              />
              <DetailRow
                label={uwSettlementCopy.rows.net}
                value={formatUsdcDecimal(mockLastSettlement.yourNetUsdc)}
                valueTone="negative"
                divider={false}
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-[16px]">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwSettlementCopy.nextCycleLabel}
            </div>
            <div className="text-[14.5px] leading-[1.65] text-foreground-secondary">
              {uwSettlementCopy.nextCycleBody(fundingCohort.id)}
            </div>
            <div className="flex flex-col gap-[10px]">
              <Button href={`/underwrite/${vaultId}/deposit`}>
                {uwSettlementCopy.rollCta(formatUsdcDecimal(mockLastSettlement.returnedToYouUsdc), fundingCohort.id)}
              </Button>
              <Button variant="ghost" href={`/underwrite/${vaultId}/deposit`}>
                {uwSettlementCopy.rollDifferentCta}
              </Button>
              <Button variant="ghost" href="/underwrite">
                {uwSettlementCopy.withdrawCta}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
