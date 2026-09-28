"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/contracts/abis/erc20";

// How much of `owner`'s token `spender` may pull, in base units. Compare it to
// the amount about to be spent to decide whether an approve step is needed.
export function useAllowance(token: Address, owner: Address | undefined, spender: Address) {
  return useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "allowance",
    args: owner ? [owner, spender] : undefined,
    query: { enabled: Boolean(owner) },
  });
}
