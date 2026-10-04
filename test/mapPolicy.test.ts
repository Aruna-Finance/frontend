import { describe, expect, it } from "vitest";
import { coverStatusOf, isActivePolicy, isFinalPolicy, mapPolicyToCover } from "@/lib/indexer/mapPolicy";
import type { IndexerPolicy } from "@/lib/indexer/types";

const base: IndexerPolicy = {
  vault: "0x7e14ef9e5ef153c3f0420bb80d13c1c7f7dda44f",
  policyId: "1",
  cohortId: 3,
  owner: "0xbd47cf97cf9ba9c1371f3ee7daa7a2788abbbac7",
  positionTokenId: "42",
  premium: "400000",
  maxPayout: "3920000",
  varNotional: "1000000",
  strikeAnnualized: "200000000000000",
  coveredSeconds: 3600,
  purchasedAt: 1790000000,
  startIndex: null,
  startSumSq: null,
  status: "Active",
  payout: null,
  refund: null,
  payoutParked: false,
  refundParked: false,
  nftParked: false,
  boughtAt: "1790000000",
  settledAt: null,
  cohortRef: null,
};

describe("policy status mapping (AE1)", () => {
  it("Active maps to a running cover with no net result", () => {
    const cover = mapPolicyToCover(base);
    expect(cover.status).toBe("active");
    expect(cover.netResultUsdc).toBeNull();
    expect(cover.refundUsdc).toBeNull();
  });

  it("Settled with a payout is paid_out and nets payout minus premium", () => {
    const cover = mapPolicyToCover({ ...base, status: "Settled", payout: "1400000", settledAt: "1790003600" });
    expect(cover.status).toBe("paid_out");
    expect(cover.netResultUsdc).toBeCloseTo(1.0);
  });

  it("Settled with zero or null payout is no_payout and loses the premium", () => {
    expect(mapPolicyToCover({ ...base, status: "Settled", payout: "0", settledAt: "1" }).status).toBe("no_payout");
    const cover = mapPolicyToCover({ ...base, status: "Settled", payout: null, settledAt: "1" });
    expect(cover.status).toBe("no_payout");
    expect(cover.netResultUsdc).toBeCloseTo(-0.4);
  });

  it("Refunded exposes the refund, not a payout", () => {
    const cover = mapPolicyToCover({ ...base, status: "Refunded", refund: "400000", payout: null, settledAt: "1" });
    expect(cover.status).toBe("refunded");
    expect(cover.refundUsdc).toBeCloseTo(0.4);
    expect(cover.netResultUsdc).toBeCloseTo(0);
  });

  it("Cancelled is never active", () => {
    const cover = mapPolicyToCover({ ...base, status: "Cancelled" });
    expect(cover.status).toBe("cancelled");
    expect(cover.netResultUsdc).toBeNull();
  });

  it("an unknown status throws instead of defaulting to active", () => {
    expect(() => coverStatusOf({ status: "Paused" as never, payout: null })).toThrow(/unknown policy status/);
  });

  it("only Active counts as an active cover; Settled and Refunded are final", () => {
    expect(isActivePolicy({ status: "Active" })).toBe(true);
    expect(isActivePolicy({ status: "Cancelled" })).toBe(false);
    expect(isFinalPolicy({ status: "Settled" })).toBe(true);
    expect(isFinalPolicy({ status: "Refunded" })).toBe(true);
    expect(isFinalPolicy({ status: "Cancelled" })).toBe(false);
  });
});
