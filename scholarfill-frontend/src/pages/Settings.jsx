import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import useStore from '../store/useStore';
import GoogleConnect from '../components/GoogleConnect';
import { mockApi } from '../hooks/useMockApi';
import toast from 'react-hot-toast';

const GROQ_MODELS = [
  { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Default)' },
  { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Fast / High Rate Limits)' },
  { value: 'groq/compound', label: 'Groq Compound' },
  { value: 'groq/compound-mini', label: 'Groq Compound Mini' },
  { value: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B' },
  { value: 'openai/gpt-oss-120b', label: 'OpenAI GPT OSS 120B' },
  { value: 'openai/gpt-oss-20b', label: 'OpenAI GPT OSS 20B' },
];

export default function Settings() {
  const { user, updateUser } = useStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('sf_api_key') || '');
  const [preferredModel, setPreferredModel] = useState(user?.preferred_model || 'llama-3.3-70b-versatile');
  const [defaultInstructions, setDefaultInstructions] = useState(user?.default_instructions || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setPreferredModel(user.preferred_model || 'llama-3.3-70b-versatile');
      setDefaultInstructions(user.default_instructions || '');
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      localStorage.setItem('sf_api_key', apiKey);
      const updatedUser = await mockApi.updateSettings({
        preferred_model: preferredModel,
        default_instructions: defaultInstructions
      });
      updateUser(updatedUser);
      setSaved(true);
      toast.success('Settings saved successfully!');
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Account */}
      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-5">
        <h2 className="text-base font-semibold text-ink">Account</h2>
        <div className="grid gap-4">
          {[{ label: 'Name', value: user?.name }, { label: 'Email', value: user?.email }].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
              <input
                readOnly
                value={value ?? ''}
                className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm bg-surface-50 text-ink-muted cursor-not-allowed"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Google Account connection */}
      <GoogleConnect />

      {/* Chrome Extension Card */}
      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">Chrome Extension Helper</h2>
            <p className="text-xs text-ink-subtle mt-0.5">Scrape and fill authenticated Google Forms directly from your active browser tab.</p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
            Recommended
          </span>
        </div>
        
        <div className="bg-surface-50 border border-surface-200 rounded-xl p-4 space-y-3">
          <p className="text-xs text-ink-muted leading-relaxed">
            Google's security system restricts automated headless browsers from logging in. 
            The Chrome Extension runs client-side in your active tab where you are already authenticated, 
            providing 100% reliability with zero anti-bot issues.
          </p>
          
          <div className="border-t border-surface-200 pt-3">
            <h3 className="text-xs font-semibold text-ink-muted mb-2">To load the extension:</h3>
            <ol className="list-decimal list-inside text-xs text-ink-subtle space-y-2 leading-relaxed">
              <li>Open Google Chrome and go to <code className="bg-surface-100 px-1 py-0.5 rounded text-ink font-mono text-[10px]">chrome://extensions/</code></li>
              <li>Enable <strong className="text-ink-muted">Developer mode</strong> (toggle switch in the top-right).</li>
              <li>Click the <strong className="text-ink-muted">Load unpacked</strong> button (top-left).</li>
              <li>Select the <code className="bg-surface-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[10px] font-semibold">scholarfill.ai-extension</code> directory in your project folder.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">AI Configuration</h2>
          <p className="text-xs text-ink-subtle mt-0.5">Select preferred models and configure global instructions context</p>
        </div>

        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Preferred AI Model</label>
            <select
              value={preferredModel}
              onChange={(e) => setPreferredModel(e.target.value)}
              className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input bg-white text-ink font-medium transition-all"
            >
              {GROQ_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Global AI Instructions & Context (Optional)</label>
            <textarea
              value={defaultInstructions}
              onChange={(e) => setDefaultInstructions(e.target.value)}
              placeholder="e.g. 'I want to apply for full-stack developer roles. Set my graduation year to 2026. Prioritize my React and Python projects.'"
              rows={4}
              className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all resize-none leading-relaxed text-ink placeholder-ink-subtle/70 font-medium"
            />
            <p className="text-[10px] text-ink-subtle mt-1 leading-relaxed">
              These guidelines are sent automatically alongside your CV to fill form fields. You can override them per-application if needed.
            </p>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-medium text-ink-muted mb-1.5">Anthropic API Key (Local fallback)</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
        >
          {loading ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
