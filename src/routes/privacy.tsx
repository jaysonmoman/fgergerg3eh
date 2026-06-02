import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
  head: () => ({
    meta: [
      { title: "Privacy Policy — Swaplix" },
      { name: "description", content: "How Swaplix collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Swaplix" },
      { property: "og:url", content: "https://swaplix.lovable.app/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://swaplix.lovable.app/privacy" }],
  }),
});

function PrivacyPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 pt-32 pb-20 md:px-10">
        <p className="text-eyebrow">Legal</p>
        <h1 className="mt-2 text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-muted-foreground">Last updated: June 2026</p>
        <div className="mt-10 space-y-6 text-foreground/80">
          <Section title="What we collect">
            Email, swap history, destination addresses you submit, and standard server logs. We do <em>not</em> collect government ID, phone numbers, or third-party tracking identifiers.
          </Section>
          <Section title="Why we collect it">
            To deliver swap notifications, resolve disputes, prevent fraud, and meet basic operational and legal obligations.
          </Section>
          <Section title="Who can see it">
            You. Swaplix administrators in case of dispute. Exchangers only see the swap fields they need to fulfill an order (amounts, destination address, subject).
          </Section>
          <Section title="Cookies">
            Only essential session cookies for authentication. No advertising trackers.
          </Section>
          <Section title="Your rights">
            Email <a className="text-primary hover:underline" href="mailto:hello@swaplix.app">hello@swaplix.app</a> for access, export, or deletion. Deletion preserves the financial trail necessary for dispute resolution and applicable law.
          </Section>
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
