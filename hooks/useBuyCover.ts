"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface BuyCoverRequest {
  vault: Address;
  cohortId: number;
  positionTokenId: bigint;
  strikeAnnualized: bigint;
  maxPremium: bigint;
  deadline: bigint;
}

// CoverVault.buyCover(...) (v2) — pulls the position NFT into the vault's
// escrow for the cover's duration (transferFrom inside this same tx), so the
// position's own NFPM approval for `vault` must already be in place (see
// useApproveNft). Returns the new policyId on-chain, but writeContractAsync
// only surfaces the tx hash — callers route by positionId, not policyId, so
// that's not needed here.
export function useBuyCover() {
  const { send, isPending } = useContractTx();

  const buyCover = useCallback(
    ({ vault, cohortId, positionTokenId, strikeAnnualized, maxPremium, deadline }: BuyCoverRequest) => {
      return send(
        {
          address: vault,
          abi: coverVaultAbi,
          functionName: "buyCover",
          args: [cohortId, positionTokenId, strikeAnnualized, maxPremium, deadline],
        },
        {
          id: `buy-cover-${vault}-${positionTokenId}`,
          submitted: "Buy cover submitted",
          confirmed: "Cover purchased",
          confirmedDescription: `Position #${positionTokenId} is now covered.`,
          failed: "Buy cover failed",
        },
      );
    },
    [send],
  );

  return { buyCover, isPending };
}
