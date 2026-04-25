import { useQuery } from '@tanstack/react-query'
import { supabase, Category, PricingPreset } from '../lib/supabase'

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
