"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface ClaimUnclaimedRequest {
  vault: Address;
}

// CoverVault.claimUnclaimed() — pull fallback (design §7.3) for a payout or
// refund that failed to push (e.g. the recipient's address reverts on
// receive). Read the pending amount first with CoverVault.unclaimed(address).
export function useClaimUnclaimed() {
  const { send, isPending } = useContractTx();

  const claimUnclaimed = useCallback(
    ({ vault }: ClaimUnclaimedRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "claimUnclaimed", args: [] },
        {
          id: `claim-unclaimed-${vault}`,
          submitted: "Claim submitted",
          confirmed: "Unclaimed balance claimed",
          failed: "Claim failed",
        },
      );
    },
    [send],
  );

  return { claimUnclaimed, isPending };
}
