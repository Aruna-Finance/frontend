import { mockVaultRealizedVolPercent, mockVaults } from "@/lib/mock/vaults";
import type { Vault } from "@/types/domain";

export interface UseVaultsResult {
  data: Vault[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useVaults(): UseVaultsResult {
  return { data: mockVaults, isLoading: false, isError: false };
}

export interface UseVaultResult {
  data: Vault | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useVault(vaultId: string): UseVaultResult {
  const vault = mockVaults.find((item) => item.id === vaultId);
  return { data: vault, isLoading: false, isError: false };
}

export interface UseVaultRealizedVolResult {
  data: number | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Realized vol is cohort-scoped, but only the featured vault has a full mock
// Cohort record today (lib/mock/cohorts.ts). This covers every vault until
// each one gets its own cohort history.
export function useVaultRealizedVol(vaultId: string): UseVaultRealizedVolResult {
  return { data: mockVaultRealizedVolPercent[vaultId], isLoading: false, isError: false };
}
