import { useQuery } from '@tanstack/react-query'
import { supabase, Category, PricingPreset, PriceContext } from '../lib/supabase'

// ============================================================
// Hook: useCategories
// All predefined and custom categories
// ============================================================
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

// ============================================================
// Hook: usePricingPresets
// All available pricing presets
// ============================================================
export function usePricingPresets() {
  return useQuery({
    queryKey: ['pricing_presets'],
    queryFn: async (): Promise<PricingPreset[]> => {
      const { data, error } = await supabase
        .from('pricing_presets')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

// ============================================================
// Hook: usePriceContexts
// All available price modifiers (additive, e.g., "Linen +$10")
// ============================================================
export function usePriceContexts() {
  return useQuery({
    queryKey: ['price_contexts'],
    queryFn: async (): Promise<PriceContext[]> => {
      const { data, error } = await supabase
        .from('price_contexts')
        .select('*')
        .order('name', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}
