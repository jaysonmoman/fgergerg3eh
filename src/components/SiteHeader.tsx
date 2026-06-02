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
          <img src="/favicon.png" alt="Swaplix" className="h-9 w-9 rounded-full" />
          <span className="font-serif text-xl tracking-wide">SWAPLIX</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-foreground/80 md:flex">
          <a href="/#how" className="hover:text-foreground transition-colors">How</a>
          <a href="/#verify" className="hover:text-foreground transition-colors">Verify</a>
          <a href="/#liquidity" className="hover:text-foreground transition-colors">Liquidity</a>
          <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
          {user ? (
            <>
              <Link to="/swaps" className="hover:text-foreground transition-colors">My Swaps</Link>
              <a href="/#swap" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:scale-[1.02] transition-transform">Start swap</a>
              <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Sign out</button>
            </>
          ) : (
            <>
              <a href="/#swap" className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:scale-[1.02] transition-transform">Start swap</a>
              <Link to="/login" search={{ redirect: "/swaps" }} className="text-xs text-muted-foreground hover:text-foreground">Sign in</Link>
            </>
          )}
        </nav>
        <a href="/#swap" className="md:hidden rounded-full bg-primary px-4 py-1.5 text-xs text-primary-foreground">Start swap</a>
      </div>
    </header>
  );
}
