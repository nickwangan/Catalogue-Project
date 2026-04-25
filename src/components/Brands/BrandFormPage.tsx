import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useBrand } from '../../hooks/useBrand'
import { useCreateBrand, useUpdateBrand } from '../../hooks/useBrands'
import { useUploadLogos } from '../../hooks/useLogos'
import {
  useCategories,
  usePricingPresets,
  usePriceContexts,
} from '../../hooks/useReference'
import { useToast } from '../../context/ToastContext'
import { Gender } from '../../lib/supabase'

type CategoryRow = {
  category: string
  min_price: string
  max_price: string
  preset_used: string | null
}

type Mode = 'create' | 'edit'

export function BrandFormPage({ mode }: { mode: Mode }) {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug: string }>()
  const { canEditBrands, username } = useAuth()
  const isEdit = mode === 'edit'

  const { data: brand, isLoading: brandLoading } = useBrand(isEdit ? slug : undefined)
  const { data: categories } = useCategories()
  const { data: presets } = usePricingPresets()
  const { data: priceContexts } = usePriceContexts()
  const createBrand = useCreateBrand()
  const updateBrand = useUpdateBrand()
  const uploadLogos = useUploadLogos()
  const { showToast } = useToast()

  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [notes, setNotes] = useState('')
  const [genders, setGenders] = useState<Gender[]>([])
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [selectedContextIds, setSelectedContextIds] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Prefill in edit mode
  useEffect(() => {
    if (isEdit && brand) {
      setName(brand.name)
      setContext(brand.context ?? '')
      setNotes(brand.notes ?? '')
      setGenders(brand.genders)
      setRows(
        brand.categories.map(c => ({
          category: c.category,
          min_price: String(c.min_price),
          max_price: String(c.max_price),
          preset_used: c.preset_used,
        })),
      )
      setSelectedContextIds(brand.price_contexts.map(c => c.id))
    }
  }, [isEdit, brand])

  // Categories filtered by selected gender(s)
  const availableCategories = useMemo(() => {
    if (!categories) return []
    if (genders.length === 0) return categories
    return categories.filter(c =>
      // Allowed if at least one of the selected genders is in the category's allowed list
      genders.some(g => c.allowed_genders.includes(g)),
    )
  }, [categories, genders])

  if (!canEditBrands) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <p className="text-lg text-gray-700 mb-4">
            Only admins and managers can create or edit brand pages.
          </p>
          <Link to="/" className="text-indigo-600 hover:underline">← Back to brands</Link>
        </div>
      </div>
    )
  }

  if (isEdit && brandLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading brand...</p>
      </div>
    )
  }

  if (isEdit && !brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Brand not found.</p>
      </div>
    )
  }

  const toggleGender = (g: Gender) => {
    setGenders(prev => (prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]))
  }

  const addRow = () => {
    setRows(prev => [...prev, { category: '', min_price: '', max_price: '', preset_used: null }])
  }

  const removeRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx))
  }

  const updateRow = (idx: number, patch: Partial<CategoryRow>) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const applyPreset = (idx: number, presetName: string) => {
    if (presetName === '') {
      updateRow(idx, { preset_used: null })
      return
    }
    const preset = presets?.find(p => p.name === presetName)
    if (!preset) return
    updateRow(idx, {
      preset_used: preset.name,
      min_price: String(preset.min_price),
      max_price: String(preset.max_price),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Brand name is required.')
      return
    }
    if (genders.length === 0) {
      setError('Select at least one gender (Men, Women, or both).')
      return
    }
    if (rows.length === 0) {
      setError('Add at least one category with pricing.')
      return
    }

    // Validate rows
    const cleanedRows = []
    for (const r of rows) {
      if (!r.category) {
        setError('Every category row needs a category selection.')
        return
      }
      const min = parseFloat(r.min_price)
      const max = parseFloat(r.max_price)
      if (isNaN(min) || isNaN(max)) {
        setError(`Invalid price for "${r.category}".`)
        return
      }
      if (min < 0 || max < 0) {
        setError(`Prices must be non-negative ("${r.category}").`)
        return
      }
      if (min > max) {
        setError(`Min price cannot exceed max price ("${r.category}").`)
        return
      }
      cleanedRows.push({
        category: r.category,
        min_price: min,
        max_price: max,
        preset_used: r.preset_used,
      })
    }

    // Detect duplicate categories
    const seen = new Set<string>()
    for (const r of cleanedRows) {
      if (seen.has(r.category)) {
        setError(`Duplicate category: ${r.category}`)
        return
      }
      seen.add(r.category)
    }

    setSubmitting(true)
    try {
      let resultBrandId: string
      let resultSlug: string

      if (isEdit && brand) {
        const res = await updateBrand.mutateAsync({
          brandId: brand.id,
          name: name.trim(),
          context: context.trim() || null,
          notes: notes.trim() || null,
          genders,
          categories: cleanedRows,
          price_context_ids: selectedContextIds,
          username: username ?? '',
        })
        resultBrandId = res.brandId
        resultSlug = res.slug
      } else {
        const created = await createBrand.mutateAsync({
          name: name.trim(),
          context: context.trim() || null,
          notes: notes.trim() || null,
          genders,
          categories: cleanedRows,
          price_context_ids: selectedContextIds,
          username: username ?? '',
        })
        resultBrandId = created.id
        resultSlug = created.slug
      }

      // Upload any selected logo files
      if (files.length > 0) {
        await uploadLogos.mutateAsync({
          brandId: resultBrandId,
          files,
          username: username ?? '',
        })
      }

      showToast(isEdit ? 'Brand updated' : 'Brand created')
      navigate(`/brand/${resultSlug}`)
    } catch (err: any) {
      setError(
        err?.message?.includes('duplicate key')
          ? 'A brand with this name already exists.'
          : err?.message ?? 'Failed to save brand.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← All Brands
          </Link>
          <h1 className="text-xl font-bold text-gray-800">
            {isEdit ? `Edit ${brand?.name}` : 'Create Brand Page'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Logo Upload */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Brand Logo(s) — Optional</h2>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={e => setFiles(e.target.files ? Array.from(e.target.files) : [])}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {files.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">{files.length} file(s) ready to upload.</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              You can upload multiple images now or later from the brand page.
            </p>
          </section>

          {/* 2. Brand Identity */}
          <section className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">2. Brand Identity</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Nike"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Context
              </label>
              <input
                type="text"
                value={context}
                onChange={e => setContext(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Subsidiary of Nike Inc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Any extra information about this brand..."
              />
            </div>
          </section>

          {/* 3. Gender */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              3. Gender <span className="text-red-500">*</span>
            </h2>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={genders.includes('Men')}
                  onChange={() => toggleGender('Men')}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Men</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={genders.includes('Women')}
                  onChange={() => toggleGender('Women')}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Women</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Categories below will be filtered by the selected gender(s).
            </p>
          </section>

          {/* 4. Categories with Pricing */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                4. Categories & Pricing <span className="text-red-500">*</span>
              </h2>
              <button
                type="button"
                onClick={addRow}
                disabled={genders.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-3 py-1.5 rounded-lg text-sm"
              >
                + Add Category
              </button>
            </div>

            {genders.length === 0 && (
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded">
                Select gender(s) above to enable category options.
              </p>
            )}

            {rows.length === 0 ? (
              <p className="text-gray-500 italic">No categories added yet.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((row, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                  >
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={row.category}
                        onChange={e => updateRow(idx, { category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select…</option>
                        {availableCategories.map(c => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                            {c.allowed_genders.length === 1 ? ` (${c.allowed_genders[0]})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Preset</label>
                      <select
                        value={row.preset_used ?? ''}
                        onChange={e => applyPreset(idx, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Custom</option>
                        {presets?.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Min ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.min_price}
                        onChange={e =>
                          updateRow(idx, { min_price: e.target.value, preset_used: null })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={row.max_price}
                        onChange={e =>
                          updateRow(idx, { max_price: e.target.value, preset_used: null })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeRow(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-bold"
                        title="Remove category"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 5. Price Contexts (optional) */}
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              5. Price Contexts (Optional)
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              Pick any modifiers that should be available on this brand's page.
              They appear as tickboxes next to the pricing table and add their
              amount to every price when toggled on.
            </p>
            {(priceContexts ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                No price contexts defined yet. Add them in Settings → Price Contexts.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {priceContexts!.map(ctx => {
                  const checked = selectedContextIds.includes(ctx.id)
                  return (
                    <label
                      key={ctx.id}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer ${
                        checked ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedContextIds(prev =>
                            prev.includes(ctx.id)
                              ? prev.filter(id => id !== ctx.id)
                              : [...prev, ctx.id],
                          )
                        }
                      />
                      <span className="text-sm text-gray-800">
                        {ctx.name}{' '}
                        <span className="text-gray-500">
                          ({Number(ctx.modifier_amount) >= 0 ? '+' : ''}
                          ${Number(ctx.modifier_amount).toFixed(2)})
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {submitting ? 'Saving…' : isEdit ? 'Update Brand' : 'Create Brand'}
            </button>
            <Link
              to={isEdit && brand ? `/brand/${brand.slug}` : '/'}
              className="flex-1 text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
