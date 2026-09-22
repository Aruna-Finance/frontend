"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { NumberedStep } from "@/components/aruna/NumberedStep";
import { AcknowledgeCheckbox } from "@/components/aruna/AcknowledgeCheckbox";
import { uwDepositCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatCohortDateInline, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import type { Vault } from "@/types/domain";
import type { mockUnderwriterPosition } from "@/lib/mock/vaults";

interface DepositClientProps {
  vault: Vault;
  activeCohortId: number;
  fundingCohortId: number;
  fundingStartsAt: string;
  fundingEndsAt: string;
  walletAddress?: string;
  position: typeof mockUnderwriterPosition;
}

const BASELINE_DEPOSIT = 200_000;

export function DepositClient({
  vault,
  activeCohortId,
  fundingCohortId,
  fundingStartsAt,
  fundingEndsAt,
  walletAddress,
  position,
}: DepositClientProps) {
  const [amountInput, setAmountInput] = useState(String(BASELINE_DEPOSIT));
  const [acknowledged, setAcknowledged] = useState(false);

  const amount = Number(amountInput) || 0;
  const scale = amount / BASELINE_DEPOSIT;
  const vaultAfterDeposit = position.existingCommittedCapitalUsdc + amount;
  const sharePercent = vaultAfterDeposit > 0 ? (amount / vaultAfterDeposit) * 100 : 0;
  const estPremiums = (vault.premiumsCurrentCycleUsdc ?? 0) * (sharePercent / 100);
  const worstCase = position.worstCaseUsdc * scale;

  const poolLabel = `${vault.poolLabel.replace(" / ", "/")} ${vault.poolFeeTier}`;
  const lockedUntil = formatCohortDateInline(fundingEndsAt);

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/underwrite")} walletAddress={walletAddress} />

      <div className="px-[24px] lg:px-[32px] pt-[28px]">
        <Link href="/underwrite" className="text-[13px] text-foreground-muted">
          {uwDepositCopy.backLink}
        </Link>
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal pt-[10px]">
          {uwDepositCopy.heading(poolLabel)}
        </h1>
        <div className="font-mono text-[13px] text-foreground-muted pt-[6px]">
          {uwDepositCopy.cohortRange(fundingCohortId, formatCohortDateInline(fundingStartsAt), lockedUntil)}
        </div>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card>
            <label htmlFor="amount" className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
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
                onClick={() => setAmountInput(String(Math.round(position.walletBalanceUsdc / 2)))}
                className="h-[46px] px-[16px] rounded-control border border-border text-foreground text-[13px]"
              >
                {uwDepositCopy.quickHalf}
              </button>
              <button
                type="button"
                onClick={() => setAmountInput(String(position.walletBalanceUsdc))}
                className="h-[46px] px-[16px] rounded-control border border-border text-foreground text-[13px]"
              >
                {uwDepositCopy.quickMax}
              </button>
            </div>
            <div className="flex justify-between flex-wrap gap-[8px] pt-[10px] font-mono text-[12px] text-foreground-muted">
              <span>{uwDepositCopy.walletBalance(formatUsdcDecimal(position.walletBalanceUsdc))}</span>
              <span>{uwDepositCopy.minimumDeposit(formatUsdcDecimal(position.minimumDepositUsdc))}</span>
            </div>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwDepositCopy.signUpLabel}
            </div>
            <div className="flex flex-col gap-[14px] pt-[16px]">
              {uwDepositCopy.signUpSteps.map((step, index) => (
                <NumberedStep key={index} index={index + 1}>
                  <div className="text-[14.5px] leading-[1.6] text-foreground-secondary">
                    {step(lockedUntil)}
                  </div>
                </NumberedStep>
              ))}
            </div>
          </Card>

          <Card className="flex flex-col flex-grow">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {uwDepositCopy.historyLabel(formatUsdc(amount))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-[12px] pt-[16px]">
              {vault.cycleHistory.map((cycle) => {
                const value = (cycle.netResultUsdc ?? 0) * scale;
                return (
                  <div key={cycle.label} className="bg-canvas border border-border rounded-control p-[14px]">
                    <div className="font-mono text-[12px] text-foreground-muted">{cycle.label}</div>
                    <div className={`font-mono text-[16px] pt-[6px] ${value >= 0 ? "text-positive" : "text-negative"}`}>
                      {value >= 0 ? "+" : ""}
                      {formatUsdc(Math.round(value))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-[13px] text-foreground-muted pt-[14px]">{uwDepositCopy.historyFootnote}</div>
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
                label={uwDepositCopy.positionCard.rows.estPremiums(activeCohortId)}
                value={formatUsdcDecimal(estPremiums)}
                valueTone="positive"
                divider={false}
              />
            </div>
            <Button href={`/underwrite/${vault.id}/dashboard`} disabled={!acknowledged}>
              {uwDepositCopy.positionCard.cta}
            </Button>
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

          <AcknowledgeCheckbox id="uwack" checked={acknowledged} onChange={setAcknowledged}>
            {uwDepositCopy.acknowledge}
          </AcknowledgeCheckbox>
        </div>
      </div>
    </div>
  );
}
