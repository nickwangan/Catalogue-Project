import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, UserProfile, UserRole, Gender } from '../lib/supabase'

// ============================================================
// USERS
// ============================================================

export function useAllUsers() {
  return useQuery({
    queryKey: ['user_profiles', 'all'],
    queryFn: async (): Promise<UserProfile[]> => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
  })
}

// Uses SECURITY DEFINER RPC to avoid RLS edge cases.
export function useUpdateUserRole() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_role: role,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user_profiles'] })
    },
  })
}

// ============================================================
// PRESETS
// ============================================================

type PresetInput = { name: string; min_price: number; max_price: number }

export function useCreatePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PresetInput) => {
      const { error } = await supabase.from('pricing_presets').insert([input])
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing_presets'] })
    },
  })
}

export function useUpdatePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: PresetInput & { id: string }) => {
      const { error } = await supabase
        .from('pricing_presets')
        .update(input)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing_presets'] })
    },
  })
}

export function useDeletePreset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_presets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing_presets'] })
    },
  })
}

// ============================================================
// CUSTOM CATEGORIES
// ============================================================

type CategoryInput = { name: string; allowed_genders: Gender[] }

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CategoryInput) => {
      const { error } = await supabase
        .from('categories')
        .insert([{ ...input, is_predefined: false }])
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// ============================================================
// PRICE CONTEXTS (modifiers)
// ============================================================

type PriceContextInput = { name: string; modifier_amount: number }

export function useCreatePriceContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: PriceContextInput) => {
      const { error } = await supabase.from('price_contexts').insert([input])
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price_contexts'] })
    },
  })
}

export function useUpdatePriceContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: PriceContextInput & { id: string }) => {
      const { error } = await supabase
        .from('price_contexts')
        .update(input)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price_contexts'] })
      qc.invalidateQueries({ queryKey: ['brand'] })
      qc.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

export function useDeletePriceContext() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('price_contexts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['price_contexts'] })
      qc.invalidateQueries({ queryKey: ['brand'] })
      qc.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

// Re-export for use in UsersTab — only kept so older imports don't break.
// (Delete-user feature is intentionally removed from the UI; manage via Supabase dashboard.)
export type { UserProfile, UserRole }
