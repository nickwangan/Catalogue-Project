import { useQuery } from '@tanstack/react-query'
import {
  supabase,
  Brand,
  BrandLogo,
  BrandCategory,
  ChangeHistoryEntry,
  PriceContext,
} from '../lib/supabase'

export type BrandDetail = Brand & {
  logos: BrandLogo[]
  categories: BrandCategory[]
  history: ChangeHistoryEntry[]
  price_contexts: PriceContext[]
}

// ============================================================
// Hook: useBrand
// Fetches a single brand by slug, with logos, categories,
// change history, and assigned price contexts.
// ============================================================
export function useBrand(slug: string | undefined) {
  return useQuery({
    queryKey: ['brand', slug],
    enabled: !!slug,
    queryFn: async (): Promise<BrandDetail | null> => {
      if (!slug) return null

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .select('*')
        .eq('slug', slug)
        .maybeSingle()

      if (brandError) throw brandError
      if (!brand) return null

      const [logosRes, categoriesRes, historyRes, contextsRes] = await Promise.all([
        supabase
          .from('brand_logos')
          .select('*')
          .eq('brand_id', brand.id)
          .order('display_order', { ascending: true }),
        supabase
          .from('brand_categories')
          .select('*')
          .eq('brand_id', brand.id)
          .order('category', { ascending: true }),
        supabase
          .from('brand_change_history')
          .select('*')
          .eq('brand_id', brand.id)
          .order('changed_at', { ascending: false }),
        supabase
          .from('brand_price_contexts')
          .select('price_context_id, price_contexts(*)')
          .eq('brand_id', brand.id),
      ])

      if (logosRes.error) throw logosRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (historyRes.error) throw historyRes.error
      if (contextsRes.error) throw contextsRes.error

      const price_contexts: PriceContext[] = (contextsRes.data ?? [])
        .map((row: any) => row.price_contexts)
        .filter(Boolean)

      return {
        ...brand,
        logos: logosRes.data ?? [],
        categories: categoriesRes.data ?? [],
        history: historyRes.data ?? [],
        price_contexts,
      }
    },
  })
}
