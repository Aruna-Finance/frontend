// The pool reads the frontend needs: the current tick (to decide whether a
// position is in range) and token0/token1/fee (to tell which positions
// belong to a vault's pool - `positions()` returns these per-position, so
// matching against a pool's own values is how "has a vault for this pool"
// is decided). Checked on-chain against the testnet pool.
export const poolAbi = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "token0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "token1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "fee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint24" }],
  },
  {
    type: "function",
    name: "tickSpacing",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "int24" }],
  },
] as const;
