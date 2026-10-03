"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { positionManagerAbi } from "@/lib/contracts/abis/positionManager";
import { useContractTx } from "./useContractTx";

export interface ApproveNftRequest {
  positionManager: Address;
  spender: Address;
  tokenId: bigint;
}

// NFPM.approve(vault, tokenId) — required before CoverVault.buyCover (v2):
// the vault pulls the position NFT into escrow with transferFrom inside the
// same transaction. Per-token approve, not setApprovalForAll — the user only
// grants the vault the one position they're about to cover, not every
// position they'll ever hold (open question in the SC integration guide;
// revisit if a product decision prefers setApprovalForAll for fewer wallet
// prompts across repeat covers).
//
// Safety: a position NFT sent to the vault any other way (plain
// transferFrom, outside buyCover) can never be recovered — there is no
// admin or rescue path. Only ever call this before buyCover, never as a
// standalone "send my NFT to the vault" action.
export function useApproveNft() {
  const { send, isPending } = useContractTx();

  const approveNft = useCallback(
    ({ positionManager, spender, tokenId }: ApproveNftRequest) => {
      return send(
        { address: positionManager, abi: positionManagerAbi, functionName: "approve", args: [spender, tokenId] },
        {
          id: `approve-nft-${positionManager}-${tokenId}`,
          submitted: "Position approval submitted",
          confirmed: "Position approved",
          failed: "Position approval failed",
        },
      );
    },
    [send],
  );

  return { approveNft, isPending };
}
