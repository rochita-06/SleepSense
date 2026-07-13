import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getMe } from "@/lib/auth.functions";
import { getProfile, upsertProfile, updateProfileField, logActivityEvent } from "@/lib/data.functions";
import { clearSession } from "@/lib/auth-client";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { SleepDetector } from "@/components/sleep-detector";
import { EntertainmentPanel } from "@/components/entertainment-panel";
import { PomodoroCard } from "@/components/pomodoro-card";
import { StatsGrid } from "@/components/stats-grid";
import { FloatingAgent } from "@/components/floating-agent";
import { useSession, formatDuration } from "@/lib/session-context";
import { Eye, LogOut, Trash2, User, BarChart3, Moon, Gamepad2, Droplets } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/auth.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [agentName, setAgentName] = useState("Nova");
  const [voice, setVoice] = useState<Voice>("female");
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [alertness, setAlertness] = useState(100);
  const [refresh, setRefresh] = useState(0);
  const { speak } = useSpeech();
  const { isIdle, activeSeconds, idleSeconds, resetSession } = useSession();

  useEffect(() => {
    (async () => {
      const me = await getMe().catch(() => null);
      if (!me) { clearSession(); return navigate({ to: "/auth" }); }
      setUserId(me.id);
      const p = await getProfile();
      if (p) {
        setName(p.name || "");
        setAgentName(p.agent_name || "Nova");
        setVoice((p.voice_gender as Voice) || "female");
        setOnboarded(!!p.onboarded);
      } else setOnboarded(false);
    })();
  }, [navigate]);

  // Smart hydration reminder — every 15 min of active use
  useEffect(() => {
    if (activeSeconds && activeSeconds % 900 === 0) {
      toast("💧 Hydration reminder", { description: "Drink a glass of water to stay sharp." });
    }
  }, [activeSeconds]);

  useEffect(() => {
    if (isIdle && name) toast(`${agentName}: You seem idle`, { description: "Need a joke, a game, or a short break?" });
  }, [isIdle, agentName, name]);

  const completeOnboarding = async (n: string, a: string, v: Voice) => {
    await upsertProfile({ data: { name: n, agent_name: a, voice_gender: v, onboarded: true } });
    setName(n); setAgentName(a); setVoice(v); setOnboarded(true);
    setTimeout(() => speak(`Hi ${n}, I'm ${a}. I'll help you stay focused and productive.`, v), 400);
  };

  const signOut = async () => { resetSession(); clearSession(); navigate({ to: "/" }); };
  const deleteAccount = async () => {
    if (!confirm("Delete your account permanently? This cannot be undone.")) return;
    try { await deleteMyAccount(); clearSession(); toast.success("Account deleted"); navigate({ to: "/" }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed to delete account"); }
  };

  if (onboarded === null) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!onboarded) return <Welcome onComplete={completeOnboarding} />;

  const logEvent = async (event_type: string) => {
    await logActivityEvent({ data: { event_type } });
    setRefresh((n) => n + 1);
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 border border-primary/40 glow-primary">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-display font-bold tracking-widest">SLEEPSENSE</div>
            <div className="text-xs text-muted-foreground">Welcome back, {name} · Agent: {agentName}</div>
          </div>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/analytics" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 hover:border-primary/40 hover:bg-primary/5"><BarChart3 className="h-4 w-4" />Analytics</Link>
          <Link to="/sleep" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 hover:border-primary/40 hover:bg-primary/5"><Moon className="h-4 w-4" />Sleep</Link>
          <Link to="/games" className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 hover:border-primary/40 hover:bg-primary/5"><Gamepad2 className="h-4 w-4" />Games</Link>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="rounded-lg border border-border p-2" title="Sign out"><LogOut className="h-4 w-4" /></button>
          <button onClick={deleteAccount} className="rounded-lg border border-destructive/50 p-2 text-destructive hover:bg-destructive/10" title="Delete account"><Trash2 className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-24">
        <StatsGrid userId={userId} alertness={alertness} refreshKey={refresh} />

        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="glass rounded-xl p-3"><div className="text-muted-foreground flex items-center justify-between">Active session<button onClick={resetSession} className="text-[10px] uppercase tracking-wider text-primary/80 hover:text-primary">End</button></div><div className="font-mono text-base mt-1">{formatDuration(activeSeconds)}</div></div>
          <div className="glass rounded-xl p-3"><div className="text-muted-foreground">Idle time</div><div className="font-mono text-base mt-1">{Math.floor(idleSeconds / 60)}m {idleSeconds % 60}s</div></div>
          <div className="glass rounded-xl p-3"><div className="text-muted-foreground">Status</div><div className={`font-mono text-base mt-1 ${isIdle ? "text-[color:var(--warning)]" : "text-[color:var(--success)]"}`}>{isIdle ? "IDLE" : "ACTIVE"}</div></div>
          <div className="glass rounded-xl p-3 flex items-center gap-2"><Droplets className="h-4 w-4 text-primary" /><div><div className="text-muted-foreground">Next hydration</div><div className="font-mono text-base">{15 - Math.floor((activeSeconds % 900) / 60)}m</div></div></div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5">
            <SleepDetector userId={userId} userName={name} voice={voice}
              onTired={() => setRefresh((n) => n + 1)} onAlertness={setAlertness} />
            <div className="grid gap-5 md:grid-cols-2">
              <EntertainmentPanel voice={voice} />
              <PomodoroCard voice={voice} onSessionEnd={(k) => logEvent(k === "focus" ? "pomodoro_focus" : "pomodoro_break")} />
            </div>
          </div>
          <div className="space-y-5">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-sm tracking-widest mb-2">AGENT SETTINGS</h3>
              <label className="text-xs text-muted-foreground">Agent name</label>
              <input value={agentName} onChange={(e) => setAgentName(e.target.value)}
                onBlur={async () => { await updateProfileField({ data: { agent_name: agentName } }); toast.success("Agent renamed"); }}
                className="mt-1 w-full rounded-lg bg-input px-3 py-2 border border-border focus:border-primary outline-none text-sm" />
              <label className="text-xs text-muted-foreground mt-3 block">Voice</label>
              <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                <button onClick={async () => {
                  setVoice("female");
                  await updateProfileField({ data: { voice_gender: "female" } });
                  window.dispatchEvent(new CustomEvent("sg:voice-change", { detail: { voice: "female" } }));
                  speak(`Hi ${name || "there"}, I'm now speaking in a female voice.`, "female");
                  toast.success("Voice switched to female");
                }}
                  className={`rounded-lg border py-2 ${voice === "female" ? "border-primary bg-primary/10" : "border-border"}`}>♀ Female</button>
                <button onClick={async () => {
                  setVoice("male");
                  await updateProfileField({ data: { voice_gender: "male" } });
                  window.dispatchEvent(new CustomEvent("sg:voice-change", { detail: { voice: "male" } }));
                  speak(`Hey ${name || "there"}, I'm now speaking in a male voice.`, "male");
                  toast.success("Voice switched to male");
                }}
                  className={`rounded-lg border py-2 ${voice === "male" ? "border-primary bg-primary/10" : "border-border"}`}>♂ Male</button>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">Tap the 💬 button (bottom-right) to talk to {agentName}. Try "open sleep monitor", "tell me a joke", "show analytics".</p>
            </div>
          </div>
        </div>
      </main>

      <FloatingAgent userName={name} agentName={agentName} voice={voice} />
    </div>
  );
}

function Welcome({ onComplete }: { onComplete: (name: string, agent: string, voice: Voice) => void | Promise<void> }) {
  const [n, setN] = useState("");
  const [a, setA] = useState("Nova");
  const [v, setV] = useState<Voice>("female");
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md glass rounded-2xl p-8">
        <div className="mb-5 flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 border border-primary/40 float">
            <User className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gradient">Let's set you up</h1>
          <p className="text-sm text-muted-foreground">Meet your autonomous AI agent</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); if (n.trim()) onComplete(n.trim(), a.trim() || "Nova", v); }} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Your name</label>
            <input value={n} onChange={(e) => setN(e.target.value)} required autoFocus placeholder="e.g. Rahul"
              className="mt-1.5 w-full rounded-lg bg-input px-3 py-2.5 border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Name your agent</label>
            <input value={a} onChange={(e) => setA(e.target.value)} placeholder="e.g. Nova, Jarvis, Atlas"
              className="mt-1.5 w-full rounded-lg bg-input px-3 py-2.5 border border-border focus:border-primary outline-none" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Assistant voice</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setV("female")} className={`rounded-lg border py-3 ${v === "female" ? "border-primary bg-primary/10" : "border-border"}`}>♀ Female</button>
              <button type="button" onClick={() => setV("male")} className={`rounded-lg border py-3 ${v === "male" ? "border-primary bg-primary/10" : "border-border"}`}>♂ Male</button>
            </div>
          </div>
          <button className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground glow-primary">Enter dashboard</button>
        </form>
      </div>
    </div>
  );
}
