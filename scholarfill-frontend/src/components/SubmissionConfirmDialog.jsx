import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockApi } from '../hooks/useMockApi';

/**
 * Dialog that appears after the user opens the pre-filled form in Google.
 * Asks whether they completed the submission so we can track the status.
 *
 * Props:
 *   applicationId  – string
 *   onClose        – () => void
 *   onStatusUpdate – (updatedApp) => void
 */
export default function SubmissionConfirmDialog({ applicationId, onClose, onStatusUpdate }) {
  const [loading, setLoading] = useState(null); // which button is loading

  const choose = async (status) => {
    setLoading(status);
    try {
      const updated = await mockApi.markStatus(applicationId, status);
      onStatusUpdate?.(updated);
      if (status === 'submitted') {
        toast.success('🎉 Application marked as submitted!');
      } else if (status === 'failed') {
        toast.error('Marked as failed. You can try again anytime.');
      } else {
        toast('Saved as pending — you can submit later from the dashboard.', { icon: '⏳' });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to update status');
    } finally {
      setLoading(null);
    }
  };

  const options = [
    {
      status: 'submitted',
      icon: <CheckCircle2 size={22} className="text-emerald-500" />,
      label: 'Yes, I submitted it!',
      sub: 'Mark this application as complete',
      bg: 'hover:bg-emerald-50 hover:border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    {
      status: 'pending',
      icon: <Clock size={22} className="text-amber-500" />,
      label: "I'll submit it later",
      sub: 'Keep it in your pending list',
      bg: 'hover:bg-amber-50 hover:border-amber-200',
      badge: 'bg-amber-100 text-amber-700',
    },
    {
      status: 'failed',
      icon: <XCircle size={22} className="text-red-400" />,
      label: 'Something went wrong',
      sub: 'Mark as failed so you can retry',
      bg: 'hover:bg-red-50 hover:border-red-200',
      badge: 'bg-red-100 text-red-700',
    },
  ];

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-100 hover:text-ink transition-colors"
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div>
          <p className="text-base font-semibold text-ink">Did you submit the form?</p>
          <p className="text-xs text-ink-muted mt-1">
            The pre-filled form was opened in your browser. Let us know what happened so we can track your progress.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {options.map(({ status, icon, label, sub, bg, badge }) => (
            <button
              key={status}
              onClick={() => choose(status)}
              disabled={loading !== null}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border border-surface-200 text-left transition-all disabled:opacity-60 ${bg}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">{icon}</div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink">{label}</p>
                <p className="text-xs text-ink-muted">{sub}</p>
              </div>

              {/* Spinner when loading */}
              {loading === status && (
                <Loader2 size={15} className="animate-spin text-ink-subtle flex-shrink-0" />
              )}
            </button>
          ))}
        </div>

        <p className="text-center text-[11px] text-ink-subtle">
          You can always change this from the dashboard
        </p>
      </div>
    </div>
  );
}
