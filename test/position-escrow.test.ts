import { describe, expect, it } from "vitest";
import { mergeEscrowedTokenIds } from "@/lib/contracts/position-escrow";

describe("mergeEscrowedTokenIds (AE8)", () => {
  it("keeps a position the vault holds in the list, labelled covered", () => {
    const { tokenIds, holdByTokenId } = mergeEscrowedTokenIds([1n], [{ tokenId: "42", state: "escrowed" }]);
    expect(tokenIds).toEqual([1n, 42n]);
    expect(holdByTokenId.get("42")).toBe("covered");
    expect(holdByTokenId.has("1")).toBe(false);
  });

  it("lists a token once when the indexer lags behind a return", () => {
    const { tokenIds } = mergeEscrowedTokenIds([42n], [{ tokenId: "42", state: "escrowed" }]);
    expect(tokenIds).toEqual([42n]);
  });

  it("ignores escrow cycles that are over", () => {
    const { tokenIds, holdByTokenId } = mergeEscrowedTokenIds(
      [],
      [
        { tokenId: "7", state: "returned" },
        { tokenId: "8", state: "claimed" },
      ],
    );
    expect(tokenIds).toEqual([]);
    expect(holdByTokenId.size).toBe(0);
  });

  it("marks a parked NFT as parked so the owner can claim it", () => {
    const { holdByTokenId, tokenIds } = mergeEscrowedTokenIds([], [{ tokenId: "9", state: "parked" }]);
    expect(holdByTokenId.get("9")).toBe("parked");
    expect(tokenIds).toEqual([9n]);
  });
});
