import { useState } from 'react';
import { Pencil, Check, X, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mockApi } from '../hooks/useMockApi';

const TYPE_BADGE = {
  text:     { label: 'Text',      cls: 'bg-surface-100 text-ink-muted' },
  email:    { label: 'Email',     cls: 'bg-blue-50 text-blue-600' },
  tel:      { label: 'Phone',     cls: 'bg-blue-50 text-blue-600' },
  url:      { label: 'URL',       cls: 'bg-blue-50 text-blue-600' },
  textarea: { label: 'Long text', cls: 'bg-violet-50 text-violet-600' },
  radio:    { label: 'Choice',    cls: 'bg-amber-50 text-amber-600' },
  select:   { label: 'Dropdown',  cls: 'bg-amber-50 text-amber-600' },
  checkbox: { label: 'Checkbox',  cls: 'bg-orange-50 text-orange-600' },
  date:     { label: 'Date',      cls: 'bg-emerald-50 text-emerald-600' },
  number:   { label: 'Number',    cls: 'bg-emerald-50 text-emerald-600' },
  file:     { label: 'File upload', cls: 'bg-indigo-50 text-indigo-600' },
};

function FieldEditor({ field, draft, setDraft, onSave, onCancel }) {
  const { type, options = [] } = field;
  const hasOptions = options.length > 0 && (type === 'radio' || type === 'select' || type === 'checkbox');

  if (type === 'textarea') {
    return (
      <div className="space-y-2">
        <textarea
          className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <EditButtons onSave={onSave} onCancel={onCancel} />
      </div>
    );
  }

  if (hasOptions) {
    return (
      <div className="space-y-2">
        <select
          className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        >
          <option value="">— select an option —</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <EditButtons onSave={onSave} onCancel={onCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        type={type === 'date' ? 'date' : type === 'number' ? 'number' : type === 'email' ? 'email' : 'text'}
        className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoFocus
      />
      <EditButtons onSave={onSave} onCancel={onCancel} />
    </div>
  );
}

function EditButtons({ onSave, onCancel }) {
  return (
    <div className="flex gap-1.5">
      <button onClick={onSave} className="flex items-center gap-1 px-2.5 py-1 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700">
        <Check size={11} /> Save
      </button>
      <button onClick={onCancel} className="flex items-center gap-1 px-2.5 py-1 bg-surface-100 text-ink-muted rounded-lg text-xs font-medium hover:bg-surface-200">
        <X size={11} /> Cancel
      </button>
    </div>
  );
}

function FileFieldUploader({ applicationId, fieldName, value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB');
      return;
    }

    setUploading(true);
    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const result = await mockApi.uploadFieldFile(applicationId, fieldName, file);
      onChange(fieldName, result.file_url);
      toast.success('File uploaded successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Upload failed', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(fieldName, '');
    toast.success('File reference removed');
  };

  const isImage = value && /\.(jpeg|jpg|gif|png|webp|svg)$/i.test(value);
  const backendUrl = 'http://localhost:8000';

  if (uploading) {
    return (
      <div className="flex items-center gap-2 text-xs text-brand-600 font-medium">
        <Loader2 size={13} className="animate-spin" /> Uploading file...
      </div>
    );
  }

  if (value) {
    const fullUrl = value.startsWith('http') ? value : `${backendUrl}${value}`;
    const filename = value.split('/').pop()?.replace(/^[0-9a-fA-F-]{36}_/, '') || 'Uploaded file';

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          {isImage ? (
            <div className="w-12 h-12 rounded-lg border border-surface-200 overflow-hidden bg-surface-50 flex-shrink-0">
              <img src={fullUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg border border-surface-200 bg-surface-50 flex items-center justify-center text-ink-subtle flex-shrink-0">
              <FileText size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink truncate animate-fade-in" title={filename}>
              {filename}
            </p>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:underline uppercase tracking-wider mt-0.5 inline-block"
            >
              View/Download
            </a>
          </div>
          {!disabled && (
            <button
              onClick={handleRemove}
              className="w-7 h-7 text-ink-subtle rounded-lg flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-colors"
              title="Remove File"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (disabled) {
    return <span className="text-xs text-ink-subtle italic">No file uploaded</span>;
  }

  return (
    <div>
      <input
        type="file"
        id={`upload-${fieldName}`}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,application/pdf"
      />
      <label
        htmlFor={`upload-${fieldName}`}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-700 hover:text-brand-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm shadow-brand-100/50"
      >
        <Upload size={12} /> Upload Photo/File
      </label>
    </div>
  );
}

export default function FieldReviewTable({ fields, filledData, onChange, applicationId, disabled = false }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (name, val) => { setEditing(name); setDraft(val ?? ''); };
  const saveEdit  = (name) => { onChange(name, draft); setEditing(null); };
  const cancelEdit = () => setEditing(null);

  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden divide-y divide-surface-100">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_2rem] bg-surface-50 px-4 py-2.5 gap-4">
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Question</span>
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">AI-Filled Answer</span>
        <span />
      </div>

      {fields.map((field, i) => {
        const value   = filledData[field.name] ?? '';
        const isEditing = editing === field.name;
        const badge   = TYPE_BADGE[field.type] ?? { label: field.type, cls: 'bg-surface-100 text-ink-muted' };
        const hasOptions = (field.options ?? []).length > 0;

        return (
          <div
            key={field.name}
            className={`grid grid-cols-[1fr_1fr_2rem] gap-4 px-4 py-3.5 items-start transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/40'} hover:bg-brand-50/30`}
          >
            {/* Question column */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-start gap-1.5 flex-wrap">
                <span className="font-medium text-sm text-ink leading-snug">
                  {field.label}
                </span>
                {field.required && <span className="text-red-400 text-sm leading-snug">*</span>}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
                {/* Show available choices as chips */}
                {hasOptions && !isEditing && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {field.options.slice(0, 6).map((opt) => (
                      <span key={opt} className="px-1.5 py-0.5 bg-surface-100 text-ink-subtle rounded-md text-[10px] border border-surface-200">
                        {opt}
                      </span>
                    ))}
                    {field.options.length > 6 && (
                      <span className="text-[10px] text-ink-subtle">+{field.options.length - 6} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Answer column */}
            <div className="min-w-0">
              {field.type === 'file' ? (
                <FileFieldUploader
                  applicationId={applicationId}
                  fieldName={field.name}
                  value={value}
                  onChange={onChange}
                  disabled={disabled}
                />
              ) : isEditing ? (
                <FieldEditor
                  field={field}
                  draft={draft}
                  setDraft={setDraft}
                  onSave={() => saveEdit(field.name)}
                  onCancel={cancelEdit}
                />
              ) : (
                <span
                  className={`text-sm leading-relaxed block ${value ? 'text-ink' : 'text-ink-subtle italic'}`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {value || '— not filled —'}
                </span>
              )}
            </div>

            {/* Edit button */}
            <div className="flex justify-end pt-0.5">
              {!isEditing && field.type !== 'file' && !disabled && (
                <button
                  onClick={() => startEdit(field.name, value)}
                  className="w-7 h-7 text-ink-subtle rounded-lg flex items-center justify-center hover:bg-surface-100 hover:text-ink transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

