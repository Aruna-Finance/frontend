import type { Address } from "viem";

// Arbitrum Sepolia testnet deployment (chain ID 421614). Source: the smart
// contract team's deployment table, checked on-chain (each address holds code
// on this chain and nowhere else we tried).
export const arunaChainId = 421614;

export const arunaAddresses = {
  arunaFactory: "0xcbd7D8bDCe3c8D1e9605A647607505e1F88bE7F5",
  varianceAccumulator: "0xc373585Fd3f8d033DA37A2496eB721F990982aa0",
  coverVault: "0x13368645dF72572d0b7a5A75D56E36d6632f8c7c",
  premiumPricer: "0x1395d984eca016e42Fc1C03a78c73cA6C92b95fd",
  positionValuer: "0x44E2555A90F9460669fe099C566cDC99d95B9D2C",
  pool: "0x92411A2A9F96Eee703Fd5D8f06631fF40d4E553C",
  settlementToken: "0x07B5d700adE197C6c04802D56Cdc93EADCED0f50",
  positionManager: "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65",
} as const satisfies Record<string, Address>;

export type ArunaContractName = keyof typeof arunaAddresses;
