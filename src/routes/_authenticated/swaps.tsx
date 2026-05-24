import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMySwaps } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/_authenticated/swaps")({
  component: MySwapsPage,
  head: () => ({ meta: [{ title: "My Swaps — Swaplix" }] }),
});

function MySwapsPage() {
  const fn = useServerFn(listMySwaps);
  const q = useQuery({ queryKey: ["my-swaps"], queryFn: () => fn(), refetchInterval: 15_000 });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-eyebrow">Your swap history</p>
          <h1 className="mt-2 text-4xl">My Swaps</h1>
        </div>
        <Link to="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground hover:scale-[1.02] transition-transform">+ New swap</Link>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-foreground/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Pair</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {q.isLoading && (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>)}
            {q.data?.swaps.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No swaps yet. <Link to="/" className="text-primary hover:underline">Start one</Link>.</td></tr>
            )}
            {q.data?.swaps.map((s) => (
              <tr key={s.id} className="hover:bg-foreground/[0.03]">
                <td className="px-4 py-3 font-mono text-xs">{s.short_id}</td>
                <td className="px-4 py-3">{s.from_currency} → {s.to_currency}</td>
                <td className="px-4 py-3 text-num">{s.from_amount}</td>
                <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-right"><Link to="/swap/$id" params={{ id: s.id }} className="text-primary text-xs hover:underline">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
