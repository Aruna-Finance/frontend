// varNotionalFor(uint256) -> uint256 checked on-chain against token 1.
// The quote path (CoverVault.quote) calls the valuer itself; this is only for
// showing an indicative notional before a quote exists.
export const positionValuerAbi = [
  {
    type: "function",
    name: "varNotionalFor",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;
