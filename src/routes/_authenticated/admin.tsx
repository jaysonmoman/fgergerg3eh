import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { adminPostSwap, adminGrantRole, getMyRoles, claimFirstAdmin, listMySwaps } from "@/lib/swaps.functions";
import { StatusPill } from "@/components/StatusPill";
import { TradePipeline } from "@/components/TradePipeline";
import { Shield, Users, LayoutDashboard, Wallet, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Swaplix" }] }),
});

const CURRENCIES = ["BTC", "ETH", "LTC", "XMR", "SOL", "DOGE", "BCH", "USDT"] as const;

type Tab = "pipeline" | "post" | "roles" | "all";

function AdminPage() {
  const rolesFn = useServerFn(getMyRoles);
  const post = useServerFn(adminPostSwap);
  const grant = useServerFn(adminGrantRole);
  const claimAdmin = useServerFn(claimFirstAdmin);
  const listAll = useServerFn(listMySwaps);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>("pipeline");

  const rolesQ = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = rolesQ.data?.roles.includes("admin");
  const allQ = useQuery({ queryKey: ["my-swaps"], queryFn: () => listAll(), enabled: !!isAdmin, refetchInterval: 10_000 });

  const postM = useMutation({
    mutationFn: post,
    onSuccess: () => { toast.success("Admin swap posted"); qc.invalidateQueries({ queryKey: ["my-swaps"] }); qc.invalidateQueries({ queryKey: ["orderbook"] }); setActiveTab("pipeline"); },
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

  if (rolesQ.isLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center md:px-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Shield className="h-8 w-8" />
        </div>
        <h1 className="text-3xl">Admin Access Required</h1>
        <p className="mt-4 text-muted-foreground">If no admin exists yet, you can claim the first admin slot (bootstrap-only).</p>
        <button 
          onClick={() => claimM.mutate(undefined)} 
          disabled={claimM.isPending}
          className="mt-6 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {claimM.isPending ? "Claiming..." : "Claim First Admin"}
        </button>
      </main>
    );
  }

  const tabs = [
    { id: "pipeline" as const, label: "Trade Pipeline", icon: LayoutDashboard },
    { id: "post" as const, label: "Post Swap", icon: Wallet },
    { id: "roles" as const, label: "Manage Roles", icon: Users },
    { id: "all" as const, label: "All Swaps", icon: ChevronRight },
  ];

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <p className="text-eyebrow">Admin Console</p>
          <h1 className="text-3xl">Dashboard</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "pipeline" && (
          <TradePipeline swaps={allQ.data?.swaps ?? []} />
        )}

        {activeTab === "post" && (
          <section className="max-w-xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/15 text-purple-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium">Post from Platform Liquidity</h2>
                <p className="text-xs text-muted-foreground">(Admin Only)</p>
              </div>
            </div>
            <p className="mt-4 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-200">
              This bypasses the deposit/escrow flow. You are responsible for delivering the from-leg manually after an exchanger claims and pays out.
            </p>
            
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Select 
                label="From Currency" 
                value={form.from_currency} 
                onChange={(v) => setForm({ ...form, from_currency: v })} 
                options={CURRENCIES as unknown as string[]} 
              />
              <Select 
                label="To Currency" 
                value={form.to_currency} 
                onChange={(v) => setForm({ ...form, to_currency: v })} 
                options={CURRENCIES as unknown as string[]} 
              />
              <Input 
                label="From Amount" 
                value={form.from_amount} 
                onChange={(v) => setForm({ ...form, from_amount: v })} 
                placeholder="0.1"
              />
              <Input 
                label="To Amount" 
                value={form.to_amount} 
                onChange={(v) => setForm({ ...form, to_amount: v })} 
                placeholder="0.05"
              />
            </div>
            <div className="mt-4">
              <Input 
                label="Your Destination Address (where exchanger sends)" 
                value={form.destination_address} 
                onChange={(v) => setForm({ ...form, destination_address: v })} 
                mono 
                placeholder="Your wallet address"
                fullWidth
              />
            </div>
            
            {form.from_amount && form.to_amount && (
              <div className="mt-4 rounded-xl bg-foreground/5 p-3">
                <p className="text-xs text-muted-foreground">Effective Rate</p>
                <p className="font-mono text-sm">
                  1 {form.from_currency} = {(parseFloat(form.to_amount) / parseFloat(form.from_amount) || 0).toFixed(6)} {form.to_currency}
                </p>
              </div>
            )}
            
            <button 
              onClick={() => postM.mutate({ data: { from_currency: form.from_currency as never, to_currency: form.to_currency as never, from_amount: parseFloat(form.from_amount), to_amount: parseFloat(form.to_amount), destination_address: form.destination_address } })} 
              disabled={postM.isPending || !form.from_amount || !form.to_amount || !form.destination_address}
              className="mt-6 w-full rounded-xl bg-purple-500 py-3 text-sm font-medium text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {postM.isPending ? "Posting..." : "Post Admin Swap"}
            </button>
          </section>
        )}

        {activeTab === "roles" && (
          <section className="max-w-xl rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium">Grant User Roles</h2>
                <p className="text-xs text-muted-foreground">Promote users to exchanger or admin by email</p>
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <Input 
                label="User Email" 
                value={grantForm.email} 
                onChange={(v) => setGrantForm({ ...grantForm, email: v })} 
                placeholder="user@example.com"
                fullWidth
              />
              <Select 
                label="Role" 
                value={grantForm.role} 
                onChange={(v) => setGrantForm({ ...grantForm, role: v })} 
                options={["exchanger", "admin", "user"]} 
              />
              
              <div className="rounded-xl bg-foreground/5 p-3 text-xs text-muted-foreground">
                <p><strong>Exchanger:</strong> Can claim and fulfill swaps from the order book.</p>
                <p className="mt-1"><strong>Admin:</strong> Full access including posting admin swaps and managing roles.</p>
              </div>
            </div>
            
            <button 
              onClick={() => grantM.mutate({ data: { email: grantForm.email, role: grantForm.role as never } })} 
              disabled={grantM.isPending || !grantForm.email}
              className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {grantM.isPending ? "Granting..." : "Grant Role"}
            </button>
          </section>
        )}

        {activeTab === "all" && (
          <section>
            <h2 className="text-2xl">All Swaps</h2>
            <p className="mt-1 text-sm text-muted-foreground">Complete history of all swap requests</p>
            
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-foreground/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Pair</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {allQ.data?.swaps.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-foreground/5">
                      <td className="px-4 py-3 font-mono text-xs">{s.short_id}</td>
                      <td className="px-4 py-3">
                        {s.swap_type === "admin" ? (
                          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-purple-400">
                            Admin
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">{s.swap_type}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{s.from_currency} → {s.to_currency}</td>
                      <td className="px-4 py-3 font-mono">{s.from_amount}</td>
                      <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {(!allQ.data?.swaps || allQ.data.swaps.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No swaps yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Input({ label, value, onChange, mono, placeholder, fullWidth }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean; placeholder?: string; fullWidth?: boolean }) {
  return (
    <div className={fullWidth ? "col-span-2" : ""}>
      <label className="text-eyebrow">{label}</label>
      <input 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={placeholder}
        className={`mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm outline-none ring-1 ring-border transition-all focus:ring-primary ${mono ? "font-mono text-xs" : ""}`} 
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-eyebrow">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="mt-1 w-full rounded-xl bg-background px-4 py-2.5 text-sm outline-none ring-1 ring-border transition-all focus:ring-primary"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
