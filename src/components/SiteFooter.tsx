export function SiteFooter() {
  const cols = [
    {
      title: "Product",
      links: ["Swap", "Verify", "Liquidity", "Atomic Swap"],
    },
    {
      title: "Popular Pairs",
      links: ["BTC to XMR", "BTC to ETH", "SOL to ETH", "BNB to TRX"],
    },
    {
      title: "Resources",
      links: ["Github", "Telegram", "Twitter", "Email"],
    },
  ];

  return (
    <footer className="border-t border-border/60 px-6 py-16 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
        <div>
          <p className="font-serif italic text-2xl">Swaplix</p>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            A decentralized exchange protocol for native, atomic, verifiable swaps across chains.
          </p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-eyebrow mb-4">{c.title}</p>
            <ul className="space-y-3 text-sm">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-foreground/80 hover:text-foreground transition-colors">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-16 flex max-w-7xl items-center justify-between text-eyebrow">
        <span>© Swaplix 2026</span>
        <div className="flex gap-6">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Brand Kit</a>
        </div>
      </div>
    </footer>
  );
}
