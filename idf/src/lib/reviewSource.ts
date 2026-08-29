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
    product: String(raw.product ?? '').trim() || undefined,
  };
}

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined;
const SCRIPT_TOKEN = import.meta.env.VITE_APPS_SCRIPT_TOKEN as string | undefined;
const LOCAL_REVIEWS_KEY = 'idf_local_submitted_reviews';

export function getLocalReviews(): Review[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function submitCustomerReview(review: Review): Promise<boolean> {
  try {
    const existing = getLocalReviews();
    localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([review, ...existing]));
  } catch (e) {
    console.error('Failed to save local review cache', e);
  }

  if (SCRIPT_URL && SCRIPT_TOKEN) {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          token: SCRIPT_TOKEN,
          action: 'submit_review',
          name: review.name,
          city: review.city || '',
          rating: review.rating,
          text: review.text,
          product: review.product || '',
        }),
      });
      if (res.ok) {
        const json = await res.json();
        return Boolean(json.ok);
      }
    } catch (e) {
      console.warn('Apps Script submit review failed', e);
    }
  }
  return true;
}

export async function loadReviews(): Promise<Review[]> {
  const localList = getLocalReviews();
  let serverList: Review[] = [];

  // 1. Google Sheets Apps Script Web App
  if (SCRIPT_URL && SCRIPT_TOKEN) {
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ token: SCRIPT_TOKEN, action: 'get_reviews' }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          serverList = json.data
            .map((r: any) => normalise(r))
            .filter((r: any): r is Review => r !== null);
        }
      }
    } catch (e) {
      console.warn('Apps Script reviews fetch failed, trying fallback...', e);
    }
  }

  // 2. static reviews.json
  if (!serverList.length) {
    try {
      const url = CATALOG_SOURCE.reviewsUrl;
      const res = await fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as ReviewsFile;
        serverList = (Array.isArray(data.reviews) ? data.reviews : [])
          .map((r) => normalise(r as unknown as Record<string, unknown>))
          .filter((r): r is Review => r !== null);
      }
    } catch {
      serverList = REVIEWS;
    }
  }

  // Combine local submitted reviews + server reviews (avoiding duplicates)
  const combined = [...localList, ...serverList];
  const unique = combined.filter((r, index, self) =>
    index === self.findIndex((t) => t.name === r.name && t.text === r.text)
  );

  return unique.length ? unique : REVIEWS;
}
