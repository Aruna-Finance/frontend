"use client";

import { useId, type ReactNode } from "react";

interface TooltipProps {
  // The text that explains the term or shows the full figure.
  content: string;
  children: ReactNode;
  className?: string;
}

// A short explanation attached to a term or a shortened number. It is a button
// so it takes focus on keyboard and on tap (a plain span does not on iOS), and
// the bubble shows on hover and on focus. Keep `content` to one or two lines.
export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const id = useId();
  return (
    <span className={["relative inline-flex group", className].join(" ")}>
      <button
        type="button"
        aria-describedby={id}
        className="cursor-help underline decoration-dotted decoration-foreground-muted underline-offset-[4px] focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
      >
        {children}
      </button>
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-[8px] z-20 w-max max-w-[260px] bg-surface-raised border border-border px-[12px] py-[8px] text-[12px] leading-[1.5] font-body font-normal normal-case tracking-normal text-foreground-secondary"
      >
        {content}
      </span>
    </span>
  );
}
