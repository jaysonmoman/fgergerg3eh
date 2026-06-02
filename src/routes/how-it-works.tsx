import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/how-it-works")({
  component: HowPage,
  head: () => ({
    meta: [
      { title: "How Swaplix works — escrow swaps explained" },
      { name: "description", content: "Step-by-step: how Swaplix routes a swap through escrow, monitors the chain, and pays out — without taking custody." },
      { property: "og:title", content: "How Swaplix works" },
      { property: "og:description", content: "Step-by-step: deposit → escrow → exchanger payout → release." },
      { property: "og:url", content: "https://swaplix.lovable.app/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://swaplix.lovable.app/how-it-works" }],
  }),
});

const STEPS = [
  { n: "01", t: "Create the swap", d: "Pick from-coin, to-coin (or fiat / item), amount, and the destination address. We lock the rate, generate a unique escrow address, and start a 1-hour countdown." },
  { n: "02", t: "Deposit", d: "Scan the QR or copy the deposit address. Send the exact amount. Our bot polls Blockchair and similar explorers every minute to detect your transaction automatically." },
  { n: "03", t: "Escrowed", d: "Once your tx confirms, the swap flips to Escrowed and appears on the exchanger order book. You don't have to do anything." },
  { n: "04", t: "Exchanger claims", d: "An exchanger commits to fulfill the order, posts a payout address for their leg, and sends the destination currency to you." },
  { n: "05", t: "Verified payout", d: "Swaplix verifies the payout txid on-chain. With auto-payouts ON, the escrow releases to the exchanger automatically. Otherwise an admin reviews and releases." },
  { n: "06", t: "Done", d: "Status flips to Completed. Both sides have on-chain proof. Disputes go to admin arbitration — refund, release, or sweep." },
];

function HowPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 pt-32 pb-20 md:px-10">
        <p className="text-eyebrow">How it works</p>
        <h1 className="mt-2 text-5xl">Six steps. Zero custody risk.</h1>
        <p className="mt-4 max-w-xl text-foreground/75">Every swap goes through the same protocol. No wallet approvals, no support tickets, no surprises.</p>

        <ol className="mt-12 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="grid gap-4 rounded-2xl border border-border/60 bg-card p-6 md:grid-cols-[80px_1fr]">
              <div className="text-eyebrow text-primary">{s.n}</div>
              <div>
                <div className="text-xl font-medium">{s.t}</div>
                <p className="mt-2 text-foreground/75">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link to="/" hash="swap" className="inline-block rounded-full bg-primary px-6 py-3 text-sm text-primary-foreground hover:scale-[1.02] transition-transform">Start your first swap →</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
