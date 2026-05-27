import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// On-chain monitoring bot. Polled by pg_cron every minute.
// For each pending_deposit swap with a real (non-DEMO) deposit_address,
// query Blockchair for recent activity on that address and, if a matching
// incoming transaction is found, flip the swap to "escrowed".

const CHAIN: Record<string, { slug: string; decimals: number } | undefined> = {
  BTC: { slug: "bitcoin", decimals: 8 },
  LTC: { slug: "litecoin", decimals: 8 },
  DOGE: { slug: "dogecoin", decimals: 8 },
  BCH: { slug: "bitcoin-cash", decimals: 8 },
  ETH: { slug: "ethereum", decimals: 18 },
};

type AddrTx = { hash?: string; transaction_hash?: string; time?: string; balance_change?: number; value?: string };

async function checkAddress(chainSlug: string, address: string): Promise<AddrTx[]> {
  try {
    const r = await fetch(
      `https://api.blockchair.com/${chainSlug}/dashboards/address/${encodeURIComponent(address)}?limit=20`,
    );
    if (!r.ok) return [];
    const j = (await r.json()) as { data?: Record<string, { transactions?: unknown }> };
    const entry = j.data?.[address] ?? j.data?.[address.toLowerCase()];
    const txs = (entry?.transactions ?? []) as unknown[];
    // BTC-likes: array of objects with hash + balance_change (satoshis received, positive)
    // ETH: array of objects with transaction_hash + value (wei)
    return txs.map((t) => (typeof t === "string" ? { hash: t } : (t as AddrTx)));
  } catch (e) {
    console.error("blockchair address fetch failed", e);
    return [];
  }
}

export const Route = createFileRoute("/api/public/hooks/monitor-deposits")({
  server: {
    handlers: {
      POST: async () => {
        const { data: pending, error } = await supabaseAdmin
          .from("swap_requests")
          .select("id, from_currency, from_amount, deposit_address, created_at")
          .eq("status", "pending_deposit")
          .gt("expires_at", new Date().toISOString())
          .limit(50);
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        }

        let escrowed = 0;
        const updates: { id: string; txid: string }[] = [];

        for (const swap of pending ?? []) {
          const addr = swap.deposit_address;
          if (!addr || addr.startsWith("DEMO_")) continue;
          const chain = CHAIN[swap.from_currency];
          if (!chain) continue;

          const txs = await checkAddress(chain.slug, addr);
          if (txs.length === 0) continue;

          const expected = Number(swap.from_amount);
          const expectedSmallest = Math.round(expected * 10 ** chain.decimals);
          const createdTs = new Date(swap.created_at).getTime();
          const tolerance = Math.max(1, Math.floor(expectedSmallest * 0.001)); // 0.1% slippage

          let match: AddrTx | undefined;
          for (const t of txs) {
            const ts = t.time ? new Date(t.time + "Z").getTime() : 0;
            if (ts && ts < createdTs - 60_000) continue; // ignore old txs
            const change =
              typeof t.balance_change === "number"
                ? t.balance_change
                : t.value
                  ? Number(t.value)
                  : 0;
            if (change > 0 && Math.abs(change - expectedSmallest) <= tolerance) {
              match = t;
              break;
            }
          }
          if (!match) continue;

          const txid = match.hash ?? match.transaction_hash;
          if (!txid) continue;

          const { error: upErr } = await supabaseAdmin
            .from("swap_requests")
            .update({ status: "escrowed", deposit_txid: txid })
            .eq("id", swap.id)
            .eq("status", "pending_deposit");
          if (!upErr) {
            escrowed++;
            updates.push({ id: swap.id, txid });
          }
        }

        return Response.json({ ok: true, scanned: pending?.length ?? 0, escrowed, updates });
      },
    },
  },
});
