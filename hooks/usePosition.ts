"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";
import { arunaAddresses, arunaMarkets } from "@/lib/contracts/addresses";
import { erc20Abi } from "@/lib/contracts/abis/erc20";
import { positionManagerAbi } from "@/lib/contracts/abis/positionManager";
import { poolAbi } from "@/lib/contracts/abis/pool";
import { positionTokenAmounts } from "@/lib/contracts/position-math";
import { isPositionInRange } from "@/lib/contracts/uniswap";
import { indexerRequest } from "@/lib/indexer/client";
import { mapPolicyToCover } from "@/lib/indexer/mapPolicy";
import { POLICIES_BY_OWNER_QUERY } from "@/lib/indexer/queries";
import type { IndexerPolicy } from "@/lib/indexer/types";
import type { Position, PositionCover } from "@/types/domain";
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
// real NonfungiblePositionManager — reads directly from the chain, not the
// indexer, since a wallet's own NFTs need to be current the moment this page
// is opened. A position "has a vault for its pool" when its own
// token0/token1/fee (from `positions()`) matches a known v2 market's pool.
// Matched against `arunaMarkets` (direct contract addresses), not the
// indexer's vault list — the indexer still only watches the v0 factory and
// has never heard of the v2 sandbox vault.
export function usePositions(): UsePositionsResult {
  const { address } = useWallet();
  const vaultPools = useMemo(
    () => arunaMarkets.map((m) => ({ vaultId: m.vault as string, pool: m.pool as Address })),
    [],
  );

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

      const poolLabel =
        info0 && info1 ? `${info0.symbol} / ${info1.symbol}` : `${token0.slice(0, 6)}…/${token1.slice(0, 6)}…`;

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
  }, [address, positionsQuery.data, tokenIds, poolByKey, tokenInfoByAddress]);

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
  // The NFT's current owner — Quote/Confirm need this to pre-check "do you
  // actually own this position" before the wallet prompt, same check the
  // contract itself makes (PositionNotOwned).
  owner: Address | undefined;
  isLoading: boolean;
  isError: boolean;
}

// One specific Uniswap v3 position by its NFT token id — for Quote/Confirm,
// which land on a route param rather than a wallet-owned list. Reads
// directly from the real NFPM, matched against the known v2 market pool (see
// usePositions() above for why not the indexer). Works for ANY token id,
// not just ones the connected wallet owns — Quote needs to 404 honestly on
// someone else's position, not just silently fail.
export function usePosition(tokenId: string): UsePositionResult {
  let tokenIdBigInt: bigint | undefined;
  try {
    tokenIdBigInt = BigInt(tokenId);
  } catch {
    tokenIdBigInt = undefined;
  }

  const ownerQuery = useReadContract({
    address: arunaAddresses.positionManager,
    abi: positionManagerAbi,
    functionName: "ownerOf",
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: { enabled: tokenIdBigInt !== undefined },
  });

  const positionQuery = useReadContract({
    address: arunaAddresses.positionManager,
    abi: positionManagerAbi,
    functionName: "positions",
    args: tokenIdBigInt !== undefined ? [tokenIdBigInt] : undefined,
    query: { enabled: tokenIdBigInt !== undefined },
  });
  const raw = positionQuery.data as RawPosition | undefined;

  const market = arunaMarkets[0] as { vault: Address; pool: Address } | undefined;
  const poolInfo = useReadContracts({
    contracts: market
      ? [
          { address: market.pool, abi: poolAbi, functionName: "token0" as const },
          { address: market.pool, abi: poolAbi, functionName: "token1" as const },
          { address: market.pool, abi: poolAbi, functionName: "fee" as const },
          { address: market.pool, abi: poolAbi, functionName: "slot0" as const },
        ]
      : [],
    query: { enabled: Boolean(market) },
  });

  const tokenAddrs = useMemo(() => (raw ? [raw[2], raw[3]] : []), [raw]);
  const tokenInfoQuery = useReadContracts({
    contracts: tokenAddrs.flatMap((token) => [
      { address: token, abi: erc20Abi, functionName: "symbol" as const },
      { address: token, abi: erc20Abi, functionName: "decimals" as const },
    ]),
    query: { enabled: tokenAddrs.length > 0 },
  });

  const data = useMemo((): Position | undefined => {
    if (!raw) return undefined;
    const [, , token0, token1, fee, tickLower, tickUpper, liquidity, , , tokensOwed0, tokensOwed1] = raw;
    const symbol0 = tokenInfoQuery.data?.[0]?.result as string | undefined;
    const decimals0 = tokenInfoQuery.data?.[1]?.result as number | undefined;
    const symbol1 = tokenInfoQuery.data?.[2]?.result as string | undefined;
    const decimals1 = tokenInfoQuery.data?.[3]?.result as number | undefined;

    const poolToken0 = poolInfo.data?.[0]?.result as Address | undefined;
    const poolToken1 = poolInfo.data?.[1]?.result as Address | undefined;
    const poolFee = poolInfo.data?.[2]?.result as number | undefined;
    const slot0 = poolInfo.data?.[3]?.result as readonly [bigint, number, ...unknown[]] | undefined;
    const matches =
      poolToken0 !== undefined &&
      poolToken1 !== undefined &&
      poolFee !== undefined &&
      poolKey(poolToken0, poolToken1, poolFee) === poolKey(token0, token1, fee);

    let token0Amount: number | null = null;
    let token1Amount: number | null = null;
    if (matches && slot0 && decimals0 !== undefined && decimals1 !== undefined) {
      const amounts = positionTokenAmounts(liquidity, tickLower, tickUpper, slot0[1]);
      token0Amount = amounts.amount0 / 10 ** decimals0;
      token1Amount = amounts.amount1 / 10 ** decimals1;
    }

    const poolLabel =
      symbol0 && symbol1 ? `${symbol0} / ${symbol1}` : `${token0.slice(0, 6)}…/${token1.slice(0, 6)}…`;

    return {
      tokenId,
      poolLabel,
      poolFeeTier: `${(fee / 10_000).toFixed(2)}%`,
      inRange: matches && slot0 ? isPositionInRange(tickLower, tickUpper, slot0[1]) : null,
      // No price feed for testnet tokens (see E8) — real token amounts below instead.
      rangeLowerUsdc: null,
      rangeUpperUsdc: null,
      feesEarnedUsdc: null,
      valueUsdc: null,
      hasVaultForPool: matches,
      token0Symbol: symbol0 ?? null,
      token1Symbol: symbol1 ?? null,
      token0Amount,
      token1Amount,
      token0FeesOwed: decimals0 !== undefined ? Number(tokensOwed0) / 10 ** decimals0 : null,
      token1FeesOwed: decimals1 !== undefined ? Number(tokensOwed1) / 10 ** decimals1 : null,
    };
  }, [raw, tokenId, tokenInfoQuery.data, poolInfo.data]);

  return {
    data,
    owner: ownerQuery.data as Address | undefined,
    isLoading: ownerQuery.isLoading || positionQuery.isLoading || poolInfo.isLoading || tokenInfoQuery.isLoading,
    isError: ownerQuery.isError || positionQuery.isError || poolInfo.isError || tokenInfoQuery.isError,
  };
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
