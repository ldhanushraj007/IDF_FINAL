import { supabase, isSupabaseConfigured } from './supabase';

export interface ScoredProduct {
  productId: string;
  score: number;
}

export async function fetchTopPicks(limit = 6): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('get_top_picks', { limit_count: limit });
    if (error || !data) return [];
    return (data as { product_id: string }[]).map((r) => r.product_id);
  } catch {
    return [];
  }
}

export async function fetchFrequentlyTogether(productId: string, limit = 4): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase || !productId) return [];
  try {
    const { data, error } = await supabase.rpc('get_frequently_together', {
      target_product_id: productId,
      limit_count: limit,
    });
    if (error || !data) return [];
    return (data as { product_id: string }[]).map((r) => r.product_id);
  } catch {
    return [];
  }
}

export async function fetchRecommendedForUser(limit = 6): Promise<string[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.rpc('get_recommended_for_user', { limit_count: limit });
    if (error || !data) return [];
    return (data as { product_id: string }[]).map((r) => r.product_id);
  } catch {
    return [];
  }
}
