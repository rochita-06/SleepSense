import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const ChatInput = z.object({
  name: z.string().max(60).default(""),
  agent: z.string().max(60).default("your assistant"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(20)
    .default([]),
  message: z.string().min(1).max(2000),
});

function getKey() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return key;
}

const SAFE_FALLBACKS = [
  "Hmm, my brain glitched for a sec 🌀 could you say that again?",
  "I'm listening — tell me a bit more about what you need 😊",
  "Ok, walk me through what you're trying to do and I'll help you sort it out.",
  "Got it — say more? I want to give you the right answer, not a random one.",
];

/**
 * Conversational chat with a warm, human-feeling assistant.
 * Always returns a reply — falls back to a friendly template on any error.
 */
export const aiChat = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => ChatInput.parse(v))
  .handler(async ({ data }) => {
    const sys = `You are ${data.agent}, a warm, witty, human-feeling productivity + wellness companion for ${data.name || "the user"}.
Personality: friendly, upbeat, playful, curious. Use emojis naturally (1-2 per reply, not every reply). Vary your wording — never sound scripted.
Style: 1-4 short sentences, natural spoken tone, no lists unless asked, no "As an AI" disclaimers, no mention of being an LLM or model.
Behavior: acknowledge feelings, ask a short follow-up when helpful, celebrate small wins, gently nudge toward focus/rest/hydration when relevant.
Never refuse casual chat. If the user just says "hi" or "how are you" — answer like a caring friend.`;

    try {
      const gateway = createLovableAiGatewayProvider(getKey());
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        messages: [
          { role: "system", content: sys },
          ...data.history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: data.message },
        ],
      });
      const reply = (text || "").trim();
      if (!reply) return { reply: SAFE_FALLBACKS[Math.floor(Math.random() * SAFE_FALLBACKS.length)], fallback: true };
      return { reply, fallback: false };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[aiChat] fallback:", msg);
      return {
        reply: SAFE_FALLBACKS[Math.floor(Math.random() * SAFE_FALLBACKS.length)],
        fallback: true,
      };
    }
  });

/**
 * Legacy joke server-fn kept for backwards compatibility.
 * The UI prefers the local 1000+ joke bank in src/data/jokes.ts, but this
 * remains available if callers want a model-generated variation.
 */
export const aiJoke = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) => z.object({ name: z.string().max(60).default("") }).parse(v))
  .handler(async ({ data }) => {
    try {
      const gateway = createLovableAiGatewayProvider(getKey());
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        messages: [
          {
            role: "system",
            content: `Tell ONE fresh, clean, clever joke in 1-3 sentences. No preamble. Occasionally address ${data.name || "the user"} at the end.`,
          },
          { role: "user", content: "Tell me a joke." },
        ],
      });
      return { joke: text.trim() || "Why did the developer go broke? Because they used up all their cache. 💸" };
    } catch {
      return { joke: "Why do programmers prefer dark mode? Because light attracts bugs. 🐛" };
    }
  });

/**
 * Legacy fact server-fn — kept for compatibility. UI prefers the local categorized bank.
 */
export const aiFact = createServerFn({ method: "POST" })
  .inputValidator((v: unknown) =>
    z
      .object({
        category: z.string().max(40).default("random"),
      })
      .parse(v),
  )
  .handler(async ({ data }) => {
    try {
      const gateway = createLovableAiGatewayProvider(getKey());
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        messages: [
          {
            role: "system",
            content: `Return ONE surprising, verifiable fun fact about "${data.category}". 1-2 sentences. No preamble.`,
          },
          { role: "user", content: "Give me a fact." },
        ],
      });
      return { fact: text.trim() || "Honey never spoils — jars from ancient Egypt are still edible today. 🍯", category: data.category };
    } catch {
      return { fact: "Octopuses have three hearts and blue blood. 🐙", category: data.category };
    }
  });
