"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowUpRightIcon, ChevronRightIcon, QuestionMarkCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@/hooks/useWallet";
import { useWalletModal } from "@/hooks/useWalletModal";
import { walletCopy } from "@/lib/content/copy";
import { buildWalletOptions, type WalletOption } from "@/lib/wallets";

const rowClasses =
  "flex items-center gap-[14px] w-full h-[64px] px-[16px] rounded-[16px] text-left transition-all duration-300 hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";

const badgeClasses = "px-[8px] py-[3px] rounded-badge font-mono text-[11px] tracking-[0.04em]";

const iconButtonClasses =
  "inline-flex items-center justify-center w-[36px] h-[36px] rounded-full text-foreground-secondary hover:text-foreground hover:bg-surface-raised transition-all duration-300";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function WalletIcon({ option }: { option: WalletOption }) {
  if (option.icon) {
    // A plain <img>: these are tiny icons announced by the wallet itself
    // (data URIs or arbitrary https hosts), so there is nothing for
    // next/image to optimise, and unlike it an <img> never throws on a
    // source it dislikes.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={option.icon} alt="" width={36} height={36} className="w-[36px] h-[36px] rounded-[10px] shrink-0" />
    );
  }
  // No icon is announced for wallets that are not installed; a lettered tile
  // is honest, where a redrawn brand logo would not be.
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center w-[36px] h-[36px] rounded-[10px] shrink-0 bg-surface-raised border border-border font-display text-[20px] text-foreground-secondary"
    >
      {option.name.charAt(0)}
    </span>
  );
}

export function WalletModal() {
  const { isOpen, close } = useWalletModal();
  const { isConnected, connectors, connectingId, connect } = useWallet();
  const [showHelp, setShowHelp] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { installed, suggested } = buildWalletOptions(connectors);

  // Connected: the modal has done its job.
  useEffect(() => {
    if (isOpen && isConnected) close();
  }, [isOpen, isConnected, close]);

  // While open: lock page scroll, move focus in, and give it back on close.
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
      setShowHelp(false);
    };
  }, [isOpen]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key !== "Tab" || !panelRef.current) return;
    const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panelRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-[16px] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={walletCopy.modalTitle}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              className="w-full max-w-[380px] max-h-[calc(100vh-32px)] overflow-y-auto rounded-[28px] border border-border bg-surface p-[16px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] outline-none"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-between pb-[12px]">
                <button
                  type="button"
                  aria-label={walletCopy.helpLabel}
                  aria-pressed={showHelp}
                  onClick={() => setShowHelp((value) => !value)}
                  className={iconButtonClasses}
                >
                  <QuestionMarkCircleIcon aria-hidden className="w-[20px] h-[20px]" />
                </button>
                <h2 className="text-[16px] font-medium text-foreground">
                  {showHelp ? walletCopy.helpTitle : walletCopy.modalTitle}
                </h2>
                <button type="button" aria-label={walletCopy.closeLabel} onClick={close} className={iconButtonClasses}>
                  <XMarkIcon aria-hidden className="w-[20px] h-[20px]" />
                </button>
              </div>

              {showHelp ? (
                <div className="px-[8px] pb-[8px]">
                  <div className="flex flex-col gap-[12px] text-[14px] leading-[1.6] text-foreground-secondary">
                    {walletCopy.helpBody.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="mt-[16px] h-[44px] w-full rounded-button border border-border text-[14px] text-foreground transition-all duration-300 hover:bg-surface-raised"
                  >
                    {walletCopy.helpBack}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-[2px]">
                  {installed.length === 0 ? (
                    <p className="px-[16px] pb-[8px] text-[13px] leading-[1.5] text-foreground-muted">
                      {walletCopy.noWalletDetected}
                    </p>
                  ) : null}

                  {installed.map((option) => {
                    const connecting = connectingId !== undefined && connectingId === option.connector?.uid;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={connectingId !== undefined}
                        onClick={() => option.connector && connect(option.connector)}
                        className={rowClasses}
                      >
                        <WalletIcon option={option} />
                        <span className="flex-1 min-w-0 truncate text-[16px] font-medium text-foreground">
                          {option.name}
                        </span>
                        <span
                          className={`${badgeClasses} ${connecting ? "bg-accent-soft text-accent" : "bg-positive-soft text-positive"}`}
                        >
                          {connecting ? walletCopy.connectingBadge : walletCopy.installedBadge}
                        </span>
                        <ChevronRightIcon aria-hidden className="w-[16px] h-[16px] shrink-0 text-foreground-muted" />
                      </button>
                    );
                  })}

                  {suggested.length > 0 ? (
                    <>
                      <div className="px-[16px] pt-[12px] pb-[4px] font-mono text-[11px] tracking-[0.08em] text-foreground-muted">
                        {walletCopy.suggestedHeading.toUpperCase()}
                      </div>
                      {suggested.map((option) => (
                        <a
                          key={option.id}
                          href={option.installUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${rowClasses} !text-foreground`}
                        >
                          <WalletIcon option={option} />
                          <span className="flex-1 min-w-0 truncate text-[16px] font-medium">{option.name}</span>
                          <span className={`${badgeClasses} bg-border text-foreground-secondary`}>
                            {walletCopy.installBadge}
                          </span>
                          <ArrowUpRightIcon aria-hidden className="w-[16px] h-[16px] shrink-0 text-foreground-muted" />
                        </a>
                      ))}
                    </>
                  ) : null}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );
}
