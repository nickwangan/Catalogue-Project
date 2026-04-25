import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useBrand } from '../../hooks/useBrand'
import { useDeleteBrand } from '../../hooks/useBrands'
import { useAuth } from '../../hooks/useAuth'
import { LogoGallery } from './LogoGallery'
import { ChangeHistory } from './ChangeHistory'

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { canEditBrands, username } = useAuth()
  const { data: brand, isLoading, error } = useBrand(slug)
  const deleteBrand = useDeleteBrand()

  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)

  const allCategories = useMemo(
    () => brand?.categories.map(c => c.category) ?? [],
    [brand],
  )

  const filteredCategories = useMemo(() => {
    if (!brand) return []
    if (categoryFilter.length === 0) return brand.categories
    return brand.categories.filter(c => categoryFilter.includes(c.category))
  }, [brand, categoryFilter])

  const handleDelete = async () => {
    if (!brand) return
    if (!window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return
    try {
      await deleteBrand.mutateAsync(brand.id)
      navigate('/')
    } catch (err) {
      alert('Error deleting: ' + (err instanceof Error ? err.message : 'Unknown'))
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
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Pricing by Category</h2>
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
                  {filteredCategories.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`${idx !== filteredCategories.length - 1 ? 'border-b-2 border-gray-300' : ''}`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-800">{c.category}</td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        ${Number(c.min_price).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-700">
                        ${Number(c.max_price).toFixed(2)}
                      </td>
                    </tr>
                  ))}
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
