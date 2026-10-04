import { describe, expect, it } from "vitest";
import { claimActions } from "@/lib/indexer/claims";

const OWNER = "0xbd47cf97cf9ba9c1371f3ee7daa7a2788abbbac7";
const policy = { policyId: "7", owner: OWNER, payoutParked: false, refundParked: false, nftParked: false };

describe("claimActions (AE4)", () => {
  it("offers claimUnclaimed for a parked payout, and nothing once the balance is zero", () => {
    const parked = { ...policy, payoutParked: true };
    expect(claimActions(parked, OWNER, 386_945n)).toEqual([
      { kind: "claimUnclaimed", amount: 386_945n, reason: "payout" },
    ]);
    expect(claimActions(parked, OWNER, 0n)).toEqual([]);
  });

  it("labels a parked refund as a refund", () => {
    const parked = { ...policy, refundParked: true };
    expect(claimActions(parked, OWNER, 400_000n)[0]).toMatchObject({ reason: "refund" });
  });

  it("offers claimPosition when the NFT is parked", () => {
    expect(claimActions({ ...policy, nftParked: true }, OWNER, 0n)).toEqual([
      { kind: "claimPosition", policyId: 7n },
    ]);
  });

  it("offers both when both are held", () => {
    const both = claimActions({ ...policy, payoutParked: true, nftParked: true }, OWNER, 5n);
    expect(both.map((a) => a.kind)).toEqual(["claimUnclaimed", "claimPosition"]);
  });

  it("shows nothing when nothing is parked", () => {
    expect(claimActions(policy, OWNER, 0n)).toEqual([]);
  });

  it("shows nothing to a wallet that does not own the policy, or when disconnected", () => {
    const parked = { ...policy, payoutParked: true, nftParked: true };
    expect(claimActions(parked, "0x0000000000000000000000000000000000000001", 9n)).toEqual([]);
    expect(claimActions(parked, undefined, 9n)).toEqual([]);
  });

  it("compares owners case-insensitively", () => {
    expect(claimActions({ ...policy, payoutParked: true }, OWNER.toUpperCase().replace("0X", "0x"), 1n)).toHaveLength(1);
  });
});
