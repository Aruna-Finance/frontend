import type { IndexerPolicy } from "./types";

export type ClaimAction =
  // A payout or refund whose push failed is held in the vault until claimed.
  | { kind: "claimUnclaimed"; amount: bigint; reason: "payout" | "refund" | "balance" }
  // A position NFT whose automatic return failed is held until claimed.
  | { kind: "claimPosition"; policyId: bigint };

// What the owner can still pull out of the vault for one policy. The on-chain
// `unclaimed(owner)` balance is the source of truth for the amount (it can span
// several policies); the policy flags only say why it is there.
export function claimActions(
  policy: Pick<IndexerPolicy, "policyId" | "owner" | "payoutParked" | "refundParked" | "nftParked">,
  wallet: string | undefined,
  unclaimedAmount: bigint,
): ClaimAction[] {
  if (!wallet || wallet.toLowerCase() !== policy.owner.toLowerCase()) return [];
  const actions: ClaimAction[] = [];
  if (unclaimedAmount > 0n) {
    const reason = policy.refundParked ? "refund" : policy.payoutParked ? "payout" : "balance";
    actions.push({ kind: "claimUnclaimed", amount: unclaimedAmount, reason });
  }
  if (policy.nftParked) actions.push({ kind: "claimPosition", policyId: BigInt(policy.policyId) });
  return actions;
}
