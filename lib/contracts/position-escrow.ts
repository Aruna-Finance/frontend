// While a policy covers a Uniswap position, the vault holds the NFT, so it drops
// out of the wallet's own `tokenOfOwnerByIndex` list. The indexer's
// positionEscrow rows say which of the wallet's positions the vault holds.
export type PositionHold = "covered" | "parked";

export interface EscrowRow {
  tokenId: string;
  state: string;
}

export function mergeEscrowedTokenIds(
  ownedIds: readonly bigint[],
  escrows: readonly EscrowRow[],
): { tokenIds: bigint[]; holdByTokenId: Map<string, PositionHold> } {
  const holdByTokenId = new Map<string, PositionHold>();
  for (const row of escrows) {
    if (row.state === "escrowed") holdByTokenId.set(row.tokenId, "covered");
    // A parked NFT is still held by the vault until the owner claims it.
    else if (row.state === "parked") holdByTokenId.set(row.tokenId, "parked");
  }
  const seen = new Set(ownedIds.map((id) => id.toString()));
  const tokenIds = [...ownedIds];
  for (const tokenId of holdByTokenId.keys()) {
    if (!seen.has(tokenId)) {
      seen.add(tokenId);
      tokenIds.push(BigInt(tokenId));
    }
  }
  return { tokenIds, holdByTokenId };
}
