import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';
import { mockApi } from '../hooks/useMockApi';
import useStore from '../store/useStore';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ApplicationCard({ app }) {
  const navigate = useNavigate();
  const setApplications = useStore(s => s.setApplications);
  const applications = useStore(s => s.applications);

  const handleDelete = async (e) => {
    e.stopPropagation(); // don't navigate to detail
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">Delete this application?</p>
        <p className="text-xs text-ink-subtle truncate max-w-[200px]">{app.form_title}</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading('Deleting…');
              try {
                await mockApi.deleteApplication(app.id);
                setApplications(applications.filter(a => a.id !== app.id));
                toast.success('Application deleted', { id: deleteToast });
              } catch (err) {
                toast.error(err.response?.data?.detail ?? 'Delete failed', { id: deleteToast });
              }
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 border border-surface-200 hover:bg-surface-50 text-ink text-xs font-medium py-1.5 px-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return (
    <div
      onClick={() => navigate(`/applications/${app.id}`)}
      className="bg-white border border-surface-200 rounded-2xl p-5 cursor-pointer hover:shadow-card hover:border-surface-300 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate group-hover:text-brand-700 transition-colors">
            {app.form_title}
          </h3>
          <p className="text-xs text-ink-subtle mt-0.5 truncate flex items-center gap-1">
            <ExternalLink size={11} />
            {app.form_url}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={app.status} />
          <button
            onClick={handleDelete}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-subtle hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete application"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-ink-subtle">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(app.created_at)}
        </span>
        {app.form_fields?.length > 0 && (
          <span>{app.form_fields.length} fields</span>
        )}
        {app.submitted_at && (
          <span className="text-emerald-600 font-medium">✓ Submitted</span>
        )}
      </div>
    </div>
  );
}
