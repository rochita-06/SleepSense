import { useEffect, useRef, useState, useCallback } from "react";

export type AlertState = "idle" | "active" | "tired" | "sleep";

const LEFT = [362, 385, 387, 263, 373, 380];
const RIGHT = [33, 160, 158, 133, 153, 144];
const EAR_THRESHOLD = 0.22;
const TIRED_SECONDS = 1.2;
const SLEEP_SECONDS = 2.5;

function ear(landmarks: any[], idx: number[], w: number, h: number) {
  const p = idx.map((i) => ({ x: landmarks[i].x * w, y: landmarks[i].y * h }));
  const d = (a: any, b: any) => Math.hypot(a.x - b.x, a.y - b.y);
  return (d(p[1], p[5]) + d(p[2], p[4])) / (2 * d(p[0], p[3]));
}

export function useSleepDetection(opts: {
  onSleep?: () => void;
  onTired?: () => void;
  onWake?: () => void;
} = {}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<AlertState>("idle");
  const [earValue, setEarValue] = useState(1);
  const [alertness, setAlertness] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const closedStartRef = useRef<number | null>(null);
  const landmarkerRef = useRef<any>(null);
  const stateRef = useRef<AlertState>("idle");
  const cbRef = useRef(opts);
  cbRef.current = opts;

  const start = useCallback(async () => {
    if (running) return;
    setError(null);
    try {
      const { FilesetResolver, FaceLandmarker } = await import("@mediapipe/tasks-vision");
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
      );
      const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      landmarkerRef.current = landmarker;

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setRunning(true);

      const loop = () => {
        const canvas = canvasRef.current;
        if (!video || !canvas || !landmarkerRef.current) return;
        const w = video.videoWidth, h = video.videoHeight;
        if (!w) { rafRef.current = requestAnimationFrame(loop); return; }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.save();
        ctx.translate(w, 0); ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();

        const res = landmarkerRef.current.detectForVideo(video, performance.now());
        const lm = res.faceLandmarks?.[0];
        let newState: AlertState = "active";
        if (lm) {
          const l = ear(lm, LEFT, w, h);
          const r = ear(lm, RIGHT, w, h);
          const avg = (l + r) / 2;
          setEarValue(avg);
          const eyesClosed = avg < EAR_THRESHOLD;
          const now = performance.now() / 1000;
          if (eyesClosed) {
            if (closedStartRef.current == null) closedStartRef.current = now;
            const dur = now - closedStartRef.current;
            if (dur >= SLEEP_SECONDS) newState = "sleep";
            else if (dur >= TIRED_SECONDS) newState = "tired";
            else newState = "active";
          } else {
            closedStartRef.current = null;
            newState = "active";
          }
          // face box mirror
          const xs = lm.map((p: any) => (1 - p.x) * w);
          const ys = lm.map((p: any) => p.y * h);
          const x1 = Math.max(0, Math.min(...xs) - 12);
          const y1 = Math.max(0, Math.min(...ys) - 12);
          const x2 = Math.min(w, Math.max(...xs) + 12);
          const y2 = Math.min(h, Math.max(...ys) + 12);
          const col = newState === "sleep" ? "#ff3b6b" : newState === "tired" ? "#ffb020" : "#22e6c2";
          ctx.strokeStyle = col; ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        } else {
          newState = "idle";
        }

        // alertness rolling
        setAlertness((prev) => {
          const target = newState === "sleep" ? 20 : newState === "tired" ? 55 : newState === "active" ? 95 : prev;
          return Math.round(prev * 0.9 + target * 0.1);
        });

        if (newState !== stateRef.current) {
          const prev: AlertState = stateRef.current;
          stateRef.current = newState;
          setState(newState);
          if (newState === "sleep") cbRef.current.onSleep?.();
          else if (newState === "tired") cbRef.current.onTired?.();
          else if (prev === "sleep") cbRef.current.onWake?.();
        }

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera failed");
      setRunning(false);
    }
  }, [running]);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) { try { v.pause(); } catch {} v.srcObject = null; }
    const c = canvasRef.current;
    if (c) { const ctx = c.getContext("2d"); ctx?.clearRect(0, 0, c.width, c.height); }
    try { landmarkerRef.current?.close?.(); } catch {}
    landmarkerRef.current = null;
    setRunning(false);
    setState("idle");
    stateRef.current = "idle";
    closedStartRef.current = null;
  }, []);

  // Privacy: kill the camera stream on unmount, tab hide, or page unload.
  // No frames are ever uploaded — EAR is computed locally and discarded.
  useEffect(() => {
    const onHide = () => stop();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") stop(); });
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      stop();
    };
  }, [stop]);

  return { videoRef, canvasRef, start, stop, running, state, earValue, alertness, error };
}
