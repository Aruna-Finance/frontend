"use client";

import { useRef, useState, type ReactNode } from "react";
import { MotionConfig, motion, useMotionValueEvent, useScroll } from "motion/react";

interface HideOnScrollHeaderProps {
  children: ReactNode;
  className?: string;
}

// Distance from the top within which the bar is always shown, and how far
// the page must move in one direction before the bar reacts - without the
// second threshold a trackpad's tiny back-and-forth makes it flicker.
const ALWAYS_VISIBLE_UNTIL = 80;
const DIRECTION_THRESHOLD = 6;

// Sticky navbar that slides up out of view while scrolling down and slides
// back in as soon as the page scrolls up.
export function HideOnScrollHeader({ children, className }: HideOnScrollHeaderProps) {
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - lastY.current;

    if (latest < ALWAYS_VISIBLE_UNTIL) {
      setHidden(false);
    } else if (delta > DIRECTION_THRESHOLD) {
      setHidden(true);
    } else if (delta < -DIRECTION_THRESHOLD) {
      setHidden(false);
    }

    if (Math.abs(delta) > DIRECTION_THRESHOLD || latest < ALWAYS_VISIBLE_UNTIL) {
      lastY.current = latest;
    }
  });

  return (
    <MotionConfig reducedMotion="user">
      <motion.header
        className={`sticky top-0 z-50 ${className ?? ""}`}
        style={{
          background: "#121212",
        }}
        animate={{ y: hidden ? "-100%" : "0%" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        // A keyboard user tabbing into the bar must be able to see it.
        onFocusCapture={() => setHidden(false)}
      >
        {children}
      </motion.header>
    </MotionConfig>
  );
}
