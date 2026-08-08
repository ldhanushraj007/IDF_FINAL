/**
 * PUBLISHED REVIEWS
 *
 * Same idea as the catalog: `src/data/reviews.ts` is the bundled fallback, and
 * `public/reviews.json` is what the shop actually curates. Publishing a review
 * means adding it to that file through the editor at /#/admin and uploading it
 * — no rebuild.
 *
 * A NOTE ON CURATION, because it matters commercially and legally:
 * choosing which reviews to feature is normal — every business does it. What
 * is not fine is presenting a filtered set as if it were everything, e.g.
 * advertising "4.9 from 300 reviews" when 300 is the count you received and
 * 4.9 is the average of only the good ones. India's BIS IS 19000:2022 standard
 * on online consumer reviews, which the CCPA pushes for e-commerce, treats
 * suppressing negative reviews to inflate a rating as a deceptive practice.
 *
 * So this site labels the section as a curated selection and computes any
 * average strictly from what is actually shown. Keep it that way.
 */

import { REVIEWS, type Review } from '../data/reviews';
import { CATALOG_SOURCE } from './constants';

export interface ReviewsFile {
  updatedAt?: string;
  reviews: Review[];
}

function normalise(raw: Record<string, unknown>): Review | null {
  const name = String(raw.name ?? '').trim();
  const text = String(raw.text ?? '').trim();
  if (!name || text.length < 4) return null;

  const rating = Number(raw.rating);

  return {
    name,
    city: String(raw.city ?? '').trim(),
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, Math.round(rating))) : 5,
    text,
    date: String(raw.date ?? '').trim(),
  };
}

export async function loadReviews(): Promise<Review[]> {
  try {
    const url = CATALOG_SOURCE.reviewsUrl;
    const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as ReviewsFile;
      const list = (Array.isArray(data.reviews) ? data.reviews : [])
        .map((r) => normalise(r as unknown as Record<string, unknown>))
        .filter((r): r is Review => r !== null);
      if (list.length) return list;
    }
  } catch {
    /* fall back to the bundled set */
  }
  return REVIEWS;
}
