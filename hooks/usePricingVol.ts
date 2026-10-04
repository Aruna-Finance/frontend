"use client";

import { useReadContracts } from "wagmi";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { varianceWadToVolPercent } from "@/lib/contracts/units";

// The volatility the pricer charges against: the vault's EWMA of realized
// variance, annualized, as a percent. A cohort's premium uses the snapshot of
// this value taken when the cohort starts, so it can differ slightly from the
// live number between cohorts. Null until the EWMA has been fed by a finished
// cohort (then there is nothing to price against yet).
export function usePricingVol(vaultId: string): { volPercent: number | null; isLoading: boolean } {
  const address = vaultId as Address;
  const query = useReadContracts({
    contracts: [
      { address, abi: coverVaultAbi, functionName: "ewmaVariance" },
      { address, abi: coverVaultAbi, functionName: "ewmaEverUpdated" },
    ],
    query: { enabled: Boolean(vaultId), refetchInterval: 60_000 },
  });
  const ewma = query.data?.[0]?.result as bigint | undefined;
  const updated = query.data?.[1]?.result as boolean | undefined;
  const volPercent = updated && ewma !== undefined && ewma > 0n ? varianceWadToVolPercent(ewma) : null;
  return { volPercent, isLoading: query.isPending };
}
