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
        <h2 className="text-xl font-semibold mb-2">User Role Management</h2>
        <p className="text-gray-600">Only Admins can manage user roles.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">User Role Management</h2>
          <p className="text-gray-600">Admin-only control for assigning roles.</p>
        </div>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permission Role</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.email || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{user.role || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <select
                    className="border rounded px-2 py-1"
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
                    <div className="text-xs text-gray-500 mt-1">You cannot change your own role.</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-500">
                  {updatingId === user.id ? 'Saving…' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Role Changes</h3>
        {auditLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No role changes recorded.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <li key={log.id} className="py-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>
                    {log.actorId} changed {log.targetUserId || 'user'} from {log.oldValue || '—'} to {log.newValue || '—'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                  </span>
                </div>
                {log.reason && <div className="text-xs text-gray-500">Reason: {log.reason}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default UserRoleManagement;
