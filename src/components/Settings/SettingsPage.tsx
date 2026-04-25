import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { PresetsTab } from './PresetsTab'
import { PriceContextsTab } from './PriceContextsTab'
import { CategoriesTab } from './CategoriesTab'
import { UsersTab } from './UsersTab'

type Tab = 'presets' | 'contexts' | 'categories' | 'users'

export function SettingsPage() {
  const { canEditBrands, isAdmin, username, role, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('presets')

  // Employees can't access Settings at all.
  if (!canEditBrands) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-3xl font-bold text-gray-800 hover:text-indigo-600 transition-colors"
            >
              Fashion Catalog
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-2xl font-semibold text-gray-700">⚙ Settings</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-700 font-medium">@{username ?? '...'}</p>
              <p className="text-xs text-gray-500 capitalize">
                {role === 'admin' && '⭐ Admin'}
                {role === 'manager' && '👔 Manager'}
                {role === 'employee' && '👥 Employee'}
              </p>
            </div>
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
        {/* Tab switcher */}
        <div className="bg-white rounded-lg shadow-md mb-6 flex border-b border-gray-200">
          <TabButton active={tab === 'presets'} onClick={() => setTab('presets')}>
            💲 Pricing Presets
          </TabButton>
          <TabButton active={tab === 'contexts'} onClick={() => setTab('contexts')}>
            ✨ Price Contexts
          </TabButton>
          <TabButton active={tab === 'categories'} onClick={() => setTab('categories')}>
            🏷️ Custom Categories
          </TabButton>
          {isAdmin && (
            <TabButton active={tab === 'users'} onClick={() => setTab('users')}>
              👥 Users
            </TabButton>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {tab === 'presets' && <PresetsTab />}
          {tab === 'contexts' && <PriceContextsTab />}
          {tab === 'categories' && <CategoriesTab />}
          {tab === 'users' && isAdmin && <UsersTab />}
        </div>
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-6 py-3 font-semibold transition-colors ${
        active
          ? 'text-indigo-700 border-b-2 border-indigo-600'
          : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}
