"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { cancelFrame, frame, useReducedMotion } from "motion/react";

// Mounted only on the landing page: inertial scrolling via Lenis, driven by
// Motion's own frame loop so scroll-linked animations (the navbar's
// hide/show, whileInView reveals) stay in step with the smoothed position.
// Motion has no wheel-smoothing engine of its own - it animates values, not
// the browser's scroll physics.
export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({ autoRaf: false, lerp: 0.13, wheelMultiplier: 1.0 });
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
