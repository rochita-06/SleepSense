import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, type TooltipProps } from "recharts";
import { ArrowLeft, Activity, Moon, Focus, Zap } from "lucide-react";
import { useSession } from "@/lib/session-context";

export const Route = createFileRoute("/_authenticated/analytics")({ component: AnalyticsPage });

// Modern, high-contrast, accessible palette (aligned with Tailwind emerald/blue/amber/red)
const CATEGORY_COLORS: Record<string, string> = {
  Focus: "#3B82F6",   // blue-500
  Active: "#10B981",  // emerald-500
  Idle: "#F59E0B",    // amber-500
  Sleep: "#EF4444",   // red-500
};

function AnalyticsPage() {
  const [events, setEvents] = useState<Array<{ event_type: string; created_at: string }>>([]);
  const { activeSeconds, idleSeconds } = useSession();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("activity_events").select("event_type, created_at").order("created_at", { ascending: false }).limit(500);
      setEvents(data ?? []);
    })();
  }, []);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    const dayEvents = events.filter((e) => e.created_at.startsWith(key));
    return {
      day: label,
      focus: dayEvents.filter((e) => e.event_type === "pomodoro_focus").length * 25,
      tired: dayEvents.filter((e) => e.event_type === "tired").length,
      alarms: dayEvents.filter((e) => e.event_type === "sleep_alarm").length,
      games: dayEvents.filter((e) => e.event_type === "game_completed").length,
    };
  });

  const today = last7[6];
  const focusMin = today.focus;
  // Real values from the live session (in minutes), not synthetic estimates.
  const activeMin = Math.floor(activeSeconds / 60);
  const idleMin = Math.floor(idleSeconds / 60);
  const sleepMin = today.alarms * 3;
  const score = Math.min(100, Math.round((focusMin * 2 + today.games * 5 + activeMin * 0.2) / 2));

  const breakdown = [
    { name: "Focus", value: focusMin },
    { name: "Active", value: activeMin },
    { name: "Idle", value: idleMin },
    { name: "Sleep", value: sleepMin },
  ];
  const total = breakdown.reduce((s, b) => s + b.value, 0) || 1;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="font-display font-bold tracking-widest">DAILY ANALYTICS</h1>
        <div className="w-24" />
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-16 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat icon={<Focus className="h-4 w-4" />} label="Focus (min)" value={focusMin} />
          <Stat icon={<Activity className="h-4 w-4" />} label="Active (min)" value={activeMin} />
          <Stat icon={<Moon className="h-4 w-4" />} label="Idle (min)" value={idleMin} />
          <Stat icon={<Zap className="h-4 w-4" />} label="Productivity" value={`${score}%`} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-sm tracking-widest mb-4 text-primary">TODAY'S BREAKDOWN</h3>
            <BreakdownDonut breakdown={breakdown} total={total} />
          </div>

          <div className="glass rounded-2xl p-5 lg:col-span-2">
            <h3 className="font-display text-sm tracking-widest mb-4 text-primary">ACTIVITY TIMELINE</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7} margin={{ top: 10, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(0 0% 100% / 0.12)" />
                  <XAxis dataKey="day" stroke="hsl(0 0% 85%)" fontSize={13} tickMargin={8} />
                  <YAxis stroke="hsl(0 0% 85%)" fontSize={13} tickMargin={6} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(230 20% 10%)", border: "1px solid #3B82F6", borderRadius: 10, color: "white", fontSize: 13 }} />
                  <Bar dataKey="tired" name="Tired" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="alarms" name="Sleep alarms" fill="#EF4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="games" name="Games" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#F59E0B" }} />Tired events</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#EF4444" }} />Sleep alarms</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#8B5CF6" }} />Games played</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function BreakdownDonut({ breakdown, total }: { breakdown: Array<{ name: string; value: number }>; total: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <Pie
              data={breakdown}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="82%"
              paddingAngle={3}
              stroke="var(--background)"
              strokeWidth={3}
              isAnimationActive
              animationDuration={600}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {breakdown.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name]}
                  style={{
                    transition: "transform 200ms ease, filter 200ms ease",
                    transformOrigin: "center",
                    transform: activeIndex === i ? "scale(1.04)" : "scale(1)",
                    filter: activeIndex === i ? "brightness(1.1)" : "none",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
            <Tooltip
              content={<DonutTooltip total={total} />}
              cursor={false}
              wrapperStyle={{ outline: "none", zIndex: 40 }}
              animationDuration={180}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {breakdown.map((b) => {
          const pct = Math.round((b.value / total) * 100);
          return (
            <li key={b.name} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <span className="flex items-center gap-2 font-medium text-foreground">
                <span className="h-3 w-3 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[b.name], boxShadow: `0 0 0 2px ${CATEGORY_COLORS[b.name]}22` }} />
                {b.name}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                <span className="text-foreground">{b.value} min</span> ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function DonutTooltip({ active, payload, total }: TooltipProps<number, string> & { total: number }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0];
  const name = String(p.name ?? "");
  const value = Number(p.value ?? 0);
  const pct = Math.round((value / total) * 100);
  const color = CATEGORY_COLORS[name] ?? "#3B82F6";
  return (
    <div
      role="tooltip"
      className="pointer-events-none rounded-xl border bg-popover/95 px-3.5 py-2.5 shadow-lg backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ borderColor: `${color}66`, minWidth: 170 }}
    >
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-semibold text-popover-foreground">{name}</span>
      </div>
      <div className="mt-1.5 text-lg font-bold text-popover-foreground">{value} <span className="text-xs font-normal text-muted-foreground">minutes</span></div>
      <div className="text-xs text-muted-foreground">{pct}% of today's activity</div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</div>
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
