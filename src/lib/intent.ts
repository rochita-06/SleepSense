import type { FactCategory } from "@/data/facts";

export type IntentAction =
  | { kind: "navigate"; to: string; label: string }
  | { kind: "joke" }
  | { kind: "fact"; category?: FactCategory }
  | { kind: "game" }
  | { kind: "video"; on: boolean }
  | { kind: "break" }
  | { kind: "hydrate" }
  | { kind: "pomodoro"; mode?: "focus" | "break" }
  | { kind: "chat" };

export interface Intent {
  action: IntentAction;
  reply: string;
}

/**
 * Intent detector — used as a *hint*, not a wall.
 * The conversation engine handles casual/greeting/mood text.
 * Only strong action verbs return non-"chat" here.
 */
const rules: Array<{ test: RegExp; build: (m: RegExpMatchArray) => Intent }> = [
  { test: /\b(open|go\s+to|show)\s+(dashboard|home)\b|^dashboard$/i, build: () => ({ action: { kind: "navigate", to: "/dashboard", label: "Dashboard" }, reply: "Opening your dashboard ✨" }) },
  { test: /\b(sleep\s+monitor|open\s+sleep|start\s+monitoring|watch\s+me|drowsy\s+detection)\b/i, build: () => ({ action: { kind: "navigate", to: "/sleep", label: "Sleep Monitor" }, reply: "Opening the sleep monitor 👀" }) },
  { test: /\b(analytics|stats|productivity\s+stats|my\s+report|charts?)\b/i, build: () => ({ action: { kind: "navigate", to: "/analytics", label: "Analytics" }, reply: "Here's your analytics 📊" }) },
  { test: /\b(open\s+games?|play\s+a?\s*game|mini\s*game)\b/i, build: () => ({ action: { kind: "navigate", to: "/games", label: "Games" }, reply: "Let's play 🎮" }) },

  { test: /\b(joke|make\s+me\s+laugh|something\s+funny)\b/i, build: () => ({ action: { kind: "joke" }, reply: "" }) },

  { test: /\brelat(e|able)\s+(fact|facts)\b|\bfact.*relat/i, build: () => ({ action: { kind: "fact", category: "relatable" }, reply: "" }) },
  { test: /\b(tech|coding|computer)\s+(fact|facts)\b|\bfact.*(tech|coding)\b/i, build: () => ({ action: { kind: "fact", category: "tech" }, reply: "" }) },
  { test: /\b(health|body|brain)\s+(fact|facts)\b|\bfact.*(health|body|brain)\b/i, build: () => ({ action: { kind: "fact", category: "health" }, reply: "" }) },
  { test: /\b(motivation(al)?|inspir(ing|ational))\s+(fact|quote|facts)\b/i, build: () => ({ action: { kind: "fact", category: "motivation" }, reply: "" }) },
  { test: /\b(random|any)\s+(fact|facts)\b/i, build: () => ({ action: { kind: "fact", category: "random" }, reply: "" }) },
  { test: /\b(fact|trivia|did\s+you\s+know)\b/i, build: () => ({ action: { kind: "fact" }, reply: "" }) },

  { test: /turn\s+(off|on)\s+(the\s+)?(video|camera|webcam)/i, build: (m) => ({ action: { kind: "video", on: /on/i.test(m[1]) }, reply: `Camera ${m[1].toLowerCase()} 📷` }) },
  { test: /\b(start|begin)\s+(a\s+)?(pomodoro|focus)\b/i, build: () => ({ action: { kind: "pomodoro", mode: "focus" }, reply: "Starting a 25-min focus session 🍅" }) },
  { test: /\bstart\s+(a\s+)?break\b/i, build: () => ({ action: { kind: "pomodoro", mode: "break" }, reply: "Starting your break 🌿" }) },
  { test: /\b(take\s+a\s+)?(break|rest|pause)\b/i, build: () => ({ action: { kind: "break" }, reply: "Good idea — 5 minutes away from the screen 🧘" }) },
  { test: /\b(water|hydrat|thirsty)\b/i, build: () => ({ action: { kind: "hydrate" }, reply: "Grab a glass of water — hydration boosts focus 💧" }) },
];

export function detectIntent(text: string): Intent {
  for (const r of rules) {
    const m = text.match(r.test);
    if (m) return r.build(m);
  }
  return { action: { kind: "chat" }, reply: "" };
}
