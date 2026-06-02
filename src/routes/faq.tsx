import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/faq")({
  component: FAQPage,
  head: () => ({
    meta: [
      { title: "FAQ — Swaplix" },
      { name: "description", content: "Answers about Swaplix escrow swaps: how custody works, fees, KYC, supported coins, dispute resolution, and exchanger roles." },
      { property: "og:title", content: "FAQ — Swaplix" },
      { property: "og:description", content: "Answers about Swaplix escrow swaps, fees, KYC, dispute resolution." },
      { property: "og:url", content: "https://swaplix.lovable.app/faq" },
    ],
    links: [{ rel: "canonical", href: "https://swaplix.lovable.app/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.a },
        })),
      }),
    }],
  }),
});

const FAQ = [
  { q: "Do you ever hold my funds?", a: "Only the deposit leg sits in a protocol-controlled escrow address for the few minutes between your deposit and the exchanger's payout. The destination is paid directly by the exchanger to the address you provided." },
  { q: "Is there a fee?", a: "Swaplix takes a 0.5% fixed protocol fee. Exchangers compete on spread, so the rate you see is the rate you get." },
  { q: "Do I need to sign up?", a: "You need an email to track your swaps and receive status updates. No KYC, no phone, no Wallet Connect." },
  { q: "Which coins are supported?", a: "BTC, LTC, ETH, XMR, SOL, DOGE, BCH, USDT for swaps. Fiat payouts (INR, EUR, USD) and item-for-crypto trades route through verified exchangers." },
  { q: "What happens if my deposit doesn't arrive in time?", a: "The swap auto-expires and you simply don't lose anything — funds never left your wallet. Cron sweeps every minute." },
  { q: "What happens in a dispute?", a: "An admin freezes the trade. Neither side can modify the row until the arbitration outcome is recorded (refund, release, or sweep on confirmed fraud)." },
  { q: "How do I become an exchanger?", a: "Open an account, then ask an admin for the exchanger role. You'll see open orders in the order book and can claim and fulfill them." },
];

function FAQPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 md:px-10">
        <p className="text-eyebrow">FAQ</p>
        <h1 className="mt-2 text-5xl">Frequently asked questions.</h1>
        <div className="mt-12 divide-y divide-border/40">
          {FAQ.map((it) => (
            <details key={it.q} className="group py-5">
              <summary className="cursor-pointer list-none text-lg font-medium hover:text-primary">
                <span className="mr-2 text-primary/70">+</span>{it.q}
              </summary>
              <p className="mt-3 text-foreground/75">{it.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/5 p-6">
          <p className="font-serif text-2xl">Still have questions?</p>
          <p className="mt-2 text-sm text-muted-foreground">Email <a className="text-primary hover:underline" href="mailto:hello@swaplix.app">hello@swaplix.app</a> or <Link to="/" className="text-primary hover:underline">start a small swap</Link> to see how it works.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
