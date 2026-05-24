import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: (s.redirect as string) ?? "/swaps" }),
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — Swaplix" }] }),
});

function LoginPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Signed in");
    navigate({ to: redirect });
  };

  const google = async () => {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + redirect });
    if (r.error) toast.error(String(r.error));
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif italic">S</div>
          <span className="font-serif text-xl">SWAPLIX</span>
        </Link>
        <h1 className="text-center text-3xl">Welcome back</h1>
        <p className="text-eyebrow mt-2 text-center">Sign in to manage your swaps</p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl bg-card px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-primary" />
          <input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl bg-card px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-primary" />
          <button disabled={loading} className="w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>
        <button onClick={google} className="mt-4 w-full rounded-xl border border-border bg-card py-3 text-sm hover:bg-foreground/5">Continue with Google</button>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
