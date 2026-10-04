import { describe, expect, it } from "vitest";
import { meetsPayoutFloor, minPayoutFloor } from "@/lib/contracts/payout-floor";

// The incident: cohort 27 held 400.4M USDC; its floor is capacity / policyCap =
// 400.4M * 80% / 20 = 16.0M USDC (1.6e13 raw). A faucet-sized position at
// 3.88e12 raw reverted BelowMinPayout on-chain.
const CAP_27 = 400_439_276_345_837n;

describe("minPayoutFloor", () => {
  it("is capacity over the policy cap, matching CoverVault.buyCover", () => {
    expect(minPayoutFloor(CAP_27, 8_000n, 20n)).toBe(16_017_571_053_833n);
  });

  it("is zero when the cap is zero rather than dividing by zero", () => {
    expect(minPayoutFloor(CAP_27, 8_000n, 0n)).toBe(0n);
  });
});

describe("meetsPayoutFloor", () => {
  // Covers the reported failure: a position below the floor must be refused
  // before a transaction is sent.
  it("refuses a position whose maxPayout is below the floor (the reverted buy)", () => {
    const result = meetsPayoutFloor(3_878_623_838_972n, CAP_27, 8_000n, 20n);
    expect(result.ok).toBe(false);
    expect(result.floor).toBe(16_017_571_053_833n);
  });

  it("accepts a position at or above the floor", () => {
    expect(meetsPayoutFloor(16_017_571_053_833n, CAP_27, 8_000n, 20n).ok).toBe(true);
    expect(meetsPayoutFloor(20_000_000_000_000n, CAP_27, 8_000n, 20n).ok).toBe(true);
  });

  it("accepts anything while the vault has no capital yet", () => {
    expect(meetsPayoutFloor(1n, 0n, 8_000n, 20n).ok).toBe(true);
  });
});
