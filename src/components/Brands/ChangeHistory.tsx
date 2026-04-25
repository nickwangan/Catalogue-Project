import { useState } from 'react'
import { ChangeHistoryEntry } from '../../lib/supabase'

export function ChangeHistory({ entries }: { entries: ChangeHistoryEntry[] }) {
  const [open, setOpen] = useState(false)

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex justify-between items-center py-2 text-left"
      >
        <span className="text-lg font-semibold text-gray-800">
          📜 Change History ({entries.length})
        </span>
        <span className="text-gray-500">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-3 border-t border-gray-200 pt-3">
          {entries.length === 0 ? (
            <p className="text-gray-500 italic">No changes recorded yet.</p>
          ) : (
            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {entries.map(e => (
                <li
                  key={e.id}
                  className="border-l-4 border-indigo-500 bg-gray-50 px-4 py-2 rounded"
                >
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <span className="font-semibold text-gray-800">@{e.changed_by_username}</span>
                      <span className="text-gray-600"> {actionLabel(e.change_type)}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatDate(e.changed_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{e.change_summary}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function actionLabel(type: string): string {
  switch (type) {
    case 'created':
      return 'created the brand'
    case 'updated':
      return 'updated the brand'
    case 'logo_added':
      return 'added logo(s)'
    case 'logo_removed':
      return 'removed a logo'
    default:
      return type
  }
}
