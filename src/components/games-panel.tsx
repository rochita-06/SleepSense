import { useEffect, useRef, useState } from "react";

type GameId = "memory" | "guess" | "rps" | "reaction";

export function GamesPanel({ onCompleted }: { onCompleted: (id: GameId) => void }) {
  const [game, setGame] = useState<GameId | null>(null);
  const games: { id: GameId; name: string; desc: string; emoji: string }[] = [
    { id: "memory", name: "Memory Flash", desc: "Recall a color sequence", emoji: "🧠" },
    { id: "guess", name: "Number Guess", desc: "Find 1–100 in fewest tries", emoji: "🎯" },
    { id: "rps", name: "Rock Paper Scissors", desc: "Best of 5 vs AI", emoji: "✊" },
    { id: "reaction", name: "Reaction Speed", desc: "Tap when the light turns green", emoji: "⚡" },
  ];

  if (!game) {
    return (
      <div className="glass rounded-2xl p-5">
        <h3 className="font-display text-lg font-bold tracking-widest mb-4">MINI GAMES</h3>
        <div className="grid grid-cols-2 gap-3">
          {games.map((g) => (
            <button key={g.id} onClick={() => setGame(g.id)}
              className="rounded-xl border border-border p-4 text-left hover:border-primary/60 hover:bg-primary/5 transition">
              <div className="text-2xl">{g.emoji}</div>
              <div className="font-semibold mt-2">{g.name}</div>
              <div className="text-xs text-muted-foreground">{g.desc}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-bold tracking-widest">{games.find(g => g.id === game)?.name}</h3>
        <button onClick={() => setGame(null)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
      </div>
      {game === "memory" && <Memory onDone={() => onCompleted("memory")} />}
      {game === "guess" && <NumberGuess onDone={() => onCompleted("guess")} />}
      {game === "rps" && <RPS onDone={() => onCompleted("rps")} />}
      {game === "reaction" && <Reaction onDone={() => onCompleted("reaction")} />}
    </div>
  );
}

/* -------- Memory Flash -------- */
function Memory({ onDone }: { onDone: () => void }) {
  const colors = ["red", "green", "blue", "yellow"] as const;
  type C = typeof colors[number];
  const bg: Record<C, string> = { red: "bg-red-500", green: "bg-green-500", blue: "bg-blue-500", yellow: "bg-yellow-400" };
  const [seq, setSeq] = useState<C[]>([]);
  const [player, setPlayer] = useState<C[]>([]);
  const [flash, setFlash] = useState<C | null>(null);
  const [level, setLevel] = useState(0);
  const [msg, setMsg] = useState("Watch the sequence");

  const play = async (s: C[]) => {
    setMsg("Watch…");
    for (const c of s) {
      setFlash(c); await sleep(500); setFlash(null); await sleep(200);
    }
    setMsg("Your turn");
  };

  const next = () => {
    const c = colors[Math.floor(Math.random() * 4)];
    const s = [...seq, c];
    setSeq(s); setPlayer([]); setLevel(s.length);
    play(s);
  };

  useEffect(() => { next(); /* eslint-disable-next-line */ }, []);

  const tap = async (c: C) => {
    if (flash) return;
    const p = [...player, c];
    if (seq[p.length - 1] !== c) {
      setMsg(`Missed! You reached level ${level}. Nice reset — try again?`);
      onDone();
      setSeq([]); setPlayer([]); setLevel(0);
      setTimeout(next, 1200);
      return;
    }
    setPlayer(p);
    if (p.length === seq.length) { setMsg("Correct! Next…"); await sleep(700); next(); }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Level <span className="text-primary font-semibold">{level}</span> — {msg}</p>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {colors.map((c) => (
          <button key={c} onClick={() => tap(c)}
            className={`aspect-square rounded-xl ${bg[c]} ${flash === c ? "opacity-100 ring-4 ring-white" : "opacity-70"} transition`}
          />
        ))}
      </div>
    </div>
  );
}

/* -------- Number Guess -------- */
function NumberGuess({ onDone }: { onDone: () => void }) {
  const [target, setTarget] = useState(() => 1 + Math.floor(Math.random() * 100));
  const [guess, setGuess] = useState("");
  const [tries, setTries] = useState(0);
  const [hint, setHint] = useState("I'm thinking of a number 1–100");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(guess, 10);
    if (Number.isNaN(n)) return;
    setTries((t) => t + 1);
    if (n === target) { setHint(`Nailed it in ${tries + 1} tries!`); setDone(true); onDone(); }
    else setHint(n < target ? "Higher ↑" : "Lower ↓");
    setGuess("");
  };
  const reset = () => { setTarget(1 + Math.floor(Math.random() * 100)); setTries(0); setDone(false); setHint("New number ready"); };

  return (
    <div className="space-y-4">
      <p className="text-sm">{hint} · Tries: <span className="text-primary font-semibold">{tries}</span></p>
      <form onSubmit={submit} className="flex gap-2">
        <input value={guess} onChange={(e) => setGuess(e.target.value)} type="number" min={1} max={100} disabled={done}
          className="flex-1 rounded-lg bg-input px-3 py-2 border border-border focus:border-primary outline-none" />
        <button disabled={done} className="rounded-lg bg-primary text-primary-foreground px-4 font-medium disabled:opacity-40">Guess</button>
      </form>
      {done && <button onClick={reset} className="rounded-lg border border-border px-4 py-2 w-full">Play again</button>}
    </div>
  );
}

/* -------- RPS -------- */
function RPS({ onDone }: { onDone: () => void }) {
  const options = ["✊", "✋", "✌️"] as const;
  type O = typeof options[number];
  const beats: Record<O, O> = { "✊": "✌️", "✋": "✊", "✌️": "✋" };
  const [you, setYou] = useState(0);
  const [ai, setAi] = useState(0);
  const [round, setRound] = useState(0);
  const [last, setLast] = useState<string>("");

  const play = (pick: O) => {
    const bot = options[Math.floor(Math.random() * 3)];
    let r = "Tie";
    if (beats[pick] === bot) { setYou(y => y + 1); r = "You win!"; }
    else if (beats[bot] === pick) { setAi(a => a + 1); r = "AI wins"; }
    setLast(`${pick} vs ${bot} — ${r}`);
    setRound((n) => {
      const next = n + 1;
      if (next >= 5) onDone();
      return next;
    });
  };
  const reset = () => { setYou(0); setAi(0); setRound(0); setLast(""); };

  return (
    <div className="space-y-4">
      <p className="text-sm">You <span className="text-primary font-semibold">{you}</span> — <span className="text-secondary font-semibold">{ai}</span> AI · Round {Math.min(round + 1, 5)}/5</p>
      <div className="flex justify-center gap-3">
        {options.map((o) => (
          <button key={o} onClick={() => play(o)} disabled={round >= 5}
            className="text-4xl rounded-xl border border-border w-16 h-16 hover:border-primary/60 hover:bg-primary/5 disabled:opacity-40">{o}</button>
        ))}
      </div>
      {last && <p className="text-center text-sm text-muted-foreground">{last}</p>}
      {round >= 5 && <button onClick={reset} className="w-full rounded-lg border border-border py-2">Play again</button>}
    </div>
  );
}

/* -------- Reaction -------- */
function Reaction({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"idle" | "wait" | "go" | "done">("idle");
  const [ms, setMs] = useState(0);
  const startRef = useRef(0);
  const tRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const begin = () => {
    setPhase("wait");
    const delay = 1200 + Math.random() * 2500;
    tRef.current = setTimeout(() => { startRef.current = performance.now(); setPhase("go"); }, delay);
  };
  const click = () => {
    if (phase === "wait") { if (tRef.current) clearTimeout(tRef.current); setPhase("idle"); setMs(-1); }
    else if (phase === "go") { setMs(Math.round(performance.now() - startRef.current)); setPhase("done"); onDone(); }
    else begin();
  };
  useEffect(() => () => { if (tRef.current) clearTimeout(tRef.current); }, []);

  const bg = phase === "go" ? "bg-[color:var(--success)]" : phase === "wait" ? "bg-[color:var(--danger)]" : "bg-muted";
  const label = phase === "idle" ? (ms === -1 ? "Too early. Tap to retry" : "Tap to start") : phase === "wait" ? "Wait…" : phase === "go" ? "TAP!" : `${ms} ms — tap to retry`;

  return (
    <button onClick={click} className={`w-full aspect-video rounded-xl grid place-items-center text-2xl font-display font-bold tracking-widest ${bg} transition`}>
      {label}
    </button>
  );
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
