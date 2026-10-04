"use client";

import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { useChainGuard } from "@/hooks/useChainGuard";
import { explorerTxUrl, supportedChain } from "@/lib/contracts/config";
import { getContractErrorMessage } from "@/lib/contracts/errors";
import { toast } from "@/lib/toast";
import type { ToastAction } from "@/types/aruna";

export interface TxLabels {
  // Toast id. One id per flow, so submitted -> confirmed replaces in place.
  id: string;
  submitted: string;
  confirmed: string;
  failed: string;
  confirmedDescription?: string;
}

// Indexer lag after a confirmed write; see the refetch below.
const INDEXER_REFETCH_DELAYS_MS = [0, 4_000, 12_000];

type WriteRequest = Parameters<ReturnType<typeof useWriteContract>["writeContractAsync"]>[0];

// One contract write, start to finish: wallet prompt, submitted, mined.
// Every stage is reported as a toast (rejection, revert and RPC errors
// included), so callers only decide what to do next based on the boolean.
export function useContractTx() {
  const config = useConfig();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const { ensureSupportedChain } = useChainGuard();
  const [isPending, setIsPending] = useState(false);

  const send = useCallback(
    async (request: WriteRequest, labels: TxLabels): Promise<boolean> => {
      // Wrong network: ask for a switch and send nothing from here.
      if (!(await ensureSupportedChain())) return false;
      setIsPending(true);
      // Set once the wallet has signed, so later failures can link the tx.
      let action: ToastAction | undefined;
      try {
        const hash = await writeContractAsync({ ...request, chainId: supportedChain.id });
        action = { label: "View on explorer", href: explorerTxUrl(hash) };
        toast.success(labels.submitted, {
          id: labels.id,
          description: "Waiting for confirmation…",
          action,
          duration: Infinity,
        });

        const receipt = await waitForTransactionReceipt(config, { hash });
        if (receipt.status !== "success") {
          toast.error(labels.failed, {
            id: labels.id,
            description: "The transaction was reverted on-chain.",
            action,
          });
          return false;
        }

        toast.success(labels.confirmed, { id: labels.id, description: labels.confirmedDescription, action });
        // Balances and allowances just changed; refetch every on-chain read.
        await queryClient.invalidateQueries({ queryKey: ["readContract"] });
        // The indexer trails the chain by a few seconds: refetch now and again
        // once it has had time to catch up, so pages reflect the write.
        for (const delay of INDEXER_REFETCH_DELAYS_MS) {
          setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["indexer"] }), delay);
        }
        return true;
      } catch (error) {
        // wagmi's receipt wait itself throws when the tx reverted, so this is
        // also the path for on-chain reverts. Prefer the decoded CoverVault
        // error's own copy over viem's generic revert message when we have it.
        const description = getContractErrorMessage(error);
        toast.error(error, { id: labels.id, title: labels.failed, action, ...(description ? { description } : {}) });
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [config, queryClient, writeContractAsync, ensureSupportedChain],
  );

  return { send, isPending };
}
