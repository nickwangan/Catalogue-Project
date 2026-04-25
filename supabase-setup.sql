-- ============================================================
-- FASHION CATALOG: BRAND-BASED SYSTEM (Phase 1 Schema)
-- ============================================================
-- WARNING: This script DROPS the old fashion_catalog and user_roles
-- tables and rebuilds the schema for brand-based pages.
-- Run the entire script in the Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. CLEAN UP OLD TABLES
-- ============================================================
DROP TABLE IF EXISTS fashion_catalog CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================
-- 2. USER PROFILES (extends auth.users with username + role)
-- ============================================================
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL
    CHECK (username = LOWER(username) AND username !~ '\s' AND length(username) >= 2),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- ============================================================
-- 3. CATEGORIES REFERENCE TABLE
-- ============================================================
CREATE TABLE categories (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) UNIQUE NOT NULL,
  allowed_genders TEXT[] NOT NULL DEFAULT ARRAY['Men','Women'],
  is_predefined BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 4. BRANDS TABLE
-- ============================================================
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(120) UNIQUE NOT NULL,
  name VARCHAR(255) UNIQUE NOT NULL,
  context TEXT,
  notes TEXT,
  genders TEXT[] NOT NULL CHECK (array_length(genders, 1) >= 1),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_name ON brands(name);

-- ============================================================
-- 5. BRAND LOGOS (multiple per brand)
-- ============================================================
CREATE TABLE brand_logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  display_order INT DEFAULT 0,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_brand_logos_brand_id ON brand_logos(brand_id);

-- ============================================================
-- 6. BRAND CATEGORIES (pricing per category per brand)
-- ============================================================
CREATE TABLE brand_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  min_price DECIMAL(10,2) NOT NULL CHECK (min_price >= 0),
  max_price DECIMAL(10,2) NOT NULL CHECK (max_price >= 0),
  preset_used VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (min_price <= max_price),
  UNIQUE(brand_id, category)
);

CREATE INDEX idx_brand_categories_brand_id ON brand_categories(brand_id);
CREATE INDEX idx_brand_categories_category ON brand_categories(category);

-- ============================================================
-- 7. PRICING PRESETS
-- ============================================================
CREATE TABLE pricing_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  min_price DECIMAL(10,2) NOT NULL CHECK (min_price >= 0),
  max_price DECIMAL(10,2) NOT NULL CHECK (max_price >= 0),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (min_price <= max_price)
);

-- ============================================================
-- 8. CHANGE HISTORY (audit log per brand)
-- ============================================================
CREATE TABLE brand_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_username VARCHAR(50) NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  change_summary TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_change_history_brand_id ON brand_change_history(brand_id);
CREATE INDEX idx_change_history_changed_at ON brand_change_history(changed_at DESC);

-- ============================================================
-- 9. HELPER FUNCTIONS
-- ============================================================

-- Get the current user's role (NULL if no profile)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS VARCHAR
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- Get the current user's username
CREATE OR REPLACE FUNCTION get_my_username()
RETURNS VARCHAR
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT username FROM user_profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- True if current user can edit brand pages (admin or manager)
CREATE OR REPLACE FUNCTION can_edit_brands()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'manager')
  );
$$;

-- True if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- 10. UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- user_profiles: read everyone (for change history username display),
-- write only own profile during signup
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read profiles"
  ON user_profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- (Admin role-management policy will be added in Phase 2)

-- categories: read for all authenticated users, write Phase 2
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read categories"
  ON categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- brands: read all authenticated, write only admin/manager
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brands"
  ON brands FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can insert brands"
  ON brands FOR INSERT
  WITH CHECK (can_edit_brands());

CREATE POLICY "Admins and managers can update brands"
  ON brands FOR UPDATE
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

CREATE POLICY "Admins and managers can delete brands"
  ON brands FOR DELETE
  USING (can_edit_brands());

-- brand_logos: same rules as brands
ALTER TABLE brand_logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brand_logos"
  ON brand_logos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage brand_logos"
  ON brand_logos FOR ALL
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

-- brand_categories: same rules as brands
ALTER TABLE brand_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read brand_categories"
  ON brand_categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage brand_categories"
  ON brand_categories FOR ALL
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

-- pricing_presets: read all, write only admin/manager
ALTER TABLE pricing_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read presets"
  ON pricing_presets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and managers can manage presets"
  ON pricing_presets FOR ALL
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

-- brand_change_history: read all, insert anyone authenticated
ALTER TABLE brand_change_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read change history"
  ON brand_change_history FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert change history"
  ON brand_change_history FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- 12. SEED DATA: PREDEFINED CATEGORIES
-- ============================================================
INSERT INTO categories (name, allowed_genders, is_predefined) VALUES
  ('Outerwear',           ARRAY['Men','Women'], true),
  ('Blazers',             ARRAY['Men','Women'], true),
  ('Tops',                ARRAY['Men','Women'], true),
  ('Bottoms',             ARRAY['Men','Women'], true),
  ('Shorts',              ARRAY['Men','Women'], true),
  ('T-shirts/Tank Tops',  ARRAY['Men','Women'], true),
  ('Activewear (Tops)',   ARRAY['Men','Women'], true),
  ('Activewear (Bottoms)',ARRAY['Men','Women'], true),
  ('Knitwear',            ARRAY['Men','Women'], true),
  ('Sweatshirts/Hoodies', ARRAY['Men','Women'], true),
  ('Suits',               ARRAY['Men','Women'], true),
  ('Denim/Jeans',         ARRAY['Men','Women'], true),
  ('Loungewear',          ARRAY['Men','Women'], true),
  ('Dresses',             ARRAY['Women'],       true),
  ('Shirts',              ARRAY['Men'],         true);

-- ============================================================
-- 13. SEED DATA: DEFAULT PRICING PRESETS
-- ============================================================
INSERT INTO pricing_presets (name, min_price, max_price) VALUES
  ('Basic',           6.99, 6.99),
  ('Basic (Dresses)', 9.99, 9.99);

-- ============================================================
-- 14. MIGRATION: assign existing users as ADMIN
-- ============================================================
-- Both existing users get admin role per the spec.
-- If their auth.users emails differ, edit the WHERE clauses.
INSERT INTO user_profiles (user_id, username, role)
SELECT id, 'cptfatcat', 'admin'
FROM auth.users WHERE email = 'cpt.fatcat@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

INSERT INTO user_profiles (user_id, username, role)
SELECT id, 'fatcat', 'admin'
FROM auth.users WHERE email = 'fatcat.na@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================================
-- 15. STORAGE: brand-logos bucket
-- ============================================================
-- Run separately in Supabase Dashboard:
-- 1. Go to Storage -> Create bucket -> name: "brand-logos"
-- 2. Set as PUBLIC bucket (so logos can be displayed)
-- 3. Add policy below for authenticated upload/delete:
--
-- CREATE POLICY "Authenticated users can upload logos"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'brand-logos');
--
-- CREATE POLICY "Anyone can view logos"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'brand-logos');
--
-- CREATE POLICY "Admins/managers can delete logos"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (bucket_id = 'brand-logos' AND can_edit_brands());
-- ============================================================
