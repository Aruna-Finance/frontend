import type { ToastOptions, ToastRecord, ToastTone } from "@/types/aruna";

const MAX_VISIBLE = 4;
const DEFAULT_DURATION: Record<ToastTone, number> = {
  success: 4500,
  error: 7000,
};

// Module-level store, so `toast.success(...)` works from anywhere: components,
// wagmi mutation callbacks, plain helpers. <Toaster /> subscribes to it.
type Listener = () => void;

let records: ToastRecord[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToastsSnapshot() {
  return records;
}

const SERVER_SNAPSHOT: ToastRecord[] = [];

export function getToastsServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function push(tone: ToastTone, title: string, options: ToastOptions = {}): string {
  const id = options.id ?? `toast-${++counter}`;
  const record: ToastRecord = {
    id,
    tone,
    title,
    description: options.description,
    action: options.action,
    duration: options.duration ?? DEFAULT_DURATION[tone],
  };

  const existing = records.findIndex((item) => item.id === id);
  if (existing >= 0) {
    records = records.map((item, index) => (index === existing ? record : item));
  } else {
    records = [...records, record].slice(-MAX_VISIBLE);
  }
  emit();
  return id;
}

export function dismissToast(id?: string) {
  records = id === undefined ? [] : records.filter((item) => item.id !== id);
  emit();
}

function isUserRejection(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current && typeof current === "object"; depth++) {
    const { code, name, cause } = current as { code?: unknown; name?: unknown; cause?: unknown };
    if (code === 4001 || code === "ACTION_REJECTED" || name === "UserRejectedRequestError") return true;
    current = cause;
  }
  return false;
}

// Turns whatever a wallet or RPC call threw into one readable sentence.
// viem errors carry a short, human `shortMessage`; the full `message` is a
// multi-line dump with request bodies, which does not belong in a toast.
export function getErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) return error;
  if (isUserRejection(error)) return "You rejected the request in your wallet.";
  if (error && typeof error === "object") {
    const { shortMessage, message } = error as { shortMessage?: unknown; message?: unknown };
    if (typeof shortMessage === "string" && shortMessage.trim()) return shortMessage;
    if (typeof message === "string" && message.trim()) {
      const firstLine = message.trim().split("\n")[0];
      return firstLine.length > 200 ? `${firstLine.slice(0, 197)}...` : firstLine;
    }
  }
  return "Something unexpected happened. Please try again.";
}

function success(title: string, options?: ToastOptions) {
  return push("success", title, options);
}

// Two call shapes:
//   toast.error("Wrong network", { description: "Switch to Arbitrum Sepolia." })
//   toast.error(caughtError, { title: "Deposit failed" })  // description is derived
function error(titleOrError: unknown, options: ToastOptions & { title?: string } = {}) {
  const { title, ...rest } = options;
  if (typeof titleOrError === "string") {
    return push("error", titleOrError, rest);
  }
  return push("error", title ?? "Something went wrong", {
    ...rest,
    description: rest.description ?? getErrorMessage(titleOrError),
  });
}

export const toast = { success, error, dismiss: dismissToast };
