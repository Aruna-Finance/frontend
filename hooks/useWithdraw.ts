"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface WithdrawRequest {
  vault: Address;
  cohortId: number;
}

// CoverVault.withdraw(cohortId) - only valid in FUNDING (returns the raw
// deposit) or SETTLED (returns net = deposit + premium share - claim share).
export function useWithdraw() {
  const { send, isPending } = useContractTx();

  const withdraw = useCallback(
    ({ vault, cohortId }: WithdrawRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "withdraw", args: [cohortId] },
        {
          id: `withdraw-${vault}-${cohortId}`,
          submitted: "Withdraw submitted",
          confirmed: "Withdraw confirmed",
          confirmedDescription: `Cohort ${cohortId}.`,
          failed: "Withdraw failed",
        },
      );
    },
    [send],
  );

  return { withdraw, isPending };
}
