import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { user, token } = await mockApi.register(name, email, password);
      login(user, token);
      toast.success('Account created! Welcome to scholarfill.ai 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.detail ?? err.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-ink tracking-tight">scholarfill.ai</span>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-8">
          <h2 className="text-xl font-semibold text-ink mb-1">Create account</h2>
          <p className="text-sm text-ink-subtle mb-6">Start auto-filling scholarship forms in minutes</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, set: setName, type: 'text', placeholder: 'Ansh Gupta' },
              { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '•••••••• (min 8 chars)' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl py-2.5 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-subtle mt-5">
            Already have one?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
