import { http, createConfig } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { arunaChainId } from "./addresses";

// Public RPC is enough for development but is rate-limited; set
// NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL (see .env.example) for anything shared.
const RPC_URL = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL || arbitrumSepolia.rpcUrls.default.http[0];

export const supportedChain = arbitrumSepolia;

if (supportedChain.id !== arunaChainId) {
  throw new Error(`Configured chain ${supportedChain.id} does not match deployment chain ${arunaChainId}`);
}

export const wagmiConfig = createConfig({
  chains: [arbitrumSepolia],
  connectors: [injected()],
  transports: {
    [arbitrumSepolia.id]: http(RPC_URL),
  },
  // Server render always sees "disconnected"; wagmi reconnects after mount
  // instead of hydrating with a stale account.
  ssr: true,
});

const EXPLORER_URL = arbitrumSepolia.blockExplorers.default.url;

export const explorerTxUrl = (hash: string) => `${EXPLORER_URL}/tx/${hash}`;
export const explorerAddressUrl = (address: string) => `${EXPLORER_URL}/address/${address}`;
