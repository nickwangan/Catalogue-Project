import { useState } from 'react'
import { usePriceContexts } from '../../hooks/useReference'
import {
  useCreatePriceContext,
  useDeletePriceContext,
  useUpdatePriceContext,
} from '../../hooks/useSettings'
import { useToast } from '../../context/ToastContext'
import { PriceContext } from '../../lib/supabase'

export function PriceContextsTab() {
  const { data: contexts, isLoading } = usePriceContexts()
  const [editing, setEditing] = useState<PriceContext | null>(null)
  const [creating, setCreating] = useState(false)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Price Contexts (Modifiers)</h2>
        <button
          onClick={() => setCreating(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >
          + New Price Context
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Price contexts are additive modifiers applied on top of a brand's base
        prices. Example: a "Linen" context with +$10 means clicking the
        Linen tickbox on a brand page adds $10 to both min and max for every
        category.
      </p>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-right px-4 py-2 text-sm font-semibold text-gray-700">Modifier ($)</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {(contexts ?? []).map(c => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2 text-right">
                  +${Number(c.modifier_amount).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => setEditing(c)}
                    className="text-indigo-600 hover:underline mr-3 text-sm"
                  >
                    Edit
                  </button>
                  <DeleteContextButton id={c.id} name={c.name} />
                </td>
              </tr>
            ))}
            {(contexts ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500 italic">
                  No price contexts yet. Click "+ New Price Context" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {(creating || editing) && (
        <ContextFormModal
          context={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function DeleteContextButton({ id, name }: { id: string; name: string }) {
  const del = useDeletePriceContext()
  const { showToast } = useToast()
  const handleClick = async () => {
    if (!confirm(`Delete price context "${name}"? Any brand using it will lose the modifier.`)) return
    try {
      await del.mutateAsync(id)
      showToast('Price context deleted')
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

function ContextFormModal({
  context,
  onClose,
}: {
  context: PriceContext | null
  onClose: () => void
}) {
  const [name, setName] = useState(context?.name ?? '')
  const [amount, setAmount] = useState(context?.modifier_amount?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const create = useCreatePriceContext()
  const update = useUpdatePriceContext()
  const { showToast } = useToast()
  const isEditing = context !== null
  const isPending = create.isPending || update.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const mod = parseFloat(amount)
    if (!name.trim()) return setError('Name is required.')
    if (isNaN(mod)) return setError('Modifier must be a valid number.')
    try {
      if (isEditing) {
        await update.mutateAsync({ id: context!.id, name: name.trim(), modifier_amount: mod })
        showToast('Price context updated')
      } else {
        await create.mutateAsync({ name: name.trim(), modifier_amount: mod })
        showToast('Price context created')
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
        <h3 className="text-xl font-bold mb-4">
          {isEditing ? 'Edit Price Context' : 'New Price Context'}
        </h3>
        {error && <div className="bg-red-50 text-red-700 px-3 py-2 rounded mb-3 text-sm">{error}</div>}
        <label className="block mb-3">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Linen"
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm font-medium text-gray-700">Modifier Amount ($)</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., 10"
          />
          <span className="text-xs text-gray-500 mt-1 block">
            This amount is added to both min and max prices when applied. Use a
            negative number for a discount.
          </span>
        </label>
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
