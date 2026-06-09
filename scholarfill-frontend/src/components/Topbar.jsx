import { useLocation, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useStore from '../store/useStore';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/upload-cv': 'My CV',
  '/add-form':  'Add New Form',
  '/settings':  'Settings',
  '/notifications': 'Notifications',
  '/opportunities': 'Opportunities Explorer',
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, markAllNotificationsRead } = useStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const title = Object.entries(PAGE_TITLES).find(([k]) =>
    location.pathname.startsWith(k)
  )?.[1] ?? 'Application Details';

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-6 flex-shrink-0 relative">
      <h1 className="text-sm font-semibold text-ink">{title}</h1>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (unreadCount > 0) markAllNotificationsRead();
            navigate('/notifications');
          }}
          className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-50 transition-colors text-ink-subtle hover:text-ink"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-1 bg-brand-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
