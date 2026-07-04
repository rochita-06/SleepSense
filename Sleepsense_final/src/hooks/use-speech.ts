import { useCallback, useEffect, useRef, useState } from "react";

export type Voice = "male" | "female";

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({ tts: false, stt: false });
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ttsOk = "speechSynthesis" in window;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported({ tts: ttsOk, stt: !!SR });
    if (ttsOk) {
      const load = () => { voicesRef.current = window.speechSynthesis.getVoices(); };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, []);

  const pickVoice = useCallback((gender: Voice): SpeechSynthesisVoice | undefined => {
    const voices = voicesRef.current;
    if (!voices.length) return;
    const en = voices.filter((v) => v.lang.startsWith("en"));
    const pool = en.length ? en : voices;
    const preferMale = ["male", "google uk english male", "daniel", "alex", "fred"];
    const preferFemale = ["female", "google uk english female", "samantha", "victoria", "karen", "zira"];
    const list = gender === "male" ? preferMale : preferFemale;
    for (const key of list) {
      const found = pool.find((v) => v.name.toLowerCase().includes(key));
      if (found) return found;
    }
    return pool[gender === "male" ? Math.min(1, pool.length - 1) : 0];
  }, []);

  const speak = useCallback((text: string, gender: Voice = "female") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(gender);
    if (v) u.voice = v;
    u.rate = 1.02; u.pitch = gender === "male" ? 0.9 : 1.1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  }, [pickVoice]);

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const listen = useCallback((onResult: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US"; rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      onResult(t);
    };
    recognitionRef.current = rec;
    rec.start();
  }, []);

  const stopListen = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { speak, stop, listen, stopListen, speaking, listening, supported };
}
