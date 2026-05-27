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
  const [payoutKind, setPayoutKind] = useState<"crypto" | "fiat" | "item">("crypto");
  const [fiatCode, setFiatCode] = useState("INR");
  const [itemLabel, setItemLabel] = useState("");
  const [manualToAmount, setManualToAmount] = useState("");
  const [subject, setSubject] = useState("");

  const fetchPrices = useServerFn(getPrices);
  const createFn = useServerFn(createSwapRequest);

  const pricesQ = useQuery({
    queryKey: ["prices", from, to],
    queryFn: () => fetchPrices({ data: { symbols: [from, to] } }),
    refetchInterval: 30_000,
    enabled: payoutKind === "crypto",
  });

  const rate = useMemo(() => {
    if (payoutKind !== "crypto") return null;
    const p = pricesQ.data?.prices ?? {};
    if (!p[from] || !p[to]) return null;
    return p[from] / p[to];
  }, [pricesQ.data, from, to, payoutKind]);

  const toAmount = useMemo(() => {
    const a = parseFloat(amount);
    if (payoutKind !== "crypto") return parseFloat(manualToAmount) || null;
    if (!rate || !a || isNaN(a)) return null;
    return a * rate;
  }, [amount, rate, payoutKind, manualToAmount]);

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: ({ swap }) => {
      toast.success("Swap request created");
      navigate({ to: "/swap/$id", params: { id: swap.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = () => { const f = from; setFrom(to); setTo(f); };

  const effectiveTo = payoutKind === "fiat" ? fiatCode.toUpperCase() : payoutKind === "item" ? "ITEM" : to;

  const submit = () => {
    if (!user) { navigate({ to: "/login", search: { redirect: "/" } }); return; }
    const a = parseFloat(amount);
    if (!a || a <= 0) { toast.error("Enter a valid amount"); return; }
    if (!destination || destination.length < 1) { setShowDest(true); toast.error(payoutKind === "crypto" ? "Enter your destination address" : payoutKind === "fiat" ? "Enter your payout details (UPI / bank)" : "Describe the item / delivery details"); return; }
    if (payoutKind === "item" && !itemLabel.trim()) { toast.error("Name the item you want"); return; }
    if (payoutKind !== "crypto" && !manualToAmount) { toast.error(payoutKind === "fiat" ? "Enter the fiat amount you expect" : "Enter the agreed value"); return; }

    const finalSubject = subject.trim() || (payoutKind === "item" ? `Item: ${itemLabel}` : payoutKind === "fiat" ? `${fiatCode.toUpperCase()} ${manualToAmount} via payout details` : undefined);

    create.mutate({ data: {
      from_currency: from as never,
      to_currency: effectiveTo,
      from_amount: a,
      destination_address: destination,
      rate: rate ?? undefined,
      payout_kind: payoutKind,
      subject: finalSubject,
      payout_details: payoutKind === "item" ? { item: itemLabel, instructions: destination } : payoutKind === "fiat" ? { fiat_code: fiatCode.toUpperCase(), payout_handle: destination, expected_amount: manualToAmount } : undefined,
    } });
  };

  useEffect(() => { if (payoutKind === "crypto" && from === to) setTo(SYMBOLS.find((s) => s !== from) || "ETH"); }, [from, to, payoutKind]);

  return (
    <div className="relative w-full max-w-md rounded-3xl bg-sand p-6 text-sand-foreground shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">SWAP</p>
        <div className="flex gap-1 rounded-full bg-sand/40 p-1 text-[0.6rem] font-mono tracking-wider ring-1 ring-sand-foreground/10">
          {(["crypto", "fiat", "item"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setPayoutKind(k)}
              className={`rounded-full px-3 py-1 transition ${payoutKind === k ? "bg-background text-foreground" : "text-sand-foreground/60 hover:text-sand-foreground"}`}
            >
              {k === "crypto" ? "CRYPTO" : k === "fiat" ? "INR / FIAT" : "ITEM"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">YOU SEND</div>
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
        <button onClick={swap} disabled={payoutKind !== "crypto"} className="rounded-full bg-background p-2 text-foreground ring-4 ring-sand disabled:opacity-40">
          <ArrowDownUp className="h-3 w-3" />
        </button>
      </div>

      <div className="rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
        <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">
          YOU RECEIVE {payoutKind === "fiat" ? "(FIAT)" : payoutKind === "item" ? "(ITEM)" : ""}
        </div>
        <div className="mt-2 flex items-center justify-between gap-4">
          {payoutKind === "crypto" ? (
            <>
              <div className="font-serif text-5xl text-sand-foreground/80">
                {toAmount ? toAmount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "···"}
              </div>
              <CurrencyPicker value={to} onChange={setTo} />
            </>
          ) : payoutKind === "fiat" ? (
            <>
              <input
                value={manualToAmount}
                onChange={(e) => setManualToAmount(e.target.value)}
                inputMode="decimal"
                placeholder="0"
                className="w-32 bg-transparent font-serif text-5xl outline-none placeholder:text-sand-foreground/30"
              />
              <input
                value={fiatCode}
                onChange={(e) => setFiatCode(e.target.value.slice(0, 4))}
                className="w-20 rounded-full bg-background px-3 py-1.5 text-center text-xs font-semibold uppercase text-foreground outline-none"
              />
            </>
          ) : (
            <input
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder="iPhone 15 Pro 256GB"
              className="w-full bg-transparent font-serif text-2xl outline-none placeholder:text-sand-foreground/30"
            />
          )}
        </div>
        {payoutKind === "crypto" && (
          <div className="mt-2 flex items-center gap-2 font-mono text-[0.65rem] text-sand-foreground/70">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="tracking-[0.15em]">LIVE</span>
            <span key={rate ?? "x"} className="ticker-slide ml-1 tabular-nums">
              {rate ? `1 ${from} = ${rate.toFixed(6)} ${to}` : `1 ${from} ⇄ ${to} · syncing market…`}
            </span>
          </div>
        )}
        {payoutKind === "item" && (
          <input
            value={manualToAmount}
            onChange={(e) => setManualToAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Agreed value in USD (e.g. 1200)"
            className="mt-3 w-full rounded-lg bg-background/60 px-3 py-2 text-xs font-mono outline-none placeholder:text-sand-foreground/40"
          />
        )}
      </div>

      {showDest && (
        <>
          <div className="mt-3 rounded-2xl bg-sand/40 p-4 ring-1 ring-sand-foreground/10">
            <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">
              {payoutKind === "crypto"
                ? `DESTINATION ${to} ADDRESS`
                : payoutKind === "fiat"
                  ? "PAYOUT HANDLE (UPI / IBAN / BANK)"
                  : "DELIVERY DETAILS (ADDRESS / NOTES)"}
            </div>
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder={payoutKind === "crypto" ? `Your ${to} address` : payoutKind === "fiat" ? "name@upi · IBAN · account number" : "Where & how the exchanger ships / hands over the item"}
              className="mt-2 w-full bg-transparent font-mono text-sm outline-none placeholder:text-sand-foreground/40"
            />
          </div>
          <div className="mt-3 rounded-2xl bg-sand/40 p-4 ring-1 ring-sand-foreground/10">
            <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">SUBJECT (visible to exchanger)</div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={280}
              placeholder={payoutKind === "item" ? "e.g. iPhone 15 Pro, sealed, ship to Mumbai" : payoutKind === "fiat" ? "e.g. INR 40,000 via UPI" : "Optional note"}
              className="mt-2 w-full bg-transparent font-mono text-sm outline-none placeholder:text-sand-foreground/40"
            />
            <p className="mt-1 text-[0.6rem] text-sand-foreground/50">You can edit this after the swap is created.</p>
          </div>
        </>
      )}

      <button
        onClick={() => (showDest ? submit() : setShowDest(true))}
        disabled={create.isPending}
        className="mt-4 w-full rounded-2xl bg-primary py-4 font-mono text-sm tracking-wide text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {create.isPending ? "Creating…" : showDest ? "Create Swap Request" : "Continue"}
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
