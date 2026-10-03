"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface CollectFeesRequest {
  vault: Address;
  policyId: bigint;
  recipient: Address;
}

// CoverVault.collectFees(policyId, recipient) (v2) — while a position is
// escrowed for an active cover, only the policy owner can pull its accrued
// Uniswap trading fees, to any recipient they choose, at any time. The fees
// were always 100% theirs; this is the only NFPM call the vault exposes on
// an escrowed position.
export function useCollectFees() {
  const { send, isPending } = useContractTx();

  const collectFees = useCallback(
    ({ vault, policyId, recipient }: CollectFeesRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "collectFees", args: [policyId, recipient] },
        {
          id: `collect-fees-${vault}-${policyId}`,
          submitted: "Collect fees submitted",
          confirmed: "Fees collected",
          failed: "Collect fees failed",
        },
      );
    },
    [send],
  );

  return { collectFees, isPending };
}
