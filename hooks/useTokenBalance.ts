"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { erc20Abi } from "@/lib/contracts/abis/erc20";

// Balance of an ERC-20 for one owner, in base units. Disabled (no request)
// until an owner is known, e.g. before a wallet is connected.
export function useTokenBalance(token: Address, owner: Address | undefined) {
  return useReadContract({
    address: token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: Boolean(owner) },
  });
}
