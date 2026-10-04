"use client";

import type { Address } from "viem";
import { useReadContract } from "wagmi";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";

// CoverVault.unclaimed(owner): payout/refund the vault is holding for `owner`
// after a failed push. Read from the chain, not the indexer, so the claim
// button disappears the moment the claim is mined.
export function useUnclaimed(vault: Address | undefined, owner: Address | undefined) {
  return useReadContract({
    address: vault,
    abi: coverVaultAbi,
    functionName: "unclaimed",
    args: owner ? [owner] : undefined,
    query: { enabled: Boolean(vault && owner) },
  });
}
