import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBrand } from '../../hooks/useBrand'
import { useDeleteBrand } from '../../hooks/useBrands'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import { LogoGallery } from './LogoGallery'
import { ChangeHistory } from './ChangeHistory'
import { PriceContext } from '../../lib/supabase'

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { canEditBrands, username } = useAuth()
  const { data: brand, isLoading, error } = useBrand(slug)
  const deleteBrand = useDeleteBrand()
  const { showToast } = useToast()

  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeContextIds, setActiveContextIds] = useState<string[]>([])

  const allCategories = useMemo(
    () => brand?.categories.map(c => c.category) ?? [],
    [brand],
  )

  const filteredCategories = useMemo(() => {
    if (!brand) return []
    if (categoryFilter.length === 0) return brand.categories
    return brand.categories.filter(c => categoryFilter.includes(c.category))
  }, [brand, categoryFilter])

  const activeContexts: PriceContext[] = useMemo(() => {
    if (!brand) return []
    return brand.price_contexts.filter(c => activeContextIds.includes(c.id))
  }, [brand, activeContextIds])

  const totalModifier = useMemo(
    () => activeContexts.reduce((sum, c) => sum + Number(c.modifier_amount), 0),
    [activeContexts],
  )

  const handleDelete = async () => {
    if (!brand) return
    if (!window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return
    try {
      await deleteBrand.mutateAsync(brand.id)
      showToast('Brand deleted')
      navigate('/')
    } catch (err) {
      showToast(
        'Error deleting: ' + (err instanceof Error ? err.message : 'Unknown'),
        'error',
      )
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading brand...</p>
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-700">Brand not found.</p>
        <Link to="/" className="text-indigo-600 hover:underline">← Back to brands</Link>
      </div>
    )
  }

  const hasActive = activeContexts.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← All Brands
          </Link>
          {canEditBrands && (
            <div className="flex gap-2">
              <Link
                to={`/brand/${brand.slug}/edit`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteBrand.isPending}
                className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Logo Gallery */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <LogoGallery
            brandId={brand.id}
            logos={brand.logos}
            canEdit={canEditBrands}
            username={username ?? ''}
          />
        </div>

        {/* Brand Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-1">{brand.name}</h1>
          {brand.context && (
            <p className="text-lg text-gray-600 italic mb-3">{brand.context}</p>
          )}
          <div className="flex gap-2 mb-4">
            {brand.genders.map(g => (
              <span key={g} className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                {g}
              </span>
            ))}
          </div>
          {brand.notes && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 Additional Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{brand.notes}</p>
            </div>
          )}
        </div>

        {/* Pricing Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">Pricing by Category</h2>
              {brand.price_contexts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 ml-2">
                  {brand.price_contexts.map(ctx => {
                    const checked = activeContextIds.includes(ctx.id)
                    return (
                      <label
                        key={ctx.id}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm cursor-pointer transition-colors ${
                          checked
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setActiveContextIds(prev =>
                              prev.includes(ctx.id)
                                ? prev.filter(id => id !== ctx.id)
                                : [...prev, ctx.id],
                            )
                          }
                          className="accent-amber-500"
                        />
                        <span className="font-medium">{ctx.name}</span>
                        <span className="text-xs text-gray-500">
                          ({Number(ctx.modifier_amount) >= 0 ? '+' : ''}
                          ${Number(ctx.modifier_amount).toFixed(2)})
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
            {allCategories.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(o => !o)}
                  className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
                >
                  Filter: {categoryFilter.length === 0 ? 'All' : `${categoryFilter.length} selected`}
                </button>
                {filterOpen && (
                  <div className="absolute right-0 mt-1 z-10 max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[220px]">
                    {allCategories.map(cat => (
                      <label
                        key={cat}
                        className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        <input
                          type="checkbox"
                          checked={categoryFilter.includes(cat)}
                          onChange={() =>
                            setCategoryFilter(prev =>
                              prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
                            )
                          }
                        />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                    {categoryFilter.length > 0 && (
                      <button
                        onClick={() => setCategoryFilter([])}
                        className="w-full mt-1 text-xs text-indigo-600 hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {filteredCategories.length === 0 ? (
            <p className="text-gray-500 italic">No categories yet.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-indigo-700 text-white">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-right font-semibold">Min ($)</th>
                    <th className="px-6 py-3 text-right font-semibold">Max ($)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((c, idx) => {
                    const baseMin = Number(c.min_price)
                    const baseMax = Number(c.max_price)
                    const totalMin = baseMin + totalModifier
                    const totalMax = baseMax + totalModifier
                    const rowBorder =
                      idx !== filteredCategories.length - 1 ? 'border-b-2 border-gray-300' : ''
                    return (
                      <tr key={c.id} className={rowBorder}>
                        <td className="px-6 py-4 font-medium text-gray-800">{c.category}</td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          <PriceCell
                            base={baseMin}
                            total={totalMin}
                            activeContexts={activeContexts}
                            showBreakdown={hasActive}
                          />
                        </td>
                        <td className="px-6 py-4 text-right text-gray-700">
                          <PriceCell
                            base={baseMax}
                            total={totalMax}
                            activeContexts={activeContexts}
                            showBreakdown={hasActive}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Change History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <ChangeHistory entries={brand.history} />
        </div>
      </main>
    </div>
  )
}

function PriceCell({
  base,
  total,
  activeContexts,
  showBreakdown,
}: {
  base: number
  total: number
  activeContexts: PriceContext[]
  showBreakdown: boolean
}) {
  if (!showBreakdown) {
    return <span>${base.toFixed(2)}</span>
  }
  return (
    <div className="flex flex-col items-end leading-tight">
      <span className="text-gray-700">${base.toFixed(2)}</span>
      {activeContexts.map(ctx => {
        const amt = Number(ctx.modifier_amount)
        const sign = amt >= 0 ? '+' : '−'
        return (
          <span key={ctx.id} className="text-xs text-amber-700">
            {sign}${Math.abs(amt).toFixed(2)}{' '}
            <span className="text-amber-500">({ctx.name})</span>
          </span>
        )
      })}
      <span className="font-bold text-amber-900 mt-0.5">${total.toFixed(2)}</span>
    </div>
  )
}
