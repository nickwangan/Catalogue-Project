import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: number
  manufacturer: string
  brand: string
  category: string
  gender: string
  material: string
  quality: string
  price_range: string
  date: string
  created_by: string
  created_at: string
  updated_at: string
}

export type UserRole = 'manager' | 'employee'
