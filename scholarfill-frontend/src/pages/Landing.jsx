import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Sparkles, CheckCircle2, ShieldAlert, Cpu, ArrowRight, ExternalLink, Globe, Lightbulb, X, Share2 } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import toast from 'react-hot-toast';

export default function Landing() {
  const { isAuthenticated, login } = useStore();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    mockApi.getOpportunities().then(data => setOpportunities(data.slice(0, 3))).catch(() => {});
  }, []);

  // Auth States
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  
  // Auth Form Input States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const toastId = toast.loading('Connecting to Google...');
    try {
      const url = await mockApi.googleLoginUrl();
      window.location.href = url;
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Failed to initiate Google authentication', { id: toastId });
      setGoogleLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const toastId = toast.loading(authTab === 'login' ? 'Signing in...' : 'Creating account...');
    try {
      if (authTab === 'login') {
        const { user, token } = await mockApi.login(email, password);
        login(user, token);
        toast.success(`Welcome back, ${user.name.split(' ')[0]}!`, { id: toastId });
        setEmail('');
        setPassword('');
        navigate('/dashboard');
      } else {
        if (password.length < 8) {
          toast.error('Password must be at least 8 characters', { id: toastId });
          setAuthLoading(false);
          return;
        }
        const { user, token } = await mockApi.register(name, email, password);
        login(user, token);
        toast.success('Account created! Welcome to scholarfill.ai 🎉', { id: toastId });
        setName('');
        setEmail('');
        setPassword('');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail ?? err.message ?? 'Authentication failed', { id: toastId });
    } finally {
      setAuthLoading(false);
    }
  };

  const scrollToAuth = (tab) => {
    setAuthTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyNow = (opp) => {
    if (isAuthenticated) {
      navigate('/add-form', { state: { prefillTarget: opp.title, prefillLink: opp.link } });
    } else {
      scrollToAuth('login');
      toast.error(`Please log in or register to apply for ${opp.title}.`);
    }
  };

  const handleShare = (opp) => {
    const linkToShare = opp.link || window.location.href;
    if (navigator.share) {
      navigator.share({
        title: opp.title,
        text: `Check out this opportunity: ${opp.title} by ${opp.provider}`,
        url: linkToShare
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(linkToShare);
          toast.success('Link copied to clipboard!');
        }
      });
    } else {
      navigator.clipboard.writeText(linkToShare);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col text-ink selection:bg-brand-100 font-display">
      {/* Sticky Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-surface-200 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8.5 h-8.5 bg-brand-600 rounded-xl flex items-center justify-center shadow-md shadow-brand-100">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-base font-semibold tracking-tight text-ink">scholarfill.ai</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-muted">
          <a href="#products" className="hover:text-brand-600 transition-colors">Products</a>
          <a href="#why-necessary" className="hover:text-brand-600 transition-colors">Why scholarfill.ai?</a>
          <a href="#opportunities" className="hover:text-brand-600 transition-colors">Opportunities</a>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-brand-100"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <button
                onClick={() => scrollToAuth('login')}
                className="text-xs font-semibold text-ink-muted hover:text-ink transition-colors px-3 py-2"
              >
                Log In
              </button>
              <button
                onClick={() => scrollToAuth('register')}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm shadow-brand-100"
              >
                Sign Up Free
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-12 md:py-20 max-w-7xl mx-auto overflow-hidden">
        {/* Soft Background Gradients */}
        <div className="absolute top-10 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-brand-200/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy */}
          <div className="space-y-8 text-center lg:text-left z-10">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                <Sparkles size={11} /> Next-Generation Form Auto-Filling
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.15]">
                Conquer Applications with <span className="bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">AI Precision</span>
              </h1>
              <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-xl mx-auto lg:mx-0">
                Say goodbye to typing details repeatedly. scholarfill.ai parses your CV, orchestrates top-tier Groq LLMs, and auto-fills complicated web applications instantly.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              {isAuthenticated && (
                <Link
                  to="/dashboard"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md shadow-brand-200"
                >
                  Enter Console <ArrowRight size={15} />
                </Link>
              )}
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-4">
               <div className="flex -space-x-3">
                 <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700">A</div>
                 <div className="w-8 h-8 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-bold text-emerald-700">B</div>
                 <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center text-xs font-bold text-amber-700">C</div>
               </div>
               <p className="text-xs font-medium text-ink-muted">Join 1000+ early adopters saving hours each week.</p>
            </div>
          </div>

          {/* Right Column: Auth or Mock Dashboard */}
          <div id="auth" className="relative z-10 w-full max-w-md mx-auto lg:max-w-none">
            {isAuthenticated ? (
              <div className="relative rounded-3xl overflow-hidden border border-surface-200/60 shadow-2xl shadow-brand-100/50 bg-white/70 backdrop-blur-sm">
                <div className="flex items-center justify-between border-b border-surface-200/80 px-5 py-3.5 bg-surface-50/50">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-amber-400 rounded-full" />
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full" />
                  </div>
                  <div className="text-[10px] font-mono font-medium text-ink-muted tracking-wide">AI PREVIEW PANEL</div>
                  <div className="w-4 h-4 bg-brand-50 rounded-md flex items-center justify-center text-brand-600"><Zap size={10} /></div>
                </div>
                <div className="p-6 grid grid-cols-1 gap-4 text-left">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200/60 space-y-1.5">
                      <span className="text-[9px] font-bold text-brand-600 uppercase tracking-wider">Source: parsed_cv.json</span>
                      <p className="text-xs font-semibold text-ink">"degree": "B.Sc. Computer Science"</p>
                      <p className="text-[11px] text-ink-muted leading-relaxed">"skills": ["Python", "React", "AI Agents", "Django"]</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100/60 space-y-2">
                      <div className="flex items-center gap-1.5"><Sparkles size={12} className="text-indigo-600" /><span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">AI Auto-Reasoning</span></div>
                      <p className="text-[11px] text-indigo-900 leading-relaxed font-medium">
                        "Based on user custom instructions, selecting Django/Python backend project and setting graduation to 2026."
                      </p>
                    </div>
                  </div>
                  <div className="border border-dashed border-surface-200 rounded-2xl p-4 flex flex-col justify-center space-y-3 bg-surface-50/20">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">Full Name</label>
                      <div className="w-full bg-white border border-surface-200 rounded-lg px-3 py-2 text-xs font-medium text-ink shadow-sm flex items-center justify-between">
                        <span>Ansh Gupta</span><span className="text-[9px] font-bold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded border border-brand-100">AI Filled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-surface-200 rounded-3xl shadow-2xl p-8 relative space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-ink tracking-tight">
                    {authTab === 'login' ? 'Welcome back' : 'Create account'}
                  </h2>
                  <p className="text-xs text-ink-subtle mt-1.5">
                    {authTab === 'login' ? 'Sign in to auto-fill scholarship & job forms' : 'Start auto-filling applications in minutes'}
                  </p>
                </div>

                {/* Tab Selectors */}
                <div className="flex border-b border-surface-200">
                  <button
                    onClick={() => setAuthTab('login')}
                    className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors
                      ${authTab === 'login' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setAuthTab('register')}
                    className={`flex-1 pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors
                      ${authTab === 'register' ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink'}`}
                  >
                    Register
                  </button>
                </div>

                {/* Google Sign-in */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-surface-50 border border-surface-200 text-ink font-semibold text-xs py-3 rounded-xl transition-all shadow-sm"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Separator */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-surface-200"></div>
                  <span className="flex-shrink mx-4 text-ink-muted text-[10px] uppercase font-bold tracking-wider">Or email login</span>
                  <div className="flex-grow border-t border-surface-200"></div>
                </div>

                {/* Email Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4 text-left">
                  {authTab === 'register' && (
                    <div>
                      <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-brand-400 focus:shadow-input transition-all text-ink font-medium"
                        placeholder="Ansh Gupta"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-brand-400 focus:shadow-input transition-all text-ink font-medium"
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-ink-muted uppercase tracking-wider mb-1.5">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-surface-50 border border-surface-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-none focus:border-brand-400 focus:shadow-input transition-all text-ink font-medium"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs py-3 rounded-xl transition-colors disabled:opacity-60 mt-2"
                  >
                    {authLoading ? 'Signing in...' : authTab === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Products & Features Section */}
      <section id="products" className="py-20 bg-white border-t border-b border-surface-200/80 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Market-Ready Products</h2>
            <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
              Enterprise-grade tools engineered to automate form submission and scraping workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Intelligent Application Engine',
                desc: 'Instantly parse complex scholarship, job, and university applications. Our AI engine accurately maps your CV details to the exact requirements of any form, eliminating manual data entry.',
                icon: Cpu,
                color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
              },
              {
                title: 'Context-Aware Auto-Fill',
                desc: 'Experience seamless automation directly in your browser. scholarfill.ai understands context, adapting to varied application layouts to accurately inject answers without missing a beat.',
                icon: Zap,
                color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
              },
              {
                title: 'Smart Document Management',
                desc: 'Centralize your professional identity. Store your CV, cover letters, and transcripts in a secure vault, allowing our AI to dynamically generate tailored responses for every unique application.',
                icon: Sparkles,
                color: 'text-brand-600 bg-brand-50 border-brand-100',
              },
            ].map((prod) => {
              const Icon = prod.icon;
              return (
                <div key={prod.title} className="border border-surface-200 rounded-2xl p-6 hover:shadow-card hover:border-brand-200 transition-all space-y-4">
                  <div className={`w-10 h-10 ${prod.color} border rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{prod.title}</h3>
                  <p className="text-xs text-ink-muted leading-relaxed font-medium">{prod.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why scholarfill.ai Section */}
      <section id="why-necessary" className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
              Why scholarfill.ai?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ink leading-tight">
              Solving the Application Fatigue
            </h2>
            <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
              Applying for fellowships and tech incubators takes valuable time. scholarfill.ai automates redundant entries so you can focus on building solutions.
            </p>
            <div className="space-y-3 pt-2">
              {[
                { title: 'Saves 95% of manual typing time', text: 'Auto-fills forms in under 5 seconds.' },
                { title: 'Eliminates copy-paste mistakes', text: 'Contextual mapping aligns names, dates, and links.' },
                { title: 'Bypasses rate-limiting & anti-bot screens', text: 'Chrome Helper executes directly inside authenticated browser sessions.' }
              ].map((item) => (
                <div key={item.title} className="flex gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-ink">{item.title}</h4>
                    <p className="text-[11px] text-ink-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-7 bg-white border border-surface-200 rounded-3xl p-6 shadow-card space-y-4 relative">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <ShieldAlert size={15} className="text-amber-500" /> Auto-Recovery Pipeline
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              scholarfill.ai implements a custom-built, resilient retry structure that bypasses typical LLM processing blockades.
            </p>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl p-4 divide-y divide-surface-200 space-y-3.5">
              <div className="pb-3.5">
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Level 1: Groq Orchestration</span>
                <p className="text-xs font-semibold text-ink mt-2">Primary completions are dispatched to Llama 3.3 70B.</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Applies JSON schema validations.</p>
              </div>
              <div className="py-3.5">
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Level 2: High TPM Fallback</span>
                <p className="text-xs font-semibold text-ink mt-2">Rate-limit (413) fallback automatically shifts load to Llama 3.1 8B.</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Keeps payload size minimized.</p>
              </div>
              <div className="pt-3.5">
                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Level 3: Keyword Recovery</span>
                <p className="text-xs font-semibold text-ink mt-2">Local database keyword mapping triggers if LLM API is completely offline.</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Ensures answers are populated regardless of API server state.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities Section */}
      <section id="opportunities" className="py-20 bg-white border-t border-surface-200/80 px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
              Opportunities Center
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-ink">Active Programs</h2>
            <p className="text-xs md:text-sm text-ink-muted leading-relaxed">
              These verified programs are connected directly to scholarfill.ai. Paste these links or click apply to test auto-filling immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {opportunities.length === 0 ? (
              <div className="col-span-full text-center text-sm text-ink-muted py-8">No opportunities available.</div>
            ) : opportunities.map((opp) => {
              return (
                <div key={opp.id} className="border border-surface-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-card hover:border-brand-200 transition-all space-y-5">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full uppercase tracking-wider ${opp.badgeColor || 'bg-brand-50 text-brand-700 border-brand-100'}`}>
                        {opp.location || 'Remote'}
                      </span>
                      <span className="text-[10px] font-bold text-ink-muted">{opp.funding}</span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-semibold text-ink leading-snug">{opp.title}</h3>
                      <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">{opp.provider}</p>
                    </div>

                    <p className="text-xs text-ink-muted leading-relaxed font-medium line-clamp-3">{opp.description}</p>
                  </div>

                  <div className="pt-2 border-t border-surface-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] text-ink-muted uppercase font-bold tracking-wider">Deadline</p>
                      <p className="text-xs font-semibold text-ink truncate">{opp.deadline}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShare(opp)}
                        className="p-2 inline-flex items-center justify-center bg-surface-50 hover:bg-surface-100 text-ink-muted hover:text-ink border border-surface-200 rounded-xl transition-colors"
                        title="Share Opportunity"
                      >
                        <Share2 size={14} />
                      </button>
                      <button
                        onClick={() => handleApplyNow(opp)}
                        className="inline-flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-sm flex-shrink-0"
                      >
                        Apply with AI <ExternalLink size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="mt-auto border-t border-surface-200 bg-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center text-white"><Zap size={13} /></div>
            <span className="text-sm font-semibold tracking-tight text-ink">scholarfill.ai</span>
          </div>

          <div className="text-xs text-ink-muted font-medium text-center md:text-left">
            Developed by <a href="http://sayapatri.com" target="_blank" rel="noreferrer" className="text-brand-600 font-semibold hover:underline">Sayapatri Group Pvt. Ltd.</a>
          </div>

          <p className="text-xs text-ink-muted">
            &copy; {new Date().getFullYear()} scholarfill.ai. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}
