import { useState } from 'react'
import { usePricingPresets } from '../../hooks/useReference'
import {
  useCreatePreset,
  useDeletePreset,
  useUpdatePreset,
} from '../../hooks/useSettings'
import { useToast } from '../../context/ToastContext'
import { PricingPreset } from '../../lib/supabase'

export function PresetsTab() {
  const { data: presets, isLoading } = usePricingPresets()
  const [editing, setEditing] = useState<PricingPreset | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Pricing Presets</h2>
        <button
          onClick={() => setCreating(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          + New Preset
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Presets let you quickly fill in min/max prices on a brand's category row.
        Edit a preset here and any new brand using it will pick up the new values
        (existing brand rows keep the prices they were saved with).
      </p>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-right px-4 py-2 text-sm font-semibold text-gray-700">Min Price</th>
              <th className="text-right px-4 py-2 text-sm font-semibold text-gray-700">Max Price</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(presets ?? []).map(p => (
              <tr key={p.id} className="border-t border-gray-200">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-right">${Number(p.min_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">${Number(p.max_price).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => setEditing(p)}
                    className="text-indigo-600 hover:underline mr-3 text-sm"
                  >
                    Edit
                  </button>
                  <DeletePresetButton id={p.id} name={p.name} />
                </td>
              </tr>
            ))}
            {(presets ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                  No presets yet. Click "+ New Preset" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {(creating || editing) && (
        <PresetFormModal
          preset={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function DeletePresetButton({ id, name }: { id: string; name: string }) {
  const del = useDeletePreset()
  const { showToast } = useToast()
  const handleClick = async () => {
    if (!confirm(`Delete preset "${name}"? Brands already using it keep their prices.`)) return
    try {
      await del.mutateAsync(id)
      showToast('Preset deleted')
    } catch (err) {
      showToast('Delete failed: ' + (err instanceof Error ? err.message : String(err)), 'error')
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

function PresetFormModal({
  preset,
  onClose,
}: {
  preset: PricingPreset | null
  onClose: () => void
}) {
  const [name, setName] = useState(preset?.name ?? '')
  const [minPrice, setMinPrice] = useState(preset?.min_price?.toString() ?? '')
  const [maxPrice, setMaxPrice] = useState(preset?.max_price?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const create = useCreatePreset()
  const update = useUpdatePreset()
  const { showToast } = useToast()
  const isEditing = preset !== null
  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const min = parseFloat(minPrice)
    const max = parseFloat(maxPrice)
    if (!name.trim()) return setError('Name is required.')
    if (isNaN(min) || isNaN(max)) return setError('Prices must be valid numbers.')
    if (min < 0 || max < 0) return setError('Prices must be non-negative.')
    if (max < min) return setError('Max price cannot be less than min price.')
    try {
      if (isEditing) {
        await update.mutateAsync({ id: preset!.id, name: name.trim(), min_price: min, max_price: max })
        showToast('Preset updated')
      } else {
        await create.mutateAsync({ name: name.trim(), min_price: min, max_price: max })
        showToast('Preset created')
      }
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
        <h3 className="text-xl font-bold mb-4">{isEditing ? 'Edit Preset' : 'New Preset'}</h3>
        {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Preset Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Premium"
          />
        </label>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <label>
            <span className="text-sm font-medium text-gray-700">Min Price ($)</span>
            <input
              type="number"
              step="0.01"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-gray-700">Max Price ($)</span>
            <input
              type="number"
              step="0.01"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
            disabled={isPending}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
