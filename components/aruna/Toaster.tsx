"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { CheckCircleIcon, ExclamationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { dismissToast, getToastsServerSnapshot, getToastsSnapshot, subscribeToasts } from "@/lib/toast";
import type { ToastRecord, ToastTone } from "@/types/aruna";

const toneBorderClasses: Record<ToastTone, string> = {
  success: "border-border-success",
  error: "border-border-danger",
};

const toneIconClasses: Record<ToastTone, string> = {
  success: "text-positive",
  error: "text-negative",
};

const actionClasses =
  "inline-block mt-[10px] text-[13px] font-medium text-accent hover:text-accent-hover transition-all duration-300";

function ToastCard({ toast }: { toast: ToastRecord }) {
  const { id, tone, title, description, action, duration } = toast;
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);

  // Auto-dismiss that holds still while the pointer or keyboard focus is on
  // the toast, then resumes with whatever time was left. Replacing a toast by
  // id hands us a new `toast` object, which restarts the countdown.
  useEffect(() => {
    remaining.current = duration;
  }, [toast, duration]);

  useEffect(() => {
    if (paused || !Number.isFinite(remaining.current)) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(() => dismissToast(id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [paused, id, toast]);

  const Icon = tone === "success" ? CheckCircleIcon : ExclamationCircleIcon;

  return (
    <motion.li
      layout
      role={tone === "error" ? "alert" : "status"}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className={[
        "pointer-events-auto flex items-start gap-[12px] rounded-card border bg-surface-raised p-[16px] shadow-[0_12px_32px_rgba(0,0,0,0.45)]",
        toneBorderClasses[tone],
      ].join(" ")}
    >
      <Icon aria-hidden className={["w-[20px] h-[20px] shrink-0 mt-[1px]", toneIconClasses[tone]].join(" ")} />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-foreground">{title}</div>
        {description ? (
          <div className="text-[13px] leading-[1.5] text-foreground-secondary pt-[4px] break-words">{description}</div>
        ) : null}
        {action?.href ? (
          <a href={action.href} target="_blank" rel="noopener noreferrer" className={actionClasses}>
            {action.label}
          </a>
        ) : action ? (
          <button type="button" onClick={action.onClick} className={actionClasses}>
            {action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismissToast(id)}
        className="shrink-0 -m-[4px] p-[4px] rounded-control text-foreground-muted hover:text-foreground transition-all duration-300"
      >
        <XMarkIcon aria-hidden className="w-[16px] h-[16px]" />
      </button>
    </motion.li>
  );
}

// Mount once in the root layout. Anything can then call `toast.success(...)` /
// `toast.error(...)` from "@/lib/toast".
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToastsSnapshot, getToastsServerSnapshot);

  return (
    <MotionConfig reducedMotion="user">
      <section
        aria-label="Notifications"
        className="pointer-events-none fixed z-[100] bottom-[16px] left-[16px] right-[16px] sm:left-auto sm:right-[24px] sm:bottom-[24px] sm:w-[384px]"
      >
        <ul className="flex flex-col gap-[10px] list-none m-0 p-0">
          <AnimatePresence initial={false}>
            {toasts.map((item) => (
              <ToastCard key={item.id} toast={item} />
            ))}
          </AnimatePresence>
        </ul>
      </section>
    </MotionConfig>
  );
}
