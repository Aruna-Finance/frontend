"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { arunaAddresses } from "@/lib/contracts/addresses";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { positionManagerAbi } from "@/lib/contracts/abis/positionManager";
import { poolAbi } from "@/lib/contracts/abis/pool";
import { positionTokenAmounts } from "@/lib/contracts/position-math";
import { isPositionInRange } from "@/lib/contracts/uniswap";
import { indexerRequest } from "@/lib/indexer/client";
import { mapPolicyToCover } from "@/lib/indexer/mapPolicy";
import { POLICIES_BY_OWNER_QUERY } from "@/lib/indexer/queries";
import type { IndexerPolicy } from "@/lib/indexer/types";
import { mockPositionCovers, mockPositions } from "@/lib/mock/positions";
import type { Position, PositionCover } from "@/types/domain";
import { useVaults } from "./useVaults";
import { useWallet } from "./useWallet";

export interface UsePositionsResult {
  data: Position[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

type RawPosition = readonly [
  bigint,
  Address,
  Address,
  Address,
  number,
  number,
  number,
  bigint,
  bigint,
  bigint,
  bigint,
  bigint,
];

function poolKey(token0: Address, token1: Address, fee: number): string {
  return `${token0.toLowerCase()}-${token1.toLowerCase()}-${fee}`;
}

// Every Uniswap v3 position the connected wallet owns, straight from the
// (mock) NonfungiblePositionManager — reads directly from the chain, not the
// indexer, since a wallet's own NFTs need to be current the moment this page
// is opened. A position "has a vault for its pool" when its own
// token0/token1/fee (from `positions()`) matches a real vault's pool.
export function usePositions(): UsePositionsResult {
  const { address } = useWallet();
  const { data: vaults } = useVaults();
  const vaultPools = useMemo(
    () => (vaults ?? []).map((v) => ({ vaultId: v.id, pool: v.poolAddress })).filter((v) => v.pool !== null),
    [vaults],
  ) as { vaultId: string; pool: Address }[];

  // token0/token1/fee/current-tick for every real vault's pool, so an owned
  // position can be matched against it without a network round trip per NFT.
  const poolInfo = useReadContracts({
    contracts: vaultPools.flatMap(({ pool }) => [
      { address: pool, abi: poolAbi, functionName: "token0" as const },
      { address: pool, abi: poolAbi, functionName: "token1" as const },
      { address: pool, abi: poolAbi, functionName: "fee" as const },
      { address: pool, abi: poolAbi, functionName: "slot0" as const },
    ]),
    query: { enabled: vaultPools.length > 0 },
  });

  const poolByKey = useMemo(() => {
    const map = new Map<string, { vaultId: string; tick: number }>();
    if (!poolInfo.data) return map;
    vaultPools.forEach(({ vaultId }, i) => {
      const token0 = poolInfo.data?.[i * 4]?.result as Address | undefined;
      const token1 = poolInfo.data?.[i * 4 + 1]?.result as Address | undefined;
      const fee = poolInfo.data?.[i * 4 + 2]?.result as number | undefined;
      const slot0 = poolInfo.data?.[i * 4 + 3]?.result as readonly [bigint, number, ...unknown[]] | undefined;
      if (token0 !== undefined && token1 !== undefined && fee !== undefined && slot0) {
        map.set(poolKey(token0, token1, fee), { vaultId, tick: slot0[1] });
      }
    });
    return map;
  }, [poolInfo.data, vaultPools]);

  const balanceQuery = useReadContract({
    address: arunaAddresses.positionManager,
    abi: positionManagerAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });
  const balance = balanceQuery.data;

  const tokenIdContracts = useMemo(
    () =>
      address && balance
        ? Array.from({ length: Number(balance) }, (_, i) => ({
            address: arunaAddresses.positionManager,
            abi: positionManagerAbi,
            functionName: "tokenOfOwnerByIndex" as const,
            args: [address, BigInt(i)] as const,
          }))
        : [],
    [address, balance],
  );
  const tokenIdsQuery = useReadContracts({ contracts: tokenIdContracts, query: { enabled: tokenIdContracts.length > 0 } });
  const tokenIds = useMemo(
    () => (tokenIdsQuery.data ?? []).map((r) => r.result as bigint | undefined).filter((v): v is bigint => v !== undefined),
    [tokenIdsQuery.data],
  );

  const positionContracts = useMemo(
    () =>
      tokenIds.map((id) => ({
        address: arunaAddresses.positionManager,
        abi: positionManagerAbi,
        functionName: "positions" as const,
        args: [id] as const,
      })),
    [tokenIds],
  );
  const positionsQuery = useReadContracts({ contracts: positionContracts, query: { enabled: positionContracts.length > 0 } });

  // symbol() and decimals() for every distinct token across every owned
  // position, deduped — this is what turns "0x3b91…/0x4A22…" into "USDC/WETH"
  // and what makes tokensOwed readable in its own units, with no price
  // needed for either.
  const uniqueTokens = useMemo(() => {
    const addresses = new Set<string>();
    (positionsQuery.data ?? []).forEach((entry) => {
      const raw = entry.result as RawPosition | undefined;
      if (!raw) return;
      addresses.add(raw[2].toLowerCase());
      addresses.add(raw[3].toLowerCase());
    });
    return Array.from(addresses) as Address[];
  }, [positionsQuery.data]);

  const tokenInfoQuery = useReadContracts({
    contracts: uniqueTokens.flatMap((token) => [
      { address: token, abi: erc20Abi, functionName: "symbol" as const },
      { address: token, abi: erc20Abi, functionName: "decimals" as const },
    ]),
    query: { enabled: uniqueTokens.length > 0 },
  });

  const tokenInfoByAddress = useMemo(() => {
    const map = new Map<string, { symbol: string; decimals: number }>();
    if (!tokenInfoQuery.data) return map;
    uniqueTokens.forEach((token, i) => {
      const symbol = tokenInfoQuery.data?.[i * 2]?.result as string | undefined;
      const decimals = tokenInfoQuery.data?.[i * 2 + 1]?.result as number | undefined;
      if (symbol !== undefined && decimals !== undefined) map.set(token, { symbol, decimals });
    });
    return map;
  }, [tokenInfoQuery.data, uniqueTokens]);

  const data = useMemo(() => {
    if (!address) return [];
    if (!positionsQuery.data || positionsQuery.data.length !== tokenIds.length) return undefined;

    const positions: Position[] = [];
    positionsQuery.data.forEach((entry, i) => {
      const raw = entry.result as RawPosition | undefined;
      if (!raw) return;
      const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = raw;
      const match = poolByKey.get(poolKey(token0, token1, fee));
      const info0 = tokenInfoByAddress.get(token0.toLowerCase());
      const info1 = tokenInfoByAddress.get(token1.toLowerCase());

      // Current holdings need the pool's live tick, which is only fetched
      // for real vault pools — not spent on the (potentially many) unrelated
      // pools a wallet's other positions happen to sit in.
      let token0Amount: number | null = null;
      let token1Amount: number | null = null;
      if (match && info0 && info1) {
        const amounts = positionTokenAmounts(liquidity, tickLower, tickUpper, match.tick);
        token0Amount = amounts.amount0 / 10 ** info0.decimals;
        token1Amount = amounts.amount1 / 10 ** info1.decimals;
      }

      const vaultLabel = match ? vaults?.find((v) => v.id === match.vaultId)?.poolLabel : undefined;
      const poolLabel =
        vaultLabel ??
        (info0 && info1
          ? `${info0.symbol} / ${info1.symbol}`
          : `${token0.slice(0, 6)}…/${token1.slice(0, 6)}…`);

      positions.push({
        tokenId: tokenIds[i].toString(),
        poolLabel,
        poolFeeTier: `${(fee / 10_000).toFixed(2)}%`,
        inRange: match ? isPositionInRange(tickLower, tickUpper, match.tick) : null,
        // No price feed for testnet tokens, and this pool's own price ratio
        // isn't calibrated to represent anything real either (checked: it
        // implies a multi-trillion mUSDC/mWETH rate) — showing a number here
        // would look precise while being meaningless. See E8. Real token
        // amounts below instead.
        rangeLowerUsdc: null,
        rangeUpperUsdc: null,
        feesEarnedUsdc: null,
        valueUsdc: null,
        hasVaultForPool: Boolean(match),
        token0Symbol: info0?.symbol ?? null,
        token1Symbol: info1?.symbol ?? null,
        token0Amount,
        token1Amount,
        token0FeesOwed: info0 ? Number(tokensOwed0) / 10 ** info0.decimals : null,
        token1FeesOwed: info1 ? Number(tokensOwed1) / 10 ** info1.decimals : null,
      });
    });
    return positions;
  }, [address, positionsQuery.data, tokenIds, poolByKey, vaults, tokenInfoByAddress]);

  return {
    data,
    isLoading:
      Boolean(address) &&
      (balanceQuery.isLoading || tokenIdsQuery.isLoading || positionsQuery.isLoading || poolInfo.isLoading || tokenInfoQuery.isLoading),
    isError: balanceQuery.isError || tokenIdsQuery.isError || positionsQuery.isError || poolInfo.isError || tokenInfoQuery.isError,
  };
}

export interface UsePositionResult {
  data: Position | undefined;
  covers: PositionCover[];
  isLoading: boolean;
  isError: boolean;
}

export function usePosition(tokenId: string): UsePositionResult {
  const position = mockPositions.find((item) => item.tokenId === tokenId);
  const covers = mockPositionCovers.filter((cover) => cover.positionId === tokenId);
  return { data: position, covers, isLoading: false, isError: false };
}

export interface UseCoverResult {
  data: PositionCover | undefined;
  isLoading: boolean;
  isError: boolean;
}

export function useCover(coverId: string): UseCoverResult {
  const cover = mockPositionCovers.find((item) => item.id === coverId);
  return { data: cover, isLoading: false, isError: false };
}

export interface UseCoversByWalletResult {
  data: PositionCover[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

// Every cover a wallet has ever bought, from the indexer — closes the gap the
// contract itself can't answer ("all policies owned by X"). Addresses are
// stored lowercase in the indexer; normalize before filtering.
export function useCoversByWallet(owner: string | undefined): UseCoversByWalletResult {
  const query = useQuery({
    queryKey: ["indexer", "policiesByOwner", owner?.toLowerCase()],
    queryFn: () =>
      indexerRequest<{ policys: { items: IndexerPolicy[] } }, { owner: string }>(POLICIES_BY_OWNER_QUERY, {
        owner: owner!.toLowerCase(),
      }),
    select: (result) => result.policys.items.map(mapPolicyToCover),
    enabled: Boolean(owner),
  });
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
