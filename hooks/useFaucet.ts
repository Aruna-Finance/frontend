"use client";

import { useCallback, useState } from "react";
import type { Address } from "viem";
import { useBalance, useConfig, useReadContract } from "wagmi";
import { readContract } from "wagmi/actions";
import { erc20Abi, mintableErc20Abi } from "@/lib/contracts/abis/erc20";
import { poolAbi } from "@/lib/contracts/abis/pool";
import { positionManagerAbi } from "@/lib/contracts/abis/positionManager";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { coverVaultAbi } from "@/lib/contracts/abis/coverVault";
import {
  FAUCET,
  faucetPlan,
  minPayoutFloor,
  positionAmounts,
  positionRange,
  type FaucetStep,
  type FaucetStepId,
  type PositionAmounts,
} from "@/lib/demo/faucet";
import { useAllowance } from "./useAllowance";
import { useContractTx } from "./useContractTx";
import { useTokenBalance } from "./useTokenBalance";
import { useWallet } from "./useWallet";

const NFPM = arunaAddresses.positionManager;
const POOL = arunaAddresses.pool;
const USDC = arunaAddresses.settlementToken;
const VAULT = arunaAddresses.coverVault;

export type FaucetStatus = "idle" | "running" | "done" | "failed";

export interface FaucetProgress {
  steps: FaucetStep[];
  done: ReadonlySet<FaucetStepId>;
  failedStep: FaucetStepId | null;
}

export function useFaucet() {
  const config = useConfig();
  const { address } = useWallet();
  const { send } = useContractTx();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [progress, setProgress] = useState<FaucetProgress>({ steps: [], done: new Set(), failedStep: null });

  const weth = useReadContract({ address: POOL, abi: poolAbi, functionName: "token1" });
  const wethAddress = weth.data as Address | undefined;
  const usdcBalance = useTokenBalance(USDC, address);
  const wethBalance = useTokenBalance((wethAddress ?? USDC) as Address, wethAddress ? address : undefined);
  const usdcAllowance = useAllowance(USDC, address, NFPM);
  const wethAllowance = useAllowance((wethAddress ?? USDC) as Address, wethAddress ? address : undefined, NFPM);
  const eth = useBalance({ address, query: { enabled: Boolean(address) } });

  const lowGas = eth.data !== undefined && eth.data.value < FAUCET.minGasWei;

  const refetchAll = useCallback(async () => {
    await Promise.all([usdcBalance.refetch(), wethBalance.refetch(), usdcAllowance.refetch(), wethAllowance.refetch()]);
  }, [usdcBalance, wethBalance, usdcAllowance, wethAllowance]);

  const runStep = useCallback(
    async (step: FaucetStep, owner: Address, weth: Address, position: PositionAmounts): Promise<boolean> => {
      const label = (name: string) => ({
        id: `faucet-${step.id}`,
        submitted: `${name} submitted`,
        confirmed: `${name} confirmed`,
        failed: `${name} failed`,
      });
      switch (step.id) {
        case "mintUsdc":
          return send(
            { address: USDC, abi: mintableErc20Abi, functionName: "mint", args: [owner, step.amount!] },
            label("Mint mUSDC"),
          );
        case "mintWeth":
          return send(
            { address: weth, abi: mintableErc20Abi, functionName: "mint", args: [owner, step.amount!] },
            label("Mint mWETH"),
          );
        case "approveUsdc":
          return send(
            { address: USDC, abi: erc20Abi, functionName: "approve", args: [NFPM, step.amount!] },
            label("mUSDC approval"),
          );
        case "approveWeth":
          return send(
            { address: weth, abi: erc20Abi, functionName: "approve", args: [NFPM, step.amount!] },
            label("mWETH approval"),
          );
        case "mintPosition": {
          // Read the pool right before minting so the range centres on the live tick.
          const [slot0, spacing, fee] = await Promise.all([
            readContract(config, { address: POOL, abi: poolAbi, functionName: "slot0" }),
            readContract(config, { address: POOL, abi: poolAbi, functionName: "tickSpacing" }),
            readContract(config, { address: POOL, abi: poolAbi, functionName: "fee" }),
          ]);
          const { tickLower, tickUpper } = positionRange(slot0[1], spacing, FAUCET.halfWidthTicks);
          return send(
            {
              address: NFPM,
              abi: positionManagerAbi,
              functionName: "mint",
              args: [
                {
                  token0: USDC,
                  token1: weth,
                  fee,
                  tickLower,
                  tickUpper,
                  amount0Desired: position.amount0,
                  amount1Desired: position.amount1,
                  amount0Min: 0n,
                  amount1Min: 0n,
                  recipient: owner,
                  deadline: BigInt(Math.floor(Date.now() / 1000) + FAUCET.deadlineSeconds),
                },
              ],
            },
            label("Create position"),
          );
        }
      }
    },
    [config, send],
  );

  // Size the position for buyCover's floor in the cohort a visitor buys into
  // now and the next one (whichever floor is higher). Falls back to the default
  // size if the vault cannot be read.
  const sizePosition = useCallback(async (): Promise<PositionAmounts> => {
    try {
      const [current, util, cap] = await Promise.all([
        readContract(config, { address: VAULT, abi: coverVaultAbi, functionName: "currentCohortId" }),
        readContract(config, { address: VAULT, abi: coverVaultAbi, functionName: "maxUtilizationBps" }),
        readContract(config, { address: VAULT, abi: coverVaultAbi, functionName: "policyCap" }),
      ]);
      const cohorts = await Promise.all(
        [current, current + 1].map((id) =>
          readContract(config, { address: VAULT, abi: coverVaultAbi, functionName: "cohort", args: [id] }),
        ),
      );
      const floor = cohorts
        .map((c) => minPayoutFloor(c.totalCapital, BigInt(util), BigInt(cap)))
        .reduce((a, b) => (a > b ? a : b), 0n);
      return positionAmounts(floor);
    } catch {
      return positionAmounts(0n);
    }
  }, [config]);

  // Steps run one at a time; a failure stops the run on that step, and pressing
  // the button again resumes from it (steps already mined are remembered).
  const start = useCallback(async () => {
    if (!address || !wethAddress) return;
    setStatus("running");
    const done = new Set(progress.failedStep ? progress.done : []);
    await refetchAll();
    const position = await sizePosition();
    const steps = faucetPlan({
      usdcBalance: ((await usdcBalance.refetch()).data ?? 0n) as bigint,
      wethBalance: ((await wethBalance.refetch()).data ?? 0n) as bigint,
      usdcAllowance: ((await usdcAllowance.refetch()).data ?? 0n) as bigint,
      wethAllowance: ((await wethAllowance.refetch()).data ?? 0n) as bigint,
      done,
      position,
    });
    setProgress({ steps, done, failedStep: null });
    for (const step of steps) {
      const ok = await runStep(step, address, wethAddress, position);
      if (!ok) {
        setProgress({ steps, done: new Set(done), failedStep: step.id });
        setStatus("failed");
        return;
      }
      done.add(step.id);
      setProgress({ steps, done: new Set(done), failedStep: null });
    }
    await refetchAll();
    setProgress({ steps: [], done: new Set(), failedStep: null });
    setStatus("done");
  }, [address, wethAddress, progress, refetchAll, usdcBalance, wethBalance, usdcAllowance, wethAllowance, runStep, sizePosition]);

  return {
    status,
    progress,
    start,
    lowGas,
    ethBalance: eth.data?.value,
    usdcBalance: usdcBalance.data as bigint | undefined,
    wethBalance: wethBalance.data as bigint | undefined,
  };
}
