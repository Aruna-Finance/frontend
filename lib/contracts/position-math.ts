// Uniswap v3's own liquidity -> token amounts formula (whitepaper §2.2),
// using sqrt(price) = 1.0001^(tick/2). Display precision only (plain floats):
// liquidity can be far larger than float64 can hold exactly, but the
// resulting relative error is negligible for a UI number, and this is never
// used for anything that pays out real value.
export interface PositionAmounts {
  amount0: number;
  amount1: number;
}

export function positionTokenAmounts(
  liquidity: bigint,
  tickLower: number,
  tickUpper: number,
  currentTick: number,
): PositionAmounts {
  const l = Number(liquidity);
  const sqrtCurrent = 1.0001 ** (currentTick / 2);
  const sqrtLower = 1.0001 ** (tickLower / 2);
  const sqrtUpper = 1.0001 ** (tickUpper / 2);

  if (currentTick <= tickLower) {
    return { amount0: l * (1 / sqrtLower - 1 / sqrtUpper), amount1: 0 };
  }
  if (currentTick >= tickUpper) {
    return { amount0: 0, amount1: l * (sqrtUpper - sqrtLower) };
  }
  return {
    amount0: l * (1 / sqrtCurrent - 1 / sqrtUpper),
    amount1: l * (sqrtCurrent - sqrtLower),
  };
}
