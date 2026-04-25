import { useQuery } from '@tanstack/react-query'
import { supabase, Brand, BrandLogo, BrandCategory, ChangeHistoryEntry } from '../lib/supabase'

export type BrandDetail = Brand & {
  logos: BrandLogo[]
  categories: BrandCategory[]
  history: ChangeHistoryEntry[]
}

// ============================================================
// Hook: useBrand
// Fetches a single brand by slug, with logos, categories, and history
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

      const [logosRes, categoriesRes, historyRes] = await Promise.all([
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
      ])

      if (logosRes.error) throw logosRes.error
      if (categoriesRes.error) throw categoriesRes.error
      if (historyRes.error) throw historyRes.error

      return {
        ...brand,
        logos: logosRes.data ?? [],
        categories: categoriesRes.data ?? [],
        history: historyRes.data ?? [],
      }
    },
  })
}
