/**
 * recommendationsApi.ts
 * =============================================================================
 * Recommendation engine stubs. Previously called Supabase RPC functions
 * (get_top_picks, get_frequently_together, get_recommended_for_user).
 *
 * These always return [] now that Supabase has been removed. The widgets
 * (TopPicks, FrequentlyViewedTogether, RecommendedForYou) already handle an
 * empty result gracefully by hiding themselves.
 *
 * If you want recommendations in the future, options include:
 *  - A simple "most-viewed" list stored in Google Sheets (updated by the
 *    Apps Script whenever an order or wishlist action fires)
 *  - Any lightweight third-party analytics (Amplitude, PostHog, etc.)
 */

export interface ScoredProduct {
  productId: string;
  score: number;
}

export async function fetchTopPicks(_limit = 6): Promise<string[]> {
  return [];
}

export async function fetchFrequentlyTogether(_productId: string, _limit = 4): Promise<string[]> {
  return [];
}

export async function fetchRecommendedForUser(_limit = 6): Promise<string[]> {
  return [];
}
