import { useAuth } from '../../hooks/useAuth'
import {
  useAllUsers,
  useDeleteUserProfile,
  useUpdateUserRole,
} from '../../hooks/useSettings'
import { UserProfile, UserRole } from '../../lib/supabase'

export function UsersTab() {
  const { user: currentUser } = useAuth()
  const { data: users, isLoading } = useAllUsers()
  const updateRole = useUpdateUserRole()
  const deleteProfile = useDeleteUserProfile()

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
    } catch (err) {
      alert('Update failed: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const handleDelete = async (u: UserProfile) => {
    if (
      !confirm(
        `Remove @${u.username}'s profile?\n\nThis only deletes their role/username — the auth login still exists in Supabase. To fully remove the account, also delete the user from Supabase → Authentication → Users.`,
      )
    )
      return
    try {
      await deleteProfile.mutateAsync(u.user_id)
    } catch (err) {
      alert('Delete failed: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Users</h2>
      <p className="text-sm text-gray-600 mb-4">
        Promote, demote, or remove users. The role you set here takes effect the
        next time the user reloads the app.
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
              <th className="px-4 py-2"></th>
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
                  <td className="px-4 py-2 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={deleteProfile.isPending}
                        className="text-red-600 hover:underline text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {(users ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500 italic">
                  No users yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <p className="text-xs text-gray-500 mt-4">
        💡 You can't change or remove your own role here, to prevent accidentally
        locking yourself out.
      </p>
    </div>
  )
}
