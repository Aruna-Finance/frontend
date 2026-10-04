import { arunaAddresses, arunaV0Addresses } from "./addresses";
import { supportedChain } from "./config";

// A friendly "TOKEN0 / TOKEN1 · fee" label (and the symbols for their pair
// icon) needs each pool's token symbols, which the indexer doesn't store and
// reading on demand (per pool, per row) isn't worth it while there's exactly
// one real vault. Known pools are hardcoded here; anything else falls back
// to a shortened pool address so it never lies about a pair it doesn't
// actually know. Both the v2 sandbox pool (current live reads/writes) and
// the v0 pool (what the indexer - still unwired for v2 - returns for its one
// listed vault) are kept, so neither source shows an unlabeled address.
const KNOWN_POOLS: Record<string, { label: string; feeTier: string; symbols: readonly [string, string] }> = {
  [arunaAddresses.pool.toLowerCase()]: { label: "mWETH / mUSDC", feeTier: "0.30%", symbols: ["mWETH", "mUSDC"] },
  [arunaV0Addresses.pool.toLowerCase()]: { label: "mWETH / mUSDC", feeTier: "0.30%", symbols: ["mWETH", "mUSDC"] },
};

export function derivePoolInfo(poolAddress: string): {
  poolLabel: string;
  poolFeeTier: string;
  symbols: readonly [string, string] | null;
} {
  const known = KNOWN_POOLS[poolAddress.toLowerCase()];
  if (known) return { poolLabel: known.label, poolFeeTier: known.feeTier, symbols: known.symbols };
  return {
    poolLabel: `${poolAddress.slice(0, 6)}…${poolAddress.slice(-4)}`,
    poolFeeTier: "?",
    symbols: null,
  };
}

export const chainLabel = supportedChain.name;
