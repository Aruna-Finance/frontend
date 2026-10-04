// Storm mode: while a tab is open, keep the shared sandbox pool moving so cohorts
// accumulate realized variance and covers can pay out. Calm does nothing.
//
// Calibrated on an anvil fork of the sandbox (tenor 3600, sample interval 60,
// pool liquidity ~2.6e13): swapping 2e10 raw every interval adds about 2.7e12
// (WAD) of sum-of-squared-returns per sample, so one hour of Storm clears a
// demo cover's breakeven (~2.4e13) several times over. The earlier 2e9 pay-run
// swing barely moves the tick at today's liquidity.
export const STORM = {
  swapIn: 20_000_000_000n,
  // Pool liquidity swapIn was calibrated at. Every faucet position adds ~2.6e12
  // in range, and the tick move per swap shrinks as 1/L, so swapAmount scales
  // the swing back up to keep the variance per sample where it was measured.
  refLiquidity: 26_000_000_000_000n,
  // Tokens the burner mints itself (mint is permissionless) when it runs low.
  tokenTopUp: 1_000_000_000_000n,
  // Burner ETH: stop below minGasWei, and ask the user to fund fundWei.
  minGasWei: 100_000_000_000_000n,
  fundWei: 2_000_000_000_000_000n,
} as const;

// "down" swaps token0 in (zeroForOne), which lowers the tick; "up" the reverse.
export type SwapDirection = "down" | "up";

// Equal raw amounts in both directions are not symmetric (price ratio and the
// 0.3% fee), so alternating blindly drifts the tick away over hours. Steering
// by the tick instead keeps it oscillating around where the storm started, and
// also corrects drift caused by other visitors.
export function chooseDirection(tick: number, refTick: number): SwapDirection {
  return tick > refTick ? "down" : "up";
}

export function pokeDue(lastSampleAt: number, sampleInterval: number, now: number): boolean {
  return lastSampleAt === 0 || now >= lastSampleAt + sampleInterval;
}

// Each sample is the TWAP over the interval before it, so a swap only counts in
// full if the price sits at its new level for the whole interval. Swapping right
// after a sample lands does that; a swap mid-interval averages the old and new
// levels and roughly quarters the variance (measured on the live sandbox, where
// the operator also pokes every interval). So wake just after the next sample
// is due, with a small margin for clock skew against block time.
export const SAMPLE_ALIGN_MARGIN_MS = 1_500;

export function msUntilNextSample(lastSampleAt: number, sampleInterval: number, nowMs: number): number {
  if (lastSampleAt === 0) return 0;
  return Math.max(0, (lastSampleAt + sampleInterval) * 1000 - nowMs + SAMPLE_ALIGN_MARGIN_MS);
}

export interface StormDeps {
  now(): number;
  sampleInterval: number;
  refTick: number;
  readTick(): Promise<number>;
  readLastSampleAt(): Promise<number>;
  poke(): Promise<void>;
  swap(direction: SwapDirection): Promise<void>;
}

export interface StormStepResult {
  poked: boolean;
  direction: SwapDirection;
}

// One interval of Storm: record a sample if one is due (it captures the price
// before the swap), then push the price. A throttled poke (a keeper got there
// first) is fine: the swap still lands in this interval.
export async function stormStep(deps: StormDeps): Promise<StormStepResult> {
  const due = pokeDue(await deps.readLastSampleAt(), deps.sampleInterval, deps.now());
  if (due) await deps.poke();
  const direction = chooseDirection(await deps.readTick(), deps.refTick);
  await deps.swap(direction);
  return { poked: due, direction };
}

// Whether the burner can keep going: needs gas, and enough of the token it
// would spend next. Token shortfalls are topped up by minting, not by stopping.
export function canContinue(ethWei: bigint): boolean {
  return ethWei >= STORM.minGasWei;
}

export function needsTokenTopUp(balance: bigint, swapIn: bigint = STORM.swapIn): boolean {
  return balance < swapIn * 4n;
}

// Swap size for the pool's current in-range liquidity: never below the
// calibrated swapIn, growing proportionally once visitors add liquidity.
export function swapAmount(liquidity: bigint): bigint {
  const scaled = (STORM.swapIn * liquidity) / STORM.refLiquidity;
  return scaled > STORM.swapIn ? scaled : STORM.swapIn;
}
