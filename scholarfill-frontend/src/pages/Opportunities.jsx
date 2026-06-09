import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, ExternalLink, Filter, Search, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { mockApi } from '../hooks/useMockApi';

const FIELDS = ['All', 'IT', 'AI', 'Banking', 'Climate Change', 'Environment', 'Frontend', 'Backend', 'Python'];

export default function Opportunities() {
  const navigate = useNavigate();
  const [activeField, setActiveField] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getOpportunities()
      .then(setOpportunities)
      .catch(() => toast.error('Failed to load opportunities'))
      .finally(() => setLoading(false));
  }, []);

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      const matchesField = activeField === 'All' || (opp.fields && opp.fields.includes(activeField));
      const matchesSearch = (opp.title && opp.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (opp.provider && opp.provider.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesField && matchesSearch;
    });
  }, [activeField, searchQuery, opportunities]);

  const handleApply = (opp) => {
    toast(`Applying to ${opp.title} with AI...`);
    // Redirect to form parsing/adding with opportunity context
    navigate('/add-form', { state: { prefillTarget: opp.title, prefillLink: opp.link } });
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-surface-200 rounded-3xl p-8 shadow-card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[80px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-brand-100">
              <Briefcase size={12} />
              scholarfill.ai Network
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Opportunities Explorer</h1>
            <p className="text-sm text-ink-subtle leading-relaxed">
              Discover and apply to top-tier fellowships, grants, and incubators. Filter by your field of interest and use scholarfill.ai AI to automate the application process instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Field Filters (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full no-scrollbar">
          <Filter size={16} className="text-ink-muted mr-1 flex-shrink-0" />
          {FIELDS.map(field => (
            <button
              key={field}
              onClick={() => setActiveField(field)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeField === field
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-200'
                  : 'bg-white border border-surface-200 text-ink-muted hover:text-ink hover:bg-surface-50'
              }`}
            >
              {field}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64 flex-shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-surface-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-ink focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          />
        </div>
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="bg-white border border-dashed border-surface-200 rounded-3xl py-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-surface-50 rounded-full flex items-center justify-center text-ink-muted mb-3">
            <Briefcase size={20} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No opportunities found</h3>
          <p className="text-xs text-ink-subtle mt-1 max-w-sm">
            We couldn't find any programs matching your current filters. Try adjusting your search or category.
          </p>
          <button
            onClick={() => { setActiveField('All'); setSearchQuery(''); }}
            className="mt-4 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOpportunities.map(opp => (
            <div key={opp.id} className="bg-white border border-surface-200 rounded-3xl p-6 flex flex-col justify-between hover:shadow-card hover:border-brand-200 transition-all space-y-5 group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold border px-2.5 py-1 rounded-full uppercase tracking-wider ${opp.badgeColor}`}>
                    {opp.funding}
                  </span>
                  <div className="flex gap-1">
                    {opp.fields && opp.fields.slice(0, 2).map(f => (
                      <span key={f} className="text-[9px] font-bold bg-surface-50 text-ink-muted border border-surface-100 px-1.5 py-0.5 rounded uppercase">
                        {f}
                      </span>
                    ))}
                    {opp.fields && opp.fields.length > 2 && <span className="text-[9px] font-bold bg-surface-50 text-ink-muted border border-surface-100 px-1.5 py-0.5 rounded uppercase">+{opp.fields.length - 2}</span>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-ink leading-snug group-hover:text-brand-600 transition-colors">{opp.title}</h3>
                  <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider flex items-center gap-1">
                    {opp.provider}
                  </p>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed font-medium line-clamp-3">
                  {opp.description}
                </p>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs text-ink-subtle font-medium">
                    <MapPin size={13} className="text-ink-muted" /> {opp.location}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-subtle font-medium">
                    <Calendar size={13} className="text-ink-muted" /> Deadline: <span className="text-ink font-semibold">{opp.deadline}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-surface-100 mt-auto flex gap-2">
                <button
                  onClick={() => handleShare(opp)}
                  className="px-3 inline-flex items-center justify-center bg-surface-50 hover:bg-surface-100 text-ink-muted hover:text-ink border border-surface-200 rounded-xl transition-colors"
                  title="Share Opportunity"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={() => handleApply(opp)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white text-xs font-bold py-2.5 rounded-xl transition-colors border border-brand-100 hover:border-brand-600"
                >
                  Apply with AI <ExternalLink size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
