"use client";

import { useSyncExternalStore } from "react";
import {
  closeWalletModal,
  getWalletModalServerSnapshot,
  getWalletModalSnapshot,
  openWalletModal,
  subscribeWalletModal,
} from "@/lib/wallet-modal";

export function useWalletModal() {
  const isOpen = useSyncExternalStore(subscribeWalletModal, getWalletModalSnapshot, getWalletModalServerSnapshot);
  return { isOpen, open: openWalletModal, close: closeWalletModal };
}
