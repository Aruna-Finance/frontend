// Open/closed state of the "Connect Wallet" modal, kept outside React (like
// lib/toast.ts) so any flow that needs a wallet can call openWalletModal().
type Listener = () => void;

let isOpen = false;
const listeners = new Set<Listener>();

function set(value: boolean) {
  if (isOpen === value) return;
  isOpen = value;
  for (const listener of listeners) listener();
}

export const openWalletModal = () => set(true);
export const closeWalletModal = () => set(false);

export function subscribeWalletModal(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getWalletModalSnapshot = () => isOpen;
export const getWalletModalServerSnapshot = () => false;
