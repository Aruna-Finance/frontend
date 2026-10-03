"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { useContractTx } from "./useContractTx";

export interface RollToRequest {
  vault: Address;
  fromCohort: number;
  toCohort: number;
}

// CoverVault.rollTo(fromCohort, toCohort) — moves fromCohort's net (deposit +
// premium share - claim share) straight into toCohort, no token transfer.
// fromCohort must be SETTLED and toCohort must be FUNDING. During the
// settlement gap toCohort is usually fromCohort + 1; a late roll (after
// toCohort's own startsAt) must target fromCohort + 2 instead.
export function useRollTo() {
  const { send, isPending } = useContractTx();

  const rollTo = useCallback(
    ({ vault, fromCohort, toCohort }: RollToRequest) => {
      return send(
        { address: vault, abi: coverVaultAbi, functionName: "rollTo", args: [fromCohort, toCohort] },
        {
          id: `roll-${vault}-${fromCohort}-${toCohort}`,
          submitted: "Roll submitted",
          confirmed: "Roll confirmed",
          confirmedDescription: `Cohort ${fromCohort} → cohort ${toCohort}.`,
          failed: "Roll failed",
        },
      );
    },
    [send],
  );

  return { rollTo, isPending };
}
