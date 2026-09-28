"use client";

import { MotionConfig, motion, useAnimationFrame, useMotionValue, useReducedMotion, useTransform } from "motion/react";

interface GradientWordmarkProps {
  text: string;
  className?: string;
}

// Full-bleed brand wordmark for the bottom of the page, in the manner of
// React Bits' GradientText: a wide gradient clipped to the glyphs whose
// background-position drifts slowly back and forth. Kept deliberately close
// to the canvas so it reads as texture, not as a headline.
const GRADIENT =
  "linear-gradient(90deg, var(--color-surface) 0%, var(--color-surface-raised) 22%, " +
  "color-mix(in srgb, var(--color-accent) 16%, var(--color-surface-raised)) 50%, " +
  "var(--color-surface-raised) 78%, var(--color-surface) 100%)";

const DRIFT_SECONDS = 14;

export function GradientWordmark({ text, className }: GradientWordmarkProps) {
  const reducedMotion = useReducedMotion();
  const phase = useMotionValue(0);
  const backgroundPosition = useTransform(phase, (p) => `${50 + 50 * Math.sin(p)}% 50%`);

  useAnimationFrame((time) => {
    if (reducedMotion) return;
    phase.set((time / 1000 / DRIFT_SECONDS) * Math.PI * 2);
  });

  return (
    <MotionConfig reducedMotion="user">
      <motion.div
        aria-hidden
        className={className}
        initial={{ opacity: 0, y: 48 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span
          className="block select-none whitespace-nowrap text-transparent"
          style={{
            backgroundImage: GRADIENT,
            backgroundSize: "300% 100%",
            backgroundPosition,
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
          }}
        >
          {text}
        </motion.span>
      </motion.div>
    </MotionConfig>
  );
}
