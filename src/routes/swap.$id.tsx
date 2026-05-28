import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { getSwap, updateSwapSubject } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";
import { ProgressTracker } from "@/components/ProgressTracker";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/swap/$id")({
  component: SwapDetail,
  head: () => ({ meta: [{ title: "Swap — Swaplix" }] }),
});

function SwapDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const get = useServerFn(getSwap);
  const updateSubj = useServerFn(updateSwapSubject);
  const qc = useQueryClient();
  const [subjectDraft, setSubjectDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/login", search: { redirect: `/swap/${id}` } });
  }, [loading, user, id, router]);

  const q = useQuery({
    queryKey: ["swap", id],
    queryFn: () => get({ data: { id } }),
    refetchInterval: 8_000,
    enabled: !!user,
  });

  if (q.isLoading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (q.error) return <div className="flex min-h-screen items-center justify-center text-destructive">{(q.error as Error).message}</div>;
  const s = q.data!.swap;
  const expiresIn = Math.max(0, Math.floor((new Date(s.expires_at).getTime() - Date.now()) / 60_000));

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif italic text-sm">S</div>
            <span className="font-serif text-lg">SWAPLIX</span>
          </Link>
          <Link to="/swaps" className="text-sm text-muted-foreground hover:text-foreground">← All swaps</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 md:px-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-eyebrow">Swap #{s.short_id} · {s.payout_kind ?? "crypto"}</p>
            <h1 className="mt-2 text-4xl">{s.from_amount} {s.from_currency} → {s.to_amount?.toString().slice(0, 10) ?? "—"} {s.to_currency}</h1>
          </div>
          <StatusPill status={s.status} />
        </div>

        <section className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border">
          <div className="flex items-center justify-between">
            <div className="text-eyebrow">Subject (visible to exchanger)</div>
            {subjectDraft === null ? (
              <button onClick={() => setSubjectDraft(s.subject ?? "")} className="text-xs text-primary hover:underline">Edit</button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setSubjectDraft(null)} className="text-xs text-muted-foreground">Cancel</button>
                <button
                  onClick={async () => {
                    try {
                      await updateSubj({ data: { id: s.id, subject: subjectDraft ?? "" } });
                      toast.success("Subject updated");
                      setSubjectDraft(null);
                      qc.invalidateQueries({ queryKey: ["swap", id] });
                    } catch (e) { toast.error((e as Error).message); }
                  }}
                  className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
                >Save</button>
              </div>
            )}
          </div>
          {subjectDraft === null ? (
            <p className="mt-2 text-sm text-foreground/80">{s.subject || <span className="text-muted-foreground italic">No subject set — add one so the exchanger knows what this swap is for.</span>}</p>
          ) : (
            <textarea
              value={subjectDraft}
              onChange={(e) => setSubjectDraft(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="e.g. iPhone 15 Pro Max, sealed, ship to Mumbai · or · INR 40,000 via UPI bharatpe@okhdfc"
              className="mt-2 w-full rounded-lg bg-background p-3 text-sm outline-none ring-1 ring-border focus:ring-primary"
            />
          )}
        </section>

        {s.status === "pending_deposit" && (
          <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <h2 className="text-xl">Send your {s.from_currency} to the escrow address</h2>
            <p className="mt-1 text-sm text-muted-foreground">Expires in ~{expiresIn} minute{expiresIn === 1 ? "" : "s"}. Send the exact amount — our bot scans the chain every minute and will auto-escrow once it sees your transaction.</p>

            <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="text-eyebrow">Deposit address</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <code className="break-all font-mono text-sm">{s.deposit_address}</code>
                <button onClick={() => copy(s.deposit_address ?? "")} className="rounded-md p-1.5 hover:bg-foreground/10"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              {s.deposit_address?.startsWith("DEMO_") && (
                <p className="mt-3 text-xs text-amber-400">⚠ Placeholder address. Set OPERATOR_{s.from_currency}_ADDRESS env var before going live.</p>
              )}
            </div>

            <div className="mt-4 rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="text-eyebrow">Amount</div>
              <div className="mt-2 font-mono text-2xl">{s.from_amount} {s.from_currency}</div>
            </div>

            <div className="mt-6 rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="text-eyebrow">On-chain progress</div>
              <ProgressTracker confirmations={0} target={3} label="Waiting for transaction…" pulse />
              <p className="mt-3 text-xs text-muted-foreground">No txid input — we detect your deposit automatically. This page refreshes every 8 seconds.</p>
            </div>
          </section>
        )}

        {s.status === "escrowed" && (
          <section className="mt-10 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
            <h2 className="text-xl">Funds escrowed — awaiting exchanger</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your {s.from_currency} is in escrow. An exchanger will claim your order and send {s.to_currency} to your destination.</p>
            <div className="mt-4">
              <ProgressTracker confirmations={s.confirmations ?? 0} target={3} label="Confirmations" />
            </div>
            {s.deposit_txid && (
              <div className="mt-3 text-xs"><span className="text-muted-foreground">Verified txid: </span><code className="break-all font-mono text-foreground/70">{s.deposit_txid}</code></div>
            )}
          </section>
        )}

        {s.status === "disputed" && (
          <section className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <h2 className="text-xl">⚠ Trade frozen — under dispute</h2>
            <p className="mt-2 text-sm text-muted-foreground">This swap has been flagged and is frozen pending admin arbitration. Neither party can modify it until an admin resolves the dispute.</p>
          </section>
        )}

        {s.status === "claimed" && (
          <section className="mt-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <h2 className="text-xl">Exchanger claimed — payout in progress</h2>
            <p className="mt-2 text-sm text-muted-foreground">An exchanger has committed to fulfilling this swap. Payout to your address will appear shortly.</p>
          </section>
        )}

        {s.status === "completed" && (
          <section className="mt-10 rounded-2xl border border-success/30 bg-success/5 p-6">
            <h2 className="text-xl">Completed</h2>
            {s.payout_txid && (
              <div className="mt-3"><div className="text-eyebrow">Payout txid</div><code className="mt-1 block break-all font-mono text-sm">{s.payout_txid}</code></div>
            )}
          </section>
        )}

        <section className="mt-8 grid gap-3 rounded-2xl bg-card p-6 ring-1 ring-border md:grid-cols-2">
          <Field label="Destination">{s.destination_address}</Field>
          <Field label="Rate">{s.rate ? `1 ${s.from_currency} = ${Number(s.rate).toFixed(6)} ${s.to_currency}` : "—"}</Field>
          <Field label="Deposit txid">{s.deposit_txid ?? "—"}</Field>
          <Field label="Payout txid">{s.payout_txid ?? "—"}</Field>
          <Field label="Created">{new Date(s.created_at).toLocaleString()}</Field>
          <Field label="Expires">{new Date(s.expires_at).toLocaleString()}</Field>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-eyebrow">{label}</div>
      <div className="mt-1 break-all font-mono text-xs text-foreground/80">{children}</div>
    </div>
  );
}
