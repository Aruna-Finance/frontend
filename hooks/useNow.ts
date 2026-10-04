"use client";

import { useEffect, useState } from "react";

// Wall-clock seconds, ticking. Countdowns and "is it due yet" checks read this
// instead of calling Date.now() during render.
export function useNowSeconds(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
