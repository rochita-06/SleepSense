import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SleepDetector } from "@/components/sleep-detector";
import { PomodoroCard } from "@/components/pomodoro-card";
import { IdlePrompt } from "@/components/idle-prompt";
import type { Voice } from "@/hooks/use-speech";
import { ArrowLeft, Timer, Activity } from "lucide-react";
import { useSession, formatDuration } from "@/lib/session-context";

export const Route = createFileRoute("/_authenticated/sleep")({ component: SleepPage });

function SleepPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [voice, setVoice] = useState<Voice>("female");
  const { activeSeconds, idleSeconds, isIdle } = useSession();

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return navigate({ to: "/auth" });
      setUserId(u.user.id);
      const { data: p } = await supabase.from("profiles").select("name, voice_gender").eq("id", u.user.id).maybeSingle();
      if (p) { setName(p.name || ""); setVoice((p.voice_gender as Voice) || "female"); }
    })();
  }, [navigate]);

  useEffect(() => {
    const h = (e: Event) => {
      const v = (e as CustomEvent<{ voice: Voice }>).detail?.voice;
      if (v === "male" || v === "female") setVoice(v);
    };
    window.addEventListener("sg:voice-change", h);
    return () => window.removeEventListener("sg:voice-change", h);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="font-display font-bold tracking-widest bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          SLEEP MONITOR
        </h1>
        <div className="w-24" />
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {userId && <SleepDetector userId={userId} userName={name} voice={voice} onTired={() => {}} onAlertness={() => {}} />}
        </div>

        <aside className="space-y-6">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-3">
              <Activity className="h-3.5 w-3.5" /> Active Session
            </div>
            <div className="font-mono text-2xl">{formatDuration(activeSeconds)}</div>
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Idle: <span className="font-mono text-foreground">{formatDuration(idleSeconds)}</span></span>
              <span className={`font-mono ${isIdle ? "text-[color:var(--warning)]" : "text-[color:var(--success)]"}`}>{isIdle ? "IDLE" : "ACTIVE"}</span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Synced with your Dashboard session.</p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary mb-2">
              <Timer className="h-3.5 w-3.5" /> Focus Companion
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pair a Pomodoro cycle with sleep monitoring. Work in short bursts,
              take breaks when the timer chimes — I'll keep an eye on your alertness.
            </p>
          </div>

          <PomodoroCard voice={voice} onSessionEnd={() => { /* logged internally */ }} />
        </aside>
      </main>

      {/* Auto-detects inactivity on this page and offers a friendly nudge */}
      <IdlePrompt idleMs={90_000} />
    </div>
  );
}
