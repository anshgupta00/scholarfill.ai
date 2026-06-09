import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Link2, Unlink, Loader2, ExternalLink } from 'lucide-react';
import { mockApi } from '../hooks/useMockApi';
import toast from 'react-hot-toast';

/**
 * Card that shows Google account connection status and lets the user
 * connect / disconnect their Google account for sign-in-restricted forms.
 */
export default function GoogleConnect() {
  const [status, setStatus] = useState(null);   // null = loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mockApi.googleStatus()
      .then(setStatus)
      .catch(() => setStatus({ oauth_configured: false, connected: false }));

    // Handle redirect back from Google with ?google=connected / ?google=error
    const params = new URLSearchParams(window.location.search);
    const result = params.get('google');
    if (result === 'connected') {
      toast.success('Google account connected! You can now scrape sign-in-required forms.');
      // Re-fetch status
      mockApi.googleStatus().then(setStatus).catch(() => {});
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (result === 'error') {
      const reason = params.get('reason') ?? 'unknown';
      toast.error(`Failed to connect Google account: ${reason}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const url = await mockApi.googleLoginUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to initiate Google login');
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await mockApi.googleUnlink();
      setStatus(prev => ({ ...prev, connected: false }));
      toast.success('Google account disconnected');
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (status === null) {
    return (
      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card">
        <div className="flex items-center gap-2 text-ink-subtle text-sm">
          <Loader2 size={15} className="animate-spin" /> Checking Google connection…
        </div>
      </div>
    );
  }

  const { oauth_configured, connected, token_expiry } = status;

  return (
    <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Google logo */}
          <div className="w-9 h-9 rounded-xl bg-surface-50 border border-surface-200 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Google Account</h3>
            <p className="text-xs text-ink-subtle mt-0.5">
              Required for forms that need sign-in to view
            </p>
          </div>
        </div>

        {/* Status badge */}
        {connected ? (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full flex-shrink-0">
            <CheckCircle2 size={11} /> Connected
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-muted bg-surface-100 px-2.5 py-1 rounded-full flex-shrink-0">
            Not connected
          </span>
        )}
      </div>

      {/* Not configured warning */}
      {!oauth_configured && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
          <AlertCircle size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-amber-700">OAuth not configured</p>
            <p className="text-xs text-amber-600 leading-relaxed">
              Add <code className="bg-amber-100 px-1 rounded font-mono">GOOGLE_CLIENT_ID</code> and{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">GOOGLE_CLIENT_SECRET</code> to your{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">.env</code> file.
            </p>
            <a
              href="https://console.cloud.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 underline hover:text-amber-800"
            >
              Open Google Cloud Console <ExternalLink size={10} />
            </a>
          </div>
        </div>
      )}

      {/* Connected info */}
      {connected && token_expiry && (
        <div className="flex items-center gap-2 text-xs text-ink-muted bg-surface-50 rounded-xl px-3 py-2">
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
          Token valid until {new Date(token_expiry).toLocaleString()}
        </div>
      )}

      {/* What this unlocks */}
      {!connected && (
        <div className="bg-surface-50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Connecting lets scholarfill.ai:</p>
          {[
            'Scrape forms that require Google sign-in',
            'Fill them with AI using your CV',
            'Open the pre-filled form for you to submit',
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-ink-muted">
              <span className="w-1 h-1 rounded-full bg-brand-400 flex-shrink-0" />
              {item}
            </div>
          ))}
        </div>
      )}

      {/* Action button */}
      {connected ? (
        <button
          onClick={handleDisconnect}
          disabled={loading || !oauth_configured}
          className="w-full flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 text-red-600 font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading
            ? <><Loader2 size={14} className="animate-spin" /> Disconnecting…</>
            : <><Unlink size={14} /> Disconnect Google Account</>
          }
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={!oauth_configured}
          className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-surface-50 border border-surface-200 text-ink font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      )}
    </div>
  );
}
