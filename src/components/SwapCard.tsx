import { ArrowDownUp, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { getPrices, COINS } from "@/lib/prices.functions";
import { createSwapRequest } from "@/lib/swaps.functions";
import { useAuth } from "@/lib/auth";

const SYMBOLS = Object.keys(COINS);

const ICON: Record<string, { bg: string; glyph: string }> = {
  BTC: { bg: "#F7931A", glyph: "₿" },
  ETH: { bg: "#627EEA", glyph: "Ξ" },
  LTC: { bg: "#345D9D", glyph: "Ł" },
  XMR: { bg: "#FF6600", glyph: "ɱ" },
  SOL: { bg: "#14F195", glyph: "S" },
  DOGE: { bg: "#C2A633", glyph: "Ð" },
  BCH: { bg: "#0AC18E", glyph: "Ƀ" },
  USDT: { bg: "#26A17B", glyph: "₮" },
};

function CoinBadge({ sym }: { sym: string }) {
  const i = ICON[sym] ?? { bg: "#888", glyph: sym[0] };
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full text-[0.65rem] font-bold text-white" style={{ background: i.bg }}>
      {i.glyph}
    </span>
  );
}

export function SwapCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [from, setFrom] = useState("LTC");
  const [to, setTo] = useState("ETH");
  const [amount, setAmount] = useState("0.1");
  const [destination, setDestination] = useState("");
  const [showDest, setShowDest] = useState(false);

  const fetchPrices = useServerFn(getPrices);
  const createFn = useServerFn(createSwapRequest);

  const pricesQ = useQuery({
    queryKey: ["prices", from, to],
    queryFn: () => fetchPrices({ data: { symbols: [from, to] } }),
    refetchInterval: 30_000,
  });

  const rate = useMemo(() => {
    const p = pricesQ.data?.prices ?? {};
    if (!p[from] || !p[to]) return null;
    return p[from] / p[to];
  }, [pricesQ.data, from, to]);

  const toAmount = useMemo(() => {
    const a = parseFloat(amount);
    if (!rate || !a || isNaN(a)) return null;
    return a * rate;
  }, [amount, rate]);

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: ({ swap }) => {
      toast.success("Swap request created");
      navigate({ to: "/swap/$id", params: { id: swap.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = () => { const f = from; setFrom(to); setTo(f); };

  const submit = () => {
    if (!user) { navigate({ to: "/login", search: { redirect: "/" } }); return; }
    const a = parseFloat(amount);
    if (!a || a <= 0) { toast.error("Enter a valid amount"); return; }
    if (!destination || destination.length < 8) { setShowDest(true); toast.error("Enter your destination address"); return; }
    create.mutate({ data: { from_currency: from as never, to_currency: to as never, from_amount: a, destination_address: destination, rate: rate ?? undefined } });
  };

  useEffect(() => { if (from === to) setTo(SYMBOLS.find((s) => s !== from) || "ETH"); }, [from, to]);

  return (
    <div className="relative w-full max-w-md rounded-3xl bg-sand p-6 text-sand-foreground shadow-2xl shadow-black/40">
      <p className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">SWAP</p>

      <div className="mt-4 rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">FROM</div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="w-32 bg-transparent font-serif text-5xl outline-none"
          />
          <CurrencyPicker value={from} onChange={setFrom} />
        </div>
        <p className="mt-1 font-mono text-xs text-sand-foreground/60">
          {pricesQ.data?.prices?.[from] ? `≈ $${(parseFloat(amount || "0") * pricesQ.data.prices[from]).toFixed(2)}` : "—"}
        </p>
      </div>

      <div className="relative my-2 flex justify-center">
        <button onClick={swap} className="rounded-full bg-background p-2 text-foreground ring-4 ring-sand">
          <ArrowDownUp className="h-3 w-3" />
        </button>
      </div>

      <div className="rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">TO</div>
        <div className="mt-2 flex items-center justify-between gap-4">
          <div className="font-serif text-5xl text-sand-foreground/80">
            {toAmount ? toAmount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "···"}
          </div>
          <CurrencyPicker value={to} onChange={setTo} />
        </div>
        <div className="mt-2 flex items-center gap-2 font-mono text-[0.65rem] text-sand-foreground/70">
          <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="tracking-[0.15em]">LIVE</span>
          <span key={rate ?? "x"} className="ticker-slide ml-1 tabular-nums">
            {rate
              ? `1 ${from} = ${rate.toFixed(6)} ${to}`
              : `1 ${from} ⇄ ${to} · syncing market…`}
          </span>
          {pricesQ.data?.prices?.[from] && (
            <span className="ml-auto tabular-nums text-sand-foreground/50">
              ${pricesQ.data.prices[from].toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>

      {showDest && (
        <div className="mt-3 rounded-2xl bg-sand/40 p-4 ring-1 ring-sand-foreground/10">
          <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">DESTINATION {to} ADDRESS</div>
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={`Your ${to} address`}
            className="mt-2 w-full bg-transparent font-mono text-sm outline-none placeholder:text-sand-foreground/40"
          />
        </div>
      )}

      <button
        onClick={() => (showDest ? submit() : setShowDest(true))}
        disabled={create.isPending}
        className="mt-4 w-full rounded-2xl bg-primary py-4 font-mono text-sm tracking-wide text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {create.isPending
          ? "Creating…"
          : pricesQ.isLoading
            ? "Loading quote…"
            : showDest
              ? "Create Swap Request"
              : "Continue"}
      </button>
    </div>
  );
}

function CurrencyPicker({ value, onChange }: { value: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full bg-background/95 px-3 py-1.5 text-foreground">
        <CoinBadge sym={value} />
        <div className="text-left leading-tight">
          <div className="text-xs font-semibold">{value}</div>
          <div className="text-[0.55rem] font-mono tracking-widest text-muted-foreground">{COINS[value]?.name.toUpperCase()}</div>
        </div>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 grid w-44 grid-cols-2 gap-1 rounded-xl bg-card p-2 text-card-foreground shadow-xl ring-1 ring-border">
          {SYMBOLS.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-foreground/10"
            >
              <CoinBadge sym={s} />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
