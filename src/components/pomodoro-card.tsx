import { useEffect, useRef, useState } from "react";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { Play, Pause, RotateCcw } from "lucide-react";

const FOCUS = 25 * 60;
const BREAK = 5 * 60;

export function PomodoroCard({ voice, onSessionEnd }: { voice: Voice; onSessionEnd: (kind: "focus" | "break") => void }) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [remaining, setRemaining] = useState(FOCUS);
  const [running, setRunning] = useState(false);
  const { speak } = useSpeech();

  // Keep latest callbacks/values in refs so the interval effect does NOT
  // re-run on every parent re-render (which would clear the timer each tick).
  const onSessionEndRef = useRef(onSessionEnd);
  const speakRef = useRef(speak);
  const voiceRef = useRef(voice);
  const modeRef = useRef(mode);
  useEffect(() => { onSessionEndRef.current = onSessionEnd; }, [onSessionEnd]);
  useEffect(() => { speakRef.current = speak; }, [speak]);
  useEffect(() => { voiceRef.current = voice; }, [voice]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        const current = modeRef.current;
        const next = current === "focus" ? "break" : "focus";
        onSessionEndRef.current(current);
        speakRef.current(
          current === "focus" ? "Focus session complete. Time for a break." : "Break's over. Back to focus.",
          voiceRef.current,
        );
        setMode(next);
        return next === "focus" ? FOCUS : BREAK;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const reset = () => { setRunning(false); setRemaining(mode === "focus" ? FOCUS : BREAK); };
  const total = mode === "focus" ? FOCUS : BREAK;
  const pct = ((total - remaining) / total) * 100;
  const min = Math.floor(remaining / 60).toString().padStart(2, "0");
  const sec = (remaining % 60).toString().padStart(2, "0");

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-bold tracking-widest">POMODORO</h3>
        <div className="flex rounded-lg border border-border p-1 text-xs">
          <button onClick={() => { setMode("focus"); setRemaining(FOCUS); setRunning(false); }}
            className={`px-2.5 py-1 rounded-md ${mode === "focus" ? "bg-primary text-primary-foreground" : ""}`}>Focus 25</button>
          <button onClick={() => { setMode("break"); setRemaining(BREAK); setRunning(false); }}
            className={`px-2.5 py-1 rounded-md ${mode === "break" ? "bg-secondary text-secondary-foreground" : ""}`}>Break 5</button>
        </div>
      </div>
      <div className="text-center">
        <div className="text-6xl font-display font-bold tracking-widest text-gradient">{min}:{sec}</div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 flex justify-center gap-2">
          <button onClick={() => setRunning((r) => !r)}
            className="rounded-lg bg-primary text-primary-foreground px-5 py-2 font-medium glow-primary flex items-center gap-2">
            {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
          </button>
          <button onClick={reset} className="rounded-lg border border-border px-3 py-2 flex items-center gap-2">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
}
