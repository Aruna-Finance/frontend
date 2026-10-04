"use client";

import { notFound } from "next/navigation";
import { formatUnits } from "viem";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { Badge } from "@/components/aruna/Badge";
import { StatCard } from "@/components/aruna/StatCard";
import { DetailRow } from "@/components/aruna/DetailRow";
import { Table, TableRow } from "@/components/aruna/Table";
import { uwSettlementCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDate, formatSettlementDate, formatUsdc, formatUsdcDecimal, shortenAddress } from "@/lib/format";
import { useCohortsByAddress, useVaultByAddress } from "@/hooks/useVaults";
import { useCohort } from "@/hooks/useCohort";
import { useCohortDetail } from "@/hooks/useCohortDetail";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { USDC_DECIMALS, varianceWadToVolPercent } from "@/lib/contracts/units";
import { realizedVarianceAnnualized } from "@/lib/contracts/variance";
import type { TableColumn } from "@/types/aruna";

const claimsSplitColumns: TableColumn[] = [
  { key: "underwriter", header: uwSettlementCopy.claimsSplitHeaders[0], width: "minmax(180px, 1fr)" },
  { key: "share", header: uwSettlementCopy.claimsSplitHeaders[1], width: "140px" },
  { key: "premiums", header: uwSettlementCopy.claimsSplitHeaders[2], width: "140px" },
  { key: "claims", header: uwSettlementCopy.claimsSplitHeaders[3], width: "140px" },
];

function usdc(value: bigint): number {
  return Number(formatUnits(value, USDC_DECIMALS));
}

export function SettlementClient({ vaultId }: { vaultId: string }) {
  const { data: vault, isLoading: vaultLoading } = useVaultByAddress(vaultId);
  const { data: cohorts, isLoading: cohortsLoading } = useCohortsByAddress(vaultId);
  const lastSettled = cohorts?.filter((item) => item.status === "SETTLED").sort((a, b) => b.id - a.id)[0];
  const { data: cohort, isLoading: cohortLoading } = useCohortDetail(vaultId, lastSettled?.id);
  const fundingCohortId = vault?.fundingCohortId ?? (lastSettled?.id ?? 0) + 1;
  const fundingCohort = useCohort(vaultId, fundingCohortId).data;
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();

  // Only wait on `cohortLoading` once there's a `lastSettled.id` to look up —
  // if `cohorts` resolves with no settled cohort at all, that query stays
  // disabled (pending) forever, and waiting on it would spin indefinitely
  // instead of ever reaching the real "no settlement" notFound below.
  if (vaultLoading || cohortsLoading || (Boolean(lastSettled) && cohortLoading)) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading settlement…</p>
      </div>
    );
  }
  if (!vault || !lastSettled || !cohort) {
    notFound();
  }
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[16px] text-center">
          <p className="text-[15px] text-foreground-secondary">Connect the wallet you underwrote this vault with to see your settlement.</p>
          <Button type="button" onClick={() => walletModal.open()}>
            Connect wallet
          </Button>
        </div>
      </div>
    );
  }

  const position = cohort.positions.find((item) => item.wallet.toLowerCase() === address.toLowerCase());
  if (!position) {
    notFound();
  }

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const windowSeconds = Math.max(
    0,
    Math.floor((new Date(cohort.endsAt).getTime() - new Date(cohort.startsAt).getTime()) / 1000),
  );
  const finalRealizedVolPercent =
    cohort.finalSumSq !== null && windowSeconds > 0
      ? Math.round(varianceWadToVolPercent(realizedVarianceAnnualized(cohort.finalSumSq, BigInt(windowSeconds))) * 10) / 10
      : 0;
  const settledDate = formatSettlementDate(cohort.finalizedAt ?? cohort.endsAt);

  const capitalAtOpenUsdc = usdc(cohort.totalCapitalRaw);
  const premiumsUsdc = usdc(cohort.premiumsCollectedRaw);
  const claimsUsdc = usdc(cohort.claimsPaidRaw);
  const cycleNetUsdc = premiumsUsdc - claimsUsdc;
  const cycleResultPercent = capitalAtOpenUsdc > 0 ? Math.round((cycleNetUsdc / capitalAtOpenUsdc) * 10_000) / 100 : 0;
  const isLosingCycle = cycleNetUsdc < 0;

  const claimsSplit = [...cohort.positions]
    .sort((a, b) => (b.principal > a.principal ? 1 : b.principal < a.principal ? -1 : 0))
    .map((row) => {
      const share = row.sharePercent / 100;
      const isYou = row.wallet.toLowerCase() === address.toLowerCase();
      return {
        label: `${shortenAddress(row.wallet)}${isYou ? " · you" : ""}`,
        isYou,
        sharePercent: Math.round(row.sharePercent * 100) / 100,
        premiumsUsdc: share * premiumsUsdc,
        claimsUsdc: -(share * claimsUsdc),
      };
    });

  const yourShare = position.sharePercent / 100;
  const yourCapitalUsdc = usdc(position.principal);
  const yourPremiumsUsdc = yourShare * premiumsUsdc;
  const yourClaimsUsdc = -(yourShare * claimsUsdc);
  const yourNetUsdc = yourPremiumsUsdc + yourClaimsUsdc;
  const returnedToYouUsdc = yourCapitalUsdc + yourNetUsdc;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col md:flex-row justify-between md:items-start gap-[12px]">
        <div>
          <div className="flex items-center gap-[12px] flex-wrap">
            <h1 className="font-display text-[30px] lg:text-[34px] font-normal">
              {uwSettlementCopy.heading(lastSettled.id)}
            </h1>
            <Badge
              label={isLosingCycle ? uwSettlementCopy.badgeLosingCycle : uwSettlementCopy.badgeProfitableCycle}
              tone={isLosingCycle ? "negative" : "positive"}
            />
          </div>
          <div className="font-mono text-[13px] text-foreground-muted pt-[8px]">
            {uwSettlementCopy.meta(poolLabel, finalRealizedVolPercent, settledDate)}
          </div>
        </div>
        <Button variant="ghost" href="/proof">
          {uwSettlementCopy.verifyCta}
        </Button>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwSettlementCopy.cycleLabel}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-[20px] pt-[18px]">
              <StatCard label={uwSettlementCopy.statLabels.capitalAtOpen} value={formatUsdc(capitalAtOpenUsdc)} />
              <StatCard
                label={uwSettlementCopy.statLabels.premiumsCollected}
                value={`+${formatUsdc(premiumsUsdc)}`}
                valueTone="positive"
              />
              <StatCard
                label={uwSettlementCopy.statLabels.claimsPaid}
                value={`-${formatUsdc(claimsUsdc)}`}
                valueTone="negative"
              />
              <StatCard
                label={uwSettlementCopy.statLabels.cycleResult}
                value={`${cycleResultPercent >= 0 ? "+" : ""}${cycleResultPercent}%`}
                valueTone={isLosingCycle ? "negative" : "positive"}
              />
            </div>
            <div className="flex gap-[3px] pt-[22px]">
              <div className="h-[34px] rounded-l-progress bg-[var(--chart-bar-positive)]" style={{ flexGrow: Math.max(premiumsUsdc, 0.001) }} />
              <div className="h-[34px] rounded-r-progress bg-[var(--chart-bar-negative)]" style={{ flexGrow: Math.max(claimsUsdc, 0.001) }} />
            </div>
            <div className="flex justify-between pt-[8px] font-mono text-[12px] text-foreground-muted">
              <span>{uwSettlementCopy.splitPremiumsIn}</span>
              <span>{uwSettlementCopy.splitClaimsOut}</span>
            </div>
            <div className="text-[14px] leading-[1.65] text-foreground-secondary border-t border-border mt-[18px] pt-[16px]">
              {uwSettlementCopy.cycleFootnote(cohort.paidCount, cohort.settledCount, cohort.hitCapCount, cycleNetUsdc)}
            </div>
          </Card>

          <Card className="flex-grow" padding="sm">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted px-[4px] pt-[2px]">
              {uwSettlementCopy.claimsSplitLabel}
            </div>
            <div className="pt-[16px]">
              <Table columns={claimsSplitColumns}>
                {claimsSplit.map((row) => (
                  <TableRow
                    key={row.label}
                    columns={claimsSplitColumns}
                    highlighted={row.isYou}
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
              <span className="font-mono text-[34px]">{formatUsdcDecimal(returnedToYouUsdc)}</span>
              <span className="text-[13px] text-foreground-muted">{uwSettlementCopy.unit}</span>
            </div>
            <div>
              <DetailRow label={uwSettlementCopy.rows.capital} value={formatUsdcDecimal(yourCapitalUsdc)} />
              <DetailRow
                label={uwSettlementCopy.rows.premiums}
                value={`+${formatUsdcDecimal(yourPremiumsUsdc)}`}
                valueTone="positive"
              />
              <DetailRow
                label={uwSettlementCopy.rows.claims}
                value={formatUsdcDecimal(yourClaimsUsdc)}
                valueTone="negative"
              />
              <DetailRow
                label={uwSettlementCopy.rows.net}
                value={`${yourNetUsdc >= 0 ? "+" : ""}${formatUsdcDecimal(yourNetUsdc)}`}
                valueTone={yourNetUsdc >= 0 ? "positive" : "negative"}
                divider={false}
              />
            </div>
          </Card>

          <Card className="flex flex-col gap-[16px]">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwSettlementCopy.nextCycleLabel}
            </div>
            <div className="text-[14.5px] leading-[1.65] text-foreground-secondary">
              {uwSettlementCopy.nextCycleBody(fundingCohortId, fundingCohort ? formatCohortDate(fundingCohort.startsAt) : "soon")}
            </div>
            <div className="flex flex-col gap-[10px]">
              <Button href={`/underwrite/${vaultId}/deposit`}>
                {uwSettlementCopy.rollCta(formatUsdcDecimal(returnedToYouUsdc), fundingCohortId)}
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
