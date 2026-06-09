import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ErrorBoundary from './ErrorBoundary';
import useStore from '../store/useStore';

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

