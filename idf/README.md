# IN DESIGN LUXURY FABRICS — Website

A production-ready, responsive, SEO-optimised static website for a luxury couture & bridal fabric showroom in Bengaluru.

**Stack:** React 18 · TypeScript · Vite 5 · React Router 7 · Tailwind CSS 3 · Framer Motion · Lucide icons · self-hosted fonts (Cormorant Garamond + Inter). No backend required — an optional Supabase layer can be switched on for real accounts and live-syncing admin edits; see `HANDOVER.md` section 6.

---

## Quick start

```bash
npm install
npm run dev      # local dev server → http://localhost:5173
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build locally
```

The build outputs a fully static `dist/` folder. A prebuilt `dist/` is included in this package, so you can drag-and-drop it onto Netlify/Cloudflare right away if you prefer.

---

## Replace before launch

Everything you must customise lives in a handful of places.

### 1. Business details — `src/lib/constants.ts`

All contact info on the site (header, footer, WhatsApp buttons, forms, contact page) reads from one file. The current values are **placeholders**:

| Field | Placeholder | Replace with |
|---|---|---|
| `phoneDisplay` / `phoneRaw` | `+91 90000 00000` | Real phone number |
| `whatsappNumber` | `919000000000` | Real WhatsApp number (digits only, with country code) |
| `email` | `hello@indesignluxuryfabrics.com` | Real email |
| `addressLine1/2` | Commercial Street sample address | Real showroom address |
| `instagram` / `instagramHandle` | `@indesignluxuryfabrics` | Real Instagram |
| `mapsLink` / `mapsEmbed` | Generic Commercial Street map | Real Google Maps share + embed URLs |
| `hours` | Mon–Sat 10:30–8:30, Sun 11–7 | Real hours |

Also update the phone, address and hours inside the JSON-LD block in `index.html` (kept static there for SEO crawlers).

### 2. Domain — 1 file + 1 env var

Search for `indesignluxuryfabrics.com` and replace with your live domain in:

- `index.html` (canonical, Open Graph, Twitter, JSON-LD)

`robots.txt` and `sitemap.xml` are no longer hand-written — they're generated
into `dist/` at build time by `scripts/generate-sitemap.mjs`, which reads every
real route plus every product in `catalog.json`. It picks the domain up from
the `SITE_URL` environment variable, and on Vercel falls back to the project's
production URL automatically, so there's usually nothing to set.

### 3. Images — `public/images/`

All images are **generated abstract silk-texture placeholders**. Replace them with real photography using the same paths and roughly the same dimensions (JPG, compressed ~75 quality):

| Path | Size (px) | Used for |
|---|---|---|
| `images/hero.jpg` | 1920×1200 | Homepage hero |
| `images/og.jpg` | 1200×630 | Social sharing card |
| `images/collections/bridal.jpg` | 1200×1500 | Bridal collection card |
| `images/collections/heritage.jpg` | 1200×1500 | Heritage collection card |
| `images/collections/contemporary.jpg` | 1200×1500 | Contemporary collection card |
| `images/fabrics/f01.jpg … f12.jpg` | 1000×1250 | 12 product photos |
| `images/fabrics/detail-bridal-1/2.jpg` | 1000×1250 | Bridal product close-ups |
| `images/fabrics/detail-heritage-1/2.jpg` | 1000×1250 | Heritage product close-ups |
| `images/fabrics/detail-contemporary-1/2.jpg` | 1000×1250 | Contemporary product close-ups |
| `images/gallery/g01.jpg … g07.jpg` | mixed (1000×1000 → 1000×1500) | Gallery masonry |
| `images/about/story.jpg` | 1200×1400 | About page story |
| `images/about/craft.jpg` | 1200×900 | Craftsmanship section |
| `images/about/showroom-1.jpg` | 1200×900 | Showroom / contact |
| `images/about/showroom-2.jpg` | 1200×900 | Showroom / contact |

### 4. Content

Products live in `src/data/products.ts`; collections, testimonials, FAQs and gallery entries in the sibling files in `src/data/`. Edit copy, prices and MOQs there — no component changes needed.

---

## Forms

The contact, B2B and newsletter forms validate client-side and submit via **WhatsApp deep links** (a pre-filled `wa.me` message opens; the visitor presses send). This works with zero backend.

To capture submissions on a server instead, look for the `// TODO: connect to your backend` comments in:

- `src/pages/ContactPage.tsx`
- `src/pages/B2BPage.tsx`
- `src/components/layout/Footer.tsx` (newsletter)

Swap in a `fetch()` POST to your API, Formspree, Basin, or (on Netlify) [Netlify Forms](https://docs.netlify.com/forms/setup/).

---

## Deployment

The app is a client-side-routed SPA, so every host needs a rewrite of unknown paths to `index.html`. **All the needed config files are already included.**

### Netlify
- Drag-and-drop the `dist/` folder, **or** connect the repo — `netlify.toml` sets build command `npm run build` and publish dir `dist`.
- SPA redirects: handled by `public/_redirects` (copied into `dist/`).

### Vercel
- Import the repo; framework preset **Vite** (build `npm run build`, output `dist`).
- SPA rewrites: handled by `vercel.json`.

### Cloudflare Pages
- Build command `npm run build`, output directory `dist`.
- SPA redirects: handled by the same `_redirects` file.

### Hostinger / any Apache shared hosting
- Run `npm run build` locally, upload the **contents of `dist/`** to `public_html/`.
- SPA rewrites: handled by the included `.htaccess` (make sure hidden files are uploaded).

### GitHub Pages
- Build and publish the `dist/` folder (e.g. with `peaceiris/actions-gh-pages` or the `gh-pages` package).
- Deep-link support: the build step copies `index.html` → `404.html` automatically (`scripts/spa-fallback.mjs`).
- **Project pages** (`username.github.io/repo-name/`) additionally need a base path: set `base: '/repo-name/'` in `vite.config.ts` and `<BrowserRouter basename="/repo-name">` in `src/main.tsx`. Custom domains / user pages need no changes.

---

## Project structure

```
├── index.html                 # Meta tags, Open Graph, JSON-LD schema
├── public/                    # Static assets, redirects, robots, sitemap, images, catalog.json
├── scripts/spa-fallback.mjs   # Copies index.html → 404.html post-build
├── supabase/                  # Optional: DB schema + the admin-login edge function
└── src/
    ├── lib/constants.ts       # ★ All business info (edit me first)
    ├── lib/supabase.ts        # Supabase client — inert until VITE_SUPABASE_* is set
    ├── lib/adminApi.ts        # Admin login + publish operations against Supabase
    ├── data/                  # Fallback catalog + reviews bundled into the build
    ├── context/                # Catalog (live data), Cart, Auth
    ├── components/             # Navbar, footer, sections, product card, checkout…
    ├── admin/AdminPanel.tsx   # The /#/admin editor (PIN or Supabase login)
    └── pages/                 # HomePage, ProductPage
```

## Accessibility & performance notes

- Semantic landmarks, skip-to-content link, focus-visible gold rings, alt text on every image, `prefers-reduced-motion` respected via Framer Motion's `MotionConfig`.
- Fonts are self-hosted (no third-party requests), images lazy-load below the fold with width/height set to avoid layout shift, and the whole site ships as a small static bundle — comfortably in Lighthouse 95+ territory once real (compressed) images are in place.
