import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import useStore from '../store/useStore';
import client from '../api/client';

function Section({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-surface-50 hover:bg-surface-100 transition-colors"
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        {open ? <ChevronUp size={15} className="text-ink-subtle" /> : <ChevronDown size={15} className="text-ink-subtle" />}
      </button>
      {open && <div className="px-5 py-4 bg-white text-sm text-ink space-y-1">{children}</div>}
    </div>
  );
}

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <span className="text-ink-subtle w-32 shrink-0">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}

export default function UploadCV() {
  const { cvProfile, setCVProfile, addNotification } = useStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length) {
      toast.error('Only PDF files under 5 MB are accepted');
      return;
    }
    const file = acceptedFiles[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);

    const toastId = toast.loading('Uploading and analysing your CV…');
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 90)), 200);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/api/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const cv = res.data;
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setCVProfile(cv);
        setLoading(false);
        setProgress(0);
        toast.success('CV uploaded and parsed successfully!', { id: toastId });
        addNotification({
          type: 'success',
          title: 'CV Profile Synced',
          message: `Parsed file '${file.name}' with AI. Ready for auto-filling.`,
          link: '/upload-cv'
        });
      }, 400);
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setProgress(0);
      toast.error(err.response?.data?.detail ?? err.message ?? 'Upload failed. Please try again.', { id: toastId });
    }
  }, [setCVProfile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxSize: 5_242_880, multiple: false,
  });

  const pd = cvProfile?.structured_data;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-brand-400 bg-brand-50' : 'border-surface-300 hover:border-brand-300 hover:bg-surface-50'}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div className="space-y-3">
            <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center mx-auto">
              <FileText size={20} className="text-brand-600 animate-pulse" />
            </div>
            <p className="text-sm font-medium text-ink">Analysing your CV…</p>
            <div className="w-48 mx-auto bg-surface-200 rounded-full h-1.5">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-ink-subtle">{progress}%</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto">
              <Upload size={22} className="text-ink-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">
                {isDragActive ? 'Drop your CV here' : 'Drag & drop your CV'}
              </p>
              <p className="text-xs text-ink-subtle mt-1">PDF only · max 5 MB</p>
            </div>
            {cvProfile && (
              <p className="text-xs text-brand-600 font-medium">
                Current: {cvProfile.file_name} — drop new file to replace
              </p>
            )}
          </div>
        )}
      </div>

      {/* CV Preview */}
      {pd && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            <h3 className="text-sm font-semibold text-ink">CV Parsed Successfully</h3>
          </div>

          <Section title="Personal Info">
            <Row label="Name"    value={pd.personal.full_name} />
            <Row label="Email"   value={pd.personal.email} />
            <Row label="Phone"   value={pd.personal.phone} />
            <Row label="City"    value={pd.personal.city} />
            <Row label="Country" value={pd.personal.country} />
            <Row label="LinkedIn" value={pd.personal.linkedin} />
          </Section>

          <Section title="Education">
            {pd.education.map((e, i) => (
              <div key={i} className="py-1">
                <p className="font-medium">{e.degree} in {e.field}</p>
                <p className="text-ink-subtle">{e.institution} · {e.start_year}–{e.end_year} {e.gpa && `· GPA ${e.gpa}`}</p>
              </div>
            ))}
          </Section>

          <Section title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {[...pd.skills.technical, ...pd.skills.tools].map(s => (
                <span key={s} className="px-2.5 py-0.5 bg-brand-50 text-brand-700 text-xs rounded-full border border-brand-100">{s}</span>
              ))}
            </div>
          </Section>

          <Section title="Experience">
            {pd.experience.map((e, i) => (
              <div key={i} className="py-1">
                <p className="font-medium">{e.title}</p>
                <p className="text-ink-subtle">{e.organization} · {e.start_date} – {e.end_date}</p>
                <p className="mt-1">{e.description}</p>
              </div>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}
