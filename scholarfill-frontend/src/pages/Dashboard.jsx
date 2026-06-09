import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import ApplicationCard from '../components/ApplicationCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { applications, cvProfile, user, setApplications } = useStore();
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    mockApi.getApplications()
      .then((apps) => setApplications(apps))
      .catch((err) => console.error('Failed to load applications:', err));
  }, []);

  const totalPages = Math.ceil(applications.length / itemsPerPage);

  // Auto-adjust page if list size shrinks below current page
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [applications.length, totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApplications = applications.slice(startIndex, startIndex + itemsPerPage);

  const stats = [
    { label: 'Total',     value: applications.length,                                          icon: FileText,    color: 'text-ink-muted',    bg: 'bg-surface-100' },
    { label: 'Submitted', value: applications.filter(a => a.status === 'submitted').length,    icon: CheckCircle, color: 'text-emerald-600',  bg: 'bg-emerald-50' },
    { label: 'Pending',   value: applications.filter(a => a.status === 'reviewed').length,     icon: Clock,       color: 'text-blue-600',     bg: 'bg-blue-50'    },
    { label: 'Failed',    value: applications.filter(a => a.status === 'failed').length,       icon: AlertCircle, color: 'text-red-500',      bg: 'bg-red-50'     },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-ink-subtle mt-0.5">Here's your application overview</p>
        </div>
        <button
          onClick={() => navigate('/add-form')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Add Form
        </button>
      </div>

      {/* CV Banner */}
      {!cvProfile ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-800">No CV uploaded yet</p>
            <p className="text-xs text-brand-600 mt-0.5">Upload your CV first to start auto-filling forms</p>
          </div>
          <button
            onClick={() => navigate('/upload-cv')}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Upload CV
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">CV active — {cvProfile.file_name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{cvProfile.structured_data.personal.full_name} · {cvProfile.structured_data.personal.email}</p>
          </div>
          <button onClick={() => navigate('/upload-cv')} className="ml-auto text-xs text-emerald-700 underline hover:text-emerald-800">
            Update
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-surface-200 rounded-2xl p-4 shadow-card">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-ink-subtle mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Applications list */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Recent Applications</h3>
        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Add a form link and scholarfill.ai will auto-fill it using your CV"
            action={
              <button
                onClick={() => navigate('/add-form')}
                className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
              >
                Add your first form
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {paginatedApplications.map((app) => <ApplicationCard key={app.id} app={app} />)}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-surface-200 pt-4 mt-6">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 border border-surface-200 rounded-xl text-xs font-medium text-ink-muted hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all
                        ${currentPage === p
                          ? 'bg-brand-600 text-white shadow-pop'
                          : 'border border-surface-200 text-ink-muted hover:bg-surface-50 hover:text-ink'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 border border-surface-200 rounded-xl text-xs font-medium text-ink-muted hover:bg-surface-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

