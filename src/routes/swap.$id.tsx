import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, ExternalLink } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { getSwap, updateSwapSubject, cancelSwap } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";
import { ProgressTracker } from "@/components/ProgressTracker";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { txUrl, addrUrl } from "@/lib/explorers";

export const Route = createFileRoute("/swap/$id")({
  component: SwapDetail,
  head: () => ({ meta: [{ title: "Swap — Swaplix" }] }),
});

function useCountdown(target: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const ms = Math.max(0, new Date(target).getTime() - now);
  const mm = Math.floor(ms / 60000);
  const ss = Math.floor((ms % 60000) / 1000);
  return { ms, label: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` };
}

function SwapDetail() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const get = useServerFn(getSwap);
  const updateSubj = useServerFn(updateSwapSubject);
  const cancelFn = useServerFn(cancelSwap);
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

  // Realtime: invalidate on row updates so status flips appear instantly.
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`swap-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "swap_requests", filter: `id=eq.${id}` }, (payload) => {
        const prev = qc.getQueryData<{ swap: { status: string } }>(["swap", id]);
        const next = payload.new as { status: string };
        if (prev && prev.swap.status !== next.status) {
          toast.success(`Status: ${next.status.replace(/_/g, " ")}`);
        }
        qc.invalidateQueries({ queryKey: ["swap", id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, user, qc]);

  if (q.isLoading || !user) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (q.error) return <div className="flex min-h-screen items-center justify-center text-destructive">{(q.error as Error).message}</div>;
  const s = q.data!.swap;
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };
  const isOwner = s.user_id === user.id;

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border/40">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 md:px-10">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="" className="h-7 w-7 rounded-full" />
            <span className="font-serif text-lg">SWAPLIX</span>
          </Link>
          <Link to="/swaps" className="text-sm text-muted-foreground hover:text-foreground">← All swaps</Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 md:px-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-eyebrow">Swap #{s.short_id} · {s.payout_kind ?? "crypto"}</p>
            <h1 className="mt-2 text-4xl">{s.from_amount} {s.from_currency} → {s.to_amount?.toString().slice(0, 10) ?? "—"} {s.to_currency}</h1>
          </div>
          <StatusPill status={s.status} />
        </div>

        {isOwner && (
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
        )}

        {s.status === "pending_deposit" && (
          <PendingDepositPanel s={s} isOwner={isOwner} onCancel={async () => {
            if (!confirm("Cancel this swap? You will not be able to deposit afterwards.")) return;
            try { await cancelFn({ data: { id: s.id } }); toast.success("Swap cancelled"); qc.invalidateQueries({ queryKey: ["swap", id] }); }
            catch (e) { toast.error((e as Error).message); }
          }} />
        )}

        {s.status === "escrowed" && (
          <section className="mt-10 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
            <h2 className="text-xl">Funds escrowed — awaiting exchanger</h2>
            <p className="mt-2 text-sm text-muted-foreground">Your {s.from_currency} is in escrow. An exchanger will claim your order and send {s.to_currency} to your destination.</p>
            <div className="mt-4">
              <ProgressTracker confirmations={s.confirmations ?? 3} target={3} label="Confirmations" />
            </div>
            {s.deposit_txid && <TxidRow coin={s.from_currency} label="Deposit txid" hash={s.deposit_txid} />}
          </section>
        )}

        {s.status === "claimed" && (
          <section className="mt-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6">
            <h2 className="text-xl">Exchanger claimed — payout in progress</h2>
            <p className="mt-2 text-sm text-muted-foreground">An exchanger has committed to fulfilling this swap. Payout to your address will appear shortly.</p>
          </section>
        )}

        {s.status === "fulfilled" && (
          <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
            <h2 className="text-xl">Payout submitted — awaiting release</h2>
            <p className="mt-2 text-sm text-muted-foreground">The exchanger sent the payout. Once verified, funds will be released and this swap closed.</p>
            {s.payout_txid && <TxidRow coin={s.to_currency} label="Payout txid" hash={s.payout_txid} />}
          </section>
        )}

        {s.status === "disputed" && (
          <section className="mt-10 rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <h2 className="text-xl">⚠ Trade frozen — under dispute</h2>
            <p className="mt-2 text-sm text-muted-foreground">This swap has been flagged and is frozen pending admin arbitration. Neither party can modify it until an admin resolves the dispute.</p>
          </section>
        )}

        {s.status === "completed" && (
          <section className="mt-10 rounded-2xl border border-success/30 bg-success/5 p-6">
            <h2 className="text-xl">Completed</h2>
            {s.payout_txid && <TxidRow coin={s.to_currency} label="Payout txid" hash={s.payout_txid} />}
          </section>
        )}

        {(s.status === "expired" || s.status === "refunded") && (
          <section className="mt-10 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl">{s.status === "expired" ? "Swap expired" : "Refunded"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{s.status === "expired" ? "No deposit was received in time. Create a new swap to retry." : "The deposit was refunded to you per the dispute resolution."}</p>
            <Link to="/" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">+ Start a new swap</Link>
          </section>
        )}

        <section className="mt-8 grid gap-3 rounded-2xl bg-card p-6 ring-1 ring-border md:grid-cols-2">
          <Field label="Destination">
            <AddrLink coin={s.to_currency} addr={s.destination_address} />
          </Field>
          <Field label="Rate">{s.rate ? `1 ${s.from_currency} = ${Number(s.rate).toFixed(6)} ${s.to_currency}` : "—"}</Field>
          <Field label="Deposit txid"><TxLink coin={s.from_currency} hash={s.deposit_txid} /></Field>
          <Field label="Payout txid"><TxLink coin={s.to_currency} hash={s.payout_txid} /></Field>
          <Field label="Created">{new Date(s.created_at).toLocaleString()}</Field>
          <Field label="Expires">{new Date(s.expires_at).toLocaleString()}</Field>
        </section>
      </div>
    </main>
  );
}

function PendingDepositPanel({ s, isOwner, onCancel }: { s: { id: string; from_currency: string; from_amount: number; deposit_address: string | null; expires_at: string }; isOwner: boolean; onCancel: () => void }) {
  const { label, ms } = useCountdown(s.expires_at);
  const danger = ms < 5 * 60 * 1000 && ms > 0;
  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copied"); };
  // QR payload: standard URI form `coin:addr?amount=…` for wallets that parse it.
  const scheme = useMemo(() => ({ BTC: "bitcoin", LTC: "litecoin", DOGE: "dogecoin", BCH: "bitcoincash", ETH: "ethereum", XMR: "monero" } as Record<string, string>)[s.from_currency.toUpperCase()] ?? s.from_currency.toLowerCase(), [s.from_currency]);
  const qrPayload = s.deposit_address ? `${scheme}:${s.deposit_address}?amount=${s.from_amount}` : "";

  return (
    <section className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">Send your {s.from_currency} to the escrow address</h2>
          <p className="mt-1 text-sm text-muted-foreground">Send the exact amount — our bot scans the chain and auto-escrows the moment your transaction lands.</p>
        </div>
        <div className={`rounded-xl px-3 py-2 text-right ${danger ? "bg-destructive/15 ring-1 ring-destructive/40" : "bg-background/60 ring-1 ring-border"}`}>
          <div className="text-[0.6rem] font-mono uppercase tracking-wider text-muted-foreground">Expires in</div>
          <div className={`text-num text-2xl ${danger ? "text-destructive animate-pulse" : ""}`}>{label}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div className="rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="text-eyebrow">Deposit address</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <code className="break-all font-mono text-sm">{s.deposit_address}</code>
              <button onClick={() => copy(s.deposit_address ?? "")} className="rounded-md p-1.5 hover:bg-foreground/10"><Copy className="h-3.5 w-3.5" /></button>
            </div>
            {s.deposit_address?.startsWith("DEMO_") && (
              <p className="mt-3 text-xs text-amber-400">⚠ Placeholder address. Set OPERATOR_{s.from_currency}_ADDRESS env var before going live.</p>
            )}
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="text-eyebrow">Amount</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="font-mono text-2xl">{s.from_amount} {s.from_currency}</div>
              <button onClick={() => copy(String(s.from_amount))} className="rounded-md p-1.5 hover:bg-foreground/10"><Copy className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="rounded-xl bg-card p-4 ring-1 ring-border">
            <div className="text-eyebrow">On-chain progress</div>
            <ProgressTracker confirmations={0} target={3} label="Scanning chain for your deposit…" pulse />
            <p className="mt-3 text-xs text-muted-foreground">No txid input — detection is automatic. Status updates in real time.</p>
          </div>
        </div>
        {s.deposit_address && (
          <div className="flex flex-col items-center justify-start rounded-xl bg-white p-3">
            <QRCodeSVG value={qrPayload} size={168} />
            <div className="mt-2 text-[0.6rem] font-mono uppercase tracking-wider text-neutral-600">Scan with wallet</div>
          </div>
        )}
      </div>

      {isOwner && (
        <button onClick={onCancel} className="mt-4 text-xs text-muted-foreground hover:text-destructive underline">
          Cancel this swap
        </button>
      )}
    </section>
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

function TxLink({ coin, hash }: { coin: string; hash: string | null }) {
  if (!hash) return <>—</>;
  const url = txUrl(coin, hash);
  if (!url) return <>{hash}</>;
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{hash.slice(0, 12)}…{hash.slice(-6)} <ExternalLink className="h-3 w-3" /></a>;
}
function AddrLink({ coin, addr }: { coin: string; addr: string }) {
  const url = addrUrl(coin, addr);
  if (!url) return <>{addr}</>;
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">{addr} <ExternalLink className="h-3 w-3" /></a>;
}
function TxidRow({ coin, label, hash }: { coin: string; label: string; hash: string }) {
  return (
    <div className="mt-3">
      <div className="text-eyebrow">{label}</div>
      <div className="mt-1"><TxLink coin={coin} hash={hash} /></div>
    </div>
  );
}
