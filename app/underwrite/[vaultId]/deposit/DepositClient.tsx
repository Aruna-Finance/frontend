"use client";

import { useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatUnits, type Address } from "viem";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { PairIcon } from "@/components/aruna/PairIcon";
import { SectionHeader } from "@/components/aruna/SectionHeader";
import { CohortHistory } from "@/components/aruna/CohortHistory";
import { AcknowledgeCheckbox } from "@/components/aruna/AcknowledgeCheckbox";
import { AppFooter } from "@/components/aruna/AppFooter";
import { marketDetailCopy, uwDepositCopy, uwVaultsCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDateInline, formatCompact, formatPercent, formatUsdcDecimal } from "@/lib/format";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { chainTag } from "@/lib/contracts/pool-label";
import { USDC_DECIMALS, formatDuration, parseTokenAmount } from "@/lib/contracts/units";
import { useVaultByAddress } from "@/hooks/useVaults";
import { useCohortByAddress, useCohortFinancialsByAddress } from "@/hooks/useCohort";
import { useMarketStatus } from "@/hooks/useMarketStatus";
import { useVaultYield } from "@/hooks/useVaultYield";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { useAllowance } from "@/hooks/useAllowance";
import { useApprove } from "@/hooks/useApprove";
import { useDeposit } from "@/hooks/useDeposit";

const DEFAULT_DEPOSIT = 200_000;

export function DepositClient({ vaultId }: { vaultId: string }) {
  // By-address reads, so the page opens for any vault the visitor has the
  // address of, official or not. The target cohort comes from the calendar and
  // ticks every second: a page left open moves on to the next cohort by itself
  // instead of sending a deposit to one that has already started.
  const { data: vault, isLoading: vaultLoading } = useVaultByAddress(vaultId);
  const { status, now } = useMarketStatus(vaultId);
  const yieldSummary = useVaultYield(vaultId).data;
  const fundingCohortId = status?.deposit.cohortId ?? 0;
  const fundingCohort = useCohortByAddress(vaultId, fundingCohortId).data;
  const { data: fundingFinancials } = useCohortFinancialsByAddress(vaultId, fundingCohortId);

  const { address } = useWallet();
  const walletModal = useWalletModal();
  const vaultAddress = vault?.id as Address | undefined;
  const balanceQuery = useTokenBalance(arunaAddresses.settlementToken, address);
  const allowanceQuery = useAllowance(arunaAddresses.settlementToken, address, vaultAddress ?? arunaAddresses.coverVault);
  const { approve, isPending: approving } = useApprove();
  const { deposit, isPending: depositing } = useDeposit();

  const [amountInput, setAmountInput] = useState(String(DEFAULT_DEPOSIT));
  const [acknowledged, setAcknowledged] = useState(false);

  if (vaultLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading pool…</p>
      </div>
    );
  }
  if (!vault || !vault.hasVault || !status || !fundingCohort) {
    notFound();
  }

  const amount = Number(amountInput) || 0;
  const walletBalanceUsdc = balanceQuery.data !== undefined ? Number(formatUnits(balanceQuery.data, USDC_DECIMALS)) : 0;
  const existingCommittedCapitalUsdc = fundingFinancials?.totalCapitalUsdc ?? 0;
  const vaultAfterDeposit = existingCommittedCapitalUsdc + amount;
  const sharePercent = vaultAfterDeposit > 0 ? (amount / vaultAfterDeposit) * 100 : 0;
  const estPremiums = (vault.premiumsCurrentCycleUsdc ?? 0) * (sharePercent / 100);
  // The contract's own ceiling - the most a deposit could ever be reserved
  // against, not a projection from any one scenario.
  const worstCase = -(amount * vault.maxUtilizationBps) / 10_000;

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const lockedUntil = formatCohortDateInline(fundingCohort.endsAt);
  const closesIn = formatDuration(status.deposit.closesAt - now);
  const last = yieldSummary?.last ?? null;

  const amountBaseUnits = parseTokenAmount(amountInput, 6);
  const hasEnoughBalance = amountBaseUnits !== undefined && balanceQuery.data !== undefined && amountBaseUnits <= balanceQuery.data;
  const needsApproval =
    amountBaseUnits !== undefined && allowanceQuery.data !== undefined && allowanceQuery.data < amountBaseUnits;
  const busy = approving || depositing;

  async function handlePrimaryAction() {
    if (!address) {
      walletModal.open();
      return;
    }
    if (!vaultAddress || amountBaseUnits === undefined) return;
    if (needsApproval) {
      await approve({ token: arunaAddresses.settlementToken, spender: vaultAddress, amount: amountBaseUnits, symbol: "USDC" });
      return;
    }
    await deposit({ vault: vaultAddress, cohortId: fundingCohortId, amount: amountBaseUnits });
  }

  const primaryLabel = !address
    ? uwDepositCopy.connectWalletCta
    : needsApproval
      ? uwDepositCopy.approveCta
      : uwDepositCopy.positionCard.cta;

  const statLabel = "text-[11px] tracking-[0.07em] uppercase text-foreground-muted";

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[28px] flex flex-col gap-[20px]">
        <Link href="/underwrite" className="text-[13px] text-foreground-muted hover:text-foreground w-fit">
          {uwDepositCopy.backLink}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[12px]">
          <div className="flex items-center gap-[14px] min-w-0">
            {vault.poolSymbols ? <PairIcon symbol0={vault.poolSymbols[0]} symbol1={vault.poolSymbols[1]} size={32} /> : null}
            <h1 className="font-display text-[26px] sm:text-[30px] lg:text-[36px] leading-[1.15] font-normal">{poolLabel}</h1>
          </div>
          <span className="font-mono text-[12px] text-foreground-muted">{chainTag}</span>
        </div>

        <Card>
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-x-[24px] gap-y-[20px]">
            <div>
              <dt className={statLabel}>{uwDepositCopy.windowLabel}</dt>
              <dd className="font-mono text-[20px] pt-[6px]">Cohort {fundingCohortId}</dd>
              <dd className="text-[12px] text-foreground-muted pt-[2px]">{uwDepositCopy.closesIn(closesIn)}</dd>
            </div>
            <div>
              <dt className={statLabel}>{uwVaultsCopy.stats.lastCycle}</dt>
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
              <dt className={statLabel}>{uwVaultsCopy.stats.capital}</dt>
              <dd className="font-mono text-[20px] pt-[6px]">{formatCompact(vault.totalCapitalUsdc, "USDC")}</dd>
            </div>
            <div>
              <dt className={statLabel}>{uwVaultsCopy.stats.utilization}</dt>
              <dd className="font-mono text-[20px] pt-[6px]">{formatPercent(vault.utilizationPercent)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[36px]">
        <SectionHeader title={uwDepositCopy.sections.risks} />
        <Card>
          <ul className="flex flex-col gap-[10px]">
            {uwVaultsCopy.risks.items.map((item) => (
              <li key={item} className="text-[14px] leading-[1.6] text-foreground-secondary">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[36px]">
        <SectionHeader title={uwDepositCopy.sections.history} description={uwDepositCopy.historyNote} />
        <Card padding="sm">
          <CohortHistory
            rows={yieldSummary?.recent ?? []}
            labels={marketDetailCopy.history.columns}
            emptyText={marketDetailCopy.history.empty}
          />
        </Card>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[36px] pb-[40px] flex-grow">
        <SectionHeader
          title={uwDepositCopy.sections.deposit}
          description={uwDepositCopy.depositDescription(fundingCohortId, lockedUntil)}
        />
        <div className="flex flex-col lg:flex-row gap-[20px]">
          <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
            <Card>
              <label htmlFor="amount" className={statLabel}>
                {uwDepositCopy.amountLabel}
              </label>
              <div className="flex flex-wrap gap-[12px] items-center pt-[12px]">
                <input
                  id="amount"
                  type="text"
                  value={amount.toLocaleString("en-US")}
                  onChange={(event) => setAmountInput(event.target.value.replace(/[^0-9]/g, ""))}
                  className="h-[64px] w-full sm:w-auto sm:flex-grow px-[18px] rounded-button border border-border bg-canvas text-foreground font-mono text-[30px]"
                />
                <span className="font-mono text-[16px] text-foreground-muted">{uwDepositCopy.unit}</span>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(Math.round(walletBalanceUsdc / 2)))}
                  className="h-[46px] px-[16px] rounded-button border border-border text-foreground text-[13px] transition-all duration-300 hover:bg-surface-row"
                >
                  {uwDepositCopy.quickHalf}
                </button>
                <button
                  type="button"
                  onClick={() => setAmountInput(String(walletBalanceUsdc))}
                  className="h-[46px] px-[16px] rounded-button border border-border text-foreground text-[13px] transition-all duration-300 hover:bg-surface-row"
                >
                  {uwDepositCopy.quickMax}
                </button>
              </div>
              <div className="flex justify-between flex-wrap gap-[8px] pt-[10px] font-mono text-[12px] text-foreground-muted">
                <span>{uwDepositCopy.walletBalance(address ? formatUsdcDecimal(walletBalanceUsdc) : "-")}</span>
              </div>
              {address && amount > 0 && !hasEnoughBalance ? (
                <div className="text-[13px] text-negative pt-[10px]">{uwDepositCopy.insufficientBalance}</div>
              ) : null}
            </Card>

            <Card variant="danger">
              <div className="text-[11px] tracking-[0.07em] uppercase text-negative">{uwDepositCopy.worstCase.label}</div>
              <div className="flex items-baseline gap-[8px] pt-[10px]">
                <span className="font-mono text-[30px] text-negative">{formatUsdcDecimal(worstCase)}</span>
                <span className="text-[13px] text-negative-soft-foreground">{uwDepositCopy.worstCase.unit}</span>
              </div>
              <div className="text-[14px] leading-[1.65] text-negative-soft-foreground pt-[10px]">
                {uwDepositCopy.worstCase.body}
              </div>
            </Card>
          </div>

          <div className="w-full lg:w-[400px] lg:shrink-0 flex flex-col gap-[18px]">
            <Card variant="raised" className="flex flex-col gap-[18px]">
              <span className="text-[11px] tracking-[0.07em] uppercase text-accent">
                {uwDepositCopy.positionCard.label(fundingCohortId)}
              </span>
              <div>
                <div className="text-[13px] text-foreground-muted">{uwDepositCopy.positionCard.shareLabel}</div>
                <div className="font-mono text-[40px] pt-[4px]">{sharePercent.toFixed(2)}%</div>
              </div>
              <div>
                <DetailRow label={uwDepositCopy.positionCard.rows.yourCapital} value={formatUsdcDecimal(amount)} />
                <DetailRow label={uwDepositCopy.positionCard.rows.vaultAfterDeposit} value={formatUsdcDecimal(vaultAfterDeposit)} />
                <DetailRow label={uwDepositCopy.positionCard.rows.lockedUntil} value={lockedUntil} />
                <DetailRow
                  label={uwDepositCopy.positionCard.rows.estPremiums(vault.currentCohortId ?? 0)}
                  value={formatUsdcDecimal(estPremiums)}
                  valueTone="positive"
                  divider={false}
                />
              </div>
              <Button
                type="button"
                onClick={handlePrimaryAction}
                disabled={!acknowledged || busy || (Boolean(address) && (amount <= 0 || !hasEnoughBalance))}
              >
                {busy ? uwDepositCopy.processingCta : primaryLabel}
              </Button>
            </Card>

            <AcknowledgeCheckbox id="uwack" checked={acknowledged} onChange={setAcknowledged}>
              {uwDepositCopy.acknowledge}
            </AcknowledgeCheckbox>
          </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
