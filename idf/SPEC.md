# In Design Luxury Fabrics — Project Specification

Full technical specification of the site as it stands. This is the "what it is
and how it works" document. For "how do I run the shop day to day," see
`HANDOVER.md`. For "what do I do next," see `NEXT-STEPS.md`.

---

## 1. What this is

A single-page e-commerce and showroom site for a luxury couture and bridal
fabric business in Bengaluru. Fabric is sold by the metre. Orders are placed
on the site and delivered to the showroom over WhatsApp; payment is UPI.

It is designed to run in two modes:

- **Static mode** — no backend at all. Catalog lives in `public/catalog.json`,
  reviews arrive over WhatsApp, the admin editor is protected by a PIN.
  Everything works. This is the default.
- **Connected mode** — a Supabase project is configured. This adds real
  customer accounts, verified reviews, an order database, a wishlist, live
  catalog publishing, and a real admin login.

The switch between them is a single condition: whether `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` are both set. Every feature that depends on Supabase
checks `isSupabaseConfigured` and falls back cleanly when it's false. Nothing
crashes, nothing shows a broken state.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Routing | React Router 7 (`BrowserRouter`) |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| Fonts | Cormorant Garamond (display) + Inter (body), self-hosted via `@fontsource` |
| QR generation | `qrcode` |
| Backend (optional) | Supabase — Postgres, Auth, Edge Functions |
| Customer database mirror | Google Sheets via Apps Script webhook |
| Hosting | Static — Vercel (configured), Netlify (configured), any static host |

No server is required. The build output is a static `dist/` folder.

---

## 3. Repository layout

```
├── index.html                  entry HTML, all SEO meta + JSON-LD
├── vite.config.ts              build config incl. vendor chunk splitting
├── vercel.json                 Vercel deploy: rewrites, caching, security headers
├── netlify.toml                Netlify equivalent
├── tailwind.config.js          design tokens (colours, fonts)
├── scripts/
│   ├── spa-fallback.mjs        copies index.html → 404.html for static hosts
│   └── generate-sitemap.mjs    builds sitemap.xml + robots.txt from real routes
├── public/
│   ├── catalog.json            THE LIVE CATALOG — prices, stock, offers
│   ├── reviews.json            published reviews (static mode)
│   ├── images/                 fabrics, gallery, collections, about, logo, og
│   └── favicon*, apple-touch-icon
├── src/
│   ├── main.tsx                React root, font imports
│   ├── App.tsx                 providers, routes, admin hash-route split
│   ├── index.css               Tailwind layers + base styles
│   ├── context/                React state: Auth, Cart, Catalog, Wishlist
│   ├── lib/                    Supabase client, APIs, constants, order logic
│   ├── data/                   static fallback data (catalog, gallery, etc.)
│   ├── components/             all UI components
│   ├── pages/                  Home, Product, About, Account
│   └── admin/AdminPanel.tsx    the shop editor
└── supabase/
    ├── schema.sql              full database schema + RLS + triggers
    ├── functions/admin-auth/   Edge Function for admin login
    └── google-apps-script/     IDF_CustDetails sheet sync script
```

---

## 4. Routing

| Route | Page | Notes |
|---|---|---|
| `/` | `HomePage` | Hero, collections, shop grid, gallery, reviews, visit |
| `/product/:id` | `ProductPage` | Gallery, composition, add to cart, related fabrics |
| `/about` | `AboutPage` | Brand story |
| `/account` | `AccountPage` | Details, order history, wishlist. Requires sign-in |
| `#/admin` | `AdminPanel` | Shop editor — deliberately a **hash** route |

**Why admin is a hash route.** `#/admin` is handled before `BrowserRouter`
mounts, in `useIsAdminRoute()`. A hash never reaches the server, so the editor
keeps working even on a host with no SPA rewrite rule configured. It also means
the admin panel loads without the storefront's providers, so a broken catalog
fetch can never lock the shop owner out of the tool they'd use to fix it.

In-page sections (`/#collections`, `/#shop`, `/#gallery`, `/#reviews`,
`/#visit`) are anchors on the homepage, **not** routes. This matters for the
sitemap — see §11.

**Code splitting.** Only `HomePage` ships in the main bundle. Product, About,
Account and the entire AdminPanel are `React.lazy()` imports.

---

## 5. State management

Four React contexts, nested in this order in `App.tsx`:

```
CatalogProvider → AuthProvider → WishlistProvider → CartProvider
```

| Context | Holds | Persistence |
|---|---|---|
| `CatalogContext` | products, offer banner, stock | fetched from source (§6), re-polled every 45s |
| `AuthContext` | session, profile, auth modal state | Supabase session (localStorage) |
| `WishlistContext` | saved fabric ids | Supabase when signed in |
| `CartContext` | line items, metres, totals | localStorage |

The nesting order is load-bearing: Wishlist and Cart both read auth state, and
all three read the catalog.

---

## 6. The catalog — how live pricing works

The catalog is fetched **at page load, not at build time**. This is the central
design decision of the whole project: it means the shop owner can change a
price without a developer, a rebuild, or a deploy.

Three possible sources, resolved in `src/lib/catalogSource.ts`:

1. **Supabase `products` table** — used when Supabase is configured. Publishing
   from the admin panel writes here and every visitor sees it within ~1 second.
2. **Published Google Sheet CSV** — used when `CATALOG_SOURCE.sheetCsvUrl` is
   set. The owner edits prices in Google Sheets on their phone; the site picks
   it up within a few minutes (Google caches published sheets).
3. **`public/catalog.json`** — the default. Edited via the admin panel, then
   committed to the repo or uploaded to the host.

Whatever the source, an open browser tab re-checks every **45 seconds**, so a
customer already browsing sees a price change without reloading.

**Catalog item shape:**

```ts
{
  id: string            // url slug, e.g. "aurelia-tulle"
  name: string
  category: string      // "Bridal" | "Heritage" | "Contemporary"
  composition: string
  width: string
  pricePerMetre: number
  mrp?: number          // optional strike-through price
  minMetres: number
  stock: 'in' | 'low' | 'out'
  tags: string[]        // "best-seller", "festival", etc.
  image: string
  blurb: string
  gallery: string[]
}
```

All 12 fabrics currently ship as `stock: 'in'`.

---

## 7. Authentication

Three sign-in methods, all through Supabase Auth. Implemented in
`src/components/AuthGate.tsx` and `src/context/AuthContext.tsx`.

| Method | Requires | Verification |
|---|---|---|
| Google | Google Cloud OAuth client | Automatic — Google has already verified |
| Email + password | Nothing extra | 6-digit code emailed on signup |
| Phone + OTP | **A Twilio (or similar) account** | 6-digit SMS code |

**Two things that will bite if missed:**

1. **Supabase's email templates send a link by default, not a code.** The site
   verifies against `{{ .Token }}` (a 6-digit code). Both the *Confirm signup*
   and *Magic Link* templates must be edited to include `{{ .Token }}`, or
   verification silently fails.

2. **Supabase's built-in email sender is not a production mailer.** It only
   delivers to addresses on your own Supabase team and is rate-limited to a
   couple of messages an hour, project-wide. It will look like it works when
   you test with your own account and then fail for every real customer. A real
   SMTP provider (Resend, SendGrid, Postmark) must be connected under
   Authentication → Emails → SMTP Settings before launch.

Phone sign-in is genuinely optional. Google and email are enough on their own,
and phone costs real money per message.

**What sign-in gates:** placing an order, leaving a review, and using the
wishlist. This is a deliberate trade-off — requiring an account before checkout
is a well-known cause of cart abandonment, but it's the right call for a first
release where the goal is verified, contactable customers and clean records.
It's straightforward to loosen to guest checkout later.

---

## 8. Order flow

1. Customer adds fabric by the metre. Cart persists in localStorage.
2. **Step 1** — name, WhatsApp number, delivery address or store pickup, notes.
   All validated.
3. **Step 2 — payment.** UPI only. A QR code is generated per order encoding
   the exact amount and order ID, plus an "Open UPI App" deep link on mobile.
   Or the customer chooses to settle at the showroom.
4. **Step 3 — confirm send.** WhatsApp opens with the full order pre-typed. The
   site then asks *"did you press Send?"* and does **not** mark the order placed
   until confirmed. Retry button, copy-the-text fallback, and phone number are
   all offered if WhatsApp didn't open.
5. **Step 4** — confirmed, cart cleared.

**The pending-order safety net.** If someone opens WhatsApp and wanders off,
the order is stored as *pending* (`src/lib/pendingOrder.ts`). On their next
visit — an hour or a week later — `PendingOrderBanner` appears: *"Order
IDLF-XXXX hasn't reached the showroom yet — Send now."* Their cart is untouched
until it's sent. This is the single most valuable piece of the checkout.

**Wholesale is automatic:** 20+ metres → 15% off, no code needed.
**Free shipping** above ₹5,000, otherwise ₹149 flat.

**What is not real:** payment is *confirmed by the customer*, not *verified by
a gateway*. There is no card or net-banking support, because that legally
requires a licensed payment gateway. See `NEXT-STEPS.md` §4.

---

## 9. Reviews

- Customers rate 1–5 and write a note. Sign-in required (connected mode).
- **4–5 stars** → saved as *pending*, publishable from the admin Reviews tab.
- **1–3 stars** → saved as *private*. Never shown publicly. The customer is
  told this upfront, and the owner gets a chance to make it right.

**A compliance detail worth preserving.** The aggregate score shown above the
reviews is calculated from exactly the reviews displayed, and labelled "across
N published reviews." It must not become an average of everything received
while only the good ones are shown — India's review standard (BIS IS
19000:2022, pushed by the CCPA for e-commerce) treats that as a deceptive
practice. Curating which reviews you feature is normal and legal; advertising a
rating the displayed reviews don't support is not.

---

## 10. Data model (Supabase)

Defined in full in `supabase/schema.sql`, with Row Level Security on every
table.

| Table | Purpose |
|---|---|
| `profiles` | one row per customer — name, phone, email, signup method, order totals |
| `orders` | one row per order — items, amount, status, requirement notes |
| `products` | live catalog when publishing from admin |
| `reviews` | submitted reviews with pending/published/private status |
| `wishlists` | saved fabrics per customer |
| `app_config` | key-value settings, incl. `sheet_webhook_url` |

**Passwords are never stored by this application.** Supabase Auth hashes and
holds them in its own `auth.users` table; the site never receives them.

**Why orders are a separate table from profiles.** A running "number of
purchases" counter on the customer row cannot answer "who hasn't ordered in 60
days" or "what's our average order value by category." One row per order can
answer both, and the profile totals are maintained by a database trigger on top
of it. This is the difference between a customer list and a customer database.

### Google Sheets mirror — `IDF_CustDetails`

Every signup and order also pushes to a Google Sheet via an Apps Script web app
(`supabase/google-apps-script/IDF_CustDetails_sync.gs`), triggered from the
database rather than the frontend — so it still fires if the customer closes
the tab mid-flow. One row per customer, updated in place, not an append-only
log. Passwords are structurally absent.

A spreadsheet is the right choice here over a custom dashboard: sorting,
filtering and pivoting for retention questions with zero learning curve.

---

## 11. SEO

- Full meta, Open Graph, Twitter Card and `Store` JSON-LD in `index.html`
- Self-hosted fonts — no render-blocking third-party font request
- `sitemap.xml` and `robots.txt` are **generated at build time** by
  `scripts/generate-sitemap.mjs`, covering the 2 real static routes plus all 12
  product pages

**A bug this fixed.** The previous hand-written sitemap listed `/collections`,
`/gallery`, `/b2b` and `/contact`. None are real routes — the first two are
homepage anchors and the last two don't exist — so Google would have crawled
four URLs that silently resolve to the homepage and flagged them as soft 404s.
It also omitted every product page, which are the pages most worth indexing.
The generator reads the real route list and the live catalog instead.

`/account` is explicitly disallowed in `robots.txt` — it's private and
per-customer.

---

## 12. Performance

The main bundle was a single 660 kB chunk. `vite.config.ts` now splits vendor
libraries into separately-cached chunks:

| Chunk | Size | gzip |
|---|---|---|
| app | 111 kB | 31 kB |
| vendor-react | 178 kB | 58 kB |
| vendor-supabase | 219 kB | 57 kB |
| vendor-motion | 128 kB | 43 kB |
| vendor-qrcode | 24 kB | 9 kB |

Two wins: the browser fetches them in parallel, and a code change no longer
invalidates the cached copy of React on repeat visits. Page-level chunks
(Product, About, Account, Admin) load on demand.

**Caching, set in `vercel.json`:** hashed assets are immutable for a year;
images for a week; **`catalog.json` and `reviews.json` must revalidate on every
request** — long-caching those would break the live-price mechanism entirely,
which is the kind of thing a default CDN config does silently.

---

## 13. Security posture

| Concern | Status |
|---|---|
| Customer passwords | Never touched by this app — Supabase Auth only |
| Database access | Row Level Security on every table |
| Admin login (connected) | Username + password + emailed code, verified in an Edge Function. The password is a Supabase secret, never in frontend code |
| Admin PIN (static mode) | **Not security.** It ships in the JavaScript bundle and is readable by anyone. Acceptable only because the editor can't change the live site by itself — it prepares a file someone with host access must still publish. Never reuse a PIN that protects anything else |
| Secrets in the repo | `.env.local` is gitignored; `.env.example` holds no real values |
| HTTP headers | `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, restrictive `Permissions-Policy` |

**Known dependency advisory:** `esbuild ≤0.24.2` (via Vite 5) allows any
website to send requests to the *local dev server* and read the response. It
affects `npm run dev` only, never the deployed static site. The fix is a major
Vite upgrade — see `NEXT-STEPS.md` §7 for the reasoning on timing.

---

## 14. Design system

Defined in `tailwind.config.js`.

| Token | Role |
|---|---|
| `night` / `ink` | deep near-black backgrounds and body text |
| `ivory` | primary light surface |
| `gold` / `gold-dark` | accent — CTAs, active states, rules |
| `walnut` | borders, muted dividers |
| `muted` | secondary text |

Cormorant Garamond carries display type; Inter carries body and all UI. Both
are self-hosted at specific weights rather than pulled from Google Fonts at
runtime.

Accessibility floor: skip-to-content link, visible keyboard focus, `MotionConfig
reducedMotion="user"` so every animation respects the OS setting.

---

## 15. Honest limitations

| Limitation | Why | Fix |
|---|---|---|
| No card / net banking | Requires a licensed payment gateway | Razorpay/Cashfree — KYC + ~2% fee |
| Payment confirmed, not verified | No gateway to verify against | Same |
| Customer must press Send in WhatsApp | Auto-send needs the paid WhatsApp Business API | WhatsApp Cloud API + small backend |
| Stock edited by hand, not deducted per sale | Nothing watches orders in real time | Backend hook alongside the gateway work |
| Phone OTP needs Twilio | Supabase doesn't send SMS itself | Twilio account + per-message cost |

None of these block trading. A great many Indian fabric businesses run exactly
this way — confirming payment in their own UPI app before dispatch.
