import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSleepDetection, type AlertState } from "@/hooks/use-sleep-detection";
import { useAlarm } from "@/hooks/use-alarm";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { Camera, CameraOff, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

const stateLabel: Record<AlertState, { label: string; color: string }> = {
  idle: { label: "STANDBY", color: "text-muted-foreground" },
  active: { label: "ACTIVE", color: "text-[color:var(--success)]" },
  tired: { label: "TIRED", color: "text-[color:var(--warning)]" },
  sleep: { label: "SLEEPING", color: "text-[color:var(--danger)]" },
};

export function SleepDetector({
  userId,
  userName,
  voice,
  onTired,
  onAlertness,
}: {
  userId: string;
  userName: string;
  voice: Voice;
  onTired: () => void;
  onAlertness: (n: number) => void;
}) {
  const alarm = useAlarm();
  const { speak, stop: stopSpeak } = useSpeech();
  const [alarmOn, setAlarmOn] = useState(false);
  const lastLogRef = useRef(0);

  const detector = useSleepDetection({
    onTired: () => {
      speak(`${userName}, you're looking a bit tired.`, voice);
      onTired();
      logEvent(userId, "tired");
      // Pop the assistant with a menu of quick actions the user can reply to
      window.dispatchEvent(new CustomEvent("sg:agent-open", {
        detail: {
          prompt: `Hey ${userName || "friend"} 💛 I noticed you're looking tired. What would help right now?\n\n• 🎮 play a game\n• 😂 tell me a joke\n• 🧠 fun fact\n• 💧 drink water\n• ▶️ continue\n\nJust reply with any of those.`,
        },
      }));
    },
    onSleep: () => {
      alarm.play(0.35);
      setAlarmOn(true);
      speak(`${userName}! Wake up! You've been inactive.`, voice);
      logEvent(userId, "sleep_alarm");
    },
    onWake: () => {
      alarm.stop();
      setAlarmOn(false);
    },
  });

  useEffect(() => {
    onAlertness(detector.alertness);
    const now = Date.now();
    if (now - lastLogRef.current > 60_000 && detector.state === "active") {
      lastLogRef.current = now;
    }
  }, [detector.alertness, detector.state, onAlertness]);

  useEffect(() => {
    const handler = (e: Event) => {
      const on = (e as CustomEvent<{ on: boolean }>).detail?.on;
      if (on && !detector.running) detector.start();
      else if (!on && detector.running) detector.stop();
    };
    window.addEventListener("sg:video", handler as EventListener);
    return () => window.removeEventListener("sg:video", handler as EventListener);
  }, [detector]);

  const s = stateLabel[detector.state];

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold tracking-widest">SLEEP MONITOR</h3>
          <p className="text-xs text-muted-foreground mt-0.5">MediaPipe FaceMesh · Eye Aspect Ratio</p>
        </div>
        <div className="flex gap-2">
          {alarmOn && (
            <button onClick={() => { alarm.stop(); setAlarmOn(false); stopSpeak(); }}
              className="rounded-lg bg-destructive/20 border border-destructive/40 px-3 py-2 text-sm flex items-center gap-2 text-destructive">
              <VolumeX className="h-4 w-4" /> Silence
            </button>
          )}
          {detector.running ? (
            <button onClick={detector.stop} className="rounded-lg border border-border px-3 py-2 text-sm flex items-center gap-2">
              <CameraOff className="h-4 w-4" /> Stop
            </button>
          ) : (
            <button onClick={detector.start} className="rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium glow-primary flex items-center gap-2">
              <Camera className="h-4 w-4" /> Start monitoring
            </button>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border aspect-video bg-black/60">
        <video ref={detector.videoRef} className="hidden" playsInline muted />
        <canvas ref={detector.canvasRef} className="h-full w-full object-cover" />
        {!detector.running && (
          <div className="absolute inset-0 grid place-items-center text-center px-6">
            <div>
              <Camera className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">Grant camera access to begin real-time drowsiness detection.</p>
            </div>
          </div>
        )}
        {detector.running && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full glass-strong px-4 py-1.5">
            <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
              className={`h-2 w-2 rounded-full ${detector.state === "sleep" ? "bg-[color:var(--danger)]" : detector.state === "tired" ? "bg-[color:var(--warning)]" : "bg-[color:var(--success)]"}`} />
            <span className={`text-xs font-semibold tracking-widest ${s.color}`}>{s.label}</span>
          </div>
        )}
      </div>

      {detector.error && (
        <p className="mt-3 text-xs text-destructive">{detector.error}</p>
      )}

      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        🔒 <span className="text-foreground/80">Privacy:</span> video is processed only in your browser. Frames are never uploaded or stored — the camera stops automatically when you leave the page.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-border p-3">
          <div className="text-muted-foreground">EAR</div>
          <div className="font-mono text-lg">{detector.earValue.toFixed(3)}</div>
        </div>
        <div className="rounded-lg border border-border p-3">
          <div className="text-muted-foreground">Alertness</div>
          <div className="font-mono text-lg">{detector.alertness}%</div>
        </div>
      </div>
    </div>
  );
}

async function logEvent(userId: string, event_type: string, meta: Record<string, unknown> = {}) {
  try {
    await supabase.from("activity_events").insert({ user_id: userId, event_type, meta: meta as never });
  } catch {}
}
