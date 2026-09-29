"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { formatUsdcAmount } from "@/lib/contracts/units";
import { useContractTx } from "./useContractTx";

export interface DepositRequest {
  vault: Address;
  cohortId: number;
  // Base units (6 decimals).
  amount: bigint;
}

// CoverVault.deposit(cohortId, amount) — commits capital to a FUNDING
// cohort. Requires an mUSDC allowance for `vault` of at least `amount`
// already in place (see useApprove).
export function useDeposit() {
  const { send, isPending } = useContractTx();

  const deposit = useCallback(
    ({ vault, cohortId, amount }: DepositRequest) => {
      const amountLabel = `${formatUsdcAmount(amount)} USDC`;
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "deposit", args: [cohortId, amount] },
        {
          id: `deposit-${vault}-${cohortId}`,
          submitted: "Deposit submitted",
          confirmed: "Deposit confirmed",
          confirmedDescription: `${amountLabel} into cohort ${cohortId}.`,
          failed: "Deposit failed",
        },
      );
    },
    [send],
  );

  return { deposit, isPending };
}
