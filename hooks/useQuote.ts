"use client";

import { useMemo } from "react";
import { useReadContract } from "wagmi";
import type { Address } from "viem";
import { formatUnits } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { USDC_DECIMALS, volPercentToStrikeAnnualized } from "@/lib/contracts/units";
import { breakevenVolPercent, capReachedVolPercent } from "@/lib/contracts/variance";
import { getContractErrorMessage } from "@/lib/contracts/errors";
import type { QuoteRequest, QuoteResult } from "@/types/domain";

export interface UseQuoteResult {
  data: QuoteResult | undefined;
  isLoading: boolean;
  isError: boolean;
  // A decoded CoverVault revert reason (e.g. "too little time left"), when
  // the view call itself reverted — distinct from a generic network error.
  errorMessage: string | undefined;
}

// CoverVault.quote(cohortId, positionTokenId, strikeAnnualized) — a live view
// call, re-run whenever the strike changes. No indexer involved. v2 has no
// coverage-amount input: varNotional and maxPayout are entirely derived from
// the position itself (see CoverVault.sol / design §6.0), so there is
// nothing left for the frontend to size.
export function useQuote({ vault, cohortId, positionTokenId, strikePercent }: QuoteRequest): UseQuoteResult {
  const strikeAnnualized = volPercentToStrikeAnnualized(strikePercent);

  const query = useReadContract({
    address: vault as Address,
    abi: coverVaultAbi,
    functionName: "quote",
    args: strikeAnnualized !== undefined ? [cohortId, positionTokenId, strikeAnnualized] : undefined,
    query: { enabled: Boolean(vault) && strikeAnnualized !== undefined },
  });

  const data = useMemo((): QuoteResult | undefined => {
    if (!query.data || strikeAnnualized === undefined) return undefined;
    const [premium, varNotional, maxPayout, coveredSeconds] = query.data;

    return {
      strikePercent,
      strikeAnnualized,
      premiumUsdc: Number(formatUnits(premium, USDC_DECIMALS)),
      premiumRaw: premium,
      varNotionalRaw: varNotional,
      maxPayoutUsdc: Number(formatUnits(maxPayout, USDC_DECIMALS)),
      maxPayoutRaw: BigInt(maxPayout),
      coveredSeconds,
      breakevenPercent:
        Math.round(
          breakevenVolPercent({ premium, varNotional, strikeAnnualized, coveredSeconds: BigInt(coveredSeconds) }) * 10,
        ) / 10,
      capReachedAtPercent:
        Math.round(
          capReachedVolPercent({
            varNotional,
            maxPayout: BigInt(maxPayout),
            strikeAnnualized,
            coveredSeconds: BigInt(coveredSeconds),
          }) * 10,
        ) / 10,
    };
  }, [query.data, strikeAnnualized, strikePercent]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.error ? getContractErrorMessage(query.error) : undefined,
  };
}
