import type { Address } from "viem";

// Arbitrum Sepolia testnet (chain ID 421614) - unchanged by the v2 release.
export const arunaChainId = 421614;

// v2 sandbox/RC deployment (market 0: mWETH/mUSDC, tenor 3600s). Source:
// context/frontend-integration-v2-sandbox.md §1.2, smart-contract commit
// 01dc2fbfe3a4f2c34e3ba8813a130ff7002ad928 (branch rc/sandbox-1). Verified
// live on-chain (currentCohortId/allVaultsLength/tenor all read back correctly).
//
// No committed manifest exists yet (`smart-contract/deployments/421614/` has
// no JSON file as of 2026-10-03) - this is a direct copy of that doc's
// address table, not a manifest loader. These addresses WILL change once more
// when the "release" deployment happens (ABI is frozen, per the same doc
// §2 - only addresses and calibration move). Once a real manifest is
// committed, replace this object with a loader that reads
// `deployments/421614/<label>.json`, keyed by an env var
// (e.g. NEXT_PUBLIC_ARUNA_DEPLOYMENT_LABEL) - see that doc's open question §6.1.
//
// Data on this vault is NOT clean (shared with SC's own RC test scenarios) -
// don't treat any number read from it as a "real" demo figure (doc §4.2).
export const arunaAddresses = {
  arunaFactory: "0xA3547B68205794969e8A5229Ab55c2212F6eA472",
  varianceAccumulator: "0xcEF5c3CdF6dd303b522E047ff1376a0F78885c47",
  coverVault: "0x7E14ef9E5eF153c3f0420bB80d13c1c7f7DDA44F",
  premiumPricer: "0xd2e17AcD143a2Bea3b678d9d110Fe5f2443246FC",
  positionValuer: "0xef7022e17c5c26dB9273AfCD0E22A552c41198e2",
  pool: "0x0ae57A2751E50597c8a3C183AEbCF115F057d408",
  settlementToken: "0x29Fccf6C04D4d02c9ea4336c75F84145299c82cA",
  positionManager: "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65",
  // Uniswap SwapRouter02; the demo console's Storm mode swaps through it.
  swapRouter: "0x101F443B4d1b059569D643917553c771E1b9663E",
} as const satisfies Record<string, Address>;

export type ArunaContractName = keyof typeof arunaAddresses;

// The one v2 market known today, readable without the indexer. Used by
// hooks that need to recognize "does this pool have an Aruna vault" without
// going through useVaults()/the indexer - e.g. matching a wallet's Uniswap
// positions against a coverable pool (the indexer also watches this vault now). Extend this array (or replace it with
// a real ArunaFactory.allVaults() enumeration) once more than one market
// exists worth curating as "official".
export const arunaMarkets = [{ vault: arunaAddresses.coverVault, pool: arunaAddresses.pool }] as const;

// v0 deployment - known-bug (SC-01: withdraw during FUNDING doesn't reduce
// totalCapital), kept only so already-indexed v0 data (the indexer still
// watches this factory) can still resolve a pool label. Never used for a
// live read/write - see arunaAddresses above for that.
export const arunaV0Addresses = {
  arunaFactory: "0xcbd7D8bDCe3c8D1e9605A647607505e1F88bE7F5",
  varianceAccumulator: "0xc373585Fd3f8d033DA37A2496eB721F990982aa0",
  coverVault: "0x13368645dF72572d0b7a5A75D56E36d6632f8c7c",
  premiumPricer: "0x1395d984eca016e42Fc1C03a78c73cA6C92b95fd",
  positionValuer: "0x44E2555A90F9460669fe099C566cDC99d95B9D2C",
  pool: "0x92411A2A9F96Eee703Fd5D8f06631fF40d4E553C",
  settlementToken: "0x07B5d700adE197C6c04802D56Cdc93EADCED0f50",
  positionManager: "0x6b2937Bde17889EDCf8fbD8dE31C3C2a70Bc4d65",
} as const satisfies Record<string, Address>;
