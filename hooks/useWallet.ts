import { mockConnectedWallet } from "@/lib/mock/wallet";

export interface UseWalletResult {
  address: string | undefined;
  isConnected: boolean;
}

// Mirrors wagmi's useAccount() shape so swapping the implementation later
// does not change what callers destructure.
export function useWallet(): UseWalletResult {
  return {
    address: mockConnectedWallet.isConnected ? mockConnectedWallet.address : undefined,
    isConnected: mockConnectedWallet.isConnected,
  };
}
