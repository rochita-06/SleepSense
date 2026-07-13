// Must be registered as a global `functionMiddleware` in `src/start.ts`;
// otherwise the browser never attaches the bearer token to serverFn RPCs.
// Replaces attachSupabaseAuth.
import { createMiddleware } from "@tanstack/react-start";
import { getToken } from "./auth-client";

export const attachAppAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const token = getToken();
  return next({
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
