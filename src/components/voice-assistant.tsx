import { useState } from "react";
import { useSpeech, type Voice } from "@/hooks/use-speech";
import { aiChat } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

export function VoiceAssistant({ userName, voice }: { userName: string; voice: Voice }) {
  const { speak, stop, listen, stopListen, speaking, listening, supported } = useSpeech();
  const chat = useServerFn(aiChat);
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    setInput("");
    setBusy(true);
    const nextHist = [...history, { role: "user" as const, content: msg }];
    setHistory(nextHist);
    try {
      const res = await chat({ data: { name: userName, history: history.slice(-8), message: msg } });
      const reply = res.reply || "…";
      setHistory([...nextHist, { role: "assistant", content: reply }]);
      speak(reply, voice);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI error");
    } finally {
      setBusy(false);
    }
  };

  const onMic = () => {
    if (listening) return stopListen();
    if (!supported.stt) return toast.error("Voice input isn't supported in this browser");
    listen((t) => send(t));
  };

  return (
    <div className="glass rounded-2xl p-5 flex flex-col h-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold tracking-widest">AI COMPANION</h3>
          <p className="text-xs text-muted-foreground">Talk naturally — I'm listening</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`relative grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-primary/10 ${speaking ? "pulse-ring" : ""}`}>
            <motion.div animate={speaking ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ repeat: Infinity, duration: 1 }}
              className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-secondary" />
          </div>
          {speaking && (
            <button onClick={stop} className="rounded-lg border border-border p-2"><VolumeX className="h-4 w-4" /></button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[220px] max-h-[320px] overflow-y-auto rounded-xl border border-border bg-background/40 p-3 space-y-2">
        {history.length === 0 && (
          <div className="text-center text-sm text-muted-foreground mt-8">
            Say something like <span className="text-primary">"How are you?"</span> or <span className="text-primary">"Tell me a joke"</span>.
          </div>
        )}
        <AnimatePresence initial={false}>
          {history.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mt-3 flex gap-2">
        <button type="button" onClick={onMic} disabled={busy}
          className={`grid h-10 w-10 place-items-center rounded-lg border ${listening ? "border-destructive bg-destructive/20 animate-pulse" : "border-border"}`}
          title="Voice">
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder={busy ? "Thinking…" : "Type a message"}
          disabled={busy}
          className="flex-1 rounded-lg bg-input px-3 py-2 border border-border focus:border-primary outline-none text-sm"
        />
        <button disabled={busy || !input.trim()} className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="h-4 w-4" />
        </button>
      </form>

      {!supported.tts && <p className="mt-2 text-xs text-muted-foreground"><Volume2 className="inline h-3 w-3" /> Speech synthesis unavailable in this browser.</p>}
    </div>
  );
}
