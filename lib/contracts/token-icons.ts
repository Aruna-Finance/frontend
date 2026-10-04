// Real logos for the well-known tokens this testnet's mocks stand in for
// (trustwallet/assets, the same source most wallets and explorers use).
// Testnet tokens are commonly minted with a prefix to mark them as mocks
// (mUSDC, mWETH, ...) - stripped before matching, so they still resolve to
// the real token's icon rather than one made up for a test deployment.
const ICON_BY_SYMBOL: Record<string, string> = {
  USDC: "/images/tokens/usdc.png",
  WETH: "/images/tokens/weth.png",
  ARB: "/images/tokens/arb.png",
  DAI: "/images/tokens/dai.png",
  USDT: "/images/tokens/usdt.png",
  WBTC: "/images/tokens/wbtc.png",
};

export function tokenIconPath(symbol: string): string | null {
  const key = symbol.toUpperCase();
  if (ICON_BY_SYMBOL[key]) return ICON_BY_SYMBOL[key];
  if (key.startsWith("M") && ICON_BY_SYMBOL[key.slice(1)]) return ICON_BY_SYMBOL[key.slice(1)];
  return null;
}
