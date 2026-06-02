## Touch-up & finishing plan

A focused pass — only what's missing or rough. Grouped by impact.

### 1. Hero & navigation fixes
- Hero "Open app" and "Open Source" buttons go to `#` — wire them to `#swap` (scroll to the SwapCard) and an external repo link (or hide if none exists).
- Add a sticky "Create swap" CTA in `SiteHeader` so visitors past the fold can always start a swap.
- Smooth-scroll for anchor links (`#liquidity`, `#verify`).

### 2. Swap detail page (`/swap/$id`) polish
- Add a **live countdown timer** (mm:ss) for `expires_at` on `pending_deposit`, with a red pulse in the last 5 minutes.
- Show a **QR code** of the deposit address next to the copy button (use `qrcode.react`).
- Replace the static "Waiting for transaction…" with a 3-stage tracker: *Scanning chain → 1 conf → 3 confs → Escrowed*, driven by the existing `confirmations` column.
- Add **"Cancel swap"** action (owner only, status `pending_deposit`) — sets status `expired` immediately.
- Show **exchanger payout txid + explorer link** when status is `claimed`/`fulfilled`/`completed`.
- Auto-link txids/addresses to the right block explorer per coin.

### 3. Exchanger experience
- Order book: add filters (currency pair, min/max amount, payout kind) and a refresh-every-15s indicator.
- "Claim swap" modal: pre-fill exchanger's last-used payout address (localStorage).
- After claim, surface a clean **"Send payout" panel** with destination, amount, subject, payout_details, and a single field to paste the payout txid.
- Add a simple **profit estimate** ("you receive X, market value Y, spread Z%").

### 4. Notifications & real-time
- Toast + browser-notification when a watched swap changes status (uses Supabase realtime on `swap_requests` filtered by user_id / exchanger_id).
- Email the swap owner when status flips to `escrowed`, `claimed`, `completed`, `disputed` (Lovable Cloud transactional email; opt-out in profile).

### 5. Profile / account
- `/account` page: display name, notification email, default destination address per coin (saved in `profiles.preferences` jsonb), sign-out button.
- Show user's role badges (User / Exchanger / Admin).

### 6. Trust, legal, SEO
- Dedicated routes with proper `head()` metadata: `/how-it-works`, `/security`, `/terms`, `/privacy`, `/faq`.
- Add JSON-LD `Organization` + `WebSite` on root, `FAQPage` on `/faq`.
- Generate `public/robots.txt` and `public/sitemap.xml` listing the static routes.
- Add Open Graph image (existing `hero-bg.jpg` cropped to 1200×630).

### 7. Trust signals on landing
- Replace fake "50+ / 4 / 0.5%" stats with values pulled from real settings (or annotate as "target" honestly).
- Add a live "last completed swaps" ticker fetched from a new public read-only server fn (`listRecentCompleted`) returning anonymised `{from, to, amount_usd, ago}`.

### 8. Small UX/visual polish
- Skeleton states for SwapCard rate and the comparison table (currently shows "—" or "···").
- Empty states for `/swaps` and exchanger order book ("No swaps yet — create your first").
- Better mobile layout for the comparison table (currently overflows under 400px).
- Fix the `Stats` section grid border logic on mobile (currently produces double borders).
- Friendly 404 page with link home.

### Technical notes
- New deps: `qrcode.react` (~5KB), `react-intersection-observer` only if needed for ticker.
- New server fns: `cancelSwap`, `listRecentCompleted`, `updateProfile`, `markNotificationRead`.
- New table: `notifications (id, user_id, swap_id, kind, read_at, created_at)` with RLS scoped to `user_id = auth.uid()`.
- Extend `profiles` with `preferences jsonb default '{}'`.
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_requests` (filtered subscriptions on the client).
- Transactional email via Lovable Cloud (Resend under the hood) — needs `RESEND_API_KEY` secret only if you don't already have one.

### Out of scope (call out separately if you want)
- Actual on-chain custody / HD-wallet derivation (still using `OPERATOR_*_ADDRESS` env vars).
- KYC, fraud-scoring beyond the existing dispute trigger.
- Mobile native app.

---

Tell me which sections you want in this pass (or "all of it") and I'll build it in build mode. If "all", I'll ship in this order: 1 → 8 → 2 → 5 → 6 → 3 → 4 → 7 so the visible polish lands first.