import { useEffect, useRef } from "react";

export function useAlarm() {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const playingRef = useRef(false);

  useEffect(() => () => stopInternal(), []);

  function ensure() {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return ctxRef.current!;
  }

  function play(volume = 0.4) {
    if (playingRef.current) return;
    const ctx = ensure();
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    // pulsing pattern
    const t0 = ctx.currentTime;
    for (let i = 0; i < 30; i++) {
      const t = t0 + i * 0.5;
      gain.gain.setValueAtTime(volume, t);
      gain.gain.setValueAtTime(0, t + 0.25);
      osc.frequency.setValueAtTime(i % 2 ? 880 : 660, t);
    }
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;
    playingRef.current = true;
  }

  function stopInternal() {
    try { oscRef.current?.stop(); } catch {}
    oscRef.current?.disconnect();
    gainRef.current?.disconnect();
    oscRef.current = null;
    gainRef.current = null;
    playingRef.current = false;
  }

  return { play, stop: stopInternal, isPlaying: () => playingRef.current };
}
