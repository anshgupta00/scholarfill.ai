import { useState, useEffect } from 'react';
import { mockApi } from '../../hooks/useMockApi';
import toast from 'react-hot-toast';
import { Plus, Trash2, ExternalLink } from 'lucide-react';

export default function ManageOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '', provider: '', description: '', funding: '',
    location: '', deadline: '', fields: '', badgeColor: 'bg-brand-50 text-brand-700 border-brand-100'
  });

  const fetchOpps = () => {
    mockApi.getOpportunities()
      .then(setOpportunities)
      .catch(() => toast.error('Failed to load opportunities'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOpps();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mockApi.adminCreateOpportunity({
        ...formData,
        fields: formData.fields.split(',').map(f => f.trim()).filter(Boolean),
        badgeColor: ['bg-emerald-50 text-emerald-700 border-emerald-100', 'bg-blue-50 text-blue-700 border-blue-100', 'bg-indigo-50 text-indigo-700 border-indigo-100'][Math.floor(Math.random() * 3)],
        link: formData.link || null
      });
      toast.success('Opportunity created!');
      setFormData({
        title: '', provider: '', description: '', funding: '',
        location: '', deadline: '', fields: '', link: '', badgeColor: 'bg-brand-50 text-brand-700 border-brand-100'
      });
      fetchOpps();
    } catch (err) {
      toast.error('Failed to create opportunity');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this?')) return;
    try {
      await mockApi.adminDeleteOpportunity(id);
      toast.success('Deleted');
      fetchOpps();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Opportunities</h1>
          <p className="text-sm text-ink-subtle mt-1">Create and manage public opportunities shown to users.</p>
        </div>
      </div>
      
      {/* Create Form */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-surface-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/50 rounded-full blur-[80px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2" />
        <h2 className="text-lg font-bold text-ink mb-6 flex items-center gap-2">
          <Plus size={20} className="text-brand-600" />
          Post New Opportunity
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Title</label>
              <input required type="text" placeholder="e.g. Sayapatri Excellence Fellowship" className="input w-full" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Provider</label>
              <input required type="text" placeholder="e.g. Sayapatri Group Pvt. Ltd." className="input w-full" value={formData.provider} onChange={e => setFormData({...formData, provider: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Funding / Prize</label>
              <input required type="text" placeholder="e.g. $10,000 Grant" className="input w-full" value={formData.funding} onChange={e => setFormData({...formData, funding: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Location</label>
              <input required type="text" placeholder="e.g. Remote / Global" className="input w-full" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Deadline</label>
              <input required type="text" placeholder="e.g. July 15, 2026" className="input w-full" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Tags / Fields</label>
              <input required type="text" placeholder="e.g. IT, AI, Backend" className="input w-full" value={formData.fields} onChange={e => setFormData({...formData, fields: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Application Link (Optional)</label>
              <input type="url" placeholder="https://example.com/apply" className="input w-full" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Description</label>
            <textarea required placeholder="Detailed description of the opportunity..." rows={3} className="input w-full resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="pt-2 flex justify-end">
            <button type="submit" className="btn-primary flex items-center gap-2">
              Post Opportunity
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Active Opportunities</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-ink-muted text-sm">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-surface-200 text-ink-subtle text-sm">
              No opportunities posted yet.
            </div>
          ) : opportunities.map(opp => (
            <div key={opp.id} className="bg-white p-5 rounded-2xl border border-surface-200 flex flex-col justify-between group hover:border-surface-300 transition-colors shadow-sm relative">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-ink leading-tight pr-8">{opp.title}</h3>
                    <p className="text-xs font-medium text-brand-600 mt-1">{opp.provider}</p>
                  </div>
                  <button 
                    onClick={() => handleDelete(opp.id)} 
                    className="absolute top-4 right-4 p-2 text-ink-subtle hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Opportunity"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                  {opp.description}
                </p>
                
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="text-[10px] font-bold bg-surface-50 text-ink border border-surface-200 px-2 py-1 rounded-md">
                    {opp.funding}
                  </span>
                  <span className="text-[10px] font-bold bg-surface-50 text-ink-muted border border-surface-200 px-2 py-1 rounded-md">
                    {opp.deadline}
                  </span>
                  {opp.link && (
                    <a href={opp.link} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1 bg-brand-50 border border-brand-100 px-2 py-1 rounded-md">
                      Link <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
