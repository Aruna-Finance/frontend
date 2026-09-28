"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { useAccount, useConnect, useConnectors, useDisconnect, type Connector } from "wagmi";
import { walletCopy } from "@/lib/content/copy";
import { shortenAddress } from "@/lib/format";
import { toast } from "@/lib/toast";

export interface UseWalletResult {
  address: Address | undefined;
  isConnected: boolean;
  isConnecting: boolean;
  // True while wagmi restores a previous session after a page load.
  isReconnecting: boolean;
  // uid of the connector currently waiting on the wallet prompt, if any.
  connectingId: string | undefined;
  connectors: readonly Connector[];
  connect: (connector?: Connector) => void;
  disconnect: () => void;
}

const TOAST_ID = "wallet-connect";

function toastNoWallet() {
  toast.error(walletCopy.noWalletTitle, { id: TOAST_ID, description: walletCopy.noWalletBody });
}

// Wraps wagmi's account state and reports every outcome through toasts, so
// pages call connect() and never write their own error handling.
export function useWallet(): UseWalletResult {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const connectors = useConnectors();
  const { mutate: connectMutate, isPending, variables } = useConnect();
  const { mutate: disconnectMutate } = useDisconnect();

  const connect = useCallback(
    (selected?: Connector) => {
      const connector = selected ?? connectors[0];
      if (!connector) {
        toastNoWallet();
        return;
      }
      connectMutate(
        { connector },
        {
          onSuccess: (data) => {
            const [account] = data.accounts;
            toast.success(walletCopy.connectedTitle, {
              id: TOAST_ID,
              description: account ? shortenAddress(account) : undefined,
            });
          },
          onError: (error) => {
            // wagmi's ConnectErrorType does not list this one, but the injected
            // connector throws it when the browser has no wallet extension.
            if ((error.name as string) === "ProviderNotFoundError") {
              toastNoWallet();
              return;
            }
            toast.error(error, { id: TOAST_ID, title: walletCopy.connectFailedTitle });
          },
        },
      );
    },
    [connectors, connectMutate],
  );

  const disconnect = useCallback(() => {
    disconnectMutate(undefined, {
      onSuccess: () => toast.success(walletCopy.disconnectedTitle, { id: TOAST_ID }),
      onError: (error) => toast.error(error, { id: TOAST_ID, title: walletCopy.disconnectFailedTitle }),
    });
  }, [disconnectMutate]);

  const connectingId = isPending ? (variables?.connector as Connector | undefined)?.uid : undefined;

  return { address, isConnected, isConnecting, isReconnecting, connectingId, connectors, connect, disconnect };
}
