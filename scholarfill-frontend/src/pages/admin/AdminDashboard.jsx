import { useEffect, useState } from 'react';
import { Users, Briefcase } from 'lucide-react';
import { mockApi } from '../../hooks/useMockApi';

export default function AdminDashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [oppsCount, setOppsCount] = useState(0);

  useEffect(() => {
    mockApi.adminGetUsers().then(users => setUsersCount(users.length)).catch(() => {});
    mockApi.getOpportunities().then(opps => setOppsCount(opps.length)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-surface-200 flex items-center gap-4">
          <div className="p-4 bg-brand-50 text-brand-600 rounded-full">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-subtle">Total Users</p>
            <p className="text-2xl font-bold text-ink">{usersCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-surface-200 flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink-subtle">Active Opportunities</p>
            <p className="text-2xl font-bold text-ink">{oppsCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
