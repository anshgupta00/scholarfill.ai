import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useStore();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`Google Sign-In failed: ${error}`);
      navigate('/');
      return;
    }

    if (token) {
      localStorage.setItem('sf_token', token);
      mockApi.getMe()
        .then(user => {
          login(user, token);
          toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
          navigate('/dashboard');
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to fetch user profile');
          navigate('/');
        });
    } else {
      navigate('/');
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-subtle">Authenticating...</p>
      </div>
    </div>
  );
}
