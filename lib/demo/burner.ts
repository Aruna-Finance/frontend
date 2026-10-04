import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

// Storm needs a transaction every sample interval, which a wallet popup cannot
// do. So the browser keeps a throwaway key (testnet only, funded with a little
// ETH by the visitor) and signs those transactions itself. It lives in this
// browser's localStorage; nothing is ever sent to a server.
const STORAGE_KEY = "aruna.demo.burner";

type BurnerKey = `0x${string}`;

function readStored(): BurnerKey | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && /^0x[0-9a-fA-F]{64}$/.test(value) ? (value as BurnerKey) : null;
  } catch {
    return null;
  }
}

// Memoised so repeated reads (and useSyncExternalStore's snapshot check) always
// see the same key within a page load.
let memo: BurnerKey | null = null;

// The stored key, or a fresh one. If storage is blocked the key only lives for
// this page load (then the visitor simply funds a new burner).
export function loadOrCreateBurnerKey(): BurnerKey {
  if (memo) return memo;
  const existing = readStored();
  if (existing) return (memo = existing);
  const key = (memo = generatePrivateKey());
  try {
    window.localStorage.setItem(STORAGE_KEY, key);
  } catch {
    // Not persisted; acceptable for a throwaway key.
  }
  return key;
}

export function burnerAccount(key: BurnerKey) {
  return privateKeyToAccount(key);
}
