import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Laugh, Sparkles, RefreshCw } from "lucide-react";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { AVAILABLE_CATEGORIES, getRandomJoke, getRandomFact } from "@/lib/conversation";
import type { FactCategory } from "@/data/facts";

export function EntertainmentPanel({ voice }: { voice: Voice }) {
  const [tab, setTab] = useState<"jokes" | "facts">("jokes");
  const [joke, setJoke] = useState<string>("");
  const [fact, setFact] = useState<string>("");
  const [cat, setCat] = useState<FactCategory>("relatable");
  const [busy, setBusy] = useState(false);
  const { speak } = useSpeech();

  const loadJoke = () => {
    setBusy(true);
    // small delay so animation feels real
    setTimeout(() => {
      const j = getRandomJoke();
      setJoke(j);
      speak(j, voice);
      setBusy(false);
    }, 250);
  };

  const loadFact = () => {
    setBusy(true);
    setTimeout(() => {
      const f = getRandomFact(cat);
      setFact(f);
      speak(f, voice);
      setBusy(false);
    }, 250);
  };

  return (
    <div className="glass rounded-2xl p-5 bg-gradient-to-br from-background/60 to-background/30 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold tracking-widest bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          REFRESH
        </h3>
        <div className="flex rounded-lg border border-border/60 p-1 text-sm backdrop-blur">
          <button onClick={() => setTab("jokes")}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${tab === "jokes" ? "bg-primary text-primary-foreground shadow" : "hover:bg-primary/10"}`}>
            <Laugh className="h-3.5 w-3.5" /> Jokes
          </button>
          <button onClick={() => setTab("facts")}
            className={`px-3 py-1 rounded-md flex items-center gap-1.5 transition-all ${tab === "facts" ? "bg-primary text-primary-foreground shadow" : "hover:bg-primary/10"}`}>
            <Sparkles className="h-3.5 w-3.5" /> Facts
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "jokes" ? (
          <motion.div key="jokes" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <motion.div key={joke} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="min-h-[110px] rounded-xl border border-border/50 bg-gradient-to-br from-background/40 to-primary/5 p-4 text-sm leading-relaxed">
              {joke || <span className="text-muted-foreground">Tap the button for a fresh joke. Over 1,000 in the bank — no repeats until you've heard them all. 😄</span>}
            </motion.div>
            <button onClick={loadJoke} disabled={busy}
              className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-medium glow-primary disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform">
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> {joke ? "Another one 😂" : "Tell me a joke"}
            </button>
          </motion.div>
        ) : (
          <motion.div key="facts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CATEGORIES.map((c) => (
                <button key={c.category} onClick={() => setCat(c.category)}
                  className={`text-xs rounded-full px-3 py-1.5 border transition-all ${cat === c.category ? "bg-secondary text-secondary-foreground border-secondary shadow" : "border-border/60 hover:border-primary/60 hover:bg-primary/5"}`}>
                  <span className="mr-1">{c.emoji}</span>{c.label}
                </button>
              ))}
            </div>
            <motion.div key={fact + cat} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
              className="min-h-[110px] rounded-xl border border-border/50 bg-gradient-to-br from-background/40 to-secondary/5 p-4 text-sm leading-relaxed">
              {fact || <span className="text-muted-foreground">Pick a category and reveal a fresh fact — {cat} vibes ready 🌟</span>}
            </motion.div>
            <button onClick={loadFact} disabled={busy}
              className="w-full rounded-lg bg-secondary text-secondary-foreground py-2.5 font-medium glow-secondary disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform">
              <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> New {cat} fact
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
