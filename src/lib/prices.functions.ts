import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// CoinGecko symbol → id mapping for what we expose
export const COINS: Record<string, { id: string; name: string }> = {
  BTC: { id: "bitcoin", name: "Bitcoin" },
  ETH: { id: "ethereum", name: "Ethereum" },
  LTC: { id: "litecoin", name: "Litecoin" },
  XMR: { id: "monero", name: "Monero" },
  SOL: { id: "solana", name: "Solana" },
  DOGE: { id: "dogecoin", name: "Dogecoin" },
  BCH: { id: "bitcoin-cash", name: "Bitcoin Cash" },
  USDT: { id: "tether", name: "Tether" },
};

export const getPrices = createServerFn({ method: "GET" })
  .inputValidator((input: { symbols: string[] }) =>
    z.object({ symbols: z.array(z.string().min(1).max(10)).max(20) }).parse(input),
  )
  .handler(async ({ data }) => {
    const ids = data.symbols
      .map((s) => COINS[s.toUpperCase()]?.id)
      .filter(Boolean)
      .join(",");
    if (!ids) return { prices: {} as Record<string, number> };

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      { headers: { accept: "application/json" } },
    );
    if (!res.ok) {
      return { prices: {} as Record<string, number>, error: `CoinGecko ${res.status}` };
    }
    const json = (await res.json()) as Record<string, { usd: number }>;
    const prices: Record<string, number> = {};
    for (const [sym, def] of Object.entries(COINS)) {
      if (data.symbols.includes(sym) && json[def.id]?.usd) prices[sym] = json[def.id].usd;
    }
    return { prices };
  });
