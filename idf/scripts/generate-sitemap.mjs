/**
 * Generates dist/sitemap.xml and dist/robots.txt from the real routes in
 * App.tsx plus every product in public/catalog.json.
 *
 * The previous hand-written public/sitemap.xml listed /collections, /gallery,
 * /b2b and /contact. Only the first two exist, and only as in-page anchors
 * (/#collections) — not as routes — so Google would have crawled four URLs
 * that resolve to the homepage and flagged them as soft 404s. It also omitted
 * all 12 product pages, which are the pages most worth indexing.
 *
 * Set SITE_URL in the environment (Vercel does this automatically via
 * VERCEL_PROJECT_PRODUCTION_URL) or edit the fallback below.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const FALLBACK_URL = 'https://www.indesignluxuryfabrics.com';

function resolveSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return FALLBACK_URL;
}

const siteUrl = resolveSiteUrl().replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

// Real routes, from the <Route> list in src/App.tsx.
// /account is deliberately excluded — it's private, per-customer, and behind
// a sign-in; there is nothing there for a crawler to index.
const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
];

// Dynamic categories list matching src/lib/categories.ts
const DEFAULT_CATEGORIES = [
  { slug: 'bridal' },
  { slug: 'heritage' },
  { slug: 'contemporary' },
  { slug: 'dyeable-fabrics' },
  { slug: 'printed' },
  { slug: 'plain' },
  { slug: 'imported-fabrics' },
  { slug: 'brocade' },
  { slug: 'handprint-fabrics' }
];

const categoryRoutes = DEFAULT_CATEGORIES.map((c) => ({
  path: `/?category=${c.slug}`,
  priority: '0.6',
  changefreq: 'weekly',
}));

let productRoutes = [];
try {
  const catalog = JSON.parse(readFileSync('public/catalog.json', 'utf8'));
  productRoutes = (catalog.items ?? [])
    .filter((item) => item?.id)
    .map((item) => ({
      path: `/product/${item.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    }));
} catch (err) {
  console.warn('generate-sitemap: could not read catalog.json —', err.message);
}

const routes = [...staticRoutes, ...categoryRoutes, ...productRoutes];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${siteUrl}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /

# Private, per-customer page — nothing to index.
Disallow: /account

Sitemap: ${siteUrl}/sitemap.xml
`;

if (existsSync('dist')) {
  writeFileSync('dist/sitemap.xml', xml);
  writeFileSync('dist/robots.txt', robots);
  console.log(`Sitemap written: ${routes.length} URLs at ${siteUrl}`);
} else {
  console.warn('generate-sitemap: no dist/ folder — run after vite build');
}
