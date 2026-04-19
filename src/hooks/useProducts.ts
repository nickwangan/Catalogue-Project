import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Product } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useProducts() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fashion_catalog')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Product[]
    },
  })

  const addProduct = useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('fashion_catalog')
        .insert([{ ...product, created_by: user?.id }])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...product }: Partial<Product> & { id: number }) => {
      const { data, error } = await supabase
        .from('fashion_catalog')
        .update(product)
        .eq('id', id)
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('fashion_catalog')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return {
    products,
    isLoading,
    error,
    addProduct: addProduct.mutateAsync,
    updateProduct: updateProduct.mutateAsync,
    deleteProduct: deleteProduct.mutateAsync,
    isAdding: addProduct.isPending,
    isUpdating: updateProduct.isPending,
    isDeleting: deleteProduct.isPending,
  }
}
