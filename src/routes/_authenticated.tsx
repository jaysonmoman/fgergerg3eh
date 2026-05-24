import { createFileRoute, Outlet, Link, useRouter, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login", search: { redirect: window.location.pathname } });
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif italic text-sm">S</div>
            <span className="font-serif text-lg tracking-wide">SWAPLIX</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-foreground/80">
            <Link to="/swaps" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>My Swaps</Link>
            <Link to="/exchanger" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>Exchanger</Link>
            <Link to="/admin" className="hover:text-foreground" activeProps={{ className: "text-primary" }}>Admin</Link>
            <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
            <button onClick={signOut} className="rounded-full border border-border px-3 py-1 text-xs hover:bg-foreground/5">Sign out</button>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

// Avoid unused import lint
export const _r = redirect;
