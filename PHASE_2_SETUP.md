# Phase 2 Setup — Settings Page & Logo Reordering

This file contains everything needed to enable the Phase 2 features:

- `/settings` page with three tabs (Presets, Categories, Users)
- Custom (non-predefined) category creation
- Logo reordering on brand pages
- Admin-only user role management

> ✅ **No data is lost.** Phase 2 only adds new RLS policies and one new RPC
> function. All existing brands, logos, presets, and users are preserved.

---

## 1. Run the Phase 2 SQL

Open Supabase → **SQL Editor → New Query**, paste the entire block below, and
click **Run**.

```sql
-- ============================================================
-- PHASE 2 — Settings page support
-- ============================================================

-- 1. Allow admins/managers to INSERT custom categories
DROP POLICY IF EXISTS "Admins and managers can insert categories" ON categories;
CREATE POLICY "Admins and managers can insert categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (can_edit_brands());

-- 2. Allow admins/managers to DELETE custom (non-predefined) categories.
--    Predefined categories are protected — they can never be deleted.
DROP POLICY IF EXISTS "Admins and managers can delete custom categories" ON categories;
CREATE POLICY "Admins and managers can delete custom categories"
  ON categories FOR DELETE TO authenticated
  USING (can_edit_brands() AND is_predefined = false);

-- 3. Allow admins to UPDATE other users' profiles (role changes).
--    Users can still update their own profile (e.g., username changes later).
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. Allow admins to DELETE user_profiles rows.
--    Note: this only removes the profile, not the auth.users row. Use the
--    Supabase dashboard if you also want to delete the underlying auth user.
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE TO authenticated
  USING (is_admin());

-- 5. RPC: reorder logos atomically (admins/managers only).
--    Takes an array of {id, display_order} pairs and applies them in one go.
CREATE OR REPLACE FUNCTION reorder_brand_logos(
  p_brand_id UUID,
  p_logo_ids UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i INT;
BEGIN
  -- Permission check: only admins/managers
  IF NOT can_edit_brands() THEN
    RAISE EXCEPTION 'Permission denied: only admins/managers can reorder logos';
  END IF;

  -- Apply new ordering: array index becomes display_order (0-based)
  FOR i IN 1..array_length(p_logo_ids, 1) LOOP
    UPDATE brand_logos
       SET display_order = i - 1
     WHERE id = p_logo_ids[i] AND brand_id = p_brand_id;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION reorder_brand_logos TO authenticated;
```

What this adds:

| Change | Why |
|---|---|
| INSERT policy on `categories` | So admins/managers can add custom categories from the Settings page |
| DELETE policy on `categories` (only `is_predefined = false`) | Custom categories can be removed; the 15 predefined ones can't |
| UPDATE policy on `user_profiles` (admin) | Admins can promote/demote users from the Users tab |
| DELETE policy on `user_profiles` (admin) | Admins can remove a user's profile row |
| `reorder_brand_logos` RPC | Atomic logo reorder via the up/down arrows on the brand page |

---

## 2. New Route

| Path | Description | Visible to |
|---|---|---|
| `/settings` | Settings page (Presets / Categories / Users tabs) | Admin + Manager |

The **Users** tab inside `/settings` is admin-only — managers see only Presets
and Categories.

---

## 3. Updated Permission Matrix

| Action | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| View brands | ✅ | ✅ | ✅ |
| Create / edit / delete brand | ✅ | ✅ | ❌ |
| Upload / remove / reorder logos | ✅ | ✅ | ❌ |
| Manage presets | ✅ | ✅ | ❌ |
| Manage custom categories | ✅ | ✅ | ❌ |
| Change user roles | ✅ | ❌ | ❌ |
| Remove user profile | ✅ | ❌ | ❌ |

---

## 4. Smoke Test

1. Log in as admin → click the **⚙ Settings** link in the header.
2. **Presets tab**: add a new preset `Premium` ($14.99 / $19.99). Edit `Basic`
   to change its max price. Try deleting one.
3. **Categories tab**: add a custom category `Hats` allowed for both genders.
   Confirm it appears in the brand form's category dropdown.
4. **Users tab**: change a test employee's role to `manager`. Log in as that
   user — they should now see Create/Edit buttons.
5. Open any brand with multiple logos. Click ↑/↓ on a thumbnail to reorder.
   Refresh — order is persisted.
6. Log in as a **manager** → `/settings` works, Users tab is hidden.
7. Log in as an **employee** → opening `/settings` redirects back to `/`.

---

## 5. Deploy

```bash
git add .
git commit -m "Phase 2: settings page, custom categories, logo reorder"
git push
```

Vercel auto-deploys.
