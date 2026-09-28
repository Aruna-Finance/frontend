// Uniswap v3 tick helpers. A tick i is the price 1.0001^i of token0 in token1,
// in raw base units, so human prices need the decimals difference applied.

export function tickToPrice(tick: number, decimals0: number, decimals1: number, invert = false): number {
  const price = 1.0001 ** tick * 10 ** (decimals0 - decimals1);
  return invert ? 1 / price : price;
}

// Uniswap treats a position as active while tickLower <= tick < tickUpper.
export function isPositionInRange(tickLower: number, tickUpper: number, currentTick: number): boolean {
  return currentTick >= tickLower && currentTick < tickUpper;
}
