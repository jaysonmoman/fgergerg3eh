import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { getPrices, COINS } from "@/lib/prices.functions";
import { TrendingUp, RefreshCw } from "lucide-react";

interface LivePriceComparisonProps {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: string;
}

const COMPETITORS = [
  { name: "MetaMask Swaps", fee: 0.0175, slug: "metamask" },
  { name: "ShapeShift", fee: 0.015, slug: "shapeshift" },
  { name: "Changelly", fee: 0.025, slug: "changelly" },
  { name: "SimpleSwap", fee: 0.02, slug: "simpleswap" },
];

const SWAPLIX_FEE = 0.005; // 0.5%

export function LivePriceComparison({ fromCurrency, toCurrency, fromAmount }: LivePriceComparisonProps) {
  const fetchPrices = useServerFn(getPrices);
  const amount = parseFloat(fromAmount) || 0;

  const allSymbols = Object.keys(COINS);
  const pricesQ = useQuery({
    queryKey: ["all-prices"],
    queryFn: () => fetchPrices({ data: { symbols: allSymbols } }),
    refetchInterval: 12_000,
    staleTime: 10_000,
  });

  const calculation = useMemo(() => {
    const prices = pricesQ.data?.prices ?? {};
    const fromPrice = prices[fromCurrency];
    const toPrice = prices[toCurrency];

    if (!fromPrice || !toPrice || !amount) {
      return null;
    }

    const fromValueUSD = amount * fromPrice;
    const rate = fromPrice / toPrice;
    
    // Swaplix output (after 0.5% fee)
    const swaplixOutput = amount * rate * (1 - SWAPLIX_FEE);
    const swaplixOutputUSD = swaplixOutput * toPrice;

    // Competitor outputs
    const competitorResults = COMPETITORS.map(comp => {
      const output = amount * rate * (1 - comp.fee);
      const outputUSD = output * toPrice;
      const diff = swaplixOutputUSD - outputUSD;
      const diffPct = ((swaplixOutput - output) / output) * 100;
      return {
        ...comp,
        output,
        outputUSD,
        diff,
        diffPct,
      };
    });

    // Calculate average savings
    const avgSavings = competitorResults.reduce((acc, c) => acc + c.diff, 0) / competitorResults.length;

    return {
      fromValueUSD,
      swaplixOutput,
      swaplixOutputUSD,
      competitors: competitorResults,
      avgSavings,
      rate,
    };
  }, [pricesQ.data, fromCurrency, toCurrency, amount]);

  if (!calculation || amount <= 0) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <div className="text-center text-muted-foreground">
          Enter an amount above to see live savings comparison
        </div>
      </div>
    );
  }

  const maxOutput = Math.max(calculation.swaplixOutput, ...calculation.competitors.map(c => c.output));

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-eyebrow">Live comparison</p>
          <h3 className="mt-1 text-2xl">
            You save{" "}
            <span className="font-serif italic text-primary">
              ${calculation.avgSavings.toFixed(2)}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={`h-3 w-3 ${pricesQ.isFetching ? "animate-spin" : ""}`} />
          <span>Live · 12s refresh</span>
        </div>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        Swapping {amount} {fromCurrency} (≈${calculation.fromValueUSD.toFixed(2)}) to {toCurrency}
      </p>

      {/* Swaplix result - highlighted */}
      <div className="mt-6 rounded-xl bg-primary/10 p-4 ring-1 ring-primary/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <div className="font-medium text-primary">Swaplix</div>
              <div className="text-xs text-muted-foreground">0.5% fixed fee</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg text-primary">
              {calculation.swaplixOutput.toFixed(6)} {toCurrency}
            </div>
            <div className="text-xs text-muted-foreground">
              ≈${calculation.swaplixOutputUSD.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-primary/20">
          <div className="h-full bg-primary" style={{ width: "100%" }} />
        </div>
      </div>

      {/* Competitor results */}
      <div className="mt-4 space-y-3">
        {calculation.competitors.map((comp) => {
          const barWidth = (comp.output / maxOutput) * 100;
          return (
            <div key={comp.slug} className="rounded-xl bg-foreground/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                    {comp.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-foreground/80">{comp.name}</div>
                    <div className="text-xs text-muted-foreground">{(comp.fee * 100).toFixed(1)}% fee</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-foreground/70">
                    {comp.output.toFixed(6)} {toCurrency}
                  </div>
                  <div className="text-xs text-destructive">
                    -{comp.diffPct.toFixed(2)}% (−${comp.diff.toFixed(2)})
                  </div>
                </div>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full bg-foreground/30 transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-success/10 p-4 text-center">
        <p className="text-sm text-success">
          With <span className="font-mono">{amount} {fromCurrency}</span>, you get{" "}
          <span className="font-semibold">
            {(calculation.swaplixOutput - calculation.competitors[0].output).toFixed(6)} more {toCurrency}
          </span>{" "}
          than MetaMask
        </p>
      </div>
    </div>
  );
}
