import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../../store/useStore';
import { mockApi } from '../../hooks/useMockApi';

export default function AdminLogin() {
  const { login, logout } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Authenticating admin...');
    try {
      const { user, token } = await mockApi.login(email, password);
      
      if (!user.is_admin) {
        toast.error('Unauthorized: Admin access required', { id: toastId });
        logout(); // ensure we don't pollute state
        setLoading(false);
        return;
      }
      
      login(user, token);
      toast.success('Admin authentication successful', { id: toastId });
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.detail ?? err.message ?? 'Authentication failed', { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-6 selection:bg-brand-100 font-display relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-50/50 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-sm space-y-8 z-10 relative">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center justify-center gap-2">
              Admin Portal
              <ShieldAlert size={20} className="text-brand-600" />
            </h1>
            <p className="text-sm text-ink-subtle mt-1">Sign in to manage scholarfill.ai</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-surface-200 shadow-xl shadow-brand-50/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-brand-400 focus:shadow-input transition-all text-ink font-medium"
                placeholder="admin@scholarfill.ai"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:border-brand-400 focus:shadow-input transition-all text-ink font-medium"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-brand-200 disabled:opacity-60 disabled:hover:bg-brand-600 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
