import { useState, useEffect } from 'react';
import { mockApi } from '../../hooks/useMockApi';
import toast from 'react-hot-toast';
import { Send, Trash2 } from 'lucide-react';

export default function ManageNotifications() {
  const [users, setUsers] = useState([]);
  const [notificationsHistory, setNotificationsHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [formData, setFormData] = useState({
    user_id: '',
    title: '',
    message: '',
    type: 'info'
  });

  const fetchHistory = () => {
    setLoadingHistory(true);
    mockApi.adminGetNotifications()
      .then(setNotificationsHistory)
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    mockApi.adminGetUsers().then(setUsers).catch(() => {});
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await mockApi.adminCreateNotification({
        ...formData,
        user_id: formData.user_id || null
      });
      toast.success('Notification sent!');
      setFormData({ ...formData, title: '', message: '' });
      fetchHistory();
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      await mockApi.adminDeleteNotification(id);
      toast.success('Notification deleted');
      fetchHistory();
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Push Notifications</h1>
        <p className="text-sm text-ink-subtle mt-1">Send alerts to specific users or broadcast to everyone.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Form Container */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-surface-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-brand-50/50 rounded-full blur-[80px] -z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Target Audience</label>
                <select 
                  className="input w-full bg-surface-50 cursor-pointer"
                  value={formData.user_id}
                  onChange={e => setFormData({...formData, user_id: e.target.value})}
                >
                  <option value="">🌎 All Users (Broadcast)</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>👤 {u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Alert Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {['info', 'success', 'warning'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({...formData, type})}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                        formData.type === type 
                          ? type === 'info' ? 'bg-brand-50 border-brand-200 text-brand-700' :
                            type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-white border-surface-200 text-ink-muted hover:bg-surface-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Notification Title</label>
                <input 
                  required 
                  type="text" 
                  placeholder="e.g. Server Maintenance"
                  className="input w-full" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Message Content</label>
                <textarea 
                  required 
                  rows={4} 
                  placeholder="Type the message details here..."
                  className="input w-full resize-none" 
                  value={formData.message} 
                  onChange={e => setFormData({...formData, message: e.target.value})} 
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full btn-primary flex justify-center items-center gap-2 py-3">
                <Send size={16} /> Send Notification Now
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview */}
        <div className="bg-surface-50 p-6 md:p-8 rounded-3xl border border-surface-200 border-dashed">
          <h2 className="text-sm font-bold text-ink-muted uppercase tracking-wider mb-6 flex items-center gap-2">
            Live Preview
          </h2>
          
          <div className="bg-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-surface-100 flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {formData.type === 'success' && (
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-sm">
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    <div className="w-2 h-2 bg-current rounded-full" />
                  </div>
                </div>
              )}
              {formData.type === 'warning' && (
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100 shadow-sm">
                  <span className="font-bold text-lg">!</span>
                </div>
              )}
              {formData.type === 'info' && (
                <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm">
                  <span className="font-bold text-lg">i</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-sm font-bold text-brand-950 truncate">
                  {formData.title || "Notification Title"}
                </p>
                <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">
                  Just now
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed whitespace-pre-wrap break-words">
                {formData.message || "Your message content will appear here. Start typing to see the preview..."}
              </p>
            </div>
          </div>
          
          <p className="text-[11px] text-ink-subtle mt-6 text-center">
            This is how the notification will look in the user's notification center.
          </p>
        </div>
      </div>

      {/* History Section */}
      <div className="pt-8 mt-8 border-t border-surface-200">
        <h2 className="text-xl font-bold text-ink mb-6">Sent Notifications History</h2>
        
        {loadingHistory ? (
          <p className="text-sm text-ink-muted">Loading history...</p>
        ) : notificationsHistory.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-dashed border-surface-200 text-center text-ink-subtle text-sm">
            No notifications sent yet.
          </div>
        ) : (
          <div className="bg-white border border-surface-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-50 text-ink-muted border-b border-surface-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Type</th>
                  <th className="px-6 py-4 font-semibold">Target</th>
                  <th className="px-6 py-4 font-semibold">Title</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {notificationsHistory.map(n => {
                  const targetUser = n.user_id ? users.find(u => u.id === n.user_id) : null;
                  return (
                    <tr key={n.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold capitalize ${
                          n.type === 'info' ? 'bg-brand-50 text-brand-700' :
                          n.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {n.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {n.user_id ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-ink">{targetUser?.name || 'Unknown'}</span>
                            <span className="text-xs text-ink-muted">{targetUser?.email || 'Unknown'}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-ink-muted flex items-center gap-1">
                            🌎 Broadcast
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-ink max-w-[200px] truncate" title={n.title}>
                        {n.title}
                      </td>
                      <td className="px-6 py-4 text-ink-subtle whitespace-nowrap">
                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleDelete(n.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Delete Notification"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
