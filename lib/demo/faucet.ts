// The demo faucet: mint testnet tokens to the connected wallet and open a Uniswap
// position in the vault's pool, so a visitor can protect a position right away.
// Everything here is permissionless on the sandbox: TestToken.mint has no access
// control and the Uniswap NonfungiblePositionManager is the real one.

// Position size and width copy the `pay` run (ScenarioSetup defaults): 1e11 raw
// of each token, +/-1000 ticks. That yields a per-policy maxPayout around
// 3.9e12 raw, small enough that policyCap (20) policies fit a funded cohort.
// mUSDC is token0 (6 decimals) and mWETH token1 (18), and the pool price is a
// placeholder ratio, so the raw amounts are roughly equal on purpose.
export const FAUCET = {
  positionAmount0: 100_000_000_000n,
  positionAmount1: 100_000_000_000n,
  halfWidthTicks: 1000,
  // mUSDC kept in the wallet for deposits and premiums (1,000,000 mUSDC).
  usdcTarget: 1_000_000_000_000n,
  // mWETH is only needed for the position; keep headroom for a second one.
  wethTarget: 200_000_000_000n,
  // Below this the wallet cannot pay gas for the faucet itself.
  minGasWei: 200_000_000_000_000n,
  deadlineSeconds: 600,
} as const;

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
}

// The transactions still needed, in order. Mints top the wallet up to its
// target (skipped when already there); approvals are skipped when the NFPM
// already has enough allowance; the position mint is always last.
export function faucetPlan(state: FaucetState): FaucetStep[] {
  const done = state.done ?? new Set<FaucetStepId>();
  const steps: FaucetStep[] = [];

  if (state.usdcBalance < FAUCET.usdcTarget) steps.push({ id: "mintUsdc", amount: FAUCET.usdcTarget - state.usdcBalance });
  if (state.wethBalance < FAUCET.wethTarget) steps.push({ id: "mintWeth", amount: FAUCET.wethTarget - state.wethBalance });
  // Position creation needs the balances to be there even when no mint is needed.
  if (state.usdcAllowance < FAUCET.positionAmount0) steps.push({ id: "approveUsdc", amount: FAUCET.positionAmount0 });
  if (state.wethAllowance < FAUCET.positionAmount1) steps.push({ id: "approveWeth", amount: FAUCET.positionAmount1 });
  steps.push({ id: "mintPosition" });

  return steps.filter((step) => !done.has(step.id));
}
