import { StatusPill } from "@/components/StatusPill";
import { Clock, ArrowRight, CheckCircle2, AlertCircle, Wallet } from "lucide-react";

interface Swap {
  id: string;
  short_id: string;
  swap_type: string;
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number | null;
  status: string;
  created_at: string;
  destination_address: string;
  deposit_address?: string;
  deposit_txid?: string;
  payout_txid?: string;
  exchanger_id?: string;
}

interface TradePipelineProps {
  swaps: Swap[];
  onSelectSwap?: (swap: Swap) => void;
}

const STATUS_ORDER = [
  "pending_deposit",
  "escrowed",
  "admin_pending",
  "claimed",
  "fulfilled",
  "completed",
  "expired",
  "refunded",
];

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending_deposit: <Clock className="h-4 w-4 text-amber-400" />,
  escrowed: <Wallet className="h-4 w-4 text-blue-400" />,
  admin_pending: <AlertCircle className="h-4 w-4 text-purple-400" />,
  claimed: <ArrowRight className="h-4 w-4 text-cyan-400" />,
  fulfilled: <ArrowRight className="h-4 w-4 text-indigo-400" />,
  completed: <CheckCircle2 className="h-4 w-4 text-success" />,
};

export function TradePipeline({ swaps, onSelectSwap }: TradePipelineProps) {
  // Group swaps by status
  const groupedSwaps = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = swaps.filter((s) => s.status === status);
      return acc;
    },
    {} as Record<string, Swap[]>
  );

  // Filter to only show active statuses
  const activeStatuses = STATUS_ORDER.filter(
    (status) => groupedSwaps[status]?.length > 0
  );

  if (swaps.length === 0) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
        <p className="text-muted-foreground">No active trades in the pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {STATUS_ORDER.slice(0, 6).map((status) => {
          const count = groupedSwaps[status]?.length || 0;
          const isActive = count > 0;
          return (
            <div
              key={status}
              className={`rounded-xl p-4 text-center transition-colors ${
                isActive
                  ? "bg-card ring-1 ring-border"
                  : "bg-card/30 text-muted-foreground"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                {STATUS_ICONS[status]}
                <span className="font-mono text-2xl">{count}</span>
              </div>
              <p className="mt-1 text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground">
                {status.replace(/_/g, " ")}
              </p>
            </div>
          );
        })}
      </div>

      {/* Kanban-style Pipeline */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {activeStatuses.map((status) => (
          <div
            key={status}
            className="min-w-[300px] flex-shrink-0 rounded-2xl border border-border/60 bg-card/30"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div className="flex items-center gap-2">
                {STATUS_ICONS[status]}
                <span className="text-sm font-medium capitalize">
                  {status.replace(/_/g, " ")}
                </span>
              </div>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-mono">
                {groupedSwaps[status].length}
              </span>
            </div>
            <div className="max-h-[400px] space-y-2 overflow-y-auto p-3">
              {groupedSwaps[status].map((swap) => (
                <div
                  key={swap.id}
                  onClick={() => onSelectSwap?.(swap)}
                  className="cursor-pointer rounded-xl bg-card p-3 ring-1 ring-border/50 transition-all hover:ring-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{swap.short_id}
                    </span>
                    {swap.swap_type === "admin" && (
                      <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-purple-400">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {swap.from_amount} {swap.from_currency}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono text-sm">
                      {swap.to_amount?.toFixed(4) || "—"} {swap.to_currency}
                    </span>
                  </div>
                  <div className="mt-2 text-[0.65rem] text-muted-foreground">
                    {new Date(swap.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline View */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-4">
        <h3 className="text-sm font-medium text-muted-foreground">Recent Activity</h3>
        <div className="mt-4 space-y-3">
          {swaps.slice(0, 10).map((swap, idx) => (
            <div
              key={swap.id}
              className="flex items-center gap-4 rounded-xl px-3 py-2 transition-colors hover:bg-foreground/5"
            >
              <div className="relative">
                <StatusPill status={swap.status} />
                {idx < swaps.length - 1 && (
                  <div className="absolute left-1/2 top-full h-3 w-px -translate-x-1/2 bg-border/40" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    #{swap.short_id}
                  </span>
                  <span className="text-sm">
                    {swap.from_amount} {swap.from_currency} → {swap.to_currency}
                  </span>
                  {swap.swap_type === "admin" && (
                    <span className="rounded-full bg-purple-500/15 px-1.5 py-0.5 text-[0.5rem] uppercase tracking-wider text-purple-400">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(swap.created_at).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
