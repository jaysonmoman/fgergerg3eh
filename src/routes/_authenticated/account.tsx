import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyRoles, updateProfile } from "@/lib/swaps.functions";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/account")({
  component: AccountPage,
  head: () => ({ meta: [{ title: "Account — Swaplix" }] }),
});

function AccountPage() {
  const { user } = useAuth();
  const rolesFn = useServerFn(getMyRoles);
  const updFn = useServerFn(updateProfile);
  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      setDisplayName(data?.display_name ?? "");
    });
  }, [user]);

  const save = useMutation({
    mutationFn: () => updFn({ data: { display_name: displayName } }),
    onSuccess: () => toast.success("Profile saved"),
    onError: (e: Error) => toast.error(e.message),
  });

  const roles = rolesQ.data?.roles ?? [];

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <p className="text-eyebrow">Your account</p>
      <h1 className="mt-2 text-4xl">Profile</h1>

      <section className="mt-8 space-y-3 rounded-2xl border border-border/60 bg-card p-6">
        <div className="text-eyebrow">Email</div>
        <div className="font-mono text-sm">{user?.email}</div>
        <div className="mt-4 text-eyebrow">Display name</div>
        <div className="flex gap-2">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} className="flex-1 rounded-xl bg-background px-4 py-2 text-sm outline-none ring-1 ring-border focus:ring-primary" />
          <button onClick={() => save.mutate()} disabled={save.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{save.isPending ? "Saving…" : "Save"}</button>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <div className="text-eyebrow">Roles</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(roles.length ? roles : ["user"]).map((r) => (
            <span key={r} className={`rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wider ring-1 ${r === "admin" ? "bg-primary/15 text-primary ring-primary/30" : r === "exchanger" ? "bg-cyan-500/15 text-cyan-300 ring-cyan-400/30" : "bg-foreground/5 text-foreground/70 ring-border"}`}>{r}</span>
          ))}
        </div>
        {!roles.includes("exchanger") && !roles.includes("admin") && (
          <p className="mt-3 text-xs text-muted-foreground">Want to fulfill swaps and earn spread? Ask an admin to grant you the <code className="font-mono">exchanger</code> role.</p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <div className="text-eyebrow">Quick links</div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link to="/swaps" className="text-primary hover:underline">My swaps →</Link>
          {(roles.includes("exchanger") || roles.includes("admin")) && (
            <Link to="/exchanger" className="text-primary hover:underline">Order book →</Link>
          )}
          {roles.includes("admin") && <Link to="/admin" className="text-primary hover:underline">Admin →</Link>}
        </div>
      </section>
    </main>
  );
}
