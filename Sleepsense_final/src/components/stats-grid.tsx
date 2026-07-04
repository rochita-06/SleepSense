import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, AlertTriangle, Gamepad2, Timer } from "lucide-react";

export function StatsGrid({ userId, alertness, refreshKey }: { userId: string; alertness: number; refreshKey: number }) {
  const [tired, setTired] = useState(0);
  const [alarms, setAlarms] = useState(0);
  const [games, setGames] = useState(0);
  const [focusMin, setFocusMin] = useState(0);

  useEffect(() => {
    (async () => {
      const since = new Date(); since.setHours(0, 0, 0, 0);
      const { data } = await supabase.from("activity_events")
        .select("event_type")
        .eq("user_id", userId)
        .gte("created_at", since.toISOString());
      if (!data) return;
      setTired(data.filter(e => e.event_type === "tired").length);
      setAlarms(data.filter(e => e.event_type === "sleep_alarm").length);
      setGames(data.filter(e => e.event_type === "game_completed").length);
      setFocusMin(data.filter(e => e.event_type === "pomodoro_focus").length * 25);
    })();
  }, [userId, refreshKey]);

  const score = Math.max(0, Math.min(100, Math.round(alertness * 0.5 + focusMin * 0.8 - tired * 3 - alarms * 6 + games * 2)));

  const cards = [
    { icon: Activity, label: "Alertness", value: `${alertness}%`, color: "text-[color:var(--success)]" },
    { icon: AlertTriangle, label: "Tired events", value: tired, color: "text-[color:var(--warning)]" },
    { icon: AlertTriangle, label: "Sleep alarms", value: alarms, color: "text-[color:var(--danger)]" },
    { icon: Timer, label: "Focus mins", value: focusMin, color: "text-primary" },
    { icon: Gamepad2, label: "Games played", value: games, color: "text-secondary" },
    { icon: Activity, label: "Productivity", value: score, color: "text-gradient" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-xl p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <c.icon className="h-3.5 w-3.5" /> {c.label}
          </div>
          <div className={`mt-1 text-2xl font-display font-bold ${c.color}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
