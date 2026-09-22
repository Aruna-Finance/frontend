import { http, createConfig } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// TODO: ganti dengan RPC URL produksi (Alchemy/Infura/QuickNode) sebelum deploy.
// Fallback publik ini cukup untuk pengembangan lokal tapi rate-limited.
const ARBITRUM_RPC_URL =
  process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL ?? "https://arb1.arbitrum.io/rpc";

export const wagmiConfig = createConfig({
  chains: [arbitrum],
  connectors: [injected()],
  transports: {
    [arbitrum.id]: http(ARBITRUM_RPC_URL),
  },
});
