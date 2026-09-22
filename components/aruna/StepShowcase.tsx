"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import type { StepShowcaseProps } from "@/types/aruna";

const toneTextClasses = {
  accent: "text-accent",
  positive: "text-positive",
};

const toneBorderClasses = {
  accent: "border-accent",
  positive: "border-positive",
};

// Soft radial glow behind the floating screenshot, tinted per side —
// color-mix keeps it a translucent tint over the canvas rather than a flat
// opaque fill, echoing the glowing product-panel look from the reference.
const glowStyle = {
  accent: {
    background:
      "radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, var(--color-accent) 40%, transparent) 0%, transparent 62%), var(--color-canvas)",
  },
  positive: {
    background:
      "radial-gradient(120% 120% at 30% 20%, color-mix(in srgb, var(--color-positive) 40%, transparent) 0%, transparent 62%), var(--color-canvas)",
  },
};

const AUTO_ADVANCE_MS = 7000;

export function StepShowcase({ eyebrow, headline, steps, images, footnote, tone, startIndex = 0 }: StepShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const active = images[activeIndex];

  // Auto-advance on a timer that resets on any change (auto or manual click),
  // so a click doesn't fight with the next scheduled tick.
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveIndex((current) => (current + 1) % steps.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, steps.length]);

  return (
    <div className="rounded-card border border-border bg-surface overflow-hidden flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr]">
        <div className="flex flex-col gap-[18px] p-[28px]">
          <span className={`font-mono text-[11px] tracking-[0.1em] ${toneTextClasses[tone]}`}>{eyebrow}</span>
          <div className="font-display text-[27px] font-normal">{headline}</div>

          <div className="flex gap-[24px] border-b border-border">
            {steps.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-current={index === activeIndex}
                className={`font-mono text-[26px] tabular-nums pb-[10px] border-b-2 transition-colors ${
                  index === activeIndex
                    ? `${toneTextClasses[tone]} ${toneBorderClasses[tone]}`
                    : "text-foreground-muted border-transparent hover:text-foreground"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </button>
            ))}
          </div>

          <div className="relative min-h-[52px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                className="text-[15px] leading-[1.7] text-foreground-secondary"
              >
                {steps[activeIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative min-h-[240px] overflow-hidden" style={glowStyle[tone]}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -14 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center p-[28px]"
            >
              <Image
                src={active.src}
                width={active.width}
                height={active.height}
                alt=""
                unoptimized
                className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg ring-1 ring-black/40 drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="text-[14px] text-foreground-muted border-t border-border px-[28px] py-[16px]">{footnote}</div>
    </div>
  );
}
