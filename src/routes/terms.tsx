import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms of Service — Swaplix" },
      { name: "description", content: "Terms governing use of the Swaplix peer-to-peer escrow swap service." },
      { property: "og:title", content: "Terms of Service — Swaplix" },
      { property: "og:url", content: "https://swaplix.lovable.app/terms" },
    ],
    links: [{ rel: "canonical", href: "https://swaplix.lovable.app/terms" }],
  }),
});

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 md:px-10 prose-invert">
        <p className="text-eyebrow">Legal</p>
        <h1 className="mt-2 text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="mt-10 space-y-6 text-foreground/80">
          <Section title="1. Acceptance">By using Swaplix you agree to these terms. If you do not agree, do not use the service.</Section>
          <Section title="2. Nature of the service">Swaplix matches users wishing to swap crypto, fiat, or items with independent exchangers. Swaplix is a routing and escrow platform; settlement is performed peer-to-peer.</Section>
          <Section title="3. No financial advice">Nothing on this site is investment, legal, or tax advice. Cryptocurrency markets are volatile — only swap amounts you can afford.</Section>
          <Section title="4. Eligibility">You must be of legal age in your jurisdiction and not be located in a sanctioned country.</Section>
          <Section title="5. Prohibited use">Money laundering, terrorism financing, sanctions evasion, fraud, and any activity unlawful in your jurisdiction or ours are prohibited and will result in account termination and asset sweep where evidence supports fraud.</Section>
          <Section title="6. Dispute resolution">Disputed swaps are frozen pending review by Swaplix administrators. Outcomes include refund, release, or — on confirmed fraud — sweep.</Section>
          <Section title="7. Limitation of liability">To the maximum extent permitted by law, Swaplix is not liable for indirect, incidental, or consequential damages arising from use of the service.</Section>
          <Section title="8. Changes">We may update these terms; continued use of the service after a change constitutes acceptance.</Section>
          <Section title="9. Contact">hello@swaplix.app</Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl text-foreground">{title}</h2>
      <p className="mt-2 text-sm">{children}</p>
    </div>
  );
}
