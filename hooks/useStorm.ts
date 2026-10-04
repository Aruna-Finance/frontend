"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConfig, useSendTransaction } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { createPublicClient, createWalletClient, http, type Address } from "viem";
import { arbitrumSepolia } from "viem/chains";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import { mintableErc20Abi } from "@/lib/contracts/abis/erc20";
import { poolAbi } from "@/lib/contracts/abis/pool";
import { swapRouterAbi } from "@/lib/contracts/abis/swapRouter";
import { varianceAccumulatorAbi } from "@/lib/contracts/abis/varianceAccumulator";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { rpcUrl } from "@/lib/contracts/config";
import { burnerAccount, loadOrCreateBurnerKey } from "@/lib/demo/burner";
import { STORM, canContinue, needsTokenTopUp, stormStep, type SwapDirection } from "@/lib/demo/storm";
import { toast } from "@/lib/toast";
import { useChainGuard } from "./useChainGuard";
import { useWallet } from "./useWallet";

const { coverVault: VAULT, pool: POOL, varianceAccumulator: ACCUMULATOR, settlementToken: TOKEN0, swapRouter: ROUTER } =
  arunaAddresses;

// Enough allowance that approvals happen once per burner.
const MAX_ALLOWANCE = 2n ** 255n;
// Left in the burner when sweeping, to pay for the sweep itself.
const SWEEP_RESERVE_WEI = 20_000_000_000_000n;
const MAX_CONSECUTIVE_FAILURES = 3;

export type StormMode = "calm" | "storm";

export interface StormLogLine {
  at: number;
  text: string;
  tone: "info" | "error";
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
}

// Storm and Calm for the demo market. Storm signs transactions with a
// throwaway browser key (see lib/demo/burner) so it can act every sample
// interval without a wallet popup; it only runs while this tab is open.
export function useStorm(sampleInterval: number | undefined) {
  const wagmiConfig = useConfig();
  const queryClient = useQueryClient();
  const { address: owner } = useWallet();
  const { ensureSupportedChain } = useChainGuard();
  const { sendTransactionAsync } = useSendTransaction();

  // The key lives in localStorage, so it is unknown on the server (null) and read once on the client.
  const key = useSyncExternalStore(
    () => () => {},
    loadOrCreateBurnerKey,
    () => null,
  );
  const account = useMemo(() => (key ? burnerAccount(key) : null), [key]);

  const clients = useMemo(() => {
    if (!account) return null;
    const transport = http(rpcUrl);
    return {
      publicClient: createPublicClient({ chain: arbitrumSepolia, transport }),
      walletClient: createWalletClient({ account, chain: arbitrumSepolia, transport }),
    };
  }, [account]);

  const [mode, setModeState] = useState<StormMode>("calm");
  const [log, setLog] = useState<StormLogLine[]>([]);
  const [busy, setBusy] = useState(false);
  const pushLog = useCallback((text: string, tone: StormLogLine["tone"] = "info") => {
    setLog((lines) => [{ at: Date.now(), text, tone }, ...lines].slice(0, 8));
  }, []);

  const ethQuery = useQuery({
    queryKey: ["demo", "burnerEth", account?.address],
    queryFn: () => clients!.publicClient.getBalance({ address: account!.address }),
    enabled: Boolean(clients && account),
    refetchInterval: 10_000,
  });
  const ethBalance = ethQuery.data;

  useEffect(() => {
    if (mode !== "storm" || !clients || !account || !sampleInterval) return;
    const { publicClient, walletClient } = clients;
    const burner = account.address;
    const abort = new AbortController();

    const confirm = async (hash: `0x${string}`) => {
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      if (receipt.status !== "success") throw new Error("A transaction reverted.");
    };

    const run = async () => {
      try {
        const [token1, fee, slot0] = await Promise.all([
          publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "token1" }),
          publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "fee" }),
          publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "slot0" }),
        ]);
        const refTick = slot0[1];
        const tokens: Record<SwapDirection, { tokenIn: Address; tokenOut: Address }> = {
          down: { tokenIn: TOKEN0, tokenOut: token1 },
          up: { tokenIn: token1, tokenOut: TOKEN0 },
        };

        // The burner mints its own test tokens (mint is permissionless) and
        // approves the router once per token.
        const prepare = async (token: Address) => {
          const [balance, allowance] = await Promise.all([
            publicClient.readContract({ address: token, abi: mintableErc20Abi, functionName: "balanceOf", args: [burner] }),
            publicClient.readContract({ address: token, abi: mintableErc20Abi, functionName: "allowance", args: [burner, ROUTER] }),
          ]);
          if (needsTokenTopUp(balance)) {
            await confirm(
              await walletClient.writeContract({
                address: token,
                abi: mintableErc20Abi,
                functionName: "mint",
                args: [burner, STORM.tokenTopUp],
              }),
            );
          }
          if (allowance < STORM.swapIn * 1000n) {
            await confirm(
              await walletClient.writeContract({
                address: token,
                abi: mintableErc20Abi,
                functionName: "approve",
                args: [ROUTER, MAX_ALLOWANCE],
              }),
            );
          }
        };
        await prepare(TOKEN0);
        await prepare(token1);
        pushLog(`Storm started around tick ${refTick}.`);

        let failures = 0;
        while (!abort.signal.aborted) {
          const started = Date.now();
          try {
            const eth = await publicClient.getBalance({ address: burner });
            if (!canContinue(eth)) {
              pushLog("Storm stopped: the burner is out of ETH. Fund it to continue.", "error");
              setModeState("calm");
              return;
            }
            const result = await stormStep({
              now: () => Math.floor(Date.now() / 1000),
              sampleInterval,
              refTick,
              readTick: async () =>
                (await publicClient.readContract({ address: POOL, abi: poolAbi, functionName: "slot0" }))[1],
              readLastSampleAt: () =>
                publicClient.readContract({ address: ACCUMULATOR, abi: varianceAccumulatorAbi, functionName: "lastSampleAt" }),
              poke: async () =>
                confirm(await walletClient.writeContract({ address: VAULT, abi: coverVaultAbi, functionName: "keeperPoke", args: [] })),
              swap: async (direction) => {
                const { tokenIn, tokenOut } = tokens[direction];
                const balance = await publicClient.readContract({
                  address: tokenIn,
                  abi: mintableErc20Abi,
                  functionName: "balanceOf",
                  args: [burner],
                });
                if (needsTokenTopUp(balance)) {
                  await confirm(
                    await walletClient.writeContract({
                      address: tokenIn,
                      abi: mintableErc20Abi,
                      functionName: "mint",
                      args: [burner, STORM.tokenTopUp],
                    }),
                  );
                }
                await confirm(
                  await walletClient.writeContract({
                    address: ROUTER,
                    abi: swapRouterAbi,
                    functionName: "exactInputSingle",
                    args: [{ tokenIn, tokenOut, fee, recipient: burner, amountIn: STORM.swapIn, amountOutMinimum: 0n, sqrtPriceLimitX96: 0n }],
                  }),
                );
              },
            });
            failures = 0;
            pushLog(`${result.poked ? "Sampled and " : ""}pushed the price ${result.direction}.`);
            void ethQuery.refetch();
          } catch (error) {
            failures += 1;
            const message = error instanceof Error ? error.message.split("\n")[0] : "Unknown error";
            pushLog(`Step failed (${failures}/${MAX_CONSECUTIVE_FAILURES}): ${message}`, "error");
            if (failures >= MAX_CONSECUTIVE_FAILURES) {
              pushLog("Storm stopped after repeated failures.", "error");
              setModeState("calm");
              return;
            }
          }
          await sleep(Math.max(1_000, sampleInterval * 1000 - (Date.now() - started)), abort.signal);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message.split("\n")[0] : "Unknown error";
        pushLog(`Storm could not start: ${message}`, "error");
        setModeState("calm");
      }
    };

    void run();
    return () => abort.abort();
    // ethQuery.refetch and pushLog are stable enough; the loop must only restart on these.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, clients, account, sampleInterval]);

  const setMode = useCallback((next: StormMode) => setModeState(next), []);

  // Sends the burner its gas ETH from the connected wallet (the one wallet popup Storm needs).
  const fundBurner = useCallback(async () => {
    if (!account) return;
    if (!(await ensureSupportedChain())) return;
    setBusy(true);
    try {
      const hash = await sendTransactionAsync({ to: account.address, value: STORM.fundWei });
      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash });
      if (receipt.status !== "success") throw new Error("The transfer reverted.");
      toast.success("Burner funded", { id: "storm-fund" });
      await queryClient.invalidateQueries({ queryKey: ["demo", "burnerEth"] });
    } catch (error) {
      toast.error(error, { id: "storm-fund", title: "Could not fund the burner" });
    } finally {
      setBusy(false);
    }
  }, [account, ensureSupportedChain, sendTransactionAsync, wagmiConfig, queryClient]);

  // Returns leftover ETH to the connected wallet.
  const sweepBurner = useCallback(async () => {
    if (!clients || !account || !owner) return;
    setModeState("calm");
    setBusy(true);
    try {
      const balance = await clients.publicClient.getBalance({ address: account.address });
      if (balance <= SWEEP_RESERVE_WEI) throw new Error("Nothing worth returning yet.");
      const hash = await clients.walletClient.sendTransaction({ to: owner, value: balance - SWEEP_RESERVE_WEI });
      await clients.publicClient.waitForTransactionReceipt({ hash });
      toast.success("ETH returned to your wallet", { id: "storm-sweep" });
      await queryClient.invalidateQueries({ queryKey: ["demo", "burnerEth"] });
    } catch (error) {
      toast.error(error, { id: "storm-sweep", title: "Could not return the ETH" });
    } finally {
      setBusy(false);
    }
  }, [clients, account, owner, queryClient]);

  return {
    mode,
    setMode,
    burnerAddress: account?.address,
    ethBalance,
    canStorm: ethBalance !== undefined && canContinue(ethBalance) && Boolean(sampleInterval),
    log,
    busy,
    fundBurner,
    sweepBurner,
  };
}
