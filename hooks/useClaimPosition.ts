"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface ClaimPositionRequest {
  vault: Address;
  policyId: bigint;
}

// CoverVault.claimPosition(policyId) (v2) - pulls a position NFT that got
// "parked" (Policy.nftParked) because its automatic return at settle/cancel
// failed. Practically unreachable on the real NFPM (no receiver hook to
// fail); it exists as a fallback, proven only against a mock NFPM in tests.
export function useClaimPosition() {
  const { send, isPending } = useContractTx();

  const claimPosition = useCallback(
    ({ vault, policyId }: ClaimPositionRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "claimPosition", args: [policyId] },
        {
          id: `claim-position-${vault}-${policyId}`,
          submitted: "Claim submitted",
          confirmed: "Position claimed",
          failed: "Claim failed",
        },
      );
    },
    [send],
  );

  return { claimPosition, isPending };
}
