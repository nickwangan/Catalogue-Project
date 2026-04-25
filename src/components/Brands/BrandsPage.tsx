import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBrands } from '../../hooks/useBrands'
import { useCategories, usePricingPresets } from '../../hooks/useReference'
import { useAuth } from '../../hooks/useAuth'
import { Gender, BrandWithDetails } from '../../lib/supabase'

type SortMode =
  | 'name_asc'
  | 'name_desc'
  | 'min_asc'
  | 'min_desc'
  | 'max_asc'
  | 'max_desc'

export function BrandsPage() {
  const { canEditBrands, username, role, logout } = useAuth()
  const { data: brands, isLoading } = useBrands()
  const { data: categories } = useCategories()
  const { data: presets } = usePricingPresets()

  const [sortMode, setSortMode] = useState<SortMode>('name_asc')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<Gender | ''>('')

  const filteredAndSorted = useMemo(() => {
    if (!brands) return []
    let result = [...brands]

    // Filter by brand selection (multi)
    if (selectedBrands.length > 0) {
      result = result.filter(b => selectedBrands.includes(b.name))
    }

    // Filter by category (must contain at least one of the selected categories)
    if (selectedCategories.length > 0) {
      result = result.filter(b =>
        b.categories.some(c => selectedCategories.includes(c.category)),
      )
    }

    // Filter by preset
    if (selectedPreset) {
      result = result.filter(b =>
        b.categories.some(c => c.preset_used === selectedPreset),
      )
    }

    // Filter by gender
    if (selectedGender) {
      result = result.filter(b => b.genders.includes(selectedGender))
    }

    // Sort
    result.sort((a, b) => {
      const aMin = Math.min(...a.categories.map(c => Number(c.min_price)), Infinity)
      const aMax = Math.max(...a.categories.map(c => Number(c.max_price)), -Infinity)
      const bMin = Math.min(...b.categories.map(c => Number(c.min_price)), Infinity)
      const bMax = Math.max(...b.categories.map(c => Number(c.max_price)), -Infinity)

      switch (sortMode) {
        case 'name_asc':
          return a.name.localeCompare(b.name)
        case 'name_desc':
          return b.name.localeCompare(a.name)
        case 'min_asc':
          return aMin - bMin
        case 'min_desc':
          return bMin - aMin
        case 'max_asc':
          return aMax - bMax
        case 'max_desc':
          return bMax - aMax
        default:
          return 0
      }
    })

    return result
  }, [brands, selectedBrands, selectedCategories, selectedPreset, selectedGender, sortMode])

  const clearFilters = () => {
    setSelectedBrands([])
    setSelectedCategories([])
    setSelectedPreset('')
    setSelectedGender('')
    setSortMode('name_asc')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Fashion Catalog</h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-700 font-medium">@{username ?? '...'}</p>
              <p className="text-xs text-gray-500 capitalize">
                {role === 'admin' && '⭐ Admin'}
                {role === 'manager' && '👔 Manager'}
                {role === 'employee' && '👥 Employee'}
              </p>
            </div>
            {canEditBrands && (
              <Link
                to="/settings"
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg transition-colors"
                title="Settings"
              >
                ⚙ Settings
              </Link>
            )}
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Top controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            {canEditBrands && (
              <Link
                to="/brand/new"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
              >
                + Create Brand Page
              </Link>
            )}

            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name_asc">Sort: Name A→Z</option>
              <option value="name_desc">Sort: Name Z→A</option>
              <option value="min_asc">Sort: Min Price ↑</option>
              <option value="min_desc">Sort: Min Price ↓</option>
              <option value="max_asc">Sort: Max Price ↑</option>
              <option value="max_desc">Sort: Max Price ↓</option>
            </select>

            <select
              value={selectedGender}
              onChange={e => setSelectedGender((e.target.value as Gender) || '')}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Genders</option>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
            </select>

            <select
              value={selectedPreset}
              onChange={e => setSelectedPreset(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Presets</option>
              {presets?.map(p => (
                <option key={p.id} value={p.name}>
                  {p.name} (${Number(p.min_price).toFixed(2)} - ${Number(p.max_price).toFixed(2)})
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <MultiSelect
              label="Filter by Brand"
              options={(brands ?? []).map(b => b.name)}
              selected={selectedBrands}
              setSelected={setSelectedBrands}
            />
            <MultiSelect
              label="Filter by Category (any)"
              options={(categories ?? []).map(c => c.name)}
              selected={selectedCategories}
              setSelected={setSelectedCategories}
            />
          </div>
        </div>

        {/* Results */}
        <p className="text-gray-600 mb-3">
          Showing <strong>{filteredAndSorted.length}</strong> of <strong>{brands?.length ?? 0}</strong> brands
        </p>

        {isLoading ? (
          <p className="text-center text-gray-500 py-12">Loading brands...</p>
        ) : filteredAndSorted.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
            No brands yet. {canEditBrands && 'Click "Create Brand Page" to add your first brand.'}
          </div>
        ) : (
          <BrandsTable brands={filteredAndSorted} />
        )}
      </main>
    </div>
  )
}

// ============================================================
// Brands Table
// ============================================================
function BrandsTable({ brands }: { brands: BrandWithDetails[] }) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Logo</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Brand</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Genders</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Categories</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Price Range</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody>
            {brands.map(brand => {
              const minPrice = Math.min(...brand.categories.map(c => Number(c.min_price)), Infinity)
              const maxPrice = Math.max(...brand.categories.map(c => Number(c.max_price)), -Infinity)
              const priceRangeText = brand.categories.length === 0
                ? '—'
                : `$${minPrice.toFixed(2)} – $${maxPrice.toFixed(2)}`

              return (
                <tr key={brand.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {brand.logos[0] ? (
                      <img
                        src={brand.logos[0].image_url}
                        alt={brand.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                        N/A
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    <Link to={`/brand/${brand.slug}`} className="text-indigo-600 hover:underline">
                      {brand.name}
                    </Link>
                    {brand.context && <p className="text-xs text-gray-500">{brand.context}</p>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{brand.genders.join(' / ')}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{brand.categories.length}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{priceRangeText}</td>
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/brand/${brand.slug}`}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// Reusable Multi-Select Component
// ============================================================
function MultiSelect({
  label,
  options,
  selected,
  setSelected,
}: {
  label: string
  options: string[]
  selected: string[]
  setSelected: (v: string[]) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value))
    } else {
      setSelected([...selected, value])
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full text-left px-4 py-2 border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {selected.length === 0
          ? `All (${options.length})`
          : `${selected.length} selected: ${selected.slice(0, 2).join(', ')}${selected.length > 2 ? '…' : ''}`}
      </button>
      {isOpen && (
        <div className="mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg p-2">
          {options.length === 0 ? (
            <p className="text-sm text-gray-500 px-2 py-1">No options</p>
          ) : (
            options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer rounded">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  )
}
