import { useEffect, useState } from 'react';
import { mockApi } from '../../hooks/useMockApi';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    mockApi.adminGetUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    try {
      await mockApi.adminDeleteUser(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Manage Users</h1>
      <div className="bg-white rounded-3xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-muted">Loading users...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-50 text-ink-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Auth Method</th>
                <th className="px-6 py-4 font-semibold">Admin</th>
                <th className="px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {users.map(u => (
                <tr key={u.id}>
                  <td className="px-6 py-4 font-medium text-ink">{u.name}</td>
                  <td className="px-6 py-4 text-ink-subtle">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-surface-100 text-ink-muted rounded-md text-xs font-semibold">
                      {u.auth_method}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.is_admin ? (
                      <span className="text-brand-600 font-bold">Yes</span>
                    ) : (
                      <span className="text-ink-subtle">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleDelete(u.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
