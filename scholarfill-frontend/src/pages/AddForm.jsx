import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Link2, Loader2, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import FieldReviewTable from '../components/FieldReviewTable';
import SubmissionConfirmDialog from '../components/SubmissionConfirmDialog';

const STEPS = ['Enter URL', 'Review Fields', 'Confirm'];

export default function AddForm() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [application, setApplication] = useState(null);
  const [filledData, setFilledData] = useState({});
  const [needsGoogleAuth, setNeedsGoogleAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, addApplication, updateApplication, addNotification } = useStore();

  const [url, setUrl] = useState(location.state?.prefillLink || '');
  const [userInstructions, setUserInstructions] = useState(user?.default_instructions || '');
  const [refillLoading, setRefillLoading] = useState(false);

  const handleHtmlUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!url.trim()) {
      toast.error('Please enter the form URL first');
      return;
    }

    setLoading(true);
    setLoadingMsg('Reading HTML file...');
    const toastId = toast.loading('Reading and analysing uploaded HTML...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const htmlContent = event.target.result;
      const msgs = ['Parsing HTML structure…', 'Matching with your CV…', 'Generating answers…'];
      let i = 0;
      setLoadingMsg(msgs[0]);
      const interval = setInterval(() => { i++; if (msgs[i]) setLoadingMsg(msgs[i]); }, 700);

      try {
        const app = await mockApi.scrapeForm(url, htmlContent, userInstructions);
        clearInterval(interval);
        setApplication(app);
        setFilledData(app.filled_data);
        addApplication(app);
        setStep(1);
        toast.success(`Found ${app.form_fields?.length ?? 0} fields — review AI answers below`, { id: toastId });
        addNotification({
          type: 'info',
          title: 'Form Mapped',
          message: `Mapped ${app.form_fields?.length ?? 0} fields for '${app.form_title || 'Form'}'.`,
          link: `/applications/${app.id}`
        });
      } catch (err) {
        clearInterval(interval);
        const detail = err.response?.data?.detail ?? err.message ?? '';
        toast.error(detail || 'Could not analyse the form. Verify the HTML contents.', { id: toastId });
      } finally {
        clearInterval(interval);
        setLoading(false);
      }
    };

    reader.onerror = () => {
      toast.error('Failed to read the HTML file', { id: toastId });
      setLoading(false);
    };

    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    // Basic URL validation
    try { new URL(url); } catch {
      toast.error('Please enter a valid URL');
      return;
    }

    setLoading(true);
    const msgs = ['Opening the form…', 'Reading form fields…', 'Matching with your CV…', 'Generating answers…'];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (msgs[i]) setLoadingMsg(msgs[i]); }, 700);

    const toastId = toast.loading('Analysing form with AI…');
    try {
      setNeedsGoogleAuth(false);
      const app = await mockApi.scrapeForm(url, null, userInstructions);
      clearInterval(interval);
      setApplication(app);
      setFilledData(app.filled_data);
      addApplication(app);
      setStep(1);
      toast.success(`Found ${app.form_fields?.length ?? 0} fields — review AI answers below`, { id: toastId });
      addNotification({
        type: 'info',
        title: 'Form Mapped',
        message: `Mapped ${app.form_fields?.length ?? 0} fields for '${app.form_title || 'Form'}'.`,
        link: `/applications/${app.id}`
      });
    } catch (err) {
      clearInterval(interval);
      const detail = err.response?.data?.detail ?? err.message ?? '';
      // Detect sign-in required errors and show inline banner
      const isAuthError = detail.toLowerCase().includes('sign in') || detail.toLowerCase().includes('authentication');
      if (isAuthError) setNeedsGoogleAuth(true);
      toast.error(detail || 'Could not analyse the form. Check the URL and try again.', { id: toastId });
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleRefill = async () => {
    if (!application?.id) return;
    setRefillLoading(true);
    const toastId = toast.loading('Re-mapping fields using custom instructions...');
    try {
      const updated = await mockApi.refillApplication(application.id, userInstructions);
      setApplication(updated);
      setFilledData(updated.filled_data);
      updateApplication(application.id, {
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

  const handleFieldChange = (name, value) => {
    setFilledData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await mockApi.reviewApplication(application.id, filledData);
    } catch { /* best-effort — local state still updates */ }
    updateApplication(application.id, { filled_data: filledData, status: 'reviewed' });
    toast.success('Fields saved');
    setStep(2);
  };

  const handleSaveAndExit = async () => {
    try {
      await mockApi.reviewApplication(application.id, filledData);
    } catch { /* best-effort */ }
    updateApplication(application.id, { filled_data: filledData, status: 'reviewed' });
    toast.success('Application saved — you can submit it later from the dashboard');
    navigate('/dashboard');
  };

  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillUrl, setPrefillUrl] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleOpenPrefilled = async () => {
    setPrefillLoading(true);
    try {
      await mockApi.reviewApplication(application.id, filledData);
      const result = await mockApi.getPrefillUrl(application.id);
      if (result.prefill_url) {
        setPrefillUrl(result.prefill_url);
        window.open(result.prefill_url, '_blank', 'noopener,noreferrer');
        setShowConfirmDialog(true);
      } else {
        toast.error('Could not generate pre-fill URL — try submitting from the dashboard.');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to generate pre-fill URL');
    } finally {
      setPrefillLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    const toastId = toast.loading('Submitting… this can take up to 30 s');
    try {
      const result = await mockApi.submitApplication(application.id);
      updateApplication(application.id, {
        status: result.status ?? 'submitted',
        submitted_at: result.submitted_at ?? new Date().toISOString(),
      });
      toast.success('Application submitted! 🎉', { id: toastId });
      addNotification({
        type: 'success',
        title: 'Application Submitted',
        message: `Successfully submitted application for '${application.form_title}'.`,
        link: `/applications/${application.id}`
      });
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail ?? err.message ?? 'Submission failed.';
      toast.error(detail, { id: toastId });
      addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: `Failed to submit application for '${application.form_title}': ${detail}`,
        link: `/applications/${application.id}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-ink-subtle'}`}>
              {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className="w-8 h-px bg-surface-200" />}
          </div>
        ))}
      </div>

      {/* Step 0: URL input */}
      {step === 0 && (
        <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-5">
          <div>
            <h2 className="text-base font-semibold text-ink">Paste form link</h2>
            <p className="text-sm text-ink-subtle mt-0.5">Works with Google Forms, Typeform, or any HTML form</p>
          </div>
          <div className="relative">
            <Link2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://docs.google.com/forms/…"
              className="w-full pl-9 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Custom Instructions / Context (Optional)</label>
            <textarea
              value={userInstructions}
              onChange={(e) => setUserInstructions(e.target.value)}
              placeholder="e.g. 'Apply for Backend Developer, use Python/Django project, set graduation to 2026.'"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all resize-none leading-relaxed text-ink placeholder-ink-subtle/70 font-medium"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
              <Loader2 size={15} className="text-brand-600 animate-spin flex-shrink-0" />
              <p className="text-sm text-brand-700">{loadingMsg}</p>
            </div>
          )}

          {/* Google sign-in required banner */}
          {needsGoogleAuth && !loading && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0 w-full">
                <p className="text-xs font-semibold text-amber-700">Google sign-in required</p>
                <p className="text-xs text-amber-600 leading-relaxed">
                  Automated browsers cannot bypass Google's login security checks.
                  To proceed:
                </p>
                <ol className="list-decimal list-inside text-xs text-amber-600 space-y-1 mt-1 font-medium">
                  <li>Open the form URL in your browser (where you are logged in).</li>
                  <li>Right-click and select <b>Save As...</b> (Webpage, HTML Only).</li>
                  <li>Upload the saved <code>.html</code> file below to parse the fields.</li>
                </ol>
                <div className="mt-3">
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleHtmlUpload}
                    className="block w-full text-xs text-amber-800
                      file:mr-3 file:py-1 file:px-2.5
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-amber-100 file:text-amber-700
                      hover:file:bg-amber-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analysing…' : 'Analyse & Fill with AI'}
          </button>
        </div>
      )}

      {/* Step 1: Review */}
      {step === 1 && application && (
        <div className="space-y-4">
          <div className="bg-white border border-surface-200 rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-semibold text-ink">{application.form_title}</h2>
            <p className="text-xs text-ink-subtle mt-0.5 truncate">{application.form_url}</p>
          </div>
          <p className="text-sm text-ink-subtle">Review AI-filled values. Click the pencil icon to edit any field.</p>
          
          {application.form_summary && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex gap-3.5 shadow-sm">
              <Sparkles size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">AI Form Summary</h3>
                <p className="text-xs text-indigo-950 leading-relaxed font-medium">{application.form_summary}</p>
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
              placeholder="e.g. 'I want to apply for the Backend Engineering role, set graduation year to 2026, and use Python for my main project.'"
              rows={3}
              className="w-full px-3.5 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all resize-none leading-relaxed text-ink placeholder-ink-subtle/70 font-medium"
            />
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
          </div>

          <FieldReviewTable
            fields={application.form_fields}
            filledData={filledData}
            onChange={handleFieldChange}
            applicationId={application.id}
            disabled={application.status === 'submitted'}
          />
          <div className="flex gap-3">
            <button
              onClick={handleSaveAndExit}
              className="flex-1 border border-surface-200 hover:bg-surface-50 text-ink font-medium text-sm py-2.5 rounded-xl transition-colors"
            >
              Save & Review Later
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm + submit */}
      {step === 2 && application && (
        <div className="bg-white border border-surface-200 rounded-2xl p-8 shadow-card space-y-5">
          {/* Form info card */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle size={22} className="text-brand-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">Ready to submit</h2>
              <p className="text-sm font-medium text-ink mt-0.5 truncate">{application.form_title}</p>
              <p className="text-xs text-ink-subtle truncate">{application.form_url}</p>
            </div>
          </div>

          {application.is_google_form ? (
            /* ── Google Forms: pre-fill URL path ── */
            <div className="space-y-4">
              {/* How-it-works steps */}
              <div className="bg-surface-50 rounded-xl p-4 space-y-2.5">
                {[
                  'AI has filled all fields using your CV',
                  'Click the button below',
                  'The form opens pre-filled in your browser',
                  'Review answers and click Submit in Google',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-ink-muted">
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
                className="w-full flex items-center justify-center gap-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3 rounded-xl transition-all disabled:opacity-60 shadow-sm"
              >
                {prefillLoading ? (
                  <><Loader2 size={16} className="animate-spin" /> Generating pre-fill link…</>
                ) : (
                  <><Link2 size={16} /> Open Pre-filled Form in Browser</>
                )}
              </button>

              {/* Re-open link if already generated */}
              {prefillUrl && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700">✓ Pre-fill URL ready — form opened in new tab</p>
                  <button
                    onClick={() => window.open(prefillUrl, '_blank', 'noopener,noreferrer')}
                    className="text-xs text-emerald-700 underline hover:text-emerald-800"
                  >
                    Re-open form
                  </button>
                  <p className="text-xs text-emerald-600 mt-1">You can also view and re-submit this from your Dashboard later.</p>
                </div>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full border border-surface-200 hover:bg-surface-50 text-ink font-medium text-sm py-2.5 rounded-xl transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            /* ── Non-Google: Playwright auto-submit ── */
            <div className="space-y-3">
              <p className="text-sm text-ink-subtle text-center">
                scholarfill.ai will fill and submit this form automatically.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 border border-surface-200 hover:bg-surface-50 text-ink font-medium text-sm py-2.5 rounded-xl"
                >
                  Go Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" /> Submitting…
                    </span>
                  ) : 'Submit Application'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showConfirmDialog && (
        <SubmissionConfirmDialog
          applicationId={application.id}
          onClose={() => setShowConfirmDialog(false)}
          onStatusUpdate={(updatedApp) => {
            updateApplication(application.id, updatedApp);
            setApplication(updatedApp);
          }}
        />
      )}
    </div>
  );
}
