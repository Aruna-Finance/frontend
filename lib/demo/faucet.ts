// The demo faucet: mint testnet tokens to the connected wallet and open a Uniswap
// position in the vault's pool, so a visitor can protect a position right away.
// Everything here is permissionless on the sandbox: TestToken.mint has no access
// control and the Uniswap NonfungiblePositionManager is the real one.

// buyCover rejects a policy whose maxPayout is below capacity / policyCap
// (BelowMinPayout). The operator funds each cohort with 1e14, so that floor is
// 1e14 * 80% / 20 = 4e12. The `pay` run's 1e11 per token lands at ~3.87e12 and
// reverts; 1.25e11 per token, +/-1000 ticks, gives ~4.83e12 (measured on a fork
// of the sandbox, cohort 24), leaving room for visitor deposits that raise the
// floor. 16 such policies fill one cohort.
// mUSDC is token0 (6 decimals) and mWETH token1 (18), and the pool price is a
// placeholder ratio, so the raw amounts are roughly equal on purpose.
export const FAUCET = {
  positionAmount0: 125_000_000_000n,
  positionAmount1: 125_000_000_000n,
  halfWidthTicks: 1000,
  // mUSDC kept in the wallet for deposits and premiums (1,000,000 mUSDC).
  usdcTarget: 1_000_000_000_000n,
  // mWETH is only needed for the position; keep headroom for a second one.
  wethTarget: 300_000_000_000n,
  // Below this the wallet cannot pay gas for the faucet itself.
  minGasWei: 200_000_000_000_000n,
  deadlineSeconds: 600,
  // maxPayout of a positionAmount0/1 position (measured, see above). maxPayout
  // scales linearly with the amounts for a fixed range, which positionAmounts
  // uses to size the position for whatever floor the cohort has.
  refMaxPayout: 4_830_000_000_000n,
  // Aim this far above the floor, so deposits landing after the faucet (which
  // raise the floor) do not push the position back under it.
  floorHeadroomBps: 12_000n,
} as const;

export interface PositionAmounts {
  amount0: bigint;
  amount1: bigint;
}

// buyCover's floor: capacity / policyCap, where capacity is
// totalCapital * maxUtilizationBps / 10000 (CoverVault.buyCover, BelowMinPayout).
export function minPayoutFloor(totalCapital: bigint, maxUtilizationBps: bigint, policyCap: bigint): bigint {
  if (policyCap === 0n) return 0n;
  return (totalCapital * maxUtilizationBps) / 10_000n / policyCap;
}

// Position size whose maxPayout clears `floor` with headroom; never below the
// calibrated default. Operator capital per cohort is not fixed (a roll can land
// on top of a deposit), so a fixed faucet size can fall under the floor.
export function positionAmounts(floor: bigint): PositionAmounts {
  const target = (floor * FAUCET.floorHeadroomBps) / 10_000n;
  if (target <= FAUCET.refMaxPayout) return { amount0: FAUCET.positionAmount0, amount1: FAUCET.positionAmount1 };
  const scale = (amount: bigint) => (amount * target + FAUCET.refMaxPayout - 1n) / FAUCET.refMaxPayout;
  return { amount0: scale(FAUCET.positionAmount0), amount1: scale(FAUCET.positionAmount1) };
}

export const ETH_FAUCET_LINKS = [
  { label: "Alchemy Arbitrum Sepolia faucet", href: "https://www.alchemy.com/faucets/arbitrum-sepolia" },
  { label: "QuickNode Arbitrum Sepolia faucet", href: "https://faucet.quicknode.com/arbitrum/sepolia" },
] as const;

export interface TickRange {
  tickLower: number;
  tickUpper: number;
}

// Range centred on the current tick, snapped to the pool's tick spacing (the
// centre floors toward negative infinity, the half width rounds up), so the
// current tick is always strictly inside it.
export function positionRange(tick: number, tickSpacing: number, halfWidthTicks: number): TickRange {
  const center = Math.floor(tick / tickSpacing) * tickSpacing;
  const half = Math.ceil(halfWidthTicks / tickSpacing) * tickSpacing;
  return { tickLower: center - half, tickUpper: center + half };
}

export type FaucetStepId = "mintUsdc" | "mintWeth" | "approveUsdc" | "approveWeth" | "mintPosition";

export interface FaucetStep {
  id: FaucetStepId;
  // Raw token amount for mint and approve steps.
  amount?: bigint;
}

export interface FaucetState {
  usdcBalance: bigint;
  wethBalance: bigint;
  usdcAllowance: bigint;
  wethAllowance: bigint;
  // Steps already mined in this run, so a retry resumes instead of repeating them.
  done?: ReadonlySet<FaucetStepId>;
  // Position size; defaults to the calibrated FAUCET amounts.
  position?: PositionAmounts;
}

// The transactions still needed, in order. Mints top the wallet up to its
// target (skipped when already there); approvals are skipped when the NFPM
// already has enough allowance; the position mint is always last.
export function faucetPlan(state: FaucetState): FaucetStep[] {
  const done = state.done ?? new Set<FaucetStepId>();
  const steps: FaucetStep[] = [];
  const { amount0, amount1 } = state.position ?? { amount0: FAUCET.positionAmount0, amount1: FAUCET.positionAmount1 };
  // Keep the usual wallet balance, plus whatever a larger position needs.
  const usdcTarget = FAUCET.usdcTarget > amount0 * 2n ? FAUCET.usdcTarget : amount0 * 2n;
  const wethTarget = FAUCET.wethTarget > amount1 * 2n ? FAUCET.wethTarget : amount1 * 2n;

  if (state.usdcBalance < usdcTarget) steps.push({ id: "mintUsdc", amount: usdcTarget - state.usdcBalance });
  if (state.wethBalance < wethTarget) steps.push({ id: "mintWeth", amount: wethTarget - state.wethBalance });
  // Position creation needs the balances to be there even when no mint is needed.
  if (state.usdcAllowance < amount0) steps.push({ id: "approveUsdc", amount: amount0 });
  if (state.wethAllowance < amount1) steps.push({ id: "approveWeth", amount: amount1 });
  steps.push({ id: "mintPosition" });

  return steps.filter((step) => !done.has(step.id));
}
