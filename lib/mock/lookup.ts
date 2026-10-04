// Plain mock lookups for the pages that intentionally still run on full mock
// data end to end (Quote, Confirm, Active, Settlement, UW Dashboard, UW
// Settlement, UW Deposit - wiring them to the indexer/contracts is later,
// separate work). hooks/useVaults.ts, hooks/useCohort.ts and
// hooks/usePosition.ts now read real data and are "use client", so importing
// them from these still-async Server Component pages would either crash the
// build or (for the vault/cohort ones) always come back empty since these
// pages' mock ids don't exist on-chain. This file mirrors the selection
// logic those hooks used to have, against the same mock arrays, so these
// pages keep behaving exactly as before.
import { mockCohorts } from "./cohorts";
import { mockPositionCovers, mockPositions } from "./positions";
import { mockVaults } from "./vaults";
import type { Cohort, Position, PositionCover, Vault } from "@/types/domain";

export function findMockVault(vaultId: string): Vault | undefined {
  return mockVaults.find((item) => item.id === vaultId);
}

// No cohortId -> the vault's active cohort, falling back to any cohort it has.
export function findMockCohort(vaultId: string, cohortId?: number): Cohort | undefined {
  return cohortId !== undefined
    ? mockCohorts.find((item) => item.vaultId === vaultId && item.id === cohortId)
    : (mockCohorts.find((item) => item.vaultId === vaultId && item.status === "ACTIVE") ??
        mockCohorts.find((item) => item.vaultId === vaultId));
}

export function findMockPosition(tokenId: string): Position | undefined {
  return mockPositions.find((item) => item.tokenId === tokenId);
}

export function findMockCoversForPosition(tokenId: string): PositionCover[] {
  return mockPositionCovers.filter((cover) => cover.positionId === tokenId);
}
