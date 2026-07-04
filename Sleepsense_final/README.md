# 🧠 SleepGuard AI — Personal Productivity OS

> A ChatGPT-style AI companion fused with a real productivity dashboard.
> Watches your alertness, chats like a friend, cracks jokes, teaches facts,
> runs Pomodoro cycles, and gently nudges you when you drift.

Built with **TanStack Start · React 19 · Tailwind 4 · Supabase · Framer Motion · Vercel AI SDK**.

---

## ✨ What makes it feel human

Unlike a typical "command bot," SleepGuard AI blends five layers of intelligence into one experience:

1. **Conversation Engine (local, instant)** — greetings, moods, small talk, motivation, and mini-actions are handled instantly on-device with a hand-tuned response generator (`src/lib/conversation.ts`). The assistant *never* freezes on casual input like *"how are you"* or *"i'm bored."*
2. **1,000+ Small-Talk Bank** — `src/data/smalltalk.ts` ships a curated dataset of **1,195+ human conversational replies** across greetings, moods, advice, tips, encouragement, and casual chat. Matches are ranked by longest keyword hit, so the reply always feels on-topic.
3. **Intent Router** — verbs like *"open sleep monitor,"* *"tell me a joke,"* *"start a pomodoro,"* or *"give me a relatable fact"* get routed to real app actions (`src/lib/intent.ts`).
4. **Local Datasets** — **1,100+ jokes** and **5 categorized fact banks** (relatable · tech · health · motivation · random) served instantly with a no-repeat history (see `src/data/`).
5. **LLM Fallback** — anything genuinely open-ended flows to Google Gemini via the Lovable AI Gateway (`src/lib/ai.functions.ts`) with an always-graceful degradation path — the chat literally cannot crash.

---

## 🚀 Feature highlights

| Category | Features |
| --- | --- |
| 🤖 **AI Assistant** | ChatGPT-style floating chat · 1,195+ conversational replies · voice input & TTS · dynamic personality · live voice-gender switching · never-crash fallbacks |
| 😴 **Sleep Monitor** | Webcam eye-tracking · fatigue detection · alertness score · **tired popup** that offers *play a game · joke · fun fact · drink water · continue* and routes your reply |
| 🍅 **Pomodoro** | Focus / break cycles visible on the sleep page · voice announcements · progress ring |
| 🎮 **Mini Games** | Memory, reaction, and focus mini-games to reset when you're drifting |
| 😂 **Jokes** | 1,100+ curated jokes · random with no-repeat memory · TTS delivery |
| 🧠 **Facts** | 5 categories (relatable, tech, health, motivation, random) — 40+ each |
| 📊 **Analytics** | Improved chart legibility · **inline percentage labels on the pie chart** · larger axis fonts · high-contrast tooltips · color legends under every chart |
| ⚠️ **Idle Watcher** | Detects inactivity → offers *Continue · Play a game · Fun fact · Chat with me* |
| 🔊 **Voice** | Male / Female TTS — switching the voice on the dashboard broadcasts a `sg:voice-change` event so **every component (agent, sleep monitor, pomodoro) picks up the new voice instantly** and previews it |
| 🎨 **UI** | Glassmorphism · gradients · Framer Motion micro-interactions · dark futuristic aesthetic |

---

## 🆕 Recent upgrades

- **Games played tracking fixed** — completing any mini-game on the `/games` page now logs a `game_completed` activity event, so the "Games played" tile on the Dashboard updates immediately (previously the completion handler was a no-op).
- **Analytics uses real session data** — the *Active (min)* and *Idle (min)* tiles and the *Today's Breakdown* donut now read live values from the global `SessionProvider` instead of the old placeholder formula (`480 − focus − tired·2` / `tired·5`) that made every account show `470` active and `25` idle.
- **Focus Trend card removed** — the analytics view is now leaner and focuses on the donut breakdown and 7-day activity timeline.
- **Pomodoro timer stability** — timer callbacks stabilised via refs so the interval no longer resets on every parent re-render.
- **Hydration reminder every 15 min** (down from 30) with matching countdown tile on the dashboard.
- **Global Active Session** — the running session timer is lifted into a `SessionProvider` (`src/lib/session-context.tsx`) mounted at the `_authenticated` layout. Navigating between Dashboard → Analytics → Games → Sleep Monitor no longer resets it. The session persists for the lifetime of the tab and resets **only** on sign-out, tab close, or explicit "End" click on the Active Session card.
- **Sleep Monitor session sync** — the Sleep Monitor page shows the same Active Session card as the Dashboard, reading from the shared context.
- **Redesigned "Today's Breakdown" donut** — modern accessible palette (Focus `#3B82F6`, Active `#10B981`, Idle `#F59E0B`, Sleep `#EF4444`), custom high-contrast tooltip, slice hover-scale, two-column legend with `value min (percent%)`.
- **Google sign-in button removed** from the auth page — email/password only.
- **Voice preference tracked live** — pick Male or Female on the dashboard; broadcast app-wide via `sg:voice-change` and picked up instantly by the Sleep page and floating agent.
- **1,195+ conversational chats**, **tired popup with actionable choices**, **no email confirmation** on signup.

### Active Session lifecycle

| Trigger                              | Behavior          |
| ------------------------------------ | ----------------- |
| Navigate between authed pages        | Session continues |
| Voice / theme / profile changes      | Session continues |
| Click **End** on Active Session card | Session resets    |
| Sign out                             | Session resets    |
| Close browser tab / window           | Session cleared   |


---

## 🧩 Architecture

```
src/
├── components/
│   ├── floating-agent.tsx      # ChatGPT-style bubble w/ typing + live voice
│   ├── entertainment-panel.tsx # Jokes + categorized facts UI
│   ├── idle-prompt.tsx         # Auto pop-up when user goes idle
│   ├── pomodoro-card.tsx       # Focus/break timer
│   ├── sleep-detector.tsx      # Webcam alertness + tired popup dispatch
│   └── ...
├── data/
│   ├── jokes.ts                # 1,100+ jokes
│   ├── facts.ts                # Categorized fact banks
│   └── smalltalk.ts            # 1,195+ conversational replies
├── lib/
│   ├── conversation.ts         # Response engine · matchSmalltalk() · pickers
│   ├── intent.ts               # Verb-based intent router
│   ├── ai.functions.ts         # LLM server-fns w/ safe fallbacks
│   └── ai-gateway.server.ts    # Lovable AI Gateway provider
└── routes/_authenticated/
    ├── dashboard.tsx           # Voice switcher · broadcasts sg:voice-change
    ├── sleep.tsx               # Sleep monitor + Pomodoro + idle prompt
    ├── analytics.tsx           # Improved, legible charts
    └── games.tsx
```

### Reply pipeline

```
user message
   │
   ├─► detectIntent()      → navigate / joke / fact(category) / pomodoro / hydrate
   │
   ├─► detectCasual()      → greeting · howareyou · sad · bored · motivate · continue · drinkwater · …
   │                          (instant local, human-toned reply)
   │
   ├─► matchSmalltalk()    → 1,195+ curated replies via longest-keyword match
   │                          (still local, no network hit)
   │
   └─► aiChat()            → Gemini via Lovable Gateway
                              └─ on error → warm fallback line (never crashes)
```

### Tired-detection loop

```
webcam EAR < threshold  → useSleepDetection.onTired
                        → speak("you're looking tired") in current voice
                        → dispatch sg:agent-open with a menu prompt
                        → FloatingAgent opens with the menu message
                        → user reply → intent router
                             ├─ "play a game"   → /games
                             ├─ "joke"          → local joke
                             ├─ "fun fact"      → random fact
                             ├─ "drink water"   → hydration ack + log
                             └─ "continue"      → dismiss, resume
```

---

## 🛠️ Running locally

```bash
bun install
# Lovable Cloud env vars are auto-provisioned; no manual API keys needed.
bun dev
```

---

## 🎯 Resume-ready description

> **SleepGuard AI — Personal Productivity OS**
> Full-stack AI assistant built with TanStack Start, React 19, Tailwind 4, Supabase, and the Vercel AI SDK. Combines a ChatGPT-style conversational agent (with a local **1,195+ small-talk bank**, **1,100+ jokes**, 5 categorized fact datasets, instant small-talk engine, and Gemini LLM fallback) with a webcam-based sleep/fatigue detector that pops an actionable menu when you're tired, a Pomodoro focus timer, idle-detection prompts, and glassmorphic analytics with percentage-labeled charts — deployed on Lovable Cloud with Google OAuth via Supabase.

---

## 🧪 Reliability guarantees

- ✅ Chatbot **never crashes** on any input — every path returns a friendly line.
- ✅ Jokes never repeat until the entire 1,100+ bank has been cycled per browser.
- ✅ Facts respect the user's chosen category — no cross-contamination.
- ✅ Voice choice propagates app-wide via a live event bus — no refresh needed.
- ✅ Tired popup surfaces once per fatigue event with reply-driven follow-through.
- ✅ AI failures degrade gracefully to hand-written safe fallbacks.

---

## 📜 License

MIT — free to fork, remix, and ship your own version.
