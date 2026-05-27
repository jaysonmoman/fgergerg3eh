import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { listOrderbook, claimSwap, submitPayoutTxid, getMyRoles } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/exchanger")({
  component: ExchangerPage,
  head: () => ({ meta: [{ title: "Exchanger — Swaplix" }] }),
});

function ExchangerPage() {
  const { user } = useAuth();
  const rolesFn = useServerFn(getMyRoles);
  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isExchanger = rolesQ.data?.roles.includes("exchanger") || rolesQ.data?.roles.includes("admin");

  const list = useServerFn(listOrderbook);
  const claim = useServerFn(claimSwap);
  const payout = useServerFn(submitPayoutTxid);
  const qc = useQueryClient();
  const [addr, setAddr] = useState<Record<string, string>>({});
  const [txids, setTxids] = useState<Record<string, string>>({});

  const q = useQuery({
    queryKey: ["orderbook"],
    queryFn: () => list(),
    refetchInterval: 10_000,
    enabled: !!isExchanger,
  });

  const claimM = useMutation({
    mutationFn: claim,
    onSuccess: () => { toast.success("Claimed"); qc.invalidateQueries({ queryKey: ["orderbook"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const payoutM = useMutation({
    mutationFn: payout,
    onSuccess: ({ verified }) => { toast.success(verified ? "Payout verified — swap completed" : "Payout recorded"); qc.invalidateQueries({ queryKey: ["orderbook"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (rolesQ.isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;
  if (!isExchanger) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center md:px-10">
        <h1 className="text-3xl">Exchanger access required</h1>
        <p className="mt-4 text-muted-foreground">Your account does not have the exchanger role. Ask an admin to grant it (the admin can do this from the Admin tab using your email: <span className="font-mono">{user?.email}</span>).</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <p className="text-eyebrow">Order book</p>
      <h1 className="mt-2 text-4xl">Fulfill open swaps</h1>
      <p className="mt-2 text-sm text-muted-foreground">No fees. You only pay network costs to deliver the payout. Claim a swap, send the agreed payout to the user's address, then submit the txid.</p>

      <div className="mt-8 space-y-3">
        {q.isLoading && <div className="text-muted-foreground">Loading…</div>}
        {q.data?.swaps.length === 0 && <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">No open orders right now.</div>}
        {q.data?.swaps.map((s) => {
          const mine = s.exchanger_id === user?.id;
          return (
            <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">#{s.short_id}</span>
                    <StatusPill status={s.status} />
                    {s.swap_type === "admin" && <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-purple-400">Admin</span>}
                  </div>
                  <div className="mt-2 text-lg">
                    Pay <span className="font-mono">{s.to_amount}</span> {s.to_currency} → receive <span className="font-mono">{s.from_amount}</span> {s.from_currency}
                  </div>
                  {s.subject && (
                    <div className="mt-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200 ring-1 ring-amber-500/20">
                      <span className="font-mono text-[0.6rem] uppercase tracking-wider text-amber-400/80">Subject · {s.payout_kind ?? "crypto"}</span>
                      <div className="mt-0.5">{s.subject}</div>
                    </div>
                  )}
                  <div className="mt-1 text-xs text-muted-foreground">User destination: <code className="font-mono">{s.destination_address}</code></div>
                </div>
              </div>

              {!mine && (s.status === "escrowed" || s.status === "admin_pending") && (
                <div className="mt-4 flex gap-2">
                  <input placeholder={`Your ${s.from_currency} payout address (where you receive)`} value={addr[s.id] ?? ""} onChange={(e) => setAddr({ ...addr, [s.id]: e.target.value })}
                    className="flex-1 rounded-xl bg-background px-4 py-2 font-mono text-xs outline-none ring-1 ring-border focus:ring-primary" />
                  <button onClick={() => claimM.mutate({ data: { id: s.id, exchanger_payout_address: addr[s.id] ?? "" } })} disabled={!addr[s.id] || claimM.isPending}
                    className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">Claim</button>
                </div>
              )}

              {mine && s.status === "claimed" && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">After sending {s.to_amount} {s.to_currency} to the user's address, submit your payout txid:</div>
                  <div className="flex gap-2">
                    <input placeholder="Payout transaction id" value={txids[s.id] ?? ""} onChange={(e) => setTxids({ ...txids, [s.id]: e.target.value })}
                      className="flex-1 rounded-xl bg-background px-4 py-2 font-mono text-xs outline-none ring-1 ring-border focus:ring-primary" />
                    <button onClick={() => payoutM.mutate({ data: { id: s.id, payout_txid: txids[s.id] ?? "" } })} disabled={!txids[s.id] || payoutM.isPending}
                      className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">Submit payout</button>
                  </div>
                </div>
              )}

              {mine && s.status === "completed" && (
                <div className="mt-4 text-sm text-success">✓ Completed. Payout txid: <code className="font-mono text-xs">{s.payout_txid}</code></div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
