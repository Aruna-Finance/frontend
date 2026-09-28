"use client";

import type { ReactNode } from "react";
import { MotionConfig, motion } from "motion/react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

// A <section> that eases up into place the first time it scrolls into view.
// reducedMotion="user" drops the upward travel for people who ask for less
// motion and keeps only the fade.
export function Reveal({ children, className }: RevealProps) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.section
        className={className}
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.section>
    </MotionConfig>
  );
}
