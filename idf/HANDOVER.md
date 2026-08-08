# IN DESIGN LUXURY FABRICS — Handover Guide

## 1. Go-live checklist

| What | Where | Why it matters |
|---|---|---|
| **UPI ID** | `src/lib/constants.ts` → `UPI.vpa` | Until it's real, payments go nowhere |
| **Editor PIN** | `src/lib/constants.ts` → `ADMIN_PIN` | Change from the default `3216` — only matters if you skip the Supabase setup in section 6 |
| WhatsApp / phone number | `src/lib/constants.ts` → `BUSINESS` | Where orders arrive |
| Free-shipping threshold, wholesale % | `src/lib/constants.ts` → `ORDER` | |
| Real photos | `public/images/…` | Every image is a placeholder |
| Logo | `public/images/logo/` | The gold mark is your real logo, already wired in. Swap the files here if it ever changes. |

---

## 2. Changing prices, stock and offers

**If you've set up accounts and live sync (section 6):** open `yoursite.com/#/admin`, sign in, edit, tap **Publish Live**. Done — every visitor sees it within about a second, no upload, no rebuild. Skip straight to section 3.

**If you haven't:** two routes, pick one.

### Route A — Google Sheet (best if you edit often)

Once set up, changing a price is: open Google Sheets on your phone, type the new number, done. The site follows within a few minutes. No downloads, no GitHub, no Netlify.

**One-time setup (~15 minutes):**

1. Open Google Sheets → File → Import → upload `catalog-for-google-sheets.csv` from this repo. That gives you all 12 fabrics already filled in with the right column headers.
2. File → Share → **Publish to web** → select that sheet → format **CSV** → Publish. Copy the URL it gives you.
3. Paste that URL into `CATALOG_SOURCE.sheetCsvUrl` in `src/lib/constants.ts`.
4. Rebuild and redeploy once. After this you never rebuild for a price change again.

**Daily use:** edit the sheet. That's the whole workflow.

- `stock` column: `in`, `low`, or `out`
- `tags` column: separated by `|` — e.g. `best-seller|festival`
- `pricePerMetre`: plain numbers, but `8,500` and `₹8500` also work
- `mrp`: leave blank for no strike-through price
- Google caches published sheets for a few minutes, so changes are not instant

**Trade-off:** the offer banner, reviews and product-page galleries aren't in the sheet — those stay in the editor. And anyone with the published URL can read the sheet, so don't put private notes in it.

### Route B — the built-in editor at `/#/admin`

Open `yoursite.com/#/admin` and enter the PIN.

You can change price, MRP, stock, tags, category, min metres, the short and long descriptions, the main photo and the product-page gallery, or add/remove fabrics entirely.

Then publish:

**If Netlify is connected to this GitHub repo** (the recommended setup):
1. Tap **Copy text** in the editor
2. Go to `github.com/mithesh11-max/IDF/blob/main/public/catalog.json`
3. Tap the pencil icon → select all → paste → **Commit changes**
4. Netlify rebuilds automatically in about a minute

**If you deploy by dragging the `dist` folder to Netlify:** you cannot patch a single file into a live drag-drop deploy — put the new `catalog.json` into `dist/` and drag the whole folder again. This is the main reason to connect the repo instead.

**Even without any of this**, an open browser tab quietly re-checks `catalog.json` every 45 seconds, so a customer already on the site sees your update within under a minute once it's published — not just on their next visit.

---

## 3. How an order works

1. Customer adds fabric by the metre → cart saves automatically.
2. **Step 1** — name, WhatsApp number, address or store pickup, notes. All validated.
3. **Step 2 — payment.** UPI only for now: QR code plus an "Open UPI App" button on phones, amount and order ID pre-filled. Or they place the order and settle at the showroom.
4. **Step 3 — confirm the send.** WhatsApp opens with the full order typed out. The site then asks *"did you press Send?"* and does **not** treat the order as placed until they say yes. If WhatsApp didn't open there's a retry button, a copy-the-order-text fallback, and the phone number.
5. **Step 4** — order confirmed, cart cleared.

**The safety net:** if someone opens WhatsApp and wanders off without sending, the order is stored as *pending*. Next time they open the site — an hour or a week later — a bar appears at the bottom: *"Order IDLF-XXXX hasn't reached the showroom yet — Send now."* Their cart is untouched until it's sent.

**Wholesale is automatic:** 20+ metres → 15% off in the cart, no code needed.

**Cards and net banking** arrive together, later, via Razorpay — see section 5.

---

## 4. Product pages

Every fabric now has its own page at `/product/<id>` — full gallery, composition, width, minimum order, Add to Cart and Buy Now, plus related fabrics from the same category. Product cards throughout the site link there. Nothing to configure; it reads from the same catalog as everywhere else, so anything you publish in the editor shows up here too.

---

## 5. Payments — what's real vs what needs Razorpay

UPI works today: QR code, deep link, no gateway account needed. Cards and net banking need an actual payment gateway — a website cannot open a bank's own login page or a card network's 3-D Secure screen; only a licensed gateway can. When you're ready:

1. Open a Razorpay (or Cashfree) account — needs business KYC, PAN, GST, bank verification.
2. Bring the API keys back here and the checkout gets a proper "Pay with Card / Net Banking" step alongside UPI, with real payment verification instead of a customer ticking a box.

Until then, payment is confirmed by the customer, not verified by a gateway — completely normal for a showroom at this stage, but worth knowing.

---

## 6. Accounts and live sync (optional — Supabase)

This is the biggest upgrade available and it's optional. Switching it on gets you:

- **Real accounts for reviews** — Google sign-in, or email + password + a 6-digit verification code. Only signed-in customers can leave a review; anonymous ones are no longer possible.
- **A real admin login** — username + password + a 6-digit code emailed to you, instead of a PIN. The password never lives inside the website's code, unlike a PIN, which technically does (see the note at the end of this section).
- **True live sync** — publish a price change and it's on the site for every visitor within about a second. No file upload, no waiting for the 45-second refresh.

It costs nothing at this scale (Supabase's free tier) and takes about 20–30 minutes, once, most of it clicking through dashboards rather than anything technical.

### Setup

**1. Create the project.** Go to [supabase.com](https://supabase.com) → New project. Pick any name and a database password (save it somewhere). Wait ~2 minutes for it to provision.

**2. Run the schema.** In the Supabase dashboard: SQL Editor → New query → paste the entire contents of `supabase/schema.sql` from this repo → Run. This creates the products, reviews and settings tables and locks them down so only the right people can write to each.

**3. Fix the two email templates.** By default Supabase emails a clickable link, not a 6-digit code — this site needs the code. Authentication → Email Templates:
   - **Confirm signup** → make sure the body includes `{{ .Token }}` (this is what a new customer's verification code comes from)
   - **Magic Link** → same, include `{{ .Token }}` (this is what both returning customers and the admin's login code come from)

**4. Get your API keys.** Project Settings → API. Copy the **Project URL** and the **anon public** key.

**5. Wire them into the site.** Copy `.env.example` to `.env.local` and paste in those two values:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
   Add the same two as environment variables in Netlify (Site settings → Environment variables) so the live build picks them up too. Rebuild once.

**6. Deploy the admin login function.** This needs the [Supabase CLI](https://supabase.com/docs/guides/cli) installed once on a computer:
   ```
   supabase login
   supabase link --project-ref xxxxx        # the ref is in your project URL
   supabase functions deploy admin-auth
   supabase secrets set ADMIN_USERNAME=admin.idf
   supabase secrets set ADMIN_PASSWORD='IDF.4U'
   supabase secrets set ADMIN_EMAIL=m.mithesh11122006@gmail.com
   ```
   Change the password to whatever you like before setting it — it's stored as an encrypted secret on Supabase's servers, never inside the website's code, so this is the one place it's actually safe to put a real password. `ADMIN_EMAIL` is where every login code gets sent, so make sure it's an inbox you check.

**7. First login.** Go to `yoursite.com/#/admin`, sign in with the username and password from step 6, enter the code emailed to `ADMIN_EMAIL`. That first successful login automatically promotes the account to admin — nothing else to configure.

**8. (Optional) Turn on Google sign-in for customers.** Authentication → Providers → Google → enable it. You'll need a Google Cloud OAuth client (console.cloud.google.com → APIs & Services → Credentials → Create OAuth client ID → Web application), with Supabase's callback URL added as an authorized redirect URI — Supabase shows you the exact URL to paste in once you toggle Google on. Without this step, email + password + code still works fine for reviews; Google is an added convenience, not a requirement.

### What changes once this is live

- `/#/admin` shows the new username/password/code login instead of the PIN.
- The **Publish Live** button replaces Copy/Download — it writes straight to the database.
- The Reviews tab becomes a moderation queue of real, signed-in submissions with Publish / Keep Private / Delete buttons, instead of a manually-typed list.
- A **Sign In** button appears at the top right of the site. Customers can use Google, phone + SMS code, or email + password + a verification code.
- **Purchases and reviews both require a signed-in account.** Checkout stops at "sign in to continue" until they do. This is a deliberate choice worth knowing the trade-off on: requiring an account before checkout is one of the most common causes of cart abandonment in e-commerce, because it adds a step before someone can pay. It's the right call for a first release when the goal is genuine, contactable customers and clean records — just know that's the trade you're making, and it's easy to loosen later (e.g. "guest checkout, account optional") if you ever want to.
- Every account gets a **My Account** page (`/account`) — their details, their full order history, and their wishlist.
- A **wishlist heart** appears on every fabric. Tapping it while signed out prompts sign-in first.
- Every order is now saved to the database (previously an order only ever existed as WhatsApp text). This is what order history and "number of purchases" are built on.

### Phone sign-in needs one more thing: an SMS provider

Google and email sign-in work the moment Supabase is configured — no extra account needed. **Phone + OTP is different: Supabase doesn't send SMS itself.** It needs a connected SMS provider (Twilio is the common choice), which means:

1. A Twilio account (or MessageBird, Vonage) — needs its own signup and billing.
2. Supabase dashboard → Authentication → Providers → Phone → paste in the Twilio credentials.
3. Real cost per SMS (a few paise to a few rupees each, depending on provider and destination).

Until that's connected, the phone option in the sign-in screen will show an error if tapped. Google and email sign-in are unaffected and are enough on their own — treat phone as an optional third option to add later, not a blocker.

---

## 7. The customer database — Google Sheets

Every customer's name, phone, email, city, how they signed up, and their order history summary (total orders, last order value, last order items, last requirement/notes) can sync live to a Google Sheet named **IDF_CustDetails** — one row per customer, kept updated, not a growing duplicate log. Passwords are never part of this: Supabase never gives this site a customer's password to begin with, so there's nothing to accidentally leak.

**Setup (~10 minutes, after section 6 is done):**

1. Create a Google Sheet, name it exactly `IDF_CustDetails`.
2. Extensions → Apps Script. Delete the sample code, paste in the whole contents of `supabase/google-apps-script/IDF_CustDetails_sync.gs` from this repo.
3. Change `SHARED_TOKEN` near the top of that script to your own random string.
4. Deploy → New deployment → type **Web app** → Execute as **Me** → Who has access **Anyone** → Deploy → authorise it → copy the URL it gives you.
5. In Supabase's SQL Editor, run:
   ```sql
   update public.app_config
   set value = 'PASTE_THE_URL_HERE?token=YOUR_SHARED_TOKEN'
   where key = 'sheet_webhook_url';
   ```

That's it. From then on, every sign-up and every order updates the sheet within a second or two — nothing to run manually, nothing to export. Leave `sheet_webhook_url` blank and this simply doesn't happen; everything else keeps working normally.

**Why a spreadsheet and not a fancier dashboard:** it's what you asked for, and honestly it's the right call at this size — a spreadsheet you can sort, filter and pivot with zero learning curve beats a custom admin screen for "which customers haven't ordered in 60 days" type questions.

---

## 8. Reviews — how curation works

Customers rate 1–5 and write a note.

- **4 or 5 stars** → saved as *pending*. You publish it from the Reviews tab and it appears on the site immediately.
- **1 to 3 stars** → saved as *private*. It never appears publicly; the customer is told this upfront, and you get a chance to make it right.

Without Supabase, the same idea works over WhatsApp instead: good reviews arrive marked *OK TO PUBLISH* for you to paste into the editor; unhappy ones arrive marked *PRIVATE FEEDBACK* with a prompt to call the customer back.

**One thing to keep as it is.** The score above the reviews is calculated from exactly the reviews shown, and labelled "across N published reviews." Don't change it to an average of everything received while displaying only the good ones — that's the pattern India's review standard (BIS IS 19000:2022, which the CCPA pushes for e-commerce) treats as a deceptive practice. Curating which reviews you feature is completely normal and every shop does it; advertising a rating the displayed reviews don't support is the part that gets businesses in trouble. As built, you get the commercial benefit without the exposure.

---

### Why the PIN isn't "real" security, and the new login is

The PIN lives inside the website's own JavaScript, which means anyone can open the browser's dev tools and read it — true of any secret placed in frontend code, not a flaw specific to this site. It's an acceptable speed bump for a low-stakes editor with nothing real behind it, which was the situation before section 6. The admin password is different because it's checked on Supabase's servers, inside a function the browser never sees the source of — that's what makes it an actual secret rather than an obscured one.

---

## 9. Honest limitations

| Limitation | Why | Fix when budget allows |
|---|---|---|
| No card / net banking payments | Need a gateway merchant account | Razorpay/Cashfree — needs KYC + ~2% fee (section 5) |
| Payment is confirmed by the customer, not verified | No gateway to verify against | Same as above |
| The customer presses Send in WhatsApp | Auto-sending needs the paid WhatsApp Business API | WhatsApp Cloud API + a small backend |
| Stock is edited by hand, not deducted per sale | Nothing watches orders happen in real time | A small backend hook when the Razorpay integration lands |

Set up section 6 and the older limitations (no accounts, file-upload publishing, an insecure PIN) are solved. Without it, none of this blocks trading — thousands of Indian fabric businesses run exactly this way, confirming payment in their own UPI app before dispatching.

---

## 10. Deploying

**Quick:** drag `dist/` onto https://app.netlify.com/drop

**Proper:** push to GitHub → connect the repo on Netlify. `netlify.toml` is already configured (`npm run build` → publish `dist`). If you're using section 6, add the two `VITE_SUPABASE_*` environment variables in Netlify's site settings first.

**Day-to-day after that:** see section 2. With accounts and live sync, you never redeploy for a catalog change again. Rebuild by hand only when changing code, photos, or the files in `src/lib/constants.ts`.
