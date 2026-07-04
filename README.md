How It Works
Status	Signal	What's shown
👁️ Eyes open	🟢 Green	Green face box + "AWAKE" pill
😴 Eyes closing	🟠 Orange bar	Progress bar filling up
🚨 Eyes closed ≥ 2.5s	🔴 Red	Pulsing red overlay + alarm sound
Uses MediaPipe Face Mesh to track 468 facial landmarks in real time.
Computes the Eye Aspect Ratio (EAR) for both eyes — when EAR drops below the threshold, the countdown starts.
Alarm loops until you open your eyes.
