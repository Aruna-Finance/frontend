import type { Connector } from "wagmi";

export interface WalletOption {
  id: string;
  name: string;
  icon?: string;
  // Present for wallets that are installed and can be connected right now.
  connector?: Connector;
  // Present for suggested wallets that are not installed.
  installUrl?: string;
}

// Wallets worth suggesting when they are not installed. Ids are EIP-6963
// reverse-DNS ids, which is how installed wallets identify themselves.
const SUGGESTED_WALLETS = [
  { id: "io.metamask", name: "MetaMask", installUrl: "https://metamask.io/download" },
  { id: "io.rabby", name: "Rabby Wallet", installUrl: "https://rabby.io" },
  { id: "app.phantom", name: "Phantom", installUrl: "https://phantom.com/download" },
] as const;

const GENERIC_INJECTED_ID = "injected";

// Wallets announce their own icon string, and real ones arrive padded with
// whitespace or newlines (which next/image rejects). Trim it, and only accept
// something an <img> can actually load; anything else falls back to a tile.
export function sanitizeWalletIcon(icon: string | undefined): string | undefined {
  const trimmed = icon?.trim();
  if (!trimmed) return undefined;
  return /^(data:image\/|https:\/\/)/i.test(trimmed) ? trimmed : undefined;
}

function hasInjectedProvider(): boolean {
  return typeof window !== "undefined" && "ethereum" in window;
}

// Installed wallets come from EIP-6963 announcements, which wagmi turns into
// connectors (id = rdns, with name and icon). The generic `injected` connector
// is only used as a fallback for older wallets that never announce themselves.
export function buildWalletOptions(connectors: readonly Connector[]): {
  installed: WalletOption[];
  suggested: WalletOption[];
} {
  const announced = connectors.filter((connector) => connector.id !== GENERIC_INJECTED_ID);
  const generic = connectors.find((connector) => connector.id === GENERIC_INJECTED_ID);

  const installed: WalletOption[] = announced.map((connector) => ({
    id: connector.uid,
    name: connector.name,
    icon: sanitizeWalletIcon(connector.icon),
    connector,
  }));

  if (installed.length === 0 && generic && hasInjectedProvider()) {
    installed.push({ id: generic.uid, name: "Browser wallet", connector: generic });
  }

  const installedIds = new Set(announced.map((connector) => connector.id));
  const suggested: WalletOption[] = SUGGESTED_WALLETS.filter((wallet) => !installedIds.has(wallet.id)).map(
    (wallet) => ({ id: wallet.id, name: wallet.name, installUrl: wallet.installUrl }),
  );

  return { installed, suggested };
}
