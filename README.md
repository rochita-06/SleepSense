# 🧠 SleepGuard AI

SleepGuard AI is a web application that combines an AI assistant with productivity tools to help users stay focused and alert. It integrates chat, sleep monitoring, and task management into a single platform.

---

## 🚀 Features

- 🤖 AI chat assistant (with selectable male/female voice)
- 😴 Sleep / fatigue detection (webcam-based, via MediaPipe)
- 🍅 Pomodoro timer
- 🎮 Mini games for refresh
- 😂 Jokes and 🧠 facts
- 📊 Analytics dashboard (focus/active/idle time, sleep alarms, activity timeline)
- 🔊 Voice support (TTS + speech recognition)

---

## 🛠️ Tech Stack

- Frontend: React + TypeScript
- Styling: Tailwind CSS
- Backend: Node.js server functions on **Neon Postgres**, with custom email/password auth (JWT + bcrypt) — no longer Supabase
- Build Tool: Vite / TanStack Start (`@tanstack/react-router` + `@tanstack/react-start`)
- AI: Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`)

---

## 📂 Project Structure
```bash
src/
├── components/
│ ├── floating-agent.tsx
│ ├── voice-assistant.tsx
│ ├── entertainment-panel.tsx
│ ├── games-panel.tsx
│ ├── idle-prompt.tsx
│ ├── pomodoro-card.tsx
│ ├── sleep-detector.tsx
│ ├── stats-grid.tsx
│ └── ui/
├── data/
│ ├── jokes.ts
│ ├── facts.ts
│ └── smalltalk.ts
├── hooks/
│ ├── use-alarm.ts
│ ├── use-idle-tracker.ts
│ ├── use-sleep-detection.ts
│ └── use-speech.ts
├── lib/
│ ├── conversation.ts
│ ├── intent.ts
│ ├── ai.functions.ts
│ ├── ai-gateway.server.ts
│ ├── auth.functions.ts
│ ├── auth-middleware.server.ts
│ ├── auth-client.ts
│ ├── auth-attacher.ts
│ ├── data.functions.ts
│ ├── db.server.ts
│ ├── jwt.server.ts
│ └── session-context.tsx
├── routes/
│ ├── auth.tsx
│ ├── index.tsx
│ └── _authenticated/
│   ├── dashboard.tsx
│   ├── sleep.tsx
│   ├── analytics.tsx
│   └── games.tsx
db/
└── schema.sql
```

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/rochita-06/SleepSense.git
cd SleepSense/Sleepsense_final
```
### 2. Install dependencies
```bash
npm install
```
### 3. Set up the database
Create a [Neon](https://neon.tech) Postgres project (or point to any Postgres instance), then run the schema once:
```bash
psql "$DATABASE_URL" -f db/schema.sql
```
This creates the `users`, `profiles`, and `activity_events` tables used by the app's own auth and analytics — there is no external auth provider to configure.

### 4. Create .env file
Create a file named `.env` in the root folder and add:
```bash
# Neon/Postgres connection string (pooled connection, must include ?sslmode=require)
DATABASE_URL=""

# Secret used to sign/verify session JWTs — generate a long random string
# and keep it secret. Changing it invalidates every existing logged-in session.
AUTH_JWT_SECRET=""
```
### 5. Run the project
```bash
npm run dev
```

⚠️ Notes

1. Make sure Node.js is installed
2. Do not share your .env file
3. Restart server if needed
4. Run `db/schema.sql` again after pulling changes if new tables/columns were added

👥 Contributors

1. Sathwik
2. Rochita
