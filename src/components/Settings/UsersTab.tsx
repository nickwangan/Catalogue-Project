import { useAuth } from '../../hooks/useAuth'
import { useAllUsers, useUpdateUserRole } from '../../hooks/useSettings'
import { useToast } from '../../context/ToastContext'
import { UserProfile, UserRole } from '../../lib/supabase'

export function UsersTab() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useAllUsers()
  const updateRole = useUpdateUserRole()
  const { showToast } = useToast()

  const handleRoleChange = async (u: UserProfile, role: UserRole) => {
    if (u.role === role) return
    if (
      !confirm(
        `Change @${u.username} from ${u.role.toUpperCase()} to ${role.toUpperCase()}?`,
      )
    )
      return
    try {
      await updateRole.mutateAsync({ userId: u.user_id, role })
      showToast('Role updated')
    } catch (err) {
      showToast(
        'Update failed: ' + (err instanceof Error ? err.message : String(err)),
        'error',
      )
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Users</h2>
      <p className="text-sm text-gray-600 mb-4">
        Promote or demote users. The role you set here takes effect the next
        time the user reloads the app.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        💡 To fully delete an account, use the Supabase dashboard
        (Authentication → Users).
      </p>

      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Username</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Role</th>
              <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users ?? []).map(u => {
              const isSelf = u.user_id === currentUser?.id
              return (
                <tr key={u.user_id} className="border-t border-gray-200">
                  <td className="px-4 py-2 font-medium">
                    @{u.username}
                    {isSelf && (
                      <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                        you
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role}
                      disabled={isSelf || updateRole.isPending}
                      onChange={e => handleRoleChange(u, e.target.value as UserRole)}
                      className="px-2 py-1 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="admin">⭐ Admin</option>
                      <option value="manager">👔 Manager</option>
                      <option value="employee">👥 Employee</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500 italic">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
