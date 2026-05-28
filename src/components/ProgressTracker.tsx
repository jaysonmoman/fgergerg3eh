export function ProgressTracker({
  confirmations,
  target = 3,
  label,
  pulse = false,
}: {
  confirmations: number;
  target?: number;
  label?: string;
  pulse?: boolean;
}) {
  const pct = Math.min(100, (confirmations / target) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label ?? "Confirmations"}</span>
        <span className="font-mono">
          {confirmations}/{target}
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-foreground/10">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700 ${pulse ? "animate-pulse" : ""}`}
          style={{ width: `${pct || (pulse ? 8 : 0)}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-[0.6rem] uppercase tracking-wider text-muted-foreground">
        <span>Detected</span>
        <span>1 conf</span>
        <span>{target}+ confirmed</span>
      </div>
    </div>
  );
}
