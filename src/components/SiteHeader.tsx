import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif italic text-lg">
            S
          </div>
          <span className="font-serif text-xl tracking-wide">SWAPLIX</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-foreground/80 md:flex">
          <a href="/#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="/#verify" className="hover:text-foreground transition-colors">Verify</a>
          <a href="/#liquidity" className="hover:text-foreground transition-colors">Liquidity</a>
          <a href="/#atomic" className="hover:text-foreground transition-colors">Atomic Swap</a>
          {user ? (
            <>
              <Link to="/swaps" className="hover:text-foreground transition-colors">My Swaps</Link>
              <button onClick={signOut} className="rounded-full border border-foreground/30 px-4 py-1.5 hover:bg-foreground/5">
                Sign out
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:scale-[1.02] transition-transform">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
