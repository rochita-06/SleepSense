import { useCallback, useEffect, useRef, useState } from "react";

export type Voice = "male" | "female";

const MALE_KEYWORDS = [
  "male", "man", "google uk english male", "daniel", "alex", "fred",
  "david", "mark", "guy", "ryan", "tom", "james", "george", "oliver",
  "aaron", "gordon", "eric",
];
const FEMALE_KEYWORDS = [
  "female", "woman", "google uk english female", "samantha", "victoria",
  "karen", "zira", "moira", "tessa", "susan", "allison", "ava", "fiona",
  "kate", "serena", "hazel", "google us english", "amy", "emma", "joanna",
];

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState({ tts: false, stt: false });
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  // Cached, guaranteed-distinct voice picks so male/female never collapse to the same voice.
  const voiceMapRef = useRef<{ male?: SpeechSynthesisVoice; female?: SpeechSynthesisVoice }>({});
  const recognitionRef = useRef<any>(null);

  const computeVoiceMap = useCallback((voices: SpeechSynthesisVoice[]) => {
    if (!voices.length) return {};
    const en = voices.filter((v) => v.lang.startsWith("en"));
    const pool = en.length ? en : voices;

    const findFirst = (keys: string[]) =>
      pool.find((v) => keys.some((k) => v.name.toLowerCase().includes(k)));

    let male = findFirst(MALE_KEYWORDS);
    let female = findFirst(FEMALE_KEYWORDS);

    // If both matched the exact same voice (or neither matched), force them apart
    // so we never end up speaking both genders with the identical voice.
    if (male && female && male.voiceURI === female.voiceURI) {
      const alt = pool.find((v) => v.voiceURI !== male!.voiceURI);
      if (alt) female = alt;
    }
    if (!male && !female) {
      male = pool[0];
      female = pool[Math.min(1, pool.length - 1)] ?? pool[0];
    } else if (!male) {
      male = pool.find((v) => v.voiceURI !== female!.voiceURI) ?? pool[0];
    } else if (!female) {
      female = pool.find((v) => v.voiceURI !== male!.voiceURI) ?? pool[0];
    }

    return { male, female };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ttsOk = "speechSynthesis" in window;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported({ tts: ttsOk, stt: !!SR });
    if (ttsOk) {
      const load = () => {
        voicesRef.current = window.speechSynthesis.getVoices();
        voiceMapRef.current = computeVoiceMap(voicesRef.current);
      };
      load();
      window.speechSynthesis.onvoiceschanged = load;
    }
  }, [computeVoiceMap]);

  const pickVoice = useCallback((gender: Voice): SpeechSynthesisVoice | undefined => {
    if (!voiceMapRef.current.male && !voiceMapRef.current.female && voicesRef.current.length) {
      voiceMapRef.current = computeVoiceMap(voicesRef.current);
    }
    return voiceMapRef.current[gender];
  }, [computeVoiceMap]);

  const speak = useCallback((text: string, gender: Voice = "female") => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(gender);
    if (v) u.voice = v;
    // Wider pitch/rate gap so the two remain clearly distinguishable even on
    // devices that only expose a single underlying voice.
    u.rate = gender === "male" ? 0.8 : 1.2;
    u.pitch = gender === "male" ? 0.5 : 1.6;
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
