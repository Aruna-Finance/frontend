"use client";

import { useCallback } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { walletCopy } from "@/lib/content/copy";
import { needsSwitch } from "@/lib/contracts/chain-guard";
import { supportedChain } from "@/lib/contracts/config";
import { toast } from "@/lib/toast";

const TOAST_ID = "wrong-network";

export interface UseChainGuardResult {
  isWrongNetwork: boolean;
  // Asks the wallet to move to the supported chain. Resolves true once there.
  switchToSupported: () => Promise<boolean>;
  // For write flows: true when it is safe to send. On a wrong network it asks
  // the wallet to switch and returns false, so nothing is sent from there.
  ensureSupportedChain: () => Promise<boolean>;
}

export function useChainGuard(): UseChainGuardResult {
  const { chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const isWrongNetwork = needsSwitch(chainId, supportedChain.id);

  const switchToSupported = useCallback(async () => {
    try {
      await switchChainAsync({ chainId: supportedChain.id });
      return true;
    } catch (error) {
      toast.error(error, { id: TOAST_ID, title: walletCopy.switchFailedTitle });
      return false;
    }
  }, [switchChainAsync]);

  const ensureSupportedChain = useCallback(async () => {
    if (!isWrongNetwork) return true;
    toast.error(walletCopy.wrongNetworkTitle, { id: TOAST_ID, description: walletCopy.wrongNetworkBody });
    await switchToSupported();
    return false;
  }, [isWrongNetwork, switchToSupported]);

  return { isWrongNetwork, switchToSupported, ensureSupportedChain };
}
