import { mockVaults } from "@/lib/mock/vaults";
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
