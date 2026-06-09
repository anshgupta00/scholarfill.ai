import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Send, ImageOff, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import StatusBadge from '../components/StatusBadge';
import FieldReviewTable from '../components/FieldReviewTable';
import SubmissionConfirmDialog from '../components/SubmissionConfirmDialog';

// ── Screenshot panel ─────────────────────────────────────────────────────────
function ScreenshotPanel({ label, src }) {
  if (!src) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">{label}</p>
      <div className="rounded-xl overflow-hidden border border-surface-200 bg-surface-50">
        <img src={`data:image/png;base64,${src}`} alt={label} className="w-full object-cover" />
      </div>
    </div>
  );
}

// ── Submit panel — Google pre-fill OR Playwright ──────────────────────────────
function SubmitPanel({ app, onSave, onPlaywrightSubmit, loading, onStatusUpdate }) {
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const isGoogle = app.is_google_form;

  if (app.status === 'submitted') return null;

  const handleOpenPrefilled = async () => {
    setPrefillLoading(true);
    try {
      await onSave();
      const result = await mockApi.getPrefillUrl(app.id);
      if (result.prefill_url) {
        setPrefillUrl(result.prefill_url);
        window.open(result.prefill_url, '_blank', 'noopener,noreferrer');
        setShowConfirmDialog(true);
      } else {
        toast.error('Could not generate pre-fill URL. Try opening the form manually.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to generate pre-fill URL');
    } finally {
      setPrefillLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-200 overflow-hidden">
      {isGoogle ? (
        // ── Google Forms: pre-fill URL path ──
        <div className="p-5 space-y-4">
          {/* Explanation */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">i</div>
            <div>
              <p className="text-sm font-semibold text-ink">How submission works</p>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Google Forms requires you to be signed in. We'll open the form in your browser
                with all fields <span className="font-medium text-ink">pre-filled by AI</span> —
                just review and click <span className="font-medium text-ink">Submit</span> there.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-surface-50 rounded-xl p-3 space-y-2">
            {[
              'AI fills all fields using your CV',
              'Click the button below',
              'Form opens pre-filled in your browser',
              'Review answers and click Submit in Google',
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-ink-muted">
                <span className="flex-shrink-0 w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleOpenPrefilled}
            disabled={prefillLoading}
            className="w-full flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3 rounded-xl transition-all disabled:opacity-60 shadow-sm shadow-brand-200"
          >
            {prefillLoading ? (
              <><Loader2 size={16} className="animate-spin" /> Generating pre-fill link…</>
            ) : (
              <><ExternalLink size={16} /> Open Pre-filled Form in Browser</>
            )}
          </button>

          {/* Generated URL display */}
          {prefillUrl && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Pre-fill URL ready
              </p>
              <p className="text-[11px] text-emerald-600 break-all font-mono leading-relaxed">
                {prefillUrl.length > 120 ? prefillUrl.slice(0, 120) + '…' : prefillUrl}
              </p>
              <button
                onClick={() => window.open(prefillUrl, '_blank', 'noopener,noreferrer')}
                className="text-xs text-emerald-700 underline hover:text-emerald-800"
              >
                Re-open form
              </button>
            </div>
          )}
        </div>
      ) : (
        // ── Non-Google: Playwright auto-submit ──
        <div className="p-5 space-y-2">
          <button
            onClick={onPlaywrightSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-60"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Submitting…</>
              : <><Send size={15} /> Auto-Submit Application</>
            }
          </button>
          <p className="text-center text-xs text-ink-subtle">
            scholarfill.ai will fill and submit the form automatically.
          </p>
        </div>
      )}

      {showConfirmDialog && (
        <SubmissionConfirmDialog
          applicationId={app.id}
          onClose={() => setShowConfirmDialog(false)}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, applications, updateApplication, addNotification } = useStore();

  const storeApp = applications.find((a) => a.id === id);
  const [app, setApp] = useState(storeApp ?? null);
  const [filledData, setFilledData] = useState(storeApp?.filled_data ?? {});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [screenshotBefore, setScreenshotBefore] = useState(storeApp?.screenshot_before ?? null);
  const [screenshotAfter, setScreenshotAfter] = useState(storeApp?.screenshot_after ?? null);
  const [userInstructions, setUserInstructions] = useState(storeApp?.user_instructions ?? user?.default_instructions ?? '');
  const [refillLoading, setRefillLoading] = useState(false);

  useEffect(() => {
    if (app) {
      if (app.screenshot_before) setScreenshotBefore(app.screenshot_before);
      if (app.screenshot_after) setScreenshotAfter(app.screenshot_after);
      if (app.user_instructions) setUserInstructions(app.user_instructions);
      return;
    }
    mockApi.getApplication(id)
      .then((data) => {
        setApp(data);
        setFilledData(data.filled_data ?? {});
        updateApplication(id, data);
        if (data.screenshot_before) setScreenshotBefore(data.screenshot_before);
        if (data.screenshot_after) setScreenshotAfter(data.screenshot_after);
        if (data.user_instructions) setUserInstructions(data.user_instructions);
      })
      .catch(() => setFetchError('Application not found.'));
  }, [id]);

  if (fetchError) return (
    <div className="text-center py-20">
      <p className="text-ink-subtle">{fetchError}</p>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-600 text-sm hover:underline">
        Back to Dashboard
      </button>
    </div>
  );

  if (!app) return (
    <div className="text-center py-20">
      <p className="text-ink-subtle text-sm">Loading…</p>
    </div>
  );

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRefill = async () => {
    if (!app?.id) return;
    setRefillLoading(true);
    const toastId = toast.loading('Re-mapping fields using custom instructions...');
    try {
      const updated = await mockApi.refillApplication(app.id, userInstructions);
      setApp(updated);
      setFilledData(updated.filled_data);
      updateApplication(app.id, {
        user_instructions: userInstructions,
        filled_data: updated.filled_data,
        status: updated.status
      });
      toast.success('Fields successfully updated with new instructions!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to re-map fields', { id: toastId });
    } finally {
      setRefillLoading(false);
    }
  };

  /** Save without a toast — used internally by SubmitPanel before generating pre-fill URL */
  const handleSaveFields = async () => {
    await mockApi.reviewApplication(app.id, filledData);
    updateApplication(app.id, { filled_data: filledData, status: 'reviewed' });
    setApp(prev => ({ ...prev, filled_data: filledData, status: 'reviewed' }));
  };

  /** Save with a visible toast — triggered by the "Save Field Changes" button */
  const handleSaveWithToast = async () => {
    const toastId = toast.loading('Saving…');
    try {
      await handleSaveFields();
      toast.success('Fields saved', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to save', { id: toastId });
    }
  };

  const handlePlaywrightSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading('Submitting… this can take up to 30 s');
    try {
      await mockApi.reviewApplication(app.id, filledData);
      const result = await mockApi.submitApplication(app.id);
      const updated = {
        status: result.status ?? 'submitted',
        submitted_at: result.submitted_at ?? new Date().toISOString(),
        filled_data: filledData,
      };
      updateApplication(app.id, updated);
      setApp(prev => ({ ...prev, ...updated }));
      if (result.screenshot_before) setScreenshotBefore(result.screenshot_before);
      if (result.screenshot) setScreenshotAfter(result.screenshot);
      toast.success('Application submitted! 🎉', { id: toastId });
      addNotification({
        type: 'success',
        title: 'Application Submitted',
        message: `Successfully submitted application for '${app.form_title}'.`,
        link: `/applications/${app.id}`
      });
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message ?? 'Submission failed';
      toast.error(detail, { id: toastId });
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: `Failed to submit application for '${app.form_title}': ${detail}`,
        link: `/applications/${app.id}`
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 text-ink-subtle hover:text-ink"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-ink truncate">{app.form_title}</h2>
          <a
            href={app.form_url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-ink-subtle hover:text-brand-600 flex items-center gap-1 truncate"
          >
            <ExternalLink size={11} /> {app.form_url}
          </a>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {/* Fields */}
      {app.form_fields?.length > 0 ? (
        <>
          {app.form_summary && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-3.5 shadow-sm">
              <Sparkles size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">AI Form Summary</h3>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">{app.form_summary}</p>
              </div>
            </div>
          )}

          <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2 text-ink">
              <Sparkles size={16} className="text-brand-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Custom Instructions & Context</h3>
            </div>
            <textarea
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              disabled={app.status === 'submitted'}
              placeholder="e.g. 'I want to apply for the Backend Engineering role, set graduation year to 2026, and use Python for my main project.'"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all resize-none leading-relaxed text-ink placeholder-ink-subtle/70 font-medium disabled:opacity-60 disabled:bg-surface-50"
            />
            {app.status !== 'submitted' && (
              <button
                onClick={handleRefill}
                disabled={refillLoading}
                className="w-full flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-xs py-2.5 rounded-xl transition-all disabled:opacity-55"
              >
                {refillLoading ? (
                  <><Loader2 size={13} className="animate-spin" /> Re-mapping fields…</>
                ) : (
                  <><Sparkles size={13} /> Re-fill fields using instructions</>
                )}
              </button>
            )}
          </div>

          <FieldReviewTable
            fields={app.form_fields}
            filledData={filledData}
            onChange={(name, val) => setFilledData(p => ({ ...p, [name]: val }))}
            applicationId={app.id}
            disabled={app.status === 'submitted'}
          />

          {/* Save edits button */}
          {app.status !== 'submitted' && (
            <button
              onClick={handleSaveWithToast}
              className="w-full border border-surface-200 hover:bg-surface-50 text-ink font-medium text-sm py-2.5 rounded-xl transition-colors"
            >
              Save Field Changes
            </button>
          )}

          {/* Smart submit panel */}
          <SubmitPanel
            app={app}
            onSave={handleSaveFields}
            onPlaywrightSubmit={handlePlaywrightSubmit}
            loading={loading}
            onStatusUpdate={(updatedApp) => {
              updateApplication(app.id, updatedApp);
              setApp(updatedApp);
            }}
          />

          {/* Submitted banner */}
          {app.status === 'submitted' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Application submitted</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {new Date(app.submitted_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Before/after screenshots (Playwright path) */}
          {(screenshotBefore || screenshotAfter) && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-ink">Submission Screenshots</p>
              <div className={`grid gap-4 ${screenshotBefore && screenshotAfter ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <ScreenshotPanel label="Before (blank form)" src={screenshotBefore} />
                <ScreenshotPanel label="After (filled form)" src={screenshotAfter} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-8 text-center text-sm text-ink-subtle">
          This application is still being processed…
        </div>
      )}
    </div>
  );
}
