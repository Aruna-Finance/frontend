"use client";

import { useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { NumberedStep } from "@/components/aruna/NumberedStep";
import { AcknowledgeCheckbox } from "@/components/aruna/AcknowledgeCheckbox";
import { StepIndicator } from "@/components/aruna/StepIndicator";
import { lpConfirmCopy, stepIndicatorCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdc, formatUsdcDecimal } from "@/lib/format";
import { mockConfirmDefaults, mockQuoteDefaults } from "@/lib/mock/positions";
import type { QuoteResult, Vault } from "@/types/domain";

interface ConfirmClientProps {
  positionId: string;
  vault: Vault;
  cohortEndsAt: string;
  quote: QuoteResult;
  coveredAmountUsdc: number;
  walletAddress?: string;
}

export function ConfirmClient({
  positionId,
  vault,
  cohortEndsAt,
  quote,
  coveredAmountUsdc,
  walletAddress,
}: ConfirmClientProps) {
  const [acknowledged, setAcknowledged] = useState(true);
  const premium = formatUsdcDecimal(quote.premiumUsdc);
  const cap = formatUsdcDecimal(quote.maxPayoutUsdc);
  const poolPair = vault.poolLabel.replace(" / ", "/");
  const poolLabel = `${poolPair} ${vault.poolFeeTier}`;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} walletAddress={walletAddress} />

      <div className="px-[24px] lg:px-[32px] pt-[26px]">
        <StepIndicator
          steps={[stepIndicatorCopy.position, stepIndicatorCopy.cover, stepIndicatorCopy.confirm]}
          currentIndex={2}
        />
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal pt-[14px]">{lpConfirmCopy.heading}</h1>
      </div>

      <div className="px-[24px] lg:px-[32px] py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpConfirmCopy.plainTermsLabel}
            </div>
            <p className="font-display text-[26px] lg:text-[28px] leading-[1.35] font-normal pt-[14px]">
              {lpConfirmCopy.plainTerms(premium, poolPair, quote.breakevenPercent, cap)}
            </p>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted pb-[6px]">
              {lpConfirmCopy.termsLabel}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[40px]">
              <DetailRow label={lpConfirmCopy.termsRows.position} value={`#${positionId}`} />
              <DetailRow label={lpConfirmCopy.termsRows.vault} value={poolLabel} />
              <DetailRow label={lpConfirmCopy.termsRows.coveredAmount} value={`${formatUsdcDecimal(coveredAmountUsdc)} USDC`} />
              <DetailRow label={lpConfirmCopy.termsRows.strike} value={`${quote.strikePercent}% annualized vol`} />
              <DetailRow
                label={lpConfirmCopy.termsRows.payoutRate}
                value={`${formatUsdc(mockQuoteDefaults.payoutRateUsdc)} per variance unit`}
              />
              <DetailRow label={lpConfirmCopy.termsRows.payoutCap} value={`${cap} USDC`} valueTone="positive" />
              <DetailRow label={lpConfirmCopy.termsRows.settles} value={formatSettlementDate(cohortEndsAt)} />
              <DetailRow label={lpConfirmCopy.termsRows.oracle} value={lpConfirmCopy.oracleValue} divider={false} />
            </div>
          </Card>

          <div className="rounded-card border border-border-danger bg-negative-soft px-[24px] py-[22px] flex gap-[14px] items-start">
            <ExclamationCircleIcon className="w-[20px] h-[20px] shrink-0 mt-[2px] text-negative" />
            <div>
              <div className="text-[15px] font-semibold text-foreground">{lpConfirmCopy.warning.title}</div>
              <div className="text-[14px] leading-[1.65] text-negative-soft-foreground pt-[6px]">
                {lpConfirmCopy.warning.body(quote.strikePercent, premium)}
              </div>
            </div>
          </div>

          <AcknowledgeCheckbox id="ack" checked={acknowledged} onChange={setAcknowledged}>
            {lpConfirmCopy.acknowledge(cap)}
          </AcknowledgeCheckbox>
        </div>

        <div className="w-full lg:w-[400px] lg:shrink-0 flex flex-col gap-[18px]">
          <Card className="flex flex-col gap-[20px]">
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpConfirmCopy.txCard.label}
            </div>

            <NumberedStep index={1} status="done" statusLabel={lpConfirmCopy.txCard.statusConfirmed}>
              <div className="text-[15px] font-semibold">{lpConfirmCopy.txCard.approve(premium)}</div>
              <div className="font-mono text-[12px] text-positive pt-[4px]">
                {lpConfirmCopy.txCard.confirmed(mockConfirmDefaults.approveTxHash)}
              </div>
            </NumberedStep>

            <div className="border-t border-border" />

            <NumberedStep index={2} status="pending" statusLabel={lpConfirmCopy.txCard.statusPending}>
              <div className="text-[15px] font-semibold">{lpConfirmCopy.txCard.buyCoverTitle}</div>
              <div className="text-[13px] text-foreground-muted pt-[4px] leading-[1.55]">
                {lpConfirmCopy.txCard.buyCoverBody(cap)}
              </div>
            </NumberedStep>

            <div className="border-t border-border pt-[18px] flex flex-col gap-[10px]">
              <div className="flex justify-between">
                <span className="text-[14px] text-foreground-secondary">{lpConfirmCopy.txCard.rows.premium}</span>
                <span className="font-mono text-[14px]">{premium} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[14px] text-foreground-secondary">{lpConfirmCopy.txCard.rows.networkFee}</span>
                <span className="font-mono text-[14px]">~{mockConfirmDefaults.estNetworkFeeUsdc.toFixed(2)} USDC</span>
              </div>
            </div>

            <Button href={`/protect/${positionId}/active`} disabled={!acknowledged}>
              {lpConfirmCopy.txCard.cta}
            </Button>
            <Button variant="ghost" href={`/protect/${positionId}/quote`}>
              {lpConfirmCopy.txCard.backCta}
            </Button>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpConfirmCopy.quoteValidity.label}
            </div>
            <div className="font-mono text-[22px] pt-[8px]">
              {lpConfirmCopy.quoteValidity.countdown(mockConfirmDefaults.repriceCountdown)}
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary pt-[8px]">
              {lpConfirmCopy.quoteValidity.note}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
