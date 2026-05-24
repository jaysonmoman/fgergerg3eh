import { ArrowDownUp, ChevronDown, Copy, Check, Clock, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
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

type SwapState = "input" | "review" | "pending_deposit";

interface SwapCardProps {
  onCurrencyChange?: (from: string, to: string) => void;
  onAmountChange?: (amount: string) => void;
}

export function SwapCard({ onCurrencyChange, onAmountChange }: SwapCardProps = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [from, setFrom] = useState("LTC");
  const [to, setTo] = useState("ETH");
  const [amount, setAmount] = useState("0.1");
  const [destination, setDestination] = useState("");
  const [showDest, setShowDest] = useState(false);
  const [swapState, setSwapState] = useState<SwapState>("input");
  const [depositAddress, setDepositAddress] = useState("");
  const [timeLeft, setTimeLeft] = useState(900);
  const [copied, setCopied] = useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);

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

  // Notify parent of currency/amount changes
  useEffect(() => {
    onCurrencyChange?.(from, to);
  }, [from, to, onCurrencyChange]);

  useEffect(() => {
    onAmountChange?.(amount);
  }, [amount, onAmountChange]);

  // Simulate quote loading when amount changes
  useEffect(() => {
    if (swapState === "input" && amount && parseFloat(amount) > 0) {
      setIsLoadingQuote(true);
      const timer = setTimeout(() => setIsLoadingQuote(false), 800);
      return () => clearTimeout(timer);
    }
  }, [amount, from, to, swapState]);

  // Countdown timer for pending deposit
  useEffect(() => {
    if (swapState !== "pending_deposit") return;
    if (timeLeft <= 0) {
      toast.error("Deposit window expired");
      setSwapState("input");
      setTimeLeft(900);
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [swapState, timeLeft]);

  const create = useMutation({
    mutationFn: createFn,
    onSuccess: ({ swap }) => {
      toast.success("Escrow request created");
      setDepositAddress(swap.deposit_address || `${from.toLowerCase()}1q...demo${swap.short_id}`);
      setSwapState("pending_deposit");
      setTimeLeft(900);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = () => { const f = from; setFrom(to); setTo(f); };

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    toast.success("Address copied");
    setTimeout(() => setCopied(false), 2000);
  }, [depositAddress]);

  const handleReview = () => {
    if (!user) { navigate({ to: "/login", search: { redirect: "/" } }); return; }
    const a = parseFloat(amount);
    if (!a || a <= 0) { toast.error("Enter a valid amount"); return; }
    if (!destination || destination.length < 8) { setShowDest(true); toast.error("Enter your destination address"); return; }
    setSwapState("review");
  };

  const handleCreateEscrow = () => {
    const a = parseFloat(amount);
    create.mutate({ data: { from_currency: from as never, to_currency: to as never, from_amount: a, destination_address: destination, rate: rate ?? undefined } });
  };

  const handleBack = () => {
    if (swapState === "review") setSwapState("input");
    else if (swapState === "pending_deposit") {
      setSwapState("input");
      setTimeLeft(900);
    }
  };

  useEffect(() => { if (from === to) setTo(SYMBOLS.find((s) => s !== from) || "ETH"); }, [from, to]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Pending Deposit State
  if (swapState === "pending_deposit") {
    return (
      <div className="relative w-full max-w-md rounded-3xl bg-sand p-6 text-sand-foreground shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <p className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">PENDING DEPOSIT</p>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-amber-600">
            <Clock className="h-3 w-3" />
            <span className="font-mono text-sm font-medium">{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-sand-foreground/10">
          <div
            className="h-full bg-amber-500 transition-all duration-1000"
            style={{ width: `${(timeLeft / 900) * 100}%` }}
          />
        </div>

        <div className="mt-6 rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
          <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">SEND EXACTLY</div>
          <div className="mt-2 flex items-center gap-3">
            <CoinBadge sym={from} />
            <span className="font-serif text-3xl">{amount} {from}</span>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-sand/40 p-5 ring-1 ring-sand-foreground/10">
          <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">TO THIS ADDRESS</div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 break-all rounded-xl bg-background/80 px-3 py-2.5 font-mono text-xs text-foreground">
              {depositAddress}
            </code>
            <button
              onClick={copyAddress}
              className="rounded-xl bg-background/80 p-2.5 text-foreground transition-colors hover:bg-background"
            >
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-success/10 p-4 ring-1 ring-success/20">
          <div className="text-[0.65rem] font-mono tracking-[0.2em] text-success">YOU WILL RECEIVE</div>
          <div className="mt-2 flex items-center gap-3">
            <CoinBadge sym={to} />
            <span className="font-serif text-2xl text-success">{toAmount?.toFixed(6)} {to}</span>
          </div>
          <p className="mt-2 font-mono text-xs text-sand-foreground/60">
            To: {destination.slice(0, 12)}...{destination.slice(-8)}
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-sand-foreground/60">
          Once your deposit is confirmed, the swap will proceed automatically.
        </p>

        <button
          onClick={handleBack}
          className="mt-4 w-full rounded-2xl border border-sand-foreground/20 py-3 font-mono text-sm tracking-wide text-sand-foreground/70 transition-colors hover:bg-sand-foreground/5"
        >
          Cancel & Start Over
        </button>
      </div>
    );
  }

  // Review State
  if (swapState === "review") {
    return (
      <div className="relative w-full max-w-md rounded-3xl bg-sand p-6 text-sand-foreground shadow-2xl shadow-black/40">
        <p className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">REVIEW SWAP</p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-sand/40 p-4 ring-1 ring-sand-foreground/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.65rem] font-mono tracking-[0.2em] text-sand-foreground/60">YOU SEND</div>
                <div className="mt-1 flex items-center gap-2">
                  <CoinBadge sym={from} />
                  <span className="font-serif text-2xl">{amount} {from}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm text-sand-foreground/60">
                  ≈ ${(parseFloat(amount || "0") * (pricesQ.data?.prices?.[from] || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDownUp className="h-4 w-4 text-sand-foreground/40" />
          </div>

          <div className="rounded-2xl bg-success/10 p-4 ring-1 ring-success/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[0.65rem] font-mono tracking-[0.2em] text-success">YOU RECEIVE</div>
                <div className="mt-1 flex items-center gap-2">
                  <CoinBadge sym={to} />
                  <span className="font-serif text-2xl text-success">{toAmount?.toFixed(6)} {to}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm text-sand-foreground/60">
                  ≈ ${((toAmount || 0) * (pricesQ.data?.prices?.[to] || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-sand/40 p-4 ring-1 ring-sand-foreground/10">
          <div className="flex justify-between text-sm">
            <span className="text-sand-foreground/60">Rate</span>
            <span className="font-mono">1 {from} = {rate?.toFixed(6)} {to}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sand-foreground/60">Fee</span>
            <span className="font-mono text-success">0.5% (fixed)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-sand-foreground/60">Destination</span>
            <span className="font-mono text-xs">{destination.slice(0, 8)}...{destination.slice(-6)}</span>
          </div>
        </div>

        <button
          onClick={handleCreateEscrow}
          disabled={create.isPending}
          className="mt-4 w-full rounded-2xl bg-primary py-4 font-mono text-sm tracking-wide text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {create.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Escrow...
            </span>
          ) : (
            "Create Escrow Request"
          )}
        </button>

        <button
          onClick={handleBack}
          className="mt-2 w-full rounded-2xl border border-sand-foreground/20 py-3 font-mono text-sm tracking-wide text-sand-foreground/70 transition-colors hover:bg-sand-foreground/5"
        >
          Back
        </button>
      </div>
    );
  }

  // Input State (Default)
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
            {isLoadingQuote ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-sand-foreground/40" />
              </span>
            ) : toAmount ? (
              toAmount.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
            ) : (
              "···"
            )}
          </div>
          <CurrencyPicker value={to} onChange={setTo} />
        </div>
        <p className="mt-1 font-mono text-xs text-sand-foreground/60">
          {rate ? `1 ${from} = ${rate.toFixed(6)} ${to}` : "Loading rate…"}
        </p>
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
        onClick={() => (showDest ? handleReview() : setShowDest(true))}
        disabled={create.isPending || isLoadingQuote}
        className="mt-4 w-full rounded-2xl bg-primary py-4 font-mono text-sm tracking-wide text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
      >
        {isLoadingQuote
          ? "Loading quote…"
          : pricesQ.isLoading
            ? "Loading prices…"
            : showDest
              ? "Review Swap"
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
