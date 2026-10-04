"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { useReadContract, useReadContracts } from "wagmi";
import { Header } from "@/components/aruna/Header";
import { Button } from "@/components/aruna/Button";
import { Card } from "@/components/aruna/Card";
import { DetailRow } from "@/components/aruna/DetailRow";
import { NumberedStep } from "@/components/aruna/NumberedStep";
import { AcknowledgeCheckbox } from "@/components/aruna/AcknowledgeCheckbox";
import { StepIndicator } from "@/components/aruna/StepIndicator";
import { lpConfirmCopy, stepIndicatorCopy } from "@/lib/content/copy";
import { withActiveNavLink } from "@/lib/nav";
import { formatSettlementDate, formatUsdcDecimal } from "@/lib/format";
import { arunaAddresses, arunaMarkets } from "@/lib/contracts/addresses";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { positionManagerAbi } from "@/lib/contracts/abis/positionManager";
import { derivePoolInfo } from "@/lib/contracts/pool-label";
import { volPercentToStrikeAnnualized } from "@/lib/contracts/units";
import { usePosition } from "@/hooks/usePosition";
import { useQuote } from "@/hooks/useQuote";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useAllowance } from "@/hooks/useAllowance";
import { useApprove } from "@/hooks/useApprove";
import { useApproveNft } from "@/hooks/useApproveNft";
import { useBuyCover } from "@/hooks/useBuyCover";

const COHORT_STATUS_NAMES = ["FUNDING", "ACTIVE", "SETTLING", "SETTLED"] as const;
// A buyer-side slippage buffer on top of the live premium, and a window to
// sign before the quote is re-read - neither is decided product-wide yet
// (open question in the SC integration guide); 2% / 10 minutes are
// placeholders chosen here, not contract-mandated values.
const MAX_PREMIUM_BUFFER_BPS = 200n;
const DEADLINE_WINDOW_SECONDS = 600n;

export function ConfirmClient({ positionId, strikePercent }: { positionId: string; strikePercent: number }) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(false);
  const market = arunaMarkets[0];
  const pool = derivePoolInfo(market.pool);
  const poolLabel = `${pool.poolLabel} ${pool.poolFeeTier}`;

  const { data: position, owner, isLoading: positionLoading } = usePosition(positionId);
  const { address, isConnected } = useWallet();
  const walletModal = useWalletModal();

  const vaultReads = useReadContracts({
    contracts: [{ address: market.vault, abi: coverVaultAbi, functionName: "currentCohortId" as const }],
  });
  const currentCohortId = vaultReads.data?.[0]?.result as number | undefined;

  const cohortQuery = useReadContract({
    address: market.vault,
    abi: coverVaultAbi,
    functionName: "cohort",
    args: currentCohortId !== undefined ? [currentCohortId] : undefined,
    query: { enabled: currentCohortId !== undefined },
  });
  const cohort = cohortQuery.data;

  let positionTokenId: bigint | undefined;
  try {
    positionTokenId = BigInt(positionId);
  } catch {
    positionTokenId = undefined;
  }

  const quote = useQuote({
    vault: market.vault,
    cohortId: currentCohortId ?? 0,
    positionTokenId: positionTokenId ?? 0n,
    strikePercent,
  });

  const allowanceQuery = useAllowance(arunaAddresses.settlementToken, address, market.vault);
  const nftApprovalQuery = useReadContracts({
    contracts:
      address && positionTokenId !== undefined
        ? [
            { address: arunaAddresses.positionManager, abi: positionManagerAbi, functionName: "getApproved" as const, args: [positionTokenId] },
            { address: arunaAddresses.positionManager, abi: positionManagerAbi, functionName: "isApprovedForAll" as const, args: [address, market.vault] },
          ]
        : [],
    query: { enabled: Boolean(address) && positionTokenId !== undefined },
  });
  const nftApprovedTo = nftApprovalQuery.data?.[0]?.result as string | undefined;
  const nftApprovedForAll = nftApprovalQuery.data?.[1]?.result as boolean | undefined;
  const nftApproved = Boolean(nftApprovedForAll) || nftApprovedTo?.toLowerCase() === market.vault.toLowerCase();

  const { approve, isPending: approvingToken } = useApprove();
  const { approveNft, isPending: approvingNft } = useApproveNft();
  const { buyCover, isPending: buying } = useBuyCover();

  if (positionLoading || vaultReads.isLoading || cohortQuery.isLoading || quote.isLoading) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <p className="px-[24px] lg:px-[32px] pt-[32px] text-[14px] text-foreground-muted">Loading quote…</p>
      </div>
    );
  }
  if (!position || !position.hasVaultForPool || currentCohortId === undefined || !cohort || !quote.data) {
    notFound();
  }
  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[16px] text-center">
          <p className="text-[15px] text-foreground-secondary">Connect the wallet that owns position #{positionId} to continue.</p>
          <Button type="button" onClick={() => walletModal.open()}>
            {lpConfirmCopy.txCard.connectWalletCta}
          </Button>
        </div>
      </div>
    );
  }
  if (!owner || owner.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="flex flex-col flex-1 bg-canvas text-foreground">
        <Header variant="app" navLinks={withActiveNavLink("/protect")} />
        <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[80px] flex flex-col items-center gap-[12px] text-center">
          <p className="text-[15px] text-foreground-secondary">Position #{positionId} isn&apos;t owned by the connected wallet.</p>
          <Button variant="ghost" href="/protect">
            ← Pick a different position
          </Button>
        </div>
      </div>
    );
  }

  const statusName = COHORT_STATUS_NAMES[cohort.status] ?? "UNKNOWN";
  const isSellable = statusName === "ACTIVE";

  const premium = formatUsdcDecimal(quote.data.premiumUsdc);
  const cap = formatUsdcDecimal(quote.data.maxPayoutUsdc);
  const needsTokenApproval = (allowanceQuery.data ?? 0n) < quote.data.premiumRaw;
  const busy = approvingToken || approvingNft || buying;

  const maxPremium = (quote.data.premiumRaw * (10_000n + MAX_PREMIUM_BUFFER_BPS)) / 10_000n;
  const strikeAnnualized = volPercentToStrikeAnnualized(strikePercent);

  type Step = "approve-usdc" | "approve-nft" | "buy-cover";
  const currentStep: Step = needsTokenApproval ? "approve-usdc" : !nftApproved ? "approve-nft" : "buy-cover";

  async function handlePrimaryAction() {
    if (currentStep === "approve-usdc") {
      await approve({ token: arunaAddresses.settlementToken, spender: market.vault, amount: maxPremium, symbol: "USDC" });
      return;
    }
    if (currentStep === "approve-nft") {
      if (positionTokenId === undefined) return;
      await approveNft({ positionManager: arunaAddresses.positionManager, spender: market.vault, tokenId: positionTokenId });
      return;
    }
    if (positionTokenId === undefined || strikeAnnualized === undefined || currentCohortId === undefined) return;
    const deadline = BigInt(Math.floor(new Date().getTime() / 1000)) + DEADLINE_WINDOW_SECONDS;
    const ok = await buyCover({
      vault: market.vault,
      cohortId: currentCohortId,
      positionTokenId,
      strikeAnnualized,
      maxPremium,
      deadline,
    });
    if (ok) {
      router.push(`/protect/${positionId}/active`);
    }
  }

  const primaryLabel = busy
    ? lpConfirmCopy.txCard.processingCta
    : currentStep === "approve-usdc"
      ? lpConfirmCopy.txCard.approveUsdcCta(premium)
      : currentStep === "approve-nft"
        ? lpConfirmCopy.txCard.approveNftCta
        : lpConfirmCopy.txCard.buyCoverCta;

  return (
    <div className="flex flex-col flex-1 bg-canvas text-foreground">
      <Header variant="app" navLinks={withActiveNavLink("/protect")} />

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto pt-[26px]">
        <StepIndicator
          steps={[stepIndicatorCopy.position, stepIndicatorCopy.cover, stepIndicatorCopy.confirm]}
          currentIndex={2}
        />
        <h1 className="font-display text-[32px] lg:text-[36px] font-normal pt-[14px]">{lpConfirmCopy.heading}</h1>
      </div>

      <div className="px-[24px] lg:px-[32px] w-full max-w-[1440px] mx-auto py-[24px] flex flex-col lg:flex-row gap-[20px] flex-grow">
        <div className="flex-grow lg:min-w-0 flex flex-col gap-[18px]">
          {!isSellable ? (
            <Card variant="danger">
              <p className="text-[14px] text-negative-soft-foreground">
                This cohort isn&apos;t open for cover right now (status: {statusName}). Go back and re-quote.
              </p>
            </Card>
          ) : null}

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpConfirmCopy.plainTermsLabel}
            </div>
            <p className="font-display text-[26px] lg:text-[28px] leading-[1.35] font-normal pt-[14px]">
              {lpConfirmCopy.plainTerms(premium, pool.poolLabel, quote.data.breakevenPercent, cap)}
            </p>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted pb-[6px]">
              {lpConfirmCopy.termsLabel}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-[40px]">
              <DetailRow label={lpConfirmCopy.termsRows.position} value={`#${positionId}`} />
              <DetailRow label={lpConfirmCopy.termsRows.vault} value={poolLabel} />
              <DetailRow label={lpConfirmCopy.termsRows.strike} value={`${quote.data.strikePercent}% annualized vol`} />
              <DetailRow label={lpConfirmCopy.termsRows.payoutCap} value={`${cap} USDC`} valueTone="positive" />
              <DetailRow label={lpConfirmCopy.termsRows.settles} value={formatSettlementDate(new Date(Number(cohort.endsAt) * 1000).toISOString())} />
              <DetailRow label={lpConfirmCopy.termsRows.oracle} value={lpConfirmCopy.oracleValue} divider={false} />
            </div>
          </Card>

          <div className="rounded-card border border-border bg-surface px-[24px] py-[22px]">
            <div className="text-[15px] font-semibold text-foreground">{lpConfirmCopy.escrowNotice.title}</div>
            <div className="text-[14px] leading-[1.65] text-foreground-secondary pt-[6px]">{lpConfirmCopy.escrowNotice.body}</div>
          </div>

          <div className="rounded-card border border-border-danger bg-negative-soft px-[24px] py-[22px] flex gap-[14px] items-start">
            <ExclamationCircleIcon className="w-[20px] h-[20px] shrink-0 mt-[2px] text-negative" />
            <div>
              <div className="text-[15px] font-semibold text-foreground">{lpConfirmCopy.warning.title}</div>
              <div className="text-[14px] leading-[1.65] text-negative-soft-foreground pt-[6px]">
                {lpConfirmCopy.warning.body(quote.data.strikePercent, premium)}
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

            <NumberedStep
              index={1}
              status={needsTokenApproval ? "pending" : "done"}
              statusLabel={needsTokenApproval ? undefined : "Done"}
            >
              <div className="text-[15px] font-semibold">{lpConfirmCopy.txCard.approveUsdcTitle(premium)}</div>
            </NumberedStep>

            <div className="border-t border-border" />

            <NumberedStep
              index={2}
              status={needsTokenApproval ? "default" : nftApproved ? "done" : "pending"}
              statusLabel={!needsTokenApproval && nftApproved ? "Done" : undefined}
            >
              <div className="text-[15px] font-semibold">{lpConfirmCopy.txCard.approveNftTitle(positionId)}</div>
              <div className="text-[13px] text-foreground-muted pt-[4px] leading-[1.55]">{lpConfirmCopy.txCard.approveNftBody}</div>
            </NumberedStep>

            <div className="border-t border-border" />

            <NumberedStep index={3} status={currentStep === "buy-cover" ? "pending" : "default"}>
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
            </div>

            <Button type="button" onClick={handlePrimaryAction} disabled={!acknowledged || busy || !isSellable}>
              {primaryLabel}
            </Button>
            <Button variant="ghost" href={`/protect/${positionId}/quote`}>
              {lpConfirmCopy.txCard.backCta}
            </Button>
          </Card>

          <Card>
            <div className="text-[11px] tracking-[0.07em] uppercase text-foreground-muted">
              {lpConfirmCopy.liveQuote.label}
            </div>
            <div className="text-[13.5px] leading-[1.6] text-foreground-secondary pt-[8px]">
              {lpConfirmCopy.liveQuote.note}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
