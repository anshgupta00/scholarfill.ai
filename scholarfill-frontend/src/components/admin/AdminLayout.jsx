import { Outlet, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Briefcase, Bell, LogOut } from 'lucide-react';
import useStore from '../../store/useStore';
import toast from 'react-hot-toast';

export default function AdminLayout() {
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const location = useLocation();
  const navigate = useNavigate();

  if (!user?.is_admin) {
    return <Navigate to="/adminlogin" replace />;
  }

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Opportunities', path: '/admin/opportunities', icon: Briefcase },
    { name: 'Notifications', path: '/admin/notifications', icon: Bell },
  ];

  const handleLogout = () => {
    logout();
    toast.success('Signed out of Admin Panel');
    navigate('/adminlogin');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-surface-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-surface-100">
          <h2 className="text-xl font-bold text-ink">Admin Panel</h2>
          <p className="text-xs text-ink-muted mt-1">scholarfill.ai</p>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'bg-brand-50 text-brand-700 border border-brand-100' 
                    : 'text-ink-muted hover:bg-surface-50 hover:text-ink'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="border-t border-surface-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-ink truncate">{user?.name}</p>
              <p className="text-[10px] text-ink-muted truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-all"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
