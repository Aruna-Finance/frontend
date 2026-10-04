"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

// The three permissionless keeper calls, so anyone can drive a cohort forward.
// keeperPoke/keeperFinalize return (false, 0) instead of reverting when there
// is nothing to do; settleBatch reverts NothingToSettle when it would change nothing.
export function useKeeperActions(vault: Address) {
  const { send, isPending } = useContractTx();

  const poke = useCallback(
    () =>
      send(
        { address: vault, abi: coverVaultAbi, functionName: "keeperPoke", args: [] },
        { id: `keeper-poke-${vault}`, submitted: "Poke submitted", confirmed: "Sample recorded", failed: "Poke failed" },
      ),
    [send, vault],
  );

  const finalize = useCallback(
    (cohortId: number) =>
      send(
        { address: vault, abi: coverVaultAbi, functionName: "keeperFinalize", args: [cohortId] },
        {
          id: `keeper-finalize-${vault}-${cohortId}`,
          submitted: "Finalize submitted",
          confirmed: "Finalize confirmed",
          confirmedDescription: `Cohort ${cohortId}.`,
          failed: "Finalize failed",
        },
      ),
    [send, vault],
  );

  const settleBatch = useCallback(
    (cohortId: number, count: number) =>
      send(
        { address: vault, abi: coverVaultAbi, functionName: "settleBatch", args: [cohortId, count] },
        {
          id: `keeper-settle-${vault}-${cohortId}`,
          submitted: "Settle submitted",
          confirmed: "Policies settled",
          confirmedDescription: `Cohort ${cohortId}.`,
          failed: "Settle failed",
        },
      ),
    [send, vault],
  );

  return { poke, finalize, settleBatch, isPending };
}
