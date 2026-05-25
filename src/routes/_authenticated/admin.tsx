import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminPostSwap, adminGrantRole, getMyRoles, claimFirstAdmin, listMySwaps, getAppSetting, setAppSetting, adminReleaseFunds } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Swaplix" }] }),
});

const CURRENCIES = ["BTC", "ETH", "LTC", "XMR", "SOL", "DOGE", "BCH", "USDT"] as const;

function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const post = useServerFn(adminPostSwap);
  const grant = useServerFn(adminGrantRole);
  const claimAdmin = useServerFn(claimFirstAdmin);
  const listAll = useServerFn(listMySwaps);
  const getSetting = useServerFn(getAppSetting);
  const setSetting = useServerFn(setAppSetting);
  const releaseFn = useServerFn(adminReleaseFunds);
  const qc = useQueryClient();

  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = rolesQ.data?.roles.includes("admin");
  const allQ = useQuery({ queryKey: ["my-swaps"], queryFn: () => listAll(), enabled: !!isAdmin });
  const autoPayQ = useQuery({
    queryKey: ["setting", "auto_payouts_enabled"],
    queryFn: () => getSetting({ data: { key: "auto_payouts_enabled" } }),
    enabled: !!isAdmin,
  });
  const autoPayouts = autoPayQ.data?.value === true;

  const toggleM = useMutation({
    mutationFn: (v: boolean) => setSetting({ data: { key: "auto_payouts_enabled", value: v } }),
    onSuccess: (_d, v) => {
      toast.success(`Automated payouts ${v ? "enabled" : "disabled"}`);
      qc.invalidateQueries({ queryKey: ["setting", "auto_payouts_enabled"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const releaseM = useMutation({
    mutationFn: releaseFn,
    onSuccess: () => { toast.success("Funds released"); qc.invalidateQueries({ queryKey: ["my-swaps"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const postM = useMutation({
    mutationFn: post,
    onSuccess: () => { toast.success("Admin swap posted"); qc.invalidateQueries({ queryKey: ["my-swaps"] }); qc.invalidateQueries({ queryKey: ["orderbook"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const grantM = useMutation({
    mutationFn: grant,
    onSuccess: () => toast.success("Role granted"),
    onError: (e: Error) => toast.error(e.message),
  });
  const claimM = useMutation({
    mutationFn: claimAdmin,
    onSuccess: () => { toast.success("You are now admin"); qc.invalidateQueries({ queryKey: ["my-roles"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [form, setForm] = useState({ from_currency: "LTC", to_currency: "ETH", from_amount: "", to_amount: "", destination_address: "" });
  const [grantForm, setGrantForm] = useState({ email: "", role: "exchanger" });

  if (rolesQ.isLoading) return <div className="p-10 text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center md:px-10">
        <h1 className="text-3xl">Admin access required</h1>
        <p className="mt-4 text-muted-foreground">If no admin exists yet, you can claim the first admin slot (bootstrap-only).</p>
        <button onClick={() => claimM.mutate(undefined)} className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm text-primary-foreground">Claim first admin</button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 md:px-10">
      <p className="text-eyebrow">Admin console</p>
      <h1 className="mt-2 text-4xl">Manage swaps & roles</h1>

      {/* Global automated-payouts toggle */}
      <section
        className={`mt-8 flex flex-col gap-4 rounded-2xl border p-6 md:flex-row md:items-center md:justify-between ${
          autoPayouts ? "border-success/40 bg-success/5" : "border-amber-500/30 bg-amber-500/5"
        }`}
      >
        <div>
          <p className="text-eyebrow">Trade manager · global</p>
          <h2 className="mt-1 text-2xl">Enable Automated Payouts</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {autoPayouts
              ? "ON — verified exchanger payouts auto-advance to Completed without admin review."
              : "OFF — every user swap halts at Fulfilled and waits for an admin to click Release Funds."}
          </p>
        </div>
        <button
          onClick={() => toggleM.mutate(!autoPayouts)}
          disabled={toggleM.isPending || autoPayQ.isLoading}
          aria-pressed={autoPayouts}
          aria-label="Toggle automated payouts"
          className={`relative inline-flex h-9 w-20 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
            autoPayouts ? "bg-success" : "bg-muted ring-1 ring-border"
          }`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-background shadow-lg transition-transform ${
              autoPayouts ? "translate-x-12" : "translate-x-1"
            }`}
          />
          <span className={`absolute font-mono text-[0.6rem] font-bold tracking-wider ${autoPayouts ? "left-3 text-primary-foreground" : "right-3 text-muted-foreground"}`}>
            {autoPayouts ? "ON" : "OFF"}
          </span>
        </button>
      </section>


      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">Post an admin swap</h2>
          <p className="mt-1 text-xs text-muted-foreground">Skips deposit/escrow. You're responsible for delivering the from-leg manually after the exchanger pays out.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Select label="From" value={form.from_currency} onChange={(v) => setForm({ ...form, from_currency: v })} options={CURRENCIES as unknown as string[]} />
            <Select label="To" value={form.to_currency} onChange={(v) => setForm({ ...form, to_currency: v })} options={CURRENCIES as unknown as string[]} />
            <Input label="From amount" value={form.from_amount} onChange={(v) => setForm({ ...form, from_amount: v })} />
            <Input label="To amount" value={form.to_amount} onChange={(v) => setForm({ ...form, to_amount: v })} />
          </div>
          <Input label="Destination address (yours, where exchanger sends)" value={form.destination_address} onChange={(v) => setForm({ ...form, destination_address: v })} mono />
          <button onClick={() => postM.mutate({ data: { from_currency: form.from_currency as never, to_currency: form.to_currency as never, from_amount: parseFloat(form.from_amount), to_amount: parseFloat(form.to_amount), destination_address: form.destination_address } })} disabled={postM.isPending}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{postM.isPending ? "Posting…" : "Post swap"}</button>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-xl">Grant a role</h2>
          <p className="mt-1 text-xs text-muted-foreground">Promote a user to exchanger or admin by email.</p>
          <Input label="User email" value={grantForm.email} onChange={(v) => setGrantForm({ ...grantForm, email: v })} />
          <Select label="Role" value={grantForm.role} onChange={(v) => setGrantForm({ ...grantForm, role: v })} options={["exchanger", "admin", "user"]} />
          <button onClick={() => grantM.mutate({ data: { email: grantForm.email, role: grantForm.role as never } })} disabled={grantM.isPending || !grantForm.email}
            className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{grantM.isPending ? "Granting…" : "Grant role"}</button>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">All swaps</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-foreground/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Pair</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {allQ.data?.swaps.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-mono text-xs">{s.short_id}</td>
                  <td className="px-4 py-2 text-xs">{s.swap_type}</td>
                  <td className="px-4 py-2">{s.from_currency} → {s.to_currency}</td>
                  <td className="px-4 py-2 text-num">{s.from_amount}</td>
                  <td className="px-4 py-2"><StatusPill status={s.status} /></td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {s.status === "fulfilled" ? (
                      <button
                        onClick={() => releaseM.mutate({ data: { id: s.id } })}
                        disabled={releaseM.isPending}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        Release Funds
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      </section>
    </main>
  );
}

function Input({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div className="col-span-2 mt-3">
      <label className="text-eyebrow">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={`mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-primary ${mono ? "font-mono text-xs" : ""}`} />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-eyebrow">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-primary">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
