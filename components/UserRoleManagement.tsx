import React, { useEffect, useMemo, useState } from 'react';
import { listUsers, updateUserRole, getAuditLogs, UserItem, AuditLogItem } from '../services/apiService';
import { User } from '../types';

interface Props {
  currentUser: User | null;
}

const roleOptions = ['Admin', 'Head Technician', 'Technician', 'Requester'];

const UserRoleManagement: React.FC<Props> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isAdmin = useMemo(() => currentUser?.userRole === 'Admin', [currentUser]);

  useEffect(() => {
    const loadData = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [fetchedUsers, logs] = await Promise.all([listUsers(), getAuditLogs()]);
        setUsers(fetchedUsers);
        setAuditLogs(logs.filter((l) => l.action === 'role_change'));
        setError(null);
      } catch (err: any) {
        setError(err?.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!isAdmin) return;
    const user = users.find((u) => u.id === userId);
    if (!user || user.userRole === newRole) return;

    const reason = window.prompt(
      `Change role for ${user.name} from ${user.userRole} to ${newRole}. Please provide a reason:`
    );
    if (reason === null) return;

    setUpdatingId(userId);
    try {
      const updated = await updateUserRole(userId, newRole, reason || undefined);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, userRole: updated.userRole, role: updated.role } : u)));
      const refreshedLogs = await getAuditLogs();
      setAuditLogs(refreshedLogs.filter((l) => l.action === 'role_change'));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2 text-stone-900 dark:text-stone-100">User Role Management</h2>
        <p className="text-stone-600 dark:text-stone-400">Only Admins can manage user roles.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-stone-600 dark:text-stone-400">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">User Role Management</h2>
          <p className="text-stone-600 dark:text-stone-400">Admin-only control for assigning roles.</p>
        </div>
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
      </div>

      <div className="bg-white dark:bg-stone-800 shadow rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700">
        <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-700">
          <thead className="bg-stone-50 dark:bg-stone-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Display Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wider">Permission Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-stone-800 divide-y divide-stone-200 dark:divide-stone-700">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-stone-50 dark:hover:bg-stone-700/50">
                <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">{user.name}</td>
                <td className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400">{user.email || '—'}</td>
                <td className="px-4 py-3 text-sm text-stone-500 dark:text-stone-400">{user.role || '—'}</td>
                <td className="px-4 py-3 text-sm text-stone-900 dark:text-stone-100">
                  <select
                    className="border border-stone-200 dark:border-stone-600 rounded px-2 py-1 bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={user.userRole}
                    disabled={user.id === currentUser?.id || updatingId === user.id}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  {user.id === currentUser?.id && (
                    <div className="text-xs text-stone-500 dark:text-stone-400 mt-1">You cannot change your own role.</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm text-stone-500 dark:text-stone-400">
                  {updatingId === user.id ? 'Saving…' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-stone-800 shadow rounded-lg p-4 border border-stone-200 dark:border-stone-700">
        <h3 className="text-lg font-semibold mb-3 text-stone-900 dark:text-stone-100">Recent Role Changes</h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">No role changes recorded.</p>
        ) : (
          <ul className="divide-y divide-stone-200 dark:divide-stone-700">
            {auditLogs.map((log) => (
              <li key={log.id} className="py-2 text-sm text-stone-700 dark:text-stone-300">
                <div className="flex justify-between">
                  <span>
                    {log.actorId} changed {log.targetUserId || 'user'} from {log.oldValue || '—'} to {log.newValue || '—'}
                  </span>
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                {log.reason && <div className="text-xs text-stone-500 dark:text-stone-400">Reason: {log.reason}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserRoleManagement;
