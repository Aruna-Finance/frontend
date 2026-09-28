"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { useContractTx } from "./useContractTx";

export interface ApproveRequest {
  token: Address;
  spender: Address;
  // Base units.
  amount: bigint;
  // Shown in the toasts, e.g. "USDC".
  symbol?: string;
}

// ERC-20 approve as a reusable step for any flow that spends tokens
// (deposit, premium payment). Resolves true only once it is mined.
export function useApprove() {
  const { send, isPending } = useContractTx();

  const approve = useCallback(
    ({ token, spender, amount, symbol }: ApproveRequest) => {
      const what = symbol ? `${symbol} approval` : "Approval";
      return send(
        { address: token, abi: erc20Abi, functionName: "approve", args: [spender, amount] },
        {
          id: `approve-${token}`,
          submitted: `${what} submitted`,
          confirmed: `${what} confirmed`,
          failed: `${what} failed`,
        },
      );
    },
    [send],
  );

  return { approve, isPending };
}
