# 🧠 SleepGuard AI

SleepGuard AI is a web application that combines an AI assistant with productivity tools to help users stay focused and alert. It integrates chat, sleep monitoring, and task management into a single platform.

---

## 🚀 Features

- 🤖 AI chat assistant  
- 😴 Sleep / fatigue detection  
- 🍅 Pomodoro timer  
- 🎮 Mini games for refresh  
- 😂 Jokes and 🧠 facts  
- 📊 Basic analytics dashboard  
- 🔊 Voice support (TTS)

---

## 🛠️ Tech Stack

- Frontend: React + TypeScript  
- Styling: Tailwind CSS  
- Backend: Supabase  
- Build Tool: Vite / TanStack Start  
- AI: Vercel AI SDK  

---

## 📂 Project Structure
```bash
src/
├── components/
│ ├── floating-agent.tsx
│ ├── entertainment-panel.tsx
│ ├── idle-prompt.tsx
│ ├── pomodoro-card.tsx
│ ├── sleep-detector.tsx
├── data/
│ ├── jokes.ts
│ ├── facts.ts
│ ├── smalltalk.ts
├── lib/
│ ├── conversation.ts
│ ├── intent.ts
│ ├── ai.functions.ts
│ ├── ai-gateway.server.ts
└── routes/_authenticated/
├── dashboard.tsx
├── sleep.tsx
├── analytics.tsx
└── games.tsx
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
### 3. Create .env file

Create a file named .env in the root folder and add:
```bash
SUPABASE_PROJECT_ID=""
SUPABASE_PUBLISHABLE_KEY=""
SUPABASE_URL=""
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL=""
```
### 4. Run the project
```bash
npm run dev
```
⚠️ Notes

1. Make sure Node.js is installed

2. Do not share your .env file

3. Restart server if needed

👥 Contributors

1. Sathwik

2. Rochita


