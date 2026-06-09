import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle2, AlertCircle, Sparkles, X, Inbox, ArrowLeft, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, setNotifications, markAllNotificationsRead, clearNotification } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getNotifications()
      .then(data => {
        // map backend keys to frontend expected keys (e.g., created_at -> timestamp, is_read -> read)
        const mapped = data.map(n => ({
          ...n,
          timestamp: n.created_at,
          read: n.is_read
        }));
        setNotifications(mapped);
      })
      .finally(() => setLoading(false));
  }, [setNotifications]);

  const handleNotificationClick = async (n) => {
    if (!n.read) {
      await mockApi.markNotificationRead(n.id);
      n.read = true;
      setNotifications([...notifications]); // trigger re-render
    }
    if (n.link) navigate(n.link);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-surface-200 rounded-3xl p-6 md:p-8 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 border border-brand-100 shadow-sm">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-brand-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {unreadCount} New
                </span>
              )}
            </h1>
            <p className="text-sm text-ink-subtle mt-1">Stay updated on your auto-filled applications and account activity.</p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-surface-50 hover:bg-surface-100 border border-surface-200 text-ink-muted hover:text-ink font-semibold text-xs rounded-xl transition-all shadow-sm"
          >
            <CheckCircle2 size={14} /> Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-surface-200 rounded-3xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-24 px-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-surface-50 rounded-full flex items-center justify-center text-ink-muted mb-4 border border-surface-100 shadow-sm">
              <Inbox size={28} />
            </div>
            <h3 className="text-lg font-bold text-ink tracking-tight">All caught up!</h3>
            <p className="text-sm text-ink-subtle mt-1.5 max-w-sm">
              You don't have any notifications at the moment. Alerts about your form submission status will appear here.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-6 inline-flex items-center gap-2 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all border border-brand-100"
            >
              <ArrowLeft size={16} /> Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 sm:p-6 flex items-start sm:items-center gap-4 transition-colors group hover:bg-surface-50 cursor-pointer
                  ${!n.read ? 'bg-brand-50/20' : ''}`}
                onClick={() => handleNotificationClick(n)}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1 sm:mt-0">
                  {n.type === 'success' && (
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                      <CheckCircle2 size={20} />
                    </div>
                  )}
                  {n.type === 'error' && (
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                      <AlertCircle size={20} />
                    </div>
                  )}
                  {n.type === 'info' && (
                    <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm">
                      <Sparkles size={20} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                    <p className={`text-sm md:text-base font-semibold truncate ${!n.read ? 'text-brand-950 font-bold' : 'text-ink'}`}>
                      {n.title}
                    </p>
                    <span className="text-xs text-ink-subtle whitespace-nowrap font-medium">
                      {formatRelativeTime(n.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted leading-relaxed">
                    {n.message}
                  </p>
                </div>

                {/* Action: Clear */}
                <div className="flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearNotification(n.id);
                    }}
                    className="p-2 text-ink-subtle hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Remove notification"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
