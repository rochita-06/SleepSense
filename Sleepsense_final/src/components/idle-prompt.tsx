import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { Coffee, Gamepad2, Sparkles, X } from "lucide-react";
import { useIdleTracker } from "@/hooks/use-idle-tracker";
import { getRandomFact } from "@/lib/conversation";

/**
 * Watches for idle time and pops a friendly bot prompt after the user has been
 * inactive for `idleMs`. Only re-shows after activity → idle cycles again.
 */
export function IdlePrompt({ idleMs = 90_000 }: { idleMs?: number }) {
  const { isIdle } = useIdleTracker(idleMs);
  const [visible, setVisible] = useState(false);
  const [dismissedUntilActive, setDismissedUntilActive] = useState(false);
  const [factLine, setFactLine] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isIdle && !dismissedUntilActive) setVisible(true);
    if (!isIdle) { setDismissedUntilActive(false); setVisible(false); }
  }, [isIdle, dismissedUntilActive]);

  const dismiss = () => { setVisible(false); setDismissedUntilActive(true); setFactLine(null); };

  const handleContinue = () => dismiss();
  const handleGame = () => { dismiss(); navigate({ to: "/games" }); };
  const handleFact = () => { setFactLine(getRandomFact("random")); };
  const handleTalk = () => {
    dismiss();
    window.dispatchEvent(new CustomEvent("sg:agent-open", {
      detail: { prompt: "You seemed a bit idle — want to chat, hear a joke, or take a quick break? 😊" },
    }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          className="fixed bottom-24 left-5 z-40 w-[min(92vw,360px)] rounded-3xl border border-primary/30 shadow-2xl backdrop-blur-2xl bg-gradient-to-br from-background/90 via-background/80 to-primary/10 overflow-hidden"
        >
          <div className="flex items-start justify-between p-4 border-b border-border/40 bg-gradient-to-r from-primary/10 to-secondary/10">
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span className="text-lg">😴</span> Hey, you seem quiet
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Taking a mini-check-in — you good?</div>
            </div>
            <button onClick={dismiss} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 space-y-2 text-sm">
            {factLine ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/50 bg-background/40 p-3 leading-relaxed"
              >
                <div className="text-[10px] uppercase tracking-widest text-primary mb-1">✨ Fun fact</div>
                {factLine}
              </motion.div>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Would you like to…
              </p>
            )}

            <div className="grid gap-2 pt-1">
              <button onClick={handleContinue}
                className="rounded-xl bg-primary/10 border border-primary/30 py-2.5 px-3 text-left text-sm hover:bg-primary/20 transition flex items-center gap-2">
                <Coffee className="h-4 w-4 text-primary" /> Continue what I was doing
              </button>
              <button onClick={handleGame}
                className="rounded-xl bg-secondary/10 border border-secondary/30 py-2.5 px-3 text-left text-sm hover:bg-secondary/20 transition flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-secondary" /> Play a quick game
              </button>
              <button onClick={handleFact}
                className="rounded-xl bg-background/60 border border-border/50 py-2.5 px-3 text-left text-sm hover:bg-primary/10 transition flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> {factLine ? "Another fun fact" : "Hear a fun fact"}
              </button>
              <button onClick={handleTalk}
                className="text-xs text-muted-foreground hover:text-foreground text-center pt-1">
                or… just chat with me →
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
