// CoverVault.buyCover refuses a policy whose maxPayout is below
// capacity / policyCap (BelowMinPayout), where capacity is the vault's capital
// times its utilization ceiling. The floor moves with cohort capital, so a
// position that was big enough when it was sized can fall under it later.
export function minPayoutFloor(totalCapital: bigint, maxUtilizationBps: bigint, policyCap: bigint): bigint {
  if (policyCap === 0n) return 0n;
  return (totalCapital * maxUtilizationBps) / 10_000n / policyCap;
}

export interface PayoutFloorCheck {
  ok: boolean;
  floor: bigint;
}

// Whether buyCover would accept this maxPayout right now. Checked before a
// transaction is sent, because a buy below the floor only fails on-chain.
export function meetsPayoutFloor(
  maxPayout: bigint,
  totalCapital: bigint,
  maxUtilizationBps: bigint,
  policyCap: bigint,
): PayoutFloorCheck {
  const floor = minPayoutFloor(totalCapital, maxUtilizationBps, policyCap);
  return { ok: totalCapital === 0n || maxPayout >= floor, floor };
}
