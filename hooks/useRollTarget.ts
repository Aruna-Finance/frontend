"use client";

import { useCallback } from "react";
import { rollTarget } from "@/lib/contracts/cohort-id";
import { useVaultRawByAddress } from "@/hooks/useVaults";

// Where a settled cohort's capital can roll: n+1 while it is FUNDING (the gap,
// or n+1 not started), n+2 once n+1 has started. `resolve` recomputes against
// the clock at call time, so a click that lands after a cohort boundary still
// targets the cohort that is FUNDING right then.
export function useRollTarget(vaultId: string, fromCohort: number | undefined) {
  const raw = useVaultRawByAddress(vaultId).data ?? undefined;

  const resolve = useCallback((): number | undefined => {
    if (!raw || fromCohort === undefined) return undefined;
    const now = BigInt(Math.floor(Date.now() / 1000));
    return rollTarget(fromCohort, BigInt(raw.anchor), BigInt(raw.tenor), now, BigInt(raw.gap));
  }, [raw, fromCohort]);

  return { target: resolve(), resolve };
}
