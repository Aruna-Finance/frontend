"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface HowItWorksStep {
  title: string;
  body: string;
}

interface HowItWorksProps {
  heading: string;
  steps: HowItWorksStep[];
  // Where the visitor's "already seen this" is remembered, per browser.
  storageKey: string;
}

// Whether the visitor had already seen this explainer when the page loaded. Read
// once per key and kept for the page's lifetime: the first visit writes "seen",
// and re-reading after that would close the explainer under the visitor's eyes.
const seenAtLoad = new Map<string, boolean>();

function readSeenAtLoad(key: string): boolean {
  const cached = seenAtLoad.get(key);
  if (cached !== undefined) return cached;
  let seen = false;
  try {
    seen = window.localStorage.getItem(key) === "seen";
  } catch {
    // Storage unavailable: treat as a first visit.
  }
  seenAtLoad.set(key, seen);
  return seen;
}

const subscribeNever = () => () => {};

// A collapsible explainer for first-time visitors. Open until the visitor has
// seen it once, then closed on later visits; they can always reopen it. The
// preference is a convenience, so a blocked or empty localStorage just means it
// starts open. The server render is always the open state.
export function HowItWorks({ heading, steps, storageKey }: HowItWorksProps) {
  const seenBefore = useSyncExternalStore(subscribeNever, () => readSeenAtLoad(storageKey), () => false);
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? !seenBefore;

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, "seen");
    } catch {
      // Nothing to remember.
    }
  }, [storageKey]);

  return (
    <section className="border border-border">
      <button
        type="button"
        onClick={() => setToggled(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-[16px] px-[24px] py-[16px] text-left hover:bg-surface-row transition-colors duration-200"
      >
        <span className="text-[15px] font-semibold">{heading}</span>
        <span aria-hidden className="font-mono text-[13px] text-foreground-muted">
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open ? (
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-[20px] md:gap-[24px] px-[24px] pb-[24px] pt-[4px]">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-[14px]">
              <span className="shrink-0 w-[26px] h-[26px] inline-flex items-center justify-center rounded-full border border-border font-mono text-[12px] text-foreground-secondary">
                {index + 1}
              </span>
              <div>
                <div className="text-[14px] font-semibold">{step.title}</div>
                <p className="text-[13.5px] leading-[1.6] text-foreground-secondary pt-[4px]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
