import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, STORAGE_BUCKET, BrandLogo } from '../lib/supabase'

// ============================================================
// Hook: useUploadLogos
// Uploads one or more files to Supabase Storage and inserts records
// in brand_logos table.
// ============================================================
export function useUploadLogos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      brandId,
      files,
      username,
    }: {
      brandId: string
      files: File[]
      username: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      const uploaded: BrandLogo[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'png'
        const path = `${brandId}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          })

        if (uploadError) throw uploadError

        const { data: pubUrl } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(path)

        const { data: row, error: insertError } = await supabase
          .from('brand_logos')
          .insert({
            brand_id: brandId,
            image_url: pubUrl.publicUrl,
            storage_path: path,
            display_order: i,
            uploaded_by: userId,
          })
          .select()
          .single()

        if (insertError) throw insertError
        uploaded.push(row as BrandLogo)
      }

      // log change history
      if (uploaded.length > 0) {
        await supabase.from('brand_change_history').insert({
          brand_id: brandId,
          changed_by: userId,
          changed_by_username: username,
          change_type: 'logo_added',
          change_summary: `Added ${uploaded.length} logo${uploaded.length === 1 ? '' : 's'}.`,
        })
      }

      return uploaded
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brand'] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      queryClient.invalidateQueries({ queryKey: ['brand', variables.brandId] })
    },
  })
}

// ============================================================
// Hook: useDeleteLogo
// ============================================================
export function useDeleteLogo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      logo,
      username,
    }: {
      logo: BrandLogo
      username: string
    }) => {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id

      // 1. Remove from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([logo.storage_path])
      if (storageError) {
        // continue even if storage fails (orphan file is acceptable)
        console.warn('Storage removal failed:', storageError)
      }

      // 2. Remove DB row
      const { error: dbError } = await supabase
        .from('brand_logos')
        .delete()
        .eq('id', logo.id)
      if (dbError) throw dbError

      // 3. Log change
      await supabase.from('brand_change_history').insert({
        brand_id: logo.brand_id,
        changed_by: userId,
        changed_by_username: username,
        change_type: 'logo_removed',
        change_summary: 'A logo was removed.',
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brand', variables.logo.brand_id] })
      queryClient.invalidateQueries({ queryKey: ['brands'] })
    },
  })
}
