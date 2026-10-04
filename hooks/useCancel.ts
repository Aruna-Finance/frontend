"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface CancelRequest {
  vault: Address;
  policyId: bigint;
}

// CoverVault.cancel(policyId) (v2) - only the policy owner, only before the
// cohort's endsAt. The premium stays with the cohort (not refunded), the
// escrowed position NFT is returned, and the freed capacity can be sold
// again to someone else.
export function useCancel() {
  const { send, isPending } = useContractTx();

  const cancel = useCallback(
    ({ vault, policyId }: CancelRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "cancel", args: [policyId] },
        {
          id: `cancel-${vault}-${policyId}`,
          submitted: "Cancel submitted",
          confirmed: "Cover cancelled",
          confirmedDescription: "Your position has been returned. The premium stays with the cohort.",
          failed: "Cancel failed",
        },
      );
    },
    [send],
  );

  return { cancel, isPending };
}
