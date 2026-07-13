import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getToken } from "@/lib/auth-client";
import { SessionProvider } from "@/lib/session-context";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // Presence check only — the token itself is verified server-side on
    // every protected server function call (getMe/getProfile/etc.), each of
    // which redirects to /auth if it comes back 401. See dashboard/sleep.tsx.
    const token = getToken();
    if (!token) throw redirect({ to: "/auth" });
  },
  component: () => (
    <SessionProvider idleThresholdMs={90_000}>
      <Outlet />
    </SessionProvider>
  ),
});
