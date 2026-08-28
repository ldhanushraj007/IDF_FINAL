# What To Do Next

In order. Each phase is independently useful — the site is live and taking
orders after Phase 2, and everything after that is an upgrade, not a blocker.

**Before anything else, read §0. It's not optional.**

---

## 0. Revoke the two GitHub tokens — do this first

Two personal access tokens were pasted into a chat conversation. Treat both as
compromised:

1. Go to **https://github.com/settings/tokens**
2. Delete every compromised token listed there.
3. If you need one again later, generate a fresh one, use it locally, and never
   paste it into a chat window, a support ticket, an issue, or a commit

A token with `repo` scope can read, rewrite and delete every repository on your
account. Revoking takes about fifteen seconds and there is no downside — you
can always mint a new one.

**Also worth doing:** `git log -p | grep -i "github_pat"` in your repo, to
confirm no token was ever committed. If one was, revoking it is still the fix —
rewriting git history is not, because the old commit stays in forks and caches.

---

## 1. Get the code into GitHub

The repo already exists at `github.com/mithesh11-max/IDF`. This just updates it.

```bash
cd path/to/IDF
# copy the updated files in, then:
git add .
git commit -m "Fix sitemap generation, split vendor bundles, add Vercel config and docs"
git push
```

If you'd rather start clean:

```bash
cd idf
git init
git add .
git commit -m "In Design Luxury Fabrics — full site"
git branch -M main
git remote add origin https://github.com/mithesh11-max/IDF.git
git push -u origin main
```

**Check before you push:** `.gitignore` already covers `node_modules`, `dist`,
and `*.local`. Confirm `.env.local` is not in `git status` — if it appears,
stop and add it to `.gitignore` first. `.env.example` is safe; it holds no real
values.

---

## 2. Deploy free on Vercel

`vercel.json` is already configured — build command, output directory, SPA
rewrites, cache headers and security headers are all set.

1. Go to **vercel.com** → sign in **with GitHub**
2. **Add New → Project** → import `mithesh11-max/IDF`
3. Vercel auto-detects Vite. Framework should read **Vite**, build command
   `npm run build`, output directory `dist` — all already declared in
   `vercel.json`, so leave them alone
4. **Before clicking Deploy**, open *Environment Variables* and add these two if
   you've done Phase 3. If you haven't yet, skip them — the site builds and runs
   fine without, and you can add them later:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

5. **Deploy.** First build takes about a minute
6. You get a free `something.vercel.app` URL. Every `git push` to `main`
   redeploys automatically from then on

### After the first deploy

- **Set your domain in the meta tags.** `index.html` still has
  `indesignluxuryfabrics.com` hard-coded in the canonical, Open Graph, Twitter
  and JSON-LD blocks. Replace it with whatever your live URL actually is —
  otherwise link previews on WhatsApp and Instagram point at a domain you don't
  own. `sitemap.xml` and `robots.txt` handle this automatically; only
  `index.html` needs the edit.
- **Custom domain (optional, paid).** Vercel hosting is free; a domain is not
  (roughly ₹800–1,500/year). Project → Settings → Domains → add it and follow
  the DNS instructions.
- **Test on a real phone, on mobile data, not wifi.** This is the single most
  informative test you can run. Most of your customers will arrive this way.

---

## 3. Turn on Supabase — accounts, orders, live sync

~30 minutes, mostly clicking through dashboards. Free at this scale. This is
what activates verified customers, order history, the wishlist, real reviews,
and one-second live price publishing.

Full click-by-click steps are in **`HANDOVER.md` §6**. The condensed version:

1. Create a project at supabase.com
2. SQL Editor → paste all of `supabase/schema.sql` → Run
3. **Edit both email templates** — Authentication → Email Templates → *Confirm
   signup* and *Magic Link* must both include `{{ .Token }}`. Supabase sends a
   clickable link by default; this site verifies a 6-digit code. Miss this and
   verification silently fails
4. **Connect a real SMTP provider** — Authentication → Emails → SMTP Settings.
   Resend, SendGrid or Postmark. **Do not skip this.** Supabase's built-in
   sender only delivers to your own Supabase team members and caps at a couple
   of messages an hour. It will work perfectly when you test with your own
   account and fail for every actual customer
5. Copy the Project URL and anon key → add to Vercel env vars → redeploy
6. Deploy the admin login function (needs the Supabase CLI once):
   ```bash
   supabase login
   supabase link --project-ref xxxxx
   supabase functions deploy admin-auth
   supabase secrets set ADMIN_USERNAME=admin.idf
   supabase secrets set ADMIN_PASSWORD='pick-a-real-one'
   supabase secrets set ADMIN_EMAIL=your@email.com
   ```
7. First login at `yoursite.com/#/admin` auto-promotes that account to admin
8. *(Optional)* Google sign-in — Authentication → Providers → Google, with an
   OAuth client from Google Cloud Console
9. *(Optional)* Wire up the `IDF_CustDetails` sheet — `HANDOVER.md` §7

**Change `ADMIN_STATIC_PIN` in `src/lib/constants.ts` from the default `3216`** even
after this, in case you ever run without Supabase.

---

## 4. Before you take real money

| Item | Why it matters |
|---|---|
| **Real UPI ID** in `src/lib/constants.ts` → `UPI.vpa` | Currently `indesignfabrics@okhdfcbank`. If that isn't the shop's actual VPA, **every payment goes to the wrong place or nowhere.** Verify it with a ₹1 test transfer before launch |
| Test the full order flow end to end | Place a real order on your phone. Confirm WhatsApp opens with the right text, the QR scans, and the amount is correct |
| Test the pending-order banner | Open checkout, open WhatsApp, don't send, close the tab, come back. The banner should appear |
| Verify the free-shipping and wholesale maths | ₹5,000 threshold, ₹149 flat, 15% off at 20+ metres |
| Add a returns / exchange policy page | Fabric cut to length is usually non-returnable — say so explicitly, before a dispute rather than during one |
| Add a privacy policy | You're collecting names, phones, emails and addresses. India's DPDP Act 2023 applies |

---

## 5. Feature roadmap, in the order I'd build them

**High value, low effort:**

1. **Swatch / sample requests** — "order a swatch before you commit." For
   fabric bought sight-unseen this prevents the most expensive kind of return,
   and it captures a verified customer who isn't ready to buy yet.
2. **Fabric yardage calculator** — "how much do I need for curtains / a sofa /
   a lehenga." Fabric is a category people routinely over- and under-order in,
   and the answer is what stands between browsing and buying.
3. **Repeat-customer discount** — you're already tracking `total_orders` in
   `profiles`. Auto-apply a percentage after the 3rd order. The data is there;
   this is a UI change plus one rule.
4. **Back-in-stock notifications** — capture email against a fabric marked
   `out`. Turns a dead end into a lead.

**Medium effort, high value:**

5. **Razorpay / Cashfree integration** — real cards and net banking, with
   verified payment instead of a customer ticking a box. Needs business KYC,
   PAN, GST and bank verification, plus roughly 2% per transaction. This is the
   biggest single upgrade available and the one that removes the most friction.
6. **Automatic stock deduction** — once a gateway confirms payment, decrement
   stock. Removes the manual step that will eventually cause an oversell.
7. **Order status emails** — confirmed → dispatched → delivered.

**Later:**

8. WhatsApp Business Cloud API for automatic order sending (paid).
9. Instagram feed embed on the homepage.
10. Multi-currency / international shipping, if that's ever a market.

---

## 6. Ongoing maintenance

| Task | Frequency |
|---|---|
| Update prices / stock / offers | Via `/#/admin` — whenever needed, no deploy |
| `npm outdated` and update dependencies | Quarterly |
| Check Vercel deploy logs after any push | Every push |
| Export the `IDF_CustDetails` sheet as a backup | Monthly |
| Review pending reviews in the admin panel | Weekly |
| Check Google Search Console for crawl errors | Monthly, once indexed |

---

## 7. The dependency advisory, and why it isn't urgent

`npm install` reports two vulnerabilities, both from `esbuild ≤0.24.2`, which
Vite 5 depends on. The advisory: any website can send requests to the **local
dev server** and read the response.

- It affects `npm run dev` on your own machine only.
- It does **not** affect the deployed site — that's static files on a CDN with
  no dev server running anywhere.
- The fix is `npm audit fix --force`, which installs **Vite 8** — a major
  version jump across two majors, likely to break the build and require config
  changes.

So: not urgent, and worth doing deliberately rather than the day before a
launch. Do it as its own task, on its own branch, when you have time to test
the build afterwards. Don't run `--force` casually and discover it broke
something at a bad moment.

---

## 8. What changed in this pass

| Change | Why |
|---|---|
| `scripts/generate-sitemap.mjs` added; `public/sitemap.xml` and `public/robots.txt` removed | The old sitemap listed 4 URLs that aren't real routes (soft-404 risk) and omitted all 12 product pages. Now generated from the real route list and live catalog |
| Vendor chunk splitting in `vite.config.ts` | Main bundle went from one 660 kB chunk to 111 kB app + separately-cached vendor chunks |
| `vercel.json` expanded | Explicit build config, immutable caching for hashed assets, **must-revalidate on `catalog.json`** so CDN caching can't break live pricing, plus security headers |
| `SPEC.md` added | Full technical specification |
| `NEXT-STEPS.md` added | This document |
| `README.md` domain section updated | Reflects that robots/sitemap are now generated, not hand-edited |

Everything else was already built and working. The build passes `tsc --noEmit`
with no type errors.
