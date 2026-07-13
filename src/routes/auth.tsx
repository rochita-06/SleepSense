import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { signUp, signIn } from "@/lib/auth.functions";
import { getToken, setSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (getToken()) navigate({ to: "/dashboard" });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { token, user } = await signUp({ data: { email, password, name } });
        setSession(token, user);
        toast.success("Account created!");
        navigate({ to: "/dashboard" });
      } else {
        const { token, user } = await signIn({ data: { email, password } });
        setSession(token, user);
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/20 border border-primary/40 glow-primary">
            <Eye className="h-7 w-7 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-wide"><span className="text-gradient">SleepSense</span></h1>
          <p className="text-sm text-muted-foreground">{mode === "signup" ? "Create your assistant" : "Welcome back"}</p>
        </div>

        <div className="glass rounded-2xl p-6">


          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Your name" required
                className="w-full rounded-lg bg-input px-3 py-2.5 outline-none border border-border focus:border-primary transition"
              />
            )}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" required
              className="w-full rounded-lg bg-input px-3 py-2.5 outline-none border border-border focus:border-primary transition"
            />
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" minLength={1} required
                className="w-full rounded-lg bg-input px-3 py-2.5 pr-10 outline-none border border-border focus:border-primary transition"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button disabled={busy} className="w-full rounded-lg bg-primary py-2.5 font-semibold text-primary-foreground glow-primary disabled:opacity-50">
              {busy ? "…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "signup" ? "Have an account? Sign in" : "New here? Create an account"}
          </button>
        </div>
      </div>
    </div>
  );
}
