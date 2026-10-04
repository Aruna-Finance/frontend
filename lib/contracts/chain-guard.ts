// A wallet on another chain must never get a transaction from this app: the
// contracts only exist on the configured chain. Not connected (undefined) is
// not a mismatch; the connect flow handles that.
export function needsSwitch(accountChainId: number | undefined, expectedChainId: number): boolean {
  return accountChainId !== undefined && accountChainId !== expectedChainId;
}
