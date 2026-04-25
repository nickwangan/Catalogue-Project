import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  supabase,
  Brand,
  BrandCategory,
  BrandLogo,
  BrandWithDetails,
  Gender,
  PriceContext,
  slugify,
} from '../lib/supabase'

// ============================================================
// Hook: useBrands
// Returns all brands joined with categories, logos, and assigned
// price contexts, for the main brands table.
// ============================================================
export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: async (): Promise<BrandWithDetails[]> => {
      const { data: brands, error: brandsError } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true })

      if (brandsError) throw brandsError
      if (!brands || brands.length === 0) return []

      const brandIds = brands.map(b => b.id)

      const [categoriesRes, logosRes, contextsRes] = await Promise.all([
        supabase.from('brand_categories').select('*').in('brand_id', brandIds),
        supabase.from('brand_logos').select('*').in('brand_id', brandIds).order('display_order'),
        supabase
          .from('brand_price_contexts')
          .select('brand_id, price_contexts(*)')
          .in('brand_id', brandIds),
      ])

      if (categoriesRes.error) throw categoriesRes.error
      if (logosRes.error) throw logosRes.error
      if (contextsRes.error) throw contextsRes.error

      const contextsByBrand: Record<string, PriceContext[]> = {}
      for (const row of (contextsRes.data ?? []) as any[]) {
        if (!row.price_contexts) continue
        if (!contextsByBrand[row.brand_id]) contextsByBrand[row.brand_id] = []
        contextsByBrand[row.brand_id].push(row.price_contexts)
      }

      return brands.map((brand: Brand) => ({
        ...brand,
        categories: (categoriesRes.data ?? []).filter(
          (c: BrandCategory) => c.brand_id === brand.id,
        ),
        logos: (logosRes.data ?? []).filter(
          (l: BrandLogo) => l.brand_id === brand.id,
        ),
        price_contexts: contextsByBrand[brand.id] ?? [],
      }))
    },
  })
}

// ============================================================
// Hook: useDeleteBrand
// ============================================================
export function useDeleteBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (brandId: string) => {
      const { error } = await supabase.from('brands').delete().eq('id', brandId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

// ============================================================
// Hook: useCreateBrand
// ============================================================
export type CreateBrandInput = {
  name: string
  context: string | null
  notes: string | null
  genders: Gender[]
  categories: Array<{
    category: string
    min_price: number
    max_price: number
    preset_used: string | null
  }>
  price_context_ids: string[]
  username: string // for change history
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateBrandInput) => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      const slug = slugify(input.name)

      const { data: brand, error: brandError } = await supabase
        .from('brands')
        .insert({
          slug,
          name: input.name,
          context: input.context,
          notes: input.notes,
          genders: input.genders,
          created_by: userId,
        })
        .select()
        .single()

      if (brandError) throw brandError

      if (input.categories.length > 0) {
        const { error: catError } = await supabase
          .from('brand_categories')
          .insert(
            input.categories.map(c => ({
              brand_id: brand.id,
              category: c.category,
              min_price: c.min_price,
              max_price: c.max_price,
              preset_used: c.preset_used,
            })),
          )
        if (catError) throw catError
      }

      if (input.price_context_ids.length > 0) {
        const { error: ctxError } = await supabase
          .from('brand_price_contexts')
          .insert(
            input.price_context_ids.map(price_context_id => ({
              brand_id: brand.id,
              price_context_id,
            })),
          )
        if (ctxError) throw ctxError
      }

      // log change history
      await supabase.from('brand_change_history').insert({
        brand_id: brand.id,
        changed_by: userId,
        changed_by_username: input.username,
        change_type: 'created',
        change_summary: `Brand "${input.name}" was created with ${input.categories.length} categor${input.categories.length === 1 ? 'y' : 'ies'}.`,
      })

      return brand
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}

// ============================================================
// Hook: useUpdateBrand
// ============================================================
export type UpdateBrandInput = {
  brandId: string
  name: string
  context: string | null
  notes: string | null
  genders: Gender[]
  categories: Array<{
    category: string
    min_price: number
    max_price: number
    preset_used: string | null
  }>
  price_context_ids: string[]
  username: string
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: UpdateBrandInput) => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      const slug = slugify(input.name)

      const { error: brandError } = await supabase
        .from('brands')
        .update({
          slug,
          name: input.name,
          context: input.context,
          notes: input.notes,
          genders: input.genders,
        })
        .eq('id', input.brandId)
      if (brandError) throw brandError

      // Replace categories: delete existing then re-insert
      const { error: delError } = await supabase
        .from('brand_categories')
        .delete()
        .eq('brand_id', input.brandId)
      if (delError) throw delError

      if (input.categories.length > 0) {
        const { error: catError } = await supabase
          .from('brand_categories')
          .insert(
            input.categories.map(c => ({
              brand_id: input.brandId,
              category: c.category,
              min_price: c.min_price,
              max_price: c.max_price,
              preset_used: c.preset_used,
            })),
          )
        if (catError) throw catError
      }

      // Replace price contexts
      const { error: ctxDelError } = await supabase
        .from('brand_price_contexts')
        .delete()
        .eq('brand_id', input.brandId)
      if (ctxDelError) throw ctxDelError

      if (input.price_context_ids.length > 0) {
        const { error: ctxError } = await supabase
          .from('brand_price_contexts')
          .insert(
            input.price_context_ids.map(price_context_id => ({
              brand_id: input.brandId,
              price_context_id,
            })),
          )
        if (ctxError) throw ctxError
      }

      await supabase.from('brand_change_history').insert({
        brand_id: input.brandId,
        changed_by: userId,
        changed_by_username: input.username,
        change_type: 'updated',
        change_summary: `Brand "${input.name}" was updated.`,
      })

      return { brandId: input.brandId, slug }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      queryClient.invalidateQueries({ queryKey: ['brand', variables.brandId] })
    },
  })
}
