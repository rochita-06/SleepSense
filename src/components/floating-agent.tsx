import { useEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Mic, Send, Sparkles, X, MessageCircle } from "lucide-react";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { detectIntent } from "@/lib/intent";
import { aiChat } from "@/lib/ai.functions";
import { casualReply, detectCasual, detectFactCategory, getRandomFact, getRandomJoke, matchSmalltalk } from "@/lib/conversation";

type Msg = { role: "user" | "assistant"; content: string; ts: number };

const MEMORY_KEY = "sg_agent_memory_v1";

export function FloatingAgent({ userName, agentName, voice: voiceProp }: { userName: string; agentName: string; voice: Voice }) {
  const [voice, setVoiceState] = useState<Voice>(voiceProp);
  useEffect(() => { setVoiceState(voiceProp); }, [voiceProp]);
  // React live to voice changes broadcast from anywhere in the app
  useEffect(() => {
    const h = (e: Event) => {
      const v = (e as CustomEvent<{ voice: Voice }>).detail?.voice;
      if (v === "male" || v === "female") setVoiceState(v);
    };
    window.addEventListener("sg:voice-change", h);
    return () => window.removeEventListener("sg:voice-change", h);
  }, []);
  const navigate = useNavigate();
  const router = useRouterState();
  const { speak, listen, listening, supported } = useSpeech();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) setMsgs(JSON.parse(raw).slice(-12));
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { localStorage.setItem(MEMORY_KEY, JSON.stringify(msgs.slice(-20))); } catch { /* ignore */ }
  }, [msgs]);

  // Listen to external open events (used by IdlePrompt to auto-pop the chat)
  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const detail = (e as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) {
        // Push a synthetic assistant message
        setMsgs((m) => [...m, { role: "assistant", content: detail.prompt!, ts: Date.now() }]);
      }
    };
    window.addEventListener("sg:agent-open", handler);
    return () => window.removeEventListener("sg:agent-open", handler);
  }, []);

  useEffect(() => {
    if (open && !greeted && msgs.length === 0) {
      const hour = new Date().getHours();
      const greetPart = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
      const hello: Msg = {
        role: "assistant",
        content: `${greetPart} ${userName || "friend"} 👋 I'm ${agentName || "your assistant"}. Ask me anything — chat, jokes, facts, focus timer… I've got you.`,
        ts: Date.now(),
      };
      setMsgs((m) => [...m, hello]);
      speak(hello.content, voice);
      setGreeted(true);
    }
  }, [open, greeted, userName, agentName, voice, speak, msgs.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  const push = (m: Msg) => setMsgs((prev) => [...prev, m]);

  const handleSend = async (raw?: string) => {
    const text = (raw ?? input).trim();
    if (!text) return;
    setInput("");
    push({ role: "user", content: text, ts: Date.now() });
    setTyping(true);

    try {
      // 1) Strong action intents (navigate / joke / fact / pomodoro / etc.)
      const intent = detectIntent(text);

      if (intent.action.kind === "navigate") {
        const target = intent.action.to;
        push({ role: "assistant", content: intent.reply, ts: Date.now() });
        speak(intent.reply, voice);
        setTimeout(() => navigate({ to: target }), 500);
        return;
      }
      if (intent.action.kind === "joke") {
        const j = getRandomJoke();
        push({ role: "assistant", content: j, ts: Date.now() });
        speak(j, voice);
        return;
      }
      if (intent.action.kind === "fact") {
        const cat = intent.action.category ?? detectFactCategory(text) ?? "random";
        const f = getRandomFact(cat);
        const line = `Here's a ${cat} one 👉 ${f}`;
        push({ role: "assistant", content: line, ts: Date.now() });
        speak(f, voice);
        return;
      }
      if (intent.action.kind === "video") {
        window.dispatchEvent(new CustomEvent("sg:video", { detail: { on: intent.action.on } }));
        push({ role: "assistant", content: intent.reply, ts: Date.now() });
        speak(intent.reply, voice);
        return;
      }
      if (intent.action.kind === "pomodoro") {
        window.dispatchEvent(new CustomEvent("sg:pomodoro", { detail: { mode: intent.action.mode ?? "focus" } }));
        push({ role: "assistant", content: intent.reply, ts: Date.now() });
        speak(intent.reply, voice);
        return;
      }
      if (intent.action.kind === "break" || intent.action.kind === "hydrate") {
        push({ role: "assistant", content: intent.reply, ts: Date.now() });
        speak(intent.reply, voice);
        return;
      }

      // 2) Casual conversation (greetings, mood, small talk) — instant local reply
      const casual = detectCasual(text);
      if (casual) {
        const reply = casualReply(casual, { userName, agentName });
        push({ role: "assistant", content: reply, ts: Date.now() });
        speak(reply, voice);
        return;
      }

      // 2.5) Big local smalltalk bank (1000+ replies) — matches keywords instantly
      const bank = matchSmalltalk(text, { userName, agentName });
      if (bank) {
        push({ role: "assistant", content: bank, ts: Date.now() });
        speak(bank, voice);
        return;
      }

      // 3) Fallback: AI chat with graceful degradation
      const context = `Current page: ${router.location.pathname}.`;
      const { reply } = await aiChat({
        data: {
          name: userName,
          agent: agentName,
          message: `${text}\n\n[Context: ${context}]`,
          history: msgs.slice(-8).map((m) => ({ role: m.role, content: m.content })),
        },
      });
      push({ role: "assistant", content: reply, ts: Date.now() });
      speak(reply, voice);
    } catch (e) {
      // Absolute last-resort — never crash the chat
      const err = e instanceof Error ? e.message : "hmm, something odd happened";
      const soft = `Small hiccup on my end 😅 (${err.slice(0, 80)}) — mind saying that again?`;
      push({ role: "assistant", content: soft, ts: Date.now() });
    } finally {
      setTyping(false);
    }
  };

  const quick = ["How are you?", "Tell me a joke", "Relatable fact", "Motivate me", "Open sleep monitor"];

  return (
    <>
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-2xl shadow-primary/40"
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        <motion.span
          className="absolute inset-0 rounded-full bg-primary/30 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
        />
        <span className="relative z-10">
          {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-5 z-40 w-[min(94vw,400px)] h-[min(72vh,600px)] rounded-3xl border border-primary/30 flex flex-col overflow-hidden shadow-2xl backdrop-blur-2xl bg-gradient-to-br from-background/90 via-background/80 to-primary/10"
          >
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-lg">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div>
                  <div className="font-display text-sm font-bold tracking-wide">{agentName || "Assistant"}</div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> online · thinking with you
                  </div>
                </div>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 text-sm">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2 items-end`}>
                  {m.role === "assistant" && (
                    <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-sm ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground rounded-br-sm"
                      : "bg-background/70 border border-border/50 text-foreground rounded-bl-sm backdrop-blur"
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex justify-start items-end gap-2">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 shrink-0">
                    <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm px-3.5 py-3 bg-background/70 border border-border/50 flex gap-1 items-center">
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9 }} className="h-1.5 w-1.5 bg-primary rounded-full" />
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.15 }} className="h-1.5 w-1.5 bg-primary rounded-full" />
                    <motion.span animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.3 }} className="h-1.5 w-1.5 bg-primary rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {msgs.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {quick.map((q) => (
                  <button key={q} onClick={() => handleSend(q)}
                    className="text-[11px] rounded-full border border-border/60 px-2.5 py-1 hover:bg-primary/10 hover:border-primary/50 transition-all">
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="border-t border-border/50 p-3 flex items-center gap-2 bg-background/60 backdrop-blur">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${agentName || "assistant"}…`}
                className="flex-1 rounded-xl bg-background/70 px-3.5 py-2.5 border border-border/60 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all" />
              {supported.stt && (
                <button type="button" onClick={() => listen((t) => handleSend(t))}
                  className={`rounded-xl border p-2.5 transition-all ${listening ? "border-primary bg-primary/10 text-primary animate-pulse" : "border-border/60 hover:border-primary/50"}`} aria-label="Voice">
                  <Mic className="h-4 w-4" />
                </button>
              )}
              <button type="submit" className="rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground p-2.5 shadow-lg hover:scale-105 transition-transform" aria-label="Send">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
