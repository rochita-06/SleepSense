// Dynamic, human-like response generator.
// Provides greetings, mood/small-talk, motivation and casual replies WITHOUT the LLM,
// so the chatbot never crashes and always feels alive.
import { JOKES } from "@/data/jokes";
import { FACTS, type FactCategory, getFactBank } from "@/data/facts";
import { SMALLTALK } from "@/data/smalltalk";

const HISTORY_JOKES = "sg_joke_history_v1";
const HISTORY_FACTS = "sg_fact_history_v1";
const MAX_HISTORY = 200;

function loadHist(key: string): number[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveHist(key: string, arr: number[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(arr.slice(-MAX_HISTORY))); } catch {}
}

/** Pick a random item that hasn't been seen recently. */
function pickUnseen<T>(items: readonly T[], seen: number[]): { item: T; index: number } {
  if (items.length === 0) throw new Error("empty pool");
  const available = items.map((_, i) => i).filter((i) => !seen.includes(i));
  const pool = available.length ? available : items.map((_, i) => i);
  const index = pool[Math.floor(Math.random() * pool.length)];
  return { item: items[index], index };
}

/** Random joke, never repeats until the whole set has been cycled. */
export function getRandomJoke(): string {
  const seen = loadHist(HISTORY_JOKES);
  const { item, index } = pickUnseen(JOKES, seen);
  saveHist(HISTORY_JOKES, [...seen, index]);
  return item;
}

export function getRandomFact(category: FactCategory): string {
  const bank = getFactBank(category);
  const key = `${HISTORY_FACTS}:${category}`;
  const seen = loadHist(key);
  const { item, index } = pickUnseen(bank.facts, seen);
  saveHist(key, [...seen, index]);
  return item;
}

// ---------- Small-talk / conversation intents ----------
export type CasualKind =
  | "greeting"
  | "howareyou"
  | "whatdoing"
  | "thanks"
  | "bye"
  | "bored"
  | "sad"
  | "happy"
  | "compliment"
  | "insult"
  | "love"
  | "who"
  | "name"
  | "help"
  | "motivate"
  | "interesting"
  | "sleepy"
  | "continue"
  | "drinkwater"
  | null;

const patterns: Array<{ kind: NonNullable<CasualKind>; re: RegExp }> = [
  { kind: "greeting",    re: /^\s*(hi+|hey+|hello+|yo|sup|hola|howdy|good\s+(morning|afternoon|evening|night))\b/i },
  { kind: "howareyou",   re: /how\s+(are\s+you|r\s*u|'?s\s+it\s+going|are\s+things|do\s+you\s+feel)/i },
  { kind: "whatdoing",   re: /what\s+(are\s+you|r\s*u|'?re\s+you)\s+(doing|up\s+to)/i },
  { kind: "thanks",      re: /\b(thanks|thank\s+you|thx|ty|appreciate\s+it)\b/i },
  { kind: "bye",         re: /\b(bye|goodbye|see\s+you|see\s+ya|later|good\s+night)\b/i },
  { kind: "bored",       re: /\b(bored|boring|nothing\s+to\s+do)\b/i },
  { kind: "sad",         re: /\b(sad|down|depressed|upset|crying|lonely|anxious|stressed)\b/i },
  { kind: "happy",       re: /\b(happy|excited|great|awesome|amazing|good\s+day)\b/i },
  { kind: "compliment",  re: /\b(you'?re\s+(smart|cool|awesome|nice|great|helpful|the\s+best)|love\s+you|i\s+like\s+you)\b/i },
  { kind: "insult",      re: /\b(dumb|stupid|useless|bad\s+bot|hate\s+you|shut\s+up)\b/i },
  { kind: "love",        re: /\bi\s+love\s+you\b/i },
  { kind: "who",         re: /\b(who\s+are\s+you|who\s+made\s+you|what\s+are\s+you)\b/i },
  { kind: "name",        re: /\b(what'?s\s+your\s+name|your\s+name)\b/i },
  { kind: "help",        re: /\b(help|what\s+can\s+you\s+do|features)\b/i },
  { kind: "motivate",    re: /\b(motivate|motivation|inspire|inspiration|encourage|pep\s+talk)\b/i },
  { kind: "interesting", re: /\b(tell\s+me\s+something|something\s+interesting|say\s+something)\b/i },
  { kind: "sleepy",      re: /\b(sleepy|tired|exhausted|drowsy|yawn|can'?t\s+focus)\b/i },
  { kind: "continue",    re: /\b(continue|keep\s+going|back\s+to\s+work|resume|carry\s+on)\b/i },
  { kind: "drinkwater",  re: /\b(drink\s+water|water|hydrate|hydration|thirsty)\b/i },
];

export function detectCasual(text: string): CasualKind {
  for (const p of patterns) if (p.re.test(text)) return p.kind;
  return null;
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export function casualReply(kind: NonNullable<CasualKind>, ctx: { userName?: string; agentName?: string }): string {
  const u = ctx.userName?.trim() || "friend";
  const a = ctx.agentName?.trim() || "your assistant";
  switch (kind) {
    case "greeting": return pick([
      `Hey ${u}! 👋 Great to see you.`,
      `Hi ${u} 😊 What's on your mind today?`,
      `Hello hello! ✨ How can I help?`,
      `Yo ${u} 🙌 Ready to make today count?`,
      `Hey there! Hope your day's going smoothly so far.`,
    ]);
    case "howareyou": return pick([
      `I'm doing great 😊 running smooth and caffeinated on pure electricity. How about you?`,
      `Feeling sharp today ⚡ What about you, ${u}?`,
      `Honestly? Living the algorithmic dream. 😄 How's your day going?`,
      `All systems happy 💚 Tell me how you're feeling.`,
    ]);
    case "whatdoing": return pick([
      `Just chilling in the corner of your screen 👀 waiting to be useful.`,
      `Watching over your focus, cracking jokes, and pretending to sip coffee ☕`,
      `Organizing my thoughts into neat little tokens. You?`,
      `Same as always — being your slightly-too-enthusiastic sidekick 😄`,
    ]);
    case "thanks": return pick([
      `Anytime ${u} 💛`,
      `You got it! 🙌`,
      `Happy to help — that's literally my whole thing 😄`,
      `Aww thanks, that made my little circuits smile.`,
    ]);
    case "bye": return pick([
      `Catch you later, ${u} 👋 Take care!`,
      `Bye! I'll be right here whenever you need me. ✨`,
      `Peace ✌️ Come back soon.`,
      `See you, ${u}. Rest well 😴`,
    ]);
    case "bored": return pick([
      `Bored? I've got you 😎 Want a joke, a fun fact, or a quick game?`,
      `Let's fix that. Pick one: 🎮 game · 😂 joke · 🧠 fact.`,
      `Boredom is just an invitation for chaos. Want me to tell you a joke?`,
    ]);
    case "sad": return pick([
      `Sending you a little virtual hug 🤗 Want to talk about it, or should I try to cheer you up?`,
      `That sounds rough. I'm here 💛 Would a joke or a walk-break help?`,
      `Hey, tough moments pass. Want to try a 2-min breathing exercise together?`,
    ]);
    case "happy": return pick([
      `Yesss ${u} 🎉 love that energy for you!`,
      `That's amazing to hear! ✨ Ride the wave.`,
      `Look at you thriving 😄 Anything you want to celebrate?`,
    ]);
    case "compliment": return pick([
      `Aww stop it 🥹 You're going to make my GPU blush.`,
      `Right back at you, ${u} 💛`,
      `You're honestly a joy to work with 😄`,
    ]);
    case "insult": return pick([
      `Oof — okay, I'll try to be more helpful. What did I miss? 🙏`,
      `Fair. I'm always learning. Tell me what you actually need.`,
      `Noted. Let me try again — what's the real goal here?`,
    ]);
    case "love": return pick([
      `Aww 💛 I love helping you.`,
      `That's sweet — you're stuck with me now 😄`,
    ]);
    case "who": return pick([
      `I'm ${a}, your personal productivity + wellness sidekick 🤖✨`,
      `I'm ${a} — part focus coach, part joke machine, part hydration nag 😄`,
    ]);
    case "name": return `I'm ${a}! Nice to officially meet you, ${u} 👋`;
    case "help": return `I can open pages (dashboard · sleep · analytics · games), tell jokes, share fun facts by category, run a Pomodoro, and just chat 😊 Try: "tell me a relatable fact" or "motivate me".`;
    case "motivate": return pick([
      `You've got this, ${u}. 💪 One tiny step. That's the whole thing.`,
      `Progress > perfection. Do the smallest useful thing right now — future you will thank you. 🔥`,
      `You don't need to feel ready. Start for 2 minutes and momentum takes over. ✨`,
      `Reminder: you've already survived every bad day so far. Undefeated. 👑`,
    ]);
    case "interesting": return getRandomFact("random");
    case "sleepy": return pick([
      `Aww ${u}, sounds like your brain is asking for a break 😴 Want to try a 5-min pause, a splash of water, or a quick game to reset?`,
      `Let's fix that. Try the 20-20-20 rule: look 20 ft away for 20 seconds. I'll wait 👀`,
      `Sleepy signals detected 🚨 Water + 2-min walk = magic. Want me to start a Pomodoro break?`,
    ]);
    case "continue": return pick([
      `You got it — back to work 💪 I'll stay quiet.`,
      `Ok! Resuming focus mode 🎯 ping me anytime.`,
      `Alright ${u}, keep going. I'm right here if you need a spark.`,
    ]);
    case "drinkwater": return pick([
      `Perfect choice 💧 sip slowly and give your brain that little boost.`,
      `Water break! Even a few sips wake you up faster than coffee 😊`,
      `Yes! Hydration = free focus. Drink up ${u} 💦`,
    ]);
  }
}

// Category detection for facts
export function detectFactCategory(text: string): FactCategory | null {
  const t = text.toLowerCase();
  if (/relat(e|able)/.test(t)) return "relatable";
  if (/\btech|coding|computer|ai|programming\b/.test(t)) return "tech";
  if (/health|body|brain|wellness|fitness/.test(t)) return "health";
  if (/motivat|inspir|encourag/.test(t)) return "motivation";
  if (/random|any|surpris/.test(t)) return "random";
  return null;
}

export const AVAILABLE_CATEGORIES = FACTS.map((f) => ({
  category: f.category,
  label: f.label,
  emoji: f.emoji,
}));

/**
 * Match a message against the 1000+ small-talk bank (word/phrase inclusion).
 * Returns a random fitting reply, or null if nothing matches confidently.
 */
export function matchSmalltalk(text: string, ctx: { userName?: string; agentName?: string }): string | null {
  const t = text.toLowerCase();
  const scored: Array<{ score: number; replies: string[] }> = [];
  for (const entry of SMALLTALK) {
    let score = 0;
    for (const k of entry.keys) {
      const key = k.toLowerCase();
      if (t.includes(key)) score += key.length; // longer match wins
    }
    if (score > 0) scored.push({ score, replies: entry.replies });
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const raw = top.replies[Math.floor(Math.random() * top.replies.length)];
  return raw
    .replaceAll("${u}", ctx.userName?.trim() || "friend")
    .replaceAll("${a}", ctx.agentName?.trim() || "your assistant");
}
