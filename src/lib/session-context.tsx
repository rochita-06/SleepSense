import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface SessionState {
  isIdle: boolean;
  activeSeconds: number;
  idleSeconds: number;
  sessionStartedAt: number;
  resetSession: () => void;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children, idleThresholdMs = 90_000 }: { children: ReactNode; idleThresholdMs?: number }) {
  const [isIdle, setIsIdle] = useState(false);
  const [activeSeconds, setActiveSeconds] = useState(0);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<number>(() => Date.now());
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); setIsIdle((prev) => (prev ? false : prev)); };
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
  }, [idleThresholdMs]);

  const resetSession = () => {
    setActiveSeconds(0);
    setIdleSeconds(0);
    setIsIdle(false);
    setSessionStartedAt(Date.now());
    lastActivity.current = Date.now();
  };

  return (
    <SessionContext.Provider value={{ isIdle, activeSeconds, idleSeconds, sessionStartedAt, resetSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
}
