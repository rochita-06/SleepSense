import { useEffect, useRef, useState } from "react";

export function useIdleTracker(idleThresholdMs = 60_000) {
  const [isIdle, setIsIdle] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); if (isIdle) setIsIdle(false); };
    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    const tick = setInterval(() => {
      const gap = Date.now() - lastActivity.current;
      if (gap >= idleThresholdMs) { setIsIdle(true); setIdleSeconds((s) => s + 1); }
      else { setActiveSeconds((s) => s + 1); }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(tick);
    };
  }, [idleThresholdMs, isIdle]);

  return { isIdle, activeSeconds, idleSeconds };
}
