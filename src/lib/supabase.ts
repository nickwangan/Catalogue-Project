import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================================
// PIN -> Role mapping
// ============================================================
export const PIN_TO_ROLE: Record<string, UserRole> = {
  '1999': 'admin',
  '2178': 'manager',
  '1001': 'employee',
}

export function getRoleFromPin(pin: string): UserRole | null {
  return PIN_TO_ROLE[pin] ?? null
}

// ============================================================
// Types
// ============================================================
export type UserRole = 'admin' | 'manager' | 'employee'
export type Gender = 'Men' | 'Women'

export type UserProfile = {
  user_id: string
  username: string
  role: UserRole
  created_at: string
}

export type Category = {
  id: number
  name: string
  allowed_genders: Gender[]
  is_predefined: boolean
}

export type Brand = {
  id: string
  slug: string
  name: string
  context: string | null
  notes: string | null
  genders: Gender[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export type BrandLogo = {
  id: string
  brand_id: string
  image_url: string
  storage_path: string
  display_order: number
  uploaded_by: string | null
  uploaded_at: string
}

export type BrandCategory = {
  id: string
  brand_id: string
  category: string
  min_price: number
  max_price: number
  preset_used: string | null
  created_at: string
}

export type PricingPreset = {
  id: string
  name: string
  min_price: number
  max_price: number
  created_at: string
}

export type PriceContext = {
  id: string
  name: string
  modifier_amount: number
  created_at: string
}

export type ChangeHistoryEntry = {
  id: string
  brand_id: string
  changed_by: string | null
  changed_by_username: string
  change_type: string
  change_summary: string
  changed_at: string
}

// Brand with all its related data, used on detail/list pages
export type BrandWithDetails = Brand & {
  logos: BrandLogo[]
  categories: BrandCategory[]
  price_contexts: PriceContext[]
}

// ============================================================
// Helpers
// ============================================================
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const STORAGE_BUCKET = 'brand-logos'
