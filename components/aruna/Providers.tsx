"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/contracts/config";
import { WalletModal } from "./WalletModal";

export function Providers({ children }: { children: ReactNode }) {
  // Created once per browser session; a module-level client would be shared
  // between requests during server rendering.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // On-chain reads are cheap to repeat but noisy to retry: fail fast
            // and let the UI show its error state.
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <WalletModal />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
