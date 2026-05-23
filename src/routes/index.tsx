import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Starfield } from "@/components/Starfield";
import { SwapCard } from "@/components/SwapCard";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Swaplix — Swap Onchain without WalletConnect" },
      {
        name: "description",
        content:
          "Access 50+ blockchains via THORChain, Chainflip, and Atomic Swaps. No custody, no KYC, no Wallet Connect.",
      },
      { property: "og:title", content: "Swaplix — Swap Onchain without WalletConnect" },
      {
        property: "og:description",
        content: "Non-custodial, verifiable swaps across 50+ chains.",
      },
    ],
  }),
  component: IndexPage,
});

const stats = [
  { value: "50+", label: "Blockchains", italic: true },
  { value: "0", label: "Custody", italic: false },
  { value: "4", label: "Protocols", italic: true },
  { value: "XMR", label: "Atomic swaps", italic: true },
  { value: "0.5%", label: "Fixed fee", italic: true },
  { value: "NO", label: "Wallet Connect", italic: true },
];

const protocols = [
  { name: "THORCHAIN", color: "#33FF99" },
  { name: "CHAINFLIP", color: "#FF5C8A" },
  { name: "NEAR-INTENTS", color: "#FFFFFF" },
  { name: "ATOMIC-SWAPS", color: "#E89D6B" },
];

const competitors = [
  { rank: "01", name: "Swaplix", amount: "4.2310", diff: "best", pct: 100, highlight: true },
  { rank: "02", name: "StealthEX", amount: "4.2056", diff: "-0.6%", pct: 78 },
  { rank: "03", name: "Instant Swaps", amount: "4.1802", diff: "-1.2%", pct: 62 },
  { rank: "04", name: "MetaMask Swaps", amount: "4.1675", diff: "-1.5%", pct: 56 },
  { rank: "05", name: "ShapeShift", amount: "4.1633", diff: "-1.6%", pct: 52 },
  { rank: "06", name: "WizardSwap", amount: "4.1548", diff: "-1.8%", pct: 48 },
];

const trustRows = [
  {
    n: "01",
    cat: "DEXES",
    claim: "“Connect your wallet — our frontend is safe.”",
    risk: "Frontend gets injected with a drainer; users sign malicious approvals and",
    highlight: "lose their wallet in one click.",
  },
  {
    n: "02",
    cat: "INSTANT EXCHANGES",
    claim: "“Send funds to our address — we'll process the swap.”",
    risk: "Funds custodied during the swap.",
    highlight: "Frozen indefinitely under “compliance review.”",
  },
  {
    n: "03",
    cat: "NO-KYC INSTANT SWAPS",
    claim: "“Trust us — we don't do KYC.”",
    risk: "Thin liquidity, surprise mid-swap KYC, or a",
    highlight: "silent exit when the operator goes dark.",
  },
  {
    n: "04",
    cat: "SWAPLIX",
    claim: "“Don't trust us — verify the swap yourself.”",
    risk: "The swap fails to settle and",
    highlight: "the protocol refunds you automatically.",
    self: true,
  },
];

const steps = [
  {
    n: "01",
    title: "Create your swap",
    body: "— Select tokens, enter amount, provide destination.",
    tag: "Quotes fetched from all four protocols simultaneously — best rate wins automatically.",
  },
  {
    n: "02",
    title: "Client-side verification",
    body: "— Every swap is verified by your browser against the protocol before you send a single cent.",
    tag: "No middleman. No hidden spreads.",
  },
  {
    n: "03",
    title: "Deposit your coin",
    body: "— Once your browser confirms the address is 100% non-custodial, you deposit.",
    tag: "Nothing leaves your wallet until the address verifies.",
  },
  {
    n: "04",
    title: "Receive",
    body: "— Your coin is sent to your wallet automatically. If it fails, the protocol auto-refunds you.",
    tag: "No support ticket. No “please describe your issue.”",
  },
];

const matrix = [
  { q: "Custody during swap", mira: "You", dex: "You", instant: "Provider", cex: "Exchange" },
  { q: "Requirement", mira: "None", dex: "Wallet connect", instant: "None", cex: "Account" },
  { q: "KYC required", mira: "No", dex: "No", instant: "No", cex: "Often" },
  { q: "Worst-case outcome", mira: "Refund", dex: "Total loss", instant: "Frozen", cex: "Frozen" },
  { q: "Audit surface", mira: "Protocol", dex: "Pool code", instant: "Provider", cex: "Company" },
];

const principles = [
  {
    n: "01",
    title: ["Zero custody. ", "Not even", " for a second."],
    body: "Coins route directly from your wallet to the protocol's onchain vault. We never receive, hold, or touch them. Nothing to freeze. Nothing to seize.",
    tag: "There's no Swaplix wallet. Check the chain.",
  },
  {
    n: "02",
    title: ["No Wallet Connect. ", "No", " approvals."],
    body: "Send from a hardware wallet, a paper wallet, a phone, a CLI, or an air-gapped machine you boot once a year. No browser extension. No token approvals.",
    tag: "Your keys never leave your setup.",
  },
  {
    n: "03",
    title: ["No account. No email. ", "No", " footprint."],
    body: "No signup. No email. No phone. No “verify your identity to continue.” Open the site, swap, close the tab.",
    tag: "You were never a user. You were just a visitor.",
  },
  {
    n: "04",
    title: ["CEX rates. ", "Without", " the CEX."],
    body: "Every swap pulls live quotes from THORChain, Chainflip, and Atomic Swaps in parallel. The winner routes automatically.",
    tag: "",
  },
  {
    n: "05",
    title: ["The only browser-based ", "BTC↔XMR", " atomic swap."],
    body: "Bitcoin in, Monero out. Cryptographically enforced — no third party, no bridge risk. Built for the browser.",
    tag: "Privacy's two pillars. Swapped trustlessly.",
  },
  {
    n: "06",
    title: ["If something breaks, ", "you get", " your coins back."],
    body: "Every protocol we route through has a refund path — automatic, onchain, no support ticket required.",
    tag: "Four protocols. Four refund guarantees. Zero \"please contact support.\"",
    wide: true,
  },
];

const coins = [
  "₿", "Ξ", "M", "S", "A", "Ł", "N", "•", "▲", "◆", "₳", "⬡", "Ð", "B", "T",
];

function IndexPage() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Hero />
      <Stats />
      <PoweredBy />
      <Comparison />
      <TrustSection />
      <StepsSection />
      <MatrixSection />
      <PrinciplesSection />
      <CTASection />
      <CoinMarquee />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pb-24">
      <img
        src={heroBg}
        alt=""
        width={1920}
        height={1080}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/40 to-background" />
      <Starfield />
      <SiteHeader />

      <div className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 pt-40 md:grid-cols-2 md:items-center md:px-10 md:pt-48">
        <div>
          <h1 className="text-5xl leading-[1.05] md:text-6xl lg:text-7xl">
            Swap{" "}
            <em className="bg-gradient-to-r from-[#c084fc] to-[#a78bfa] bg-clip-text text-transparent">
              Onchain
            </em>{" "}
            without{" "}
            <em className="bg-gradient-to-r from-[#f0abfc] to-[#c084fc] bg-clip-text text-transparent">
              WalletConnect
            </em>
            .
          </h1>
          <p className="mt-8 max-w-md text-lg text-foreground/75">
            Access 50+ blockchains via THORChain, Chainflip, and Atomic Swaps, all without custody, KYC, or Wallet Connect.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Open app
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-6 py-3 text-sm font-medium text-foreground hover:bg-foreground/5"
            >
              Open Source
            </a>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <SwapCard />
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="relative border-y border-border/40 bg-background/60 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-6 py-10 ${i !== 0 ? "md:border-l border-border/40" : ""} ${
              i % 2 !== 0 ? "border-l md:border-l" : ""
            } ${i >= 2 ? "border-t md:border-t-0" : ""}`}
          >
            <div
              className={`text-4xl text-primary md:text-5xl ${
                s.italic ? "font-serif italic" : "font-serif"
              }`}
            >
              {s.value}
            </div>
            <div className="text-eyebrow mt-3">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PoweredBy() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-6 text-center md:px-10">
        <p className="text-eyebrow">Powered by</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
          {protocols.map((p) => (
            <div key={p.name} className="flex items-center gap-3 text-foreground/80">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full text-[0.6rem] font-bold"
                style={{ background: `${p.color}22`, color: p.color }}
              >
                {p.name[0]}
              </span>
              <span className="text-sm font-medium tracking-wide">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Comparison() {
  const [amount, setAmount] = useState("$10K");
  return (
    <section className="border-t border-border/40 py-24" id="liquidity">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 md:grid-cols-2 md:px-10">
        <div>
          <p className="text-eyebrow">02 / Live comparison</p>
          <h2 className="mt-6 text-4xl md:text-5xl">Better rates.</h2>
          <h3 className="text-3xl text-primary italic md:text-4xl">Without giving up custody.</h3>
          <p className="mt-6 max-w-md text-foreground/75">
            Swaplix routes you through all the best providers and gives you rates as good as a CEX for most pairs.
          </p>
          <p className="mt-12 text-2xl">
            You save <span className="font-serif italic text-primary text-3xl">$62</span>
          </p>
          <div className="mt-5 flex gap-2">
            {["$1K", "$10K", "$100K", "$1M"].map((a) => (
              <button
                key={a}
                onClick={() => setAmount(a)}
                className={`rounded-full px-4 py-1.5 font-mono text-xs tracking-wider transition-colors ${
                  amount === a
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground/70 hover:text-foreground"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="text-eyebrow mt-5">Quote for {amount} · BTC → ETH</p>
          <p className="text-eyebrow mt-2 text-success/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-success mr-2 align-middle" />
            Live quotes · refreshed every 12s
          </p>
        </div>

        <div className="space-y-3">
          {competitors.map((c) => (
            <div
              key={c.rank}
              className={`rounded-2xl px-5 py-4 ${
                c.highlight ? "bg-primary/10 ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-eyebrow w-6">{c.rank}</span>
                <span
                  className={`w-32 text-sm ${
                    c.highlight ? "text-primary font-medium" : "text-foreground/80"
                  }`}
                >
                  {c.name}
                </span>
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                    <div
                      className={c.highlight ? "h-full bg-primary" : "h-full bg-foreground/30"}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-num w-20 text-right text-sm">
                  {c.amount} <span className="text-muted-foreground text-xs">ETH</span>
                </span>
                <span
                  className={`text-num w-14 text-right text-xs ${
                    c.highlight ? "text-primary" : "text-destructive"
                  }`}
                >
                  {c.diff}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="border-t border-border/40 py-24" id="verify">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="max-w-3xl text-4xl leading-tight md:text-5xl">
          Every swap interface today asks you to <em>trust</em> something.
        </h2>
        <p className="mt-5 max-w-2xl text-foreground/75">
          A frontend. A custodian. A promise. Swaplix is the swap that asks you to trust nothing but the chain itself.
        </p>
        <div className="mt-14 space-y-2">
          {trustRows.map((r) => (
            <div
              key={r.n}
              className={`grid gap-6 rounded-2xl px-6 py-6 md:grid-cols-[1fr_2fr_2fr] ${
                r.self ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-foreground/[0.03]"
              }`}
            >
              <div className="text-eyebrow">
                <span className={r.self ? "text-primary" : ""}>{r.n}</span> · {r.cat}
              </div>
              <p className="font-serif italic text-foreground/90">{r.claim}</p>
              <p className="text-sm text-foreground/75">
                <span className={r.self ? "text-success font-medium" : "text-destructive font-medium"}>
                  Worse Case:
                </span>{" "}
                {r.risk}{" "}
                <span className={r.self ? "text-success" : "text-foreground font-medium"}>
                  {r.highlight}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="border-t border-border/40 py-24" id="how">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="text-4xl md:text-5xl">
          Four steps with <em className="text-primary">zero trust</em> required.
        </h2>
        <div className="mt-12 divide-y divide-border/40">
          {steps.map((s) => (
            <div key={s.n} className="grid gap-6 py-7 md:grid-cols-[60px_180px_1fr]">
              <div className="text-eyebrow text-primary">{s.n}</div>
              <div className="font-medium">{s.title}</div>
              <p className="text-foreground/80">
                {s.body} <em className="text-primary/90 not-italic font-serif italic">{s.tag}</em>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MatrixSection() {
  return (
    <section className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="text-4xl md:text-5xl">Six questions every swap should answer.</h2>
        <p className="mt-4 max-w-xl text-foreground/75">
          A side-by-side of the trade-offs you actually make when you move assets between chains.
        </p>
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="text-eyebrow border-b border-border/40">
                <th className="py-4 pr-4 font-normal">Question</th>
                <th className="py-4 px-4 font-normal text-primary">Swaplix</th>
                <th className="py-4 px-4 font-normal">DEX</th>
                <th className="py-4 px-4 font-normal">Instant</th>
                <th className="py-4 px-4 font-normal">CEX</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={row.q} className="border-b border-border/30">
                  <td className="py-5 pr-4">
                    <span className="text-eyebrow mr-3">{String(i + 1).padStart(2, "0")}</span>
                    {row.q}
                  </td>
                  <td className="py-5 px-4 font-serif italic text-primary">{row.mira}</td>
                  <td className="py-5 px-4 text-foreground/75">{row.dex}</td>
                  <td className="py-5 px-4 text-foreground/75">{row.instant}</td>
                  <td className="py-5 px-4 text-foreground/75">{row.cex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function PrinciplesSection() {
  return (
    <section className="border-t border-border/40 py-24" id="atomic">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="text-4xl md:text-5xl">
          Built on the principles of <em>crypto</em>.
        </h2>
        <p className="mt-4 text-foreground/75">Six reasons we're not another swap site.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {principles.map((p) => (
            <div
              key={p.n}
              className={`rounded-2xl border border-border/60 bg-card/60 p-7 ${
                p.wide ? "lg:col-span-3 bg-primary/5 border-primary/30" : ""
              }`}
            >
              <div className="text-eyebrow text-primary/80">{p.n}</div>
              <h3 className="mt-3 text-2xl">
                {p.title[0]}
                <em>{p.title[1]}</em>
                {p.title[2]}
              </h3>
              <p className="mt-4 text-sm text-foreground/75">{p.body}</p>
              {p.tag && (
                <p className="mt-4 font-serif italic text-sm text-primary/90">{p.tag}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-t border-border/40 py-28 text-center">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-4xl md:text-5xl">
          Move your assets — <em>keep</em> your keys.
        </h2>
        <p className="mt-5 text-foreground/75">
          No signup. No KYC. No Wallet Connect. Create a non-custodial swap in under a minute.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:scale-[1.02] transition-transform"
          >
            Open Swaplix <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/30 px-6 py-3 text-sm font-medium hover:bg-foreground/5"
          >
            Open Source
          </a>
        </div>
      </div>
    </section>
  );
}

function CoinMarquee() {
  const all = [...coins, ...coins, ...coins];
  return (
    <section className="border-t border-border/40 py-16">
      <p className="text-eyebrow text-center">Swap natively across</p>
      <div className="mt-8 overflow-hidden">
        <div className="marquee flex gap-10 whitespace-nowrap">
          {all.map((c, i) => (
            <div
              key={i}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card text-lg font-bold ring-1 ring-border"
            >
              {c}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
