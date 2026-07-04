import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GamesPanel } from "@/components/games-panel";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/games")({ component: GamesPage });

function GamesPage() {
  const [userId, setUserId] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    })();
  }, []);

  const onCompleted = async () => {
    if (!userId) return;
    await supabase.from("activity_events").insert({ user_id: userId, event_type: "game_completed" });
    toast.success("Game logged", { description: "Games played updated on dashboard." });
  };

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <h1 className="font-display font-bold tracking-widest">MINI GAMES</h1>
        <div className="w-24" />
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-16">
        <GamesPanel onCompleted={onCompleted} />
      </main>
    </div>
  );
}
