// Client-side session storage, replacing supabase-js's browser auth state.
// Token is a JWT issued by our own signUp/signIn server functions (see
// auth.functions.ts). Kept in localStorage, same storage model the app
// already used under Supabase, so route-guard shape barely changes.
const TOKEN_KEY = "sg_auth_token";
const USER_KEY = "sg_auth_user";

export type AppAuthUser = { id: string; email: string };

type Listener = () => void;
const listeners = new Set<Listener>();

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AppAuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppAuthUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: AppAuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notify();
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notify();
}

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") window.dispatchEvent(new Event("sg:auth-change"));
}

// Mirrors supabase.auth.onAuthStateChange for __root.tsx's router-invalidate logic.
export function onAuthChange(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
