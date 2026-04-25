import { useState } from 'react'
import { useCategories } from '../../hooks/useReference'
import { useCreateCategory, useDeleteCategory } from '../../hooks/useSettings'
import { Gender } from '../../lib/supabase'

export function CategoriesTab() {
  const { data: categories, isLoading } = useCategories()
  const [creating, setCreating] = useState(false)

  const predefined = (categories ?? []).filter(c => c.is_predefined)
  const custom = (categories ?? []).filter(c => !c.is_predefined)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Categories</h2>
        <button
          onClick={() => setCreating(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          + New Category
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        The 15 predefined categories are locked and can't be deleted. You can
        add custom categories with the genders they apply to.
      </p>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Custom ({custom.length})
          </h3>
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden mb-6">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Allowed Genders</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {custom.map(c => (
                <tr key={c.id} className="border-t border-gray-200">
                  <td className="px-4 py-2">{c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {c.allowed_genders.join(', ')}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <DeleteCategoryButton id={c.id} name={c.name} />
                  </td>
                </tr>
              ))}
              {custom.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500 italic">
                    No custom categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
            Predefined ({predefined.length}) — locked
          </h3>
          <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Allowed Genders</th>
              </tr>
            </thead>
            <tbody>
              {predefined.map(c => (
                <tr key={c.id} className="border-t border-gray-200 bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">🔒 {c.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{c.allowed_genders.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {creating && <CategoryFormModal onClose={() => setCreating(false)} />}
    </div>
  )
}

function DeleteCategoryButton({ id, name }: { id: number; name: string }) {
  const del = useDeleteCategory()
  const handleClick = async () => {
    if (
      !confirm(
        `Delete category "${name}"?\n\nBrands already using it keep their pricing rows; the category just won't be selectable for new brands.`,
      )
    )
      return
    try {
      await del.mutateAsync(id)
    } catch (err) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : String(err)))
    }
  }
  return (
    <button
      onClick={handleClick}
      disabled={del.isPending}
      className="text-red-600 hover:underline text-sm disabled:opacity-50"
    >
      {del.isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}

function CategoryFormModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [men, setMen] = useState(true)
  const [women, setWomen] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const create = useCreateCategory()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) return setError('Name is required.')
    if (!men && !women) return setError('Pick at least one gender.')
    const allowed: Gender[] = []
    if (men) allowed.push('Men')
    if (women) allowed.push('Women')
    try {
      await create.mutateAsync({ name: name.trim(), allowed_genders: allowed })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
      >
        <h3 className="text-xl font-bold mb-4">New Custom Category</h3>
        {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Category Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Hats"
          />
        </label>
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-700 block mb-2">Allowed Genders</span>
          <label className="inline-flex items-center mr-4">
            <input
              type="checkbox"
              checked={men}
              onChange={e => setMen(e.target.checked)}
              className="mr-2"
            />
            Men
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={women}
              onChange={e => setWomen(e.target.checked)}
              className="mr-2"
            />
            Women
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
          >
            {create.isPending ? 'Saving…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
