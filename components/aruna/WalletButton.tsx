"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { walletCopy } from "@/lib/content/copy";
import { explorerAddressUrl } from "@/lib/contracts/config";
import { shortenAddress } from "@/lib/format";
import { toast } from "@/lib/toast";

const chipClasses =
  "inline-flex items-center justify-center h-[36px] px-[12px] rounded-control text-[13px] transition-all duration-300";

const menuItemClasses =
  "flex items-center w-full h-[36px] px-[12px] rounded-control text-[13px] text-left text-foreground-secondary hover:bg-surface-row hover:text-foreground transition-all duration-300";

// The wallet control in the app header: a Connect button, or the connected
// address with a small menu (copy, explorer, disconnect).
export function WalletButton() {
  const hydrated = useHydrated();
  const { address, isConnected, isConnecting, isReconnecting, disconnect } = useWallet();
  const walletModal = useWalletModal();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Same footprint as the real control, so the header does not jump when the
  // saved session is restored.
  if (!hydrated || isReconnecting) {
    return <span aria-hidden className={`${chipClasses} w-[132px] border border-border`} />;
  }

  if (!isConnected || !address) {
    return (
      <button
        type="button"
        onClick={walletModal.open}
        disabled={isConnecting}
        className={`${chipClasses} bg-accent text-on-accent font-semibold hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {isConnecting ? walletCopy.connecting : walletCopy.connect}
      </button>
    );
  }

  const copyAddress = async () => {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(address);
      toast.success(walletCopy.addressCopied, { description: address });
    } catch (error) {
      toast.error(error, { title: walletCopy.copyFailed });
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${chipClasses} border border-border font-mono text-[12px] text-foreground-secondary hover:text-foreground`}
      >
        {shortenAddress(address)}
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[44px] z-50 w-[200px] rounded-card border border-border bg-surface-raised p-[6px] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
        >
          <button type="button" role="menuitem" onClick={copyAddress} className={menuItemClasses}>
            {walletCopy.copyAddress}
          </button>
          <a
            role="menuitem"
            href={explorerAddressUrl(address)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className={menuItemClasses}
          >
            {walletCopy.viewOnExplorer}
          </a>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              disconnect();
            }}
            className={menuItemClasses}
          >
            {walletCopy.disconnect}
          </button>
        </div>
      ) : null}
    </div>
  );
}
