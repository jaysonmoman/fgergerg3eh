const MAP: Record<string, { label: string; cls: string }> = {
  pending_deposit: { label: "Awaiting deposit", cls: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
  escrowed: { label: "Escrowed", cls: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
  admin_pending: { label: "Open order", cls: "bg-purple-500/15 text-purple-400 ring-purple-500/30" },
  claimed: { label: "Claimed", cls: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30" },
  fulfilled: { label: "Payout sent", cls: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/30" },
  completed: { label: "Completed", cls: "bg-success/15 text-success ring-success/30" },
  expired: { label: "Expired", cls: "bg-muted text-muted-foreground ring-border" },
  refunded: { label: "Refunded", cls: "bg-muted text-muted-foreground ring-border" },
};

export function StatusPill({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: "bg-muted text-muted-foreground ring-border" };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wider ring-1 ${m.cls}`}>
      {m.label}
    </span>
  );
}
