import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useStore from './store/useStore';
import { mockApi } from './hooks/useMockApi';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadCV from './pages/UploadCV';
import AddForm from './pages/AddForm';
import ApplicationDetail from './pages/ApplicationDetail';
import Settings from './pages/Settings';
import Landing from './pages/Landing';
import Opportunities from './pages/Opportunities';
import AuthCallback from './pages/AuthCallback';
import Notifications from './pages/Notifications';

import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManageOpportunities from './pages/admin/ManageOpportunities';
import ManageNotifications from './pages/admin/ManageNotifications';

function PrivateRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { login, logout, setCVProfile } = useStore();
  // true while we're checking the stored token — prevents PrivateRoute from
  // redirecting to /login before the async auth check completes
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sf_token');
    if (!token) {
      setInitializing(false);
      return;
    }

    // Restore session: fetch user + CV in parallel
    mockApi.getMe()
      .then(async (user) => {
        login(user, token);
        // Restore CV profile silently — ignore 404 (no CV uploaded yet)
        try {
          const cv = await mockApi.getCV();
          setCVProfile(cv);
        } catch {
          // No CV yet — that's fine
        }
      })
      .catch(() => {
        // Token expired or invalid — clear it
        localStorage.removeItem('sf_token');
        logout();
      })
      .finally(() => {
        setInitializing(false);
      });
  }, []);

  // Block rendering until we know auth state — prevents flash-redirect to /login
  if (initializing) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#1a1a2e',
            border: '1px solid #e8e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload-cv" element={<UploadCV />} />
          <Route path="add-form" element={<AddForm />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        {/* Admin Routes */}
        <Route path="/admin" element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="opportunities" element={<ManageOpportunities />} />
          <Route path="notifications" element={<ManageNotifications />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
