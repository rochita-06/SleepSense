import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, Mic, Brain, Zap, Gamepad2, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // If already logged in, hop to dashboard
    if (typeof window !== "undefined") {
      const { data } = await supabase.auth.getSession();
      if (data.session) throw redirect({ to: "/dashboard" });
    }
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 border border-primary/40 glow-primary">
            <Eye className="h-5 w-5 text-primary" />
          </div>
          <span className="font-display text-lg font-bold tracking-widest">SLEEPSENSE</span>
        </div>
        <Link to="/auth" className="rounded-lg border border-primary/40 px-4 py-2 text-sm font-medium hover:bg-primary/10 transition">Sign in</Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-8 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center">
          <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">Personal AI Wellness Assistant</p>
          <h1 className="mx-auto max-w-3xl text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-gradient">Stay awake.</span><br/>Stay in flow.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A futuristic AI companion that watches your alertness in real time, talks with you like Jarvis,
            and keeps you sharp with jokes, mini-games, and Pomodoro sessions.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground glow-primary hover:opacity-90 transition">Get started free</Link>
          </div>
        </motion.div>

        <div id="features" className="mt-24 grid gap-5 md:grid-cols-3">
          {[
            { icon: Eye, title: "Vision-based drowsiness", desc: "MediaPipe face mesh + EAR algorithm run entirely in your browser." },
            { icon: Mic, title: "Voice companion", desc: "Talk naturally. Pick a male or female AI voice powered by Gemini." },
            { icon: Zap, title: "Smart wake alarm", desc: "Escalating audio + spoken warning if your eyes stay closed too long." },
            { icon: Gamepad2, title: "Mini games", desc: "Memory, reaction, RPS, number guess — a quick reset when you dip." },
            { icon: Brain, title: "Jokes & fun facts", desc: "AI-generated on demand, spoken aloud in your chosen voice." },
            { icon: Timer, title: "Pomodoro + reports", desc: "25/5 sessions with a daily productivity score & mood timeline." },
          ].map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-6 hover:border-primary/60 transition">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
