import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, PlusCircle, Settings,
  LogOut, ChevronLeft, Zap, X, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';

const NAV = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload-cv',     icon: Upload,          label: 'My CV'      },
  { to: '/add-form',      icon: PlusCircle,      label: 'Add Form'  },
  { to: '/opportunities', icon: Briefcase,       label: 'Opportunities' },
  { to: '/settings',      icon: Settings,        label: 'Settings'  },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, logout, user } = useStore();
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    toast.success('Signed out');
    setIsLogoutModalOpen(false);
    navigate('/');
  };

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-full bg-white border-r border-surface-200 flex flex-col transition-all duration-300 z-40"
        style={{ width: sidebarOpen ? '240px' : '64px' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-100">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-ink text-sm tracking-tight">scholarfill.ai</span>
          )}
          <button
            onClick={toggleSidebar}
            className="ml-auto text-ink-subtle hover:text-ink transition-colors"
          >
            <ChevronLeft
              size={16}
              className="transition-transform duration-300"
              style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-ink-muted hover:bg-surface-50 hover:text-ink'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} className={isActive ? 'text-brand-600' : 'text-ink-subtle group-hover:text-ink-muted'} />
                  {sidebarOpen && <span>{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>


        {/* User + logout */}
        {user && (
          <div className="border-t border-surface-100 p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {user.avatar}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-ink truncate">{user.name}</p>
                  <p className="text-xs text-ink-subtle truncate">{user.email}</p>
                </div>
              )}
              {sidebarOpen && (
                <button onClick={() => setIsLogoutModalOpen(true)} className="text-ink-subtle hover:text-red-500 transition-colors">
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-surface-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 relative space-y-6 animate-in">
            {/* Close Button */}
            <button
              onClick={() => setIsLogoutModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-ink-muted hover:text-ink hover:bg-surface-100 rounded-lg transition-colors"
            >
              <X size={15} />
            </button>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
                <LogOut size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink tracking-tight">Ready to leave?</h3>
                <p className="text-xs text-ink-muted leading-relaxed mt-1.5 max-w-[250px] mx-auto">
                  Are you sure you want to sign out? You will need to log back in to fill out more applications.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 bg-surface-50 hover:bg-surface-100 border border-surface-200 text-ink-muted hover:text-ink font-semibold text-xs py-2.5 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
