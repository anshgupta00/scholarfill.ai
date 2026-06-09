const CONFIG = {
  pending:   { label: 'Pending',   cls: 'bg-amber-50 text-amber-700 border-amber-200'  },
  reviewed:  { label: 'Reviewed',  cls: 'bg-blue-50 text-blue-700 border-blue-200'     },
  submitted: { label: 'Submitted', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:    { label: 'Failed',    cls: 'bg-red-50 text-red-600 border-red-200'         },
};

export default function StatusBadge({ status }) {
  const { label, cls } = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}
