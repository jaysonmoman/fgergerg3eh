import { ArrowDownUp, ChevronDown } from "lucide-react";

export function SwapCard() {
  return (
    <div className="relative w-full max-w-md rounded-3xl bg-sand p-6 text-sand-foreground shadow-2xl shadow-black/40">
      <p className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">SWAP</p>

      <div className="mt-4 rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="flex items-center justify-between text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">
          <span>FROM</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="font-serif text-5xl">0.1</div>
          <button className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7931A] text-[0.65rem] font-bold text-white">
              ₿
            </span>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold">BTC</div>
              <div className="text-[0.55rem] font-mono tracking-widest text-muted-foreground">BITCOIN</div>
            </div>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-1 font-mono text-xs text-sand-foreground/50">—</p>
      </div>

      <div className="relative my-2 flex justify-center">
        <button className="rounded-full bg-background p-2 text-foreground ring-4 ring-sand">
          <ArrowDownUp className="h-3 w-3" />
        </button>
      </div>

      <div className="rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">TO</div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="font-serif text-5xl text-sand-foreground/50">···</div>
          <button className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#627EEA] text-[0.65rem] font-bold text-white">
              Ξ
            </span>
            <div className="text-left leading-tight">
              <div className="text-xs font-semibold">ETH</div>
              <div className="text-[0.55rem] font-mono tracking-widest text-muted-foreground">ETHEREUM</div>
            </div>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <p className="mt-1 font-mono text-xs text-sand-foreground/50">—</p>
      </div>

      <button className="mt-4 w-full rounded-2xl bg-primary/70 py-4 font-mono text-sm tracking-wide text-primary-foreground/80">
        Loading quote...
      </button>
    </div>
  );
}
