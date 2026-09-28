import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// false during server render and the first client render, true afterwards.
// Lets wallet-dependent UI render the same markup as the server first, so
// hydration never sees a mismatch.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
