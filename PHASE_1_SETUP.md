# Phase 1 Setup — Brand-Based System

This file contains every step to migrate from the old product catalog to the new brand-based system.

> ⚠️ **Heads up:** Step 1 will **delete** the old `fashion_catalog` and `user_roles` tables.
> You confirmed earlier this is fine — no real data is lost. The two existing users in `auth.users`
> are kept and migrated to the **admin** role automatically.

---

## 1. Run the New SQL Schema

1. Open Supabase → **SQL Editor → New Query**
2. Open `supabase-setup.sql` from the project, copy the **entire** file, paste, and click **Run**.

What this does:
- Drops old `fashion_catalog` and `user_roles` tables
- Creates: `user_profiles`, `categories`, `brands`, `brand_logos`, `brand_categories`, `pricing_presets`, `brand_change_history`
- Adds RLS policies (admins/managers can write, employees read-only)
- Seeds **15 predefined categories** (incl. Dresses=Women, Shirts=Men)
- Seeds **2 default presets**: `Basic` ($6.99) and `Basic (Dresses)` ($9.99)
- Migrates `cpt.fatcat@gmail.com` (username `cptfatcat`) and `fatcat.na@gmail.com` (username `fatcat`) to **admin**

---

## 2. Create the Storage Bucket for Logos

1. In Supabase, go to **Storage** → **New bucket**
2. Name: `brand-logos`
3. Toggle **Public bucket** ON (so logos can be displayed without signed URLs)
4. Click **Save**

### Storage RLS Policies (run in SQL Editor):

```sql
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-logos' AND can_edit_brands());

CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

CREATE POLICY "Admins/managers can delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-logos' AND can_edit_brands());
```

---

## 3. Install New Dependencies (already done locally)

The project now uses **React Router**. If you ever set up on a fresh machine:

```bash
cd fashion-catalog
npm install
```

---

## 4. Local Development

```bash
npm run dev
```

Open http://localhost:5173 — you should see the new login page.

---

## 5. Account Creation

The login page now requires **4 fields** to sign up:

| Field | Notes |
|-------|-------|
| Email | Standard email |
| Password | Min 6 chars |
| **Username** | Lowercase, no spaces, used in change history |
| **PIN** | 4-digit role identifier |

### Role PINs

| PIN | Role |
|-----|------|
| `1999` | Admin (full access, settings page in Phase 2) |
| `2178` | Manager (create/edit brands + manage presets) |
| `1001` | Employee (view only) |

A wrong PIN rejects signup before the account is created.

---

## 6. Existing Users

Both existing users were migrated to **Admin**:

| Email | Username | Role |
|-------|----------|------|
| cpt.fatcat@gmail.com | `cptfatcat` | admin |
| fatcat.na@gmail.com | `fatcat` | admin |

You can log in with their existing passwords — no re-signup needed.

---

## 7. Permission Matrix (Phase 1)

| Action | Admin | Manager | Employee |
|--------|:-----:|:-------:|:--------:|
| View brands | ✅ | ✅ | ✅ |
| Create / edit / delete brand | ✅ | ✅ | ❌ |
| Upload / remove logos | ✅ | ✅ | ❌ |
| Manage presets | ✅ | ✅ | ❌ |
| Settings page (role management) | 🔒 Phase 2 | ❌ | ❌ |

---

## 8. New Routes

| Path | Description | Visible to |
|------|-------------|------------|
| `/` | Brands table (with sort + filters) | All users |
| `/brand/new` | Create brand form | Admin / Manager |
| `/brand/:slug` | Brand detail page (logos, prices, history) | All users |
| `/brand/:slug/edit` | Edit brand form | Admin / Manager |

---

## 9. Quick Smoke Test

1. **Log in** as `fatcat.na@gmail.com` (admin).
2. Click **+ Create Brand Page**.
3. Fill form:
   - Name: `Nike`
   - Context: `Subsidiary of Nike Inc.`
   - Notes: `Premium athletic apparel`
   - Genders: ✅ Men, ✅ Women
   - Click **+ Add Category** twice:
     - Outerwear → Min 19.99, Max 39.99
     - Bottoms → Preset "Basic" (auto-fills 6.99 / 6.99)
   - Optionally upload 1–2 logo images
4. Click **Create Brand** — you should be redirected to `/brand/nike`.
5. Try logging out, signing up a new employee with PIN `1001`.
6. As employee, confirm you can **view** but not see the **+ Create** or **Edit** buttons.
7. Filter the main table by category, sort by min price, etc.

---

## 10. Known Phase 2 Items (NOT in this update)

Saving for the next round:

- `/settings` page (preset management, user role management)
- Custom (non-predefined) category creation UI
- Logo display order reordering UI
- Bulk import / export of brands

---

## 11. Deploy to Vercel

```bash
git add .
git commit -m "Phase 1: brand-based system with auth + logos + history"
git push
```

Vercel auto-deploys. Confirm:

1. Build succeeds (no TS errors).
2. Live site loads login page.
3. Signup PIN flow works.
4. Brand CRUD works end-to-end.
