# Phase 3 Setup — Price Contexts, Role-Change RPC, Cleanup

Run the SQL block below in **Supabase → SQL Editor → New Query** before deploying.

```sql
-- ============================================================
-- PHASE 3 — Price Contexts + role-change RPC
-- ============================================================

-- 1. price_contexts table (additive modifiers, like "Linen +$10")
CREATE TABLE IF NOT EXISTS price_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  modifier_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE price_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read price_contexts" ON price_contexts;
CREATE POLICY "Authenticated users can read price_contexts"
  ON price_contexts FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins/managers can manage price_contexts" ON price_contexts;
CREATE POLICY "Admins/managers can manage price_contexts"
  ON price_contexts FOR ALL TO authenticated
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

-- 2. brand_price_contexts join table (which contexts apply to which brand)
CREATE TABLE IF NOT EXISTS brand_price_contexts (
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  price_context_id UUID REFERENCES price_contexts(id) ON DELETE CASCADE,
  PRIMARY KEY (brand_id, price_context_id)
);

ALTER TABLE brand_price_contexts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read brand_price_contexts" ON brand_price_contexts;
CREATE POLICY "Authenticated users can read brand_price_contexts"
  ON brand_price_contexts FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins/managers can manage brand_price_contexts" ON brand_price_contexts;
CREATE POLICY "Admins/managers can manage brand_price_contexts"
  ON brand_price_contexts FOR ALL TO authenticated
  USING (can_edit_brands())
  WITH CHECK (can_edit_brands());

-- 3. Seed the first context: Linen (+$10)
INSERT INTO price_contexts (name, modifier_amount)
VALUES ('Linen', 10.00)
ON CONFLICT (name) DO NOTHING;

-- 4. Admin role-change RPC (bypasses RLS edge cases)
CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id UUID,
  p_role    VARCHAR
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Permission denied: only admins can change roles';
  END IF;

  IF p_role NOT IN ('admin','manager','employee') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  UPDATE user_profiles SET role = p_role WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_role TO authenticated;
```
