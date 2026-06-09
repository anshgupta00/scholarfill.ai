# scholarfill.ai — FRONTEND ONLY BUILD PROMPT
# Stack: React 18 + Vite + TailwindCSS + React Router + Zustand

---

## OVERVIEW

Build the complete frontend for **scholarfill.ai** — an AI-powered scholarship/form auto-fill app.
All API calls use MOCK DATA for now (real backend connects later).
The app must be fully navigable with working UI flows.

---

## SETUP COMMANDS (run in order)

```bash
npm create vite@latest scholarfill.ai-frontend -- --template react
cd scholarfill.ai-frontend
npm install
npm install react-router-dom zustand @tanstack/react-query axios react-dropzone lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm run dev
```

---

## tailwind.config.js (REPLACE COMPLETELY)

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          0:   "#ffffff",
          50:  "#f8f9fb",
          100: "#f1f2f6",
          200: "#e4e6ef",
          300: "#d1d5e0",
        },
        ink: {
          DEFAULT: "#0f1117",
          muted:   "#6b7280",
          subtle:  "#9ca3af",
        }
      },
      fontFamily: {
        display: ["'DM Sans'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl:  "12px",
        "2xl": "16px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
        pop:  "0 8px 32px rgba(99,102,241,0.16)",
        input:"0 0 0 3px rgba(99,102,241,0.15)",
      }
    },
  },
  plugins: [],
}
```

---

## index.html (add Google Fonts in <head>)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

---

## src/index.css (REPLACE COMPLETELY)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* { box-sizing: border-box; }

body {
  font-family: 'DM Sans', sans-serif;
  background-color: #f8f9fb;
  color: #0f1117;
  -webkit-font-smoothing: antialiased;
}

@layer utilities {
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
}
```

---

## FOLDER STRUCTURE (create every file listed)

```
src/
├── main.jsx
├── App.jsx
├── index.css
├── mock/
│   └── data.js              ← all fake API responses here
├── store/
│   └── useStore.js          ← Zustand global state
├── api/
│   └── client.js            ← axios instance (points to mock for now)
├── hooks/
│   └── useMockApi.js        ← fake async calls with delay
├── components/
│   ├── Layout.jsx            ← sidebar + topbar wrapper
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   ├── StatusBadge.jsx
│   ├── CVCard.jsx
│   ├── ApplicationCard.jsx
│   ├── FieldReviewTable.jsx
│   ├── EmptyState.jsx
│   └── Modal.jsx
└── pages/
    ├── Login.jsx
    ├── Register.jsx
    ├── Dashboard.jsx
    ├── UploadCV.jsx
    ├── AddForm.jsx
    ├── ApplicationDetail.jsx
    └── Settings.jsx
```

---

## src/mock/data.js

```js
export const MOCK_USER = {
  id: "u-001",
  name: "Ansh Gupta",
  email: "ansh@sayapatri.com",
  avatar: "AG",
};

export const MOCK_CV = {
  id: "cv-001",
  file_name: "Ansh_Gupta_CV.pdf",
  updated_at: "2025-06-01T10:00:00Z",
  structured_data: {
    personal: {
      full_name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      phone: "+977-9800000000",
      city: "Biratnagar",
      country: "Nepal",
      linkedin: "linkedin.com/in/anshgupta",
      github: "github.com/anshgupta",
    },
    summary: "Computer Engineering graduate and Founder of Sayapatri Group Pvt. Ltd., building AI-powered software solutions in Nepal.",
    education: [
      {
        degree: "Bachelor of Engineering",
        field: "Computer Engineering",
        institution: "Tribhuvan University",
        location: "Nepal",
        start_year: "2020",
        end_year: "2024",
        gpa: "3.8",
      },
    ],
    skills: {
      technical: ["Python", "React", "FastAPI", "PostgreSQL", "YOLOv8", "Docker"],
      soft: ["Leadership", "Communication", "Problem Solving"],
      languages: ["English", "Nepali", "Hindi"],
      tools: ["VS Code", "Figma", "Postman", "Git"],
    },
    experience: [
      {
        title: "Founder & CEO",
        organization: "Sayapatri Group Pvt. Ltd.",
        location: "Biratnagar, Nepal",
        start_date: "2022-01",
        end_date: "Present",
        description: "Leading a software development and IT consultancy firm delivering AI solutions, web/mobile development, and training programs.",
      },
    ],
    awards: [
      { title: "Best Innovation Award", issuer: "Abhiyan 2025", year: "2025" },
    ],
  },
};

export const MOCK_APPLICATIONS = [
  {
    id: "app-001",
    form_url: "https://docs.google.com/forms/d/e/example1/viewform",
    form_title: "Madhesh Province Youth Summit 2026",
    status: "submitted",
    created_at: "2025-06-05T09:00:00Z",
    submitted_at: "2025-06-05T09:12:00Z",
    form_fields: [
      { name: "full_name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email Address", type: "email", required: true },
      { name: "phone", label: "Phone Number", type: "tel", required: false },
      { name: "institution", label: "Institution/Organization", type: "text", required: true },
      { name: "motivation", label: "Why do you want to attend?", type: "textarea", required: true },
      { name: "skills", label: "Relevant Skills", type: "text", required: false },
    ],
    filled_data: {
      full_name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      phone: "+977-9800000000",
      institution: "Sayapatri Group Pvt. Ltd.",
      motivation: "As a tech entrepreneur from Koshi Province, I am deeply committed to digital civic engagement. I want to contribute insights on AI-powered governance tools we are developing at Sayapatri Group.",
      skills: "Python, React, AI/ML, Leadership, Public Speaking",
    },
  },
  {
    id: "app-002",
    form_url: "https://forms.example.com/scholarship2026",
    form_title: "Nepal Youth Innovation Scholarship 2026",
    status: "reviewed",
    created_at: "2025-06-04T14:00:00Z",
    submitted_at: null,
    form_fields: [
      { name: "name", label: "Applicant Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "age", label: "Age", type: "text", required: true },
      { name: "project", label: "Describe your innovation project", type: "textarea", required: true },
      { name: "impact", label: "What impact has it created?", type: "textarea", required: true },
    ],
    filled_data: {
      name: "Ansh Gupta",
      email: "ansh@sayapatri.com",
      age: "23",
      project: "AI Interview Platform — a real-time proctoring system using YOLOv8, MediaPipe, and DeepFace to ensure integrity in remote hiring processes.",
      impact: "Deployed at multiple institutions in Nepal, reducing hiring fraud by 60% and enabling fair remote recruitment across the country.",
    },
  },
  {
    id: "app-003",
    form_url: "https://docs.google.com/forms/d/e/example3/viewform",
    form_title: "Digital Koshi Leadership Program",
    status: "pending",
    created_at: "2025-06-06T11:00:00Z",
    submitted_at: null,
    form_fields: [],
    filled_data: {},
  },
];
```

---

## src/store/useStore.js

```js
import { create } from 'zustand';
import { MOCK_USER, MOCK_CV, MOCK_APPLICATIONS } from '../mock/data';

const useStore = create((set) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => {
    localStorage.setItem('sf_token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('sf_token');
    set({ user: null, token: null, isAuthenticated: false, cvProfile: null });
  },

  // CV
  cvProfile: null,
  setCVProfile: (cv) => set({ cvProfile: cv }),

  // Applications
  applications: [],
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) =>
    set((s) => ({ applications: [app, ...s.applications] })),
  updateApplication: (id, changes) =>
    set((s) => ({
      applications: s.applications.map((a) =>
        a.id === id ? { ...a, ...changes } : a
      ),
    })),

  // UI state
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // Mock loader (simulates logged-in state for dev)
  loadMockSession: () =>
    set({
      user: MOCK_USER,
      token: 'mock-token-123',
      isAuthenticated: true,
      cvProfile: MOCK_CV,
      applications: MOCK_APPLICATIONS,
    }),
}));

export default useStore;
```

---

## src/hooks/useMockApi.js

```js
// Simulates real API calls with realistic delay
// Replace each function body with real axios call when backend is ready

import { MOCK_CV, MOCK_USER, MOCK_APPLICATIONS } from '../mock/data';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const mockApi = {
  login: async (email, password) => {
    await delay(1200);
    if (email && password) return { user: MOCK_USER, token: 'mock-token-abc' };
    throw new Error('Invalid credentials');
  },

  register: async (name, email, password) => {
    await delay(1400);
    return { user: { ...MOCK_USER, name, email }, token: 'mock-token-new' };
  },

  uploadCV: async (file) => {
    await delay(2500);
    return MOCK_CV;
  },

  scrapeForm: async (url) => {
    await delay(3000);
    return {
      id: 'app-new-' + Date.now(),
      form_url: url,
      form_title: 'Scraped Form — ' + new URL(url.startsWith('http') ? url : 'https://' + url).hostname,
      status: 'pending',
      created_at: new Date().toISOString(),
      submitted_at: null,
      form_fields: [
        { name: 'full_name', label: 'Full Name', type: 'text', required: true },
        { name: 'email', label: 'Email Address', type: 'email', required: true },
        { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
        { name: 'organization', label: 'Organization', type: 'text', required: true },
        { name: 'essay', label: 'Tell us about yourself', type: 'textarea', required: true },
      ],
      filled_data: {
        full_name: MOCK_CV.structured_data.personal.full_name,
        email: MOCK_CV.structured_data.personal.email,
        phone: MOCK_CV.structured_data.personal.phone,
        organization: 'Sayapatri Group Pvt. Ltd.',
        essay: 'I am a Computer Engineering graduate and Founder of Sayapatri Group, building AI-powered solutions in Nepal. My work spans AI systems, web/mobile development, and capacity-building training programs.',
      },
    };
  },

  submitApplication: async (id) => {
    await delay(2000);
    return { success: true, submitted_at: new Date().toISOString() };
  },
};
```

---

## src/App.jsx

```jsx
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UploadCV from './pages/UploadCV';
import AddForm from './pages/AddForm';
import ApplicationDetail from './pages/ApplicationDetail';
import Settings from './pages/Settings';

function PrivateRoute({ children }) {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const loadMockSession = useStore((s) => s.loadMockSession);

  // COMMENT THIS OUT when real auth is wired
  useEffect(() => { loadMockSession(); }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="upload-cv" element={<UploadCV />} />
          <Route path="add-form" element={<AddForm />} />
          <Route path="applications/:id" element={<ApplicationDetail />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## src/components/Layout.jsx

```jsx
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useStore from '../store/useStore';

export default function Layout() {
  const sidebarOpen = useStore((s) => s.sidebarOpen);

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      <Sidebar />
      <div
        className="flex flex-col flex-1 overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? '240px' : '64px' }}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

---

## src/components/Sidebar.jsx

```jsx
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, PlusCircle, Settings,
  LogOut, ChevronLeft, Zap
} from 'lucide-react';
import useStore from '../store/useStore';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/upload-cv',  icon: Upload,          label: 'My CV'      },
  { to: '/add-form',   icon: PlusCircle,       label: 'Add Form'  },
  { to: '/settings',   icon: Settings,         label: 'Settings'  },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar, logout, user } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className="fixed left-0 top-0 h-full bg-white border-r border-surface-200 flex flex-col transition-all duration-300 z-40"
      style={{ width: sidebarOpen ? '240px' : '64px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-surface-100">
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-ink text-sm tracking-tight">scholarfill.ai</span>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto text-ink-subtle hover:text-ink transition-colors"
        >
          <ChevronLeft
            size={16}
            className="transition-transform duration-300"
            style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
              ${isActive
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-muted hover:bg-surface-50 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-brand-600' : 'text-ink-subtle group-hover:text-ink-muted'} />
                {sidebarOpen && <span>{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + logout */}
      {user && (
        <div className="border-t border-surface-100 p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {user.avatar}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink truncate">{user.name}</p>
                <p className="text-xs text-ink-subtle truncate">{user.email}</p>
              </div>
            )}
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-ink-subtle hover:text-red-500 transition-colors">
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
```

---

## src/components/Topbar.jsx

```jsx
import { useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import useStore from '../store/useStore';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/upload-cv': 'My CV',
  '/add-form':  'Add New Form',
  '/settings':  'Settings',
};

export default function Topbar() {
  const location = useLocation();
  const applications = useStore((s) => s.applications);
  const pending = applications.filter((a) => a.status === 'reviewed').length;

  const title = Object.entries(PAGE_TITLES).find(([k]) =>
    location.pathname.startsWith(k)
  )?.[1] ?? 'Application';

  return (
    <header className="h-14 bg-white border-b border-surface-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-sm font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-50 text-ink-subtle hover:text-ink transition-colors">
          <Bell size={16} />
          {pending > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>
    </header>
  );
}
```

---

## src/components/StatusBadge.jsx

```jsx
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
```

---

## src/components/ApplicationCard.jsx

```jsx
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Clock } from 'lucide-react';
import StatusBadge from './StatusBadge';

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ApplicationCard({ app }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/applications/${app.id}`)}
      className="bg-white border border-surface-200 rounded-2xl p-5 cursor-pointer hover:shadow-card hover:border-surface-300 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-ink truncate group-hover:text-brand-700 transition-colors">
            {app.form_title}
          </h3>
          <p className="text-xs text-ink-subtle mt-0.5 truncate flex items-center gap-1">
            <ExternalLink size={11} />
            {app.form_url}
          </p>
        </div>
        <StatusBadge status={app.status} />
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-ink-subtle">
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {timeAgo(app.created_at)}
        </span>
        {app.form_fields?.length > 0 && (
          <span>{app.form_fields.length} fields</span>
        )}
        {app.submitted_at && (
          <span className="text-emerald-600 font-medium">✓ Submitted</span>
        )}
      </div>
    </div>
  );
}
```

---

## src/components/EmptyState.jsx

```jsx
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon size={24} className="text-ink-subtle" />
      </div>
      <h3 className="text-sm font-semibold text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-subtle max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
```

---

## src/components/FieldReviewTable.jsx

```jsx
import { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';

export default function FieldReviewTable({ fields, filledData, onChange }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (name, val) => { setEditing(name); setDraft(val); };
  const saveEdit = (name) => { onChange(name, draft); setEditing(null); };
  const cancelEdit = () => setEditing(null);

  return (
    <div className="border border-surface-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-surface-50 border-b border-surface-200">
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider w-1/4">Field</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-ink-muted uppercase tracking-wider">AI-Filled Value</th>
            <th className="px-4 py-3 w-16" />
          </tr>
        </thead>
        <tbody>
          {fields.map((field, i) => {
            const value = filledData[field.name] ?? '';
            const isEditing = editing === field.name;
            return (
              <tr key={field.name} className={`border-b border-surface-100 last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-50/50'}`}>
                <td className="px-4 py-3">
                  <div>
                    <span className="font-medium text-ink">{field.label}</span>
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                    <div className="text-xs text-ink-subtle mt-0.5 font-mono">{field.type}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isEditing ? (
                    field.type === 'textarea' ? (
                      <textarea
                        className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <input
                        className="w-full border border-brand-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        autoFocus
                      />
                    )
                  ) : (
                    <span className={`text-sm ${value ? 'text-ink' : 'text-ink-subtle italic'}`}>
                      {value || '— not filled —'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(field.name)} className="w-7 h-7 bg-brand-600 text-white rounded-lg flex items-center justify-center hover:bg-brand-700">
                          <Check size={13} />
                        </button>
                        <button onClick={cancelEdit} className="w-7 h-7 bg-surface-100 text-ink-muted rounded-lg flex items-center justify-center hover:bg-surface-200">
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <button onClick={() => startEdit(field.name, value)} className="w-7 h-7 text-ink-subtle rounded-lg flex items-center justify-center hover:bg-surface-100 hover:text-ink">
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

---

## src/components/Modal.jsx

```jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-3xl shadow-pop w-full ${width} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-surface-100">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 text-ink-subtle hover:text-ink transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
```

---

## src/pages/Login.jsx

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await mockApi.login(email, password);
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-ink tracking-tight">scholarfill.ai</span>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-8">
          <h2 className="text-xl font-semibold text-ink mb-1">Welcome back</h2>
          <p className="text-sm text-ink-subtle mb-6">Sign in to continue auto-filling forms</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-surface-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl py-2.5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-subtle mt-5">
            No account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## src/pages/Register.jsx

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { user, token } = await mockApi.register(name, email, password);
      login(user, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-xl font-semibold text-ink tracking-tight">scholarfill.ai</span>
        </div>

        <div className="bg-white rounded-3xl border border-surface-200 shadow-card p-8">
          <h2 className="text-xl font-semibold text-ink mb-1">Create account</h2>
          <p className="text-sm text-ink-subtle mb-6">Start auto-filling scholarship forms in minutes</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', value: name, set: setName, type: 'text', placeholder: 'Ansh Gupta' },
              { label: 'Email', value: email, set: setEmail, type: 'email', placeholder: 'you@example.com' },
              { label: 'Password', value: password, set: setPassword, type: 'password', placeholder: '••••••••' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
                <input
                  type={type}
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
                  placeholder={placeholder}
                  required
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm rounded-xl py-2.5 transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-ink-subtle mt-5">
            Already have one?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## src/pages/Dashboard.jsx

```jsx
import { useNavigate } from 'react-router-dom';
import { PlusCircle, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import useStore from '../store/useStore';
import ApplicationCard from '../components/ApplicationCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const { applications, cvProfile, user } = useStore();
  const navigate = useNavigate();

  const stats = [
    { label: 'Total',     value: applications.length,                                          icon: FileText,    color: 'text-ink-muted',    bg: 'bg-surface-100' },
    { label: 'Submitted', value: applications.filter(a => a.status === 'submitted').length,    icon: CheckCircle, color: 'text-emerald-600',  bg: 'bg-emerald-50' },
    { label: 'Pending',   value: applications.filter(a => a.status === 'reviewed').length,     icon: Clock,       color: 'text-blue-600',     bg: 'bg-blue-50'    },
    { label: 'Failed',    value: applications.filter(a => a.status === 'failed').length,       icon: AlertCircle, color: 'text-red-500',      bg: 'bg-red-50'     },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Hello, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-ink-subtle mt-0.5">Here's your application overview</p>
        </div>
        <button
          onClick={() => navigate('/add-form')}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <PlusCircle size={16} />
          Add Form
        </button>
      </div>

      {/* CV Banner */}
      {!cvProfile ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-800">No CV uploaded yet</p>
            <p className="text-xs text-brand-600 mt-0.5">Upload your CV first to start auto-filling forms</p>
          </div>
          <button
            onClick={() => navigate('/upload-cv')}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            Upload CV
          </button>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">CV active — {cvProfile.file_name}</p>
            <p className="text-xs text-emerald-600 mt-0.5">{cvProfile.structured_data.personal.full_name} · {cvProfile.structured_data.personal.email}</p>
          </div>
          <button onClick={() => navigate('/upload-cv')} className="ml-auto text-xs text-emerald-700 underline hover:text-emerald-800">
            Update
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-surface-200 rounded-2xl p-4 shadow-card">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={color} />
            </div>
            <p className="text-2xl font-semibold text-ink">{value}</p>
            <p className="text-xs text-ink-subtle mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Applications list */}
      <div>
        <h3 className="text-sm font-semibold text-ink mb-3">Recent Applications</h3>
        {applications.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Add a form link and scholarfill.ai will auto-fill it using your CV"
            action={
              <button
                onClick={() => navigate('/add-form')}
                className="bg-brand-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-brand-700 transition-colors"
              >
                Add your first form
              </button>
            }
          />
        ) : (
          <div className="grid gap-3">
            {applications.map((app) => <ApplicationCard key={app.id} app={app} />)}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## src/pages/UploadCV.jsx

```jsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';

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
  const { cvProfile, setCVProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setLoading(true);
    setProgress(0);
    const interval = setInterval(() => setProgress(p => Math.min(p + 12, 90)), 200);
    try {
      const cv = await mockApi.uploadCV(file);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => { setCVProfile(cv); setLoading(false); setProgress(0); }, 400);
    } catch {
      clearInterval(interval);
      setLoading(false);
      setProgress(0);
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
            <p className="text-sm font-medium text-ink">Analysing your CV...</p>
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
              <p className="text-xs text-ink-subtle mt-1">PDF only · max 5MB</p>
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
```

---

## src/pages/AddForm.jsx

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link2, Loader2, CheckCircle } from 'lucide-react';
import useStore from '../store/useStore';
import { mockApi } from '../hooks/useMockApi';
import FieldReviewTable from '../components/FieldReviewTable';

const STEPS = ['Enter URL', 'Review Fields', 'Confirm'];

export default function AddForm() {
  const [step, setStep] = useState(0);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [application, setApplication] = useState(null);
  const [filledData, setFilledData] = useState({});
  const { addApplication, updateApplication } = useStore();
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    const msgs = ['Opening the form...', 'Reading form fields...', 'Matching with your CV...', 'Generating answers...'];
    let i = 0;
    setLoadingMsg(msgs[0]);
    const interval = setInterval(() => { i++; if (msgs[i]) setLoadingMsg(msgs[i]); }, 700);
    try {
      const app = await mockApi.scrapeForm(url);
      clearInterval(interval);
      setApplication(app);
      setFilledData(app.filled_data);
      addApplication(app);
      setStep(1);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleFieldChange = (name, value) => {
    setFilledData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    updateApplication(application.id, { filled_data: filledData, status: 'reviewed' });
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    await mockApi.submitApplication(application.id);
    updateApplication(application.id, { status: 'submitted', submitted_at: new Date().toISOString() });
    setLoading(false);
    navigate('/dashboard');
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
              placeholder="https://docs.google.com/forms/..."
              className="w-full pl-9 pr-4 py-2.5 border border-surface-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
            />
          </div>

          {loading && (
            <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-xl">
              <Loader2 size={15} className="text-brand-600 animate-spin flex-shrink-0" />
              <p className="text-sm text-brand-700">{loadingMsg}</p>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analysing...' : 'Analyse & Fill with AI'}
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
          <FieldReviewTable
            fields={application.form_fields}
            filledData={filledData}
            onChange={handleFieldChange}
          />
          <div className="flex gap-3">
            <button
              onClick={() => { updateApplication(application.id, { filled_data: filledData, status: 'reviewed' }); navigate('/dashboard'); }}
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

      {/* Step 2: Confirm submit */}
      {step === 2 && application && (
        <div className="bg-white border border-surface-200 rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle size={28} className="text-brand-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-ink">Ready to submit</h2>
            <p className="text-sm text-ink-subtle mt-1">scholarfill.ai will open the form and submit on your behalf</p>
          </div>
          <div className="bg-surface-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-xs font-medium text-ink-muted uppercase tracking-wider">Submitting to</p>
            <p className="text-sm font-semibold text-ink">{application.form_title}</p>
            <p className="text-xs text-ink-subtle truncate">{application.form_url}</p>
          </div>
          <div className="flex gap-3 pt-2">
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
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## src/pages/ApplicationDetail.jsx

```jsx
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Send } from 'lucide-react';
import useStore from '../store/useStore';
import StatusBadge from '../components/StatusBadge';
import FieldReviewTable from '../components/FieldReviewTable';
import { useState } from 'react';
import { mockApi } from '../hooks/useMockApi';

export default function ApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { applications, updateApplication } = useStore();
  const app = applications.find(a => a.id === id);
  const [filledData, setFilledData] = useState(app?.filled_data ?? {});
  const [loading, setLoading] = useState(false);

  if (!app) return (
    <div className="text-center py-20">
      <p className="text-ink-subtle">Application not found.</p>
      <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-600 text-sm hover:underline">← Back</button>
    </div>
  );

  const handleSubmit = async () => {
    setLoading(true);
    await mockApi.submitApplication(app.id);
    updateApplication(app.id, { status: 'submitted', submitted_at: new Date().toISOString(), filled_data: filledData });
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-100 text-ink-subtle hover:text-ink">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-ink">{app.form_title}</h2>
          <a href={app.form_url} target="_blank" rel="noreferrer" className="text-xs text-ink-subtle hover:text-brand-600 flex items-center gap-1">
            <ExternalLink size={11} /> {app.form_url}
          </a>
        </div>
        <StatusBadge status={app.status} />
      </div>

      {app.form_fields?.length > 0 ? (
        <>
          <FieldReviewTable
            fields={app.form_fields}
            filledData={filledData}
            onChange={(name, val) => setFilledData(p => ({ ...p, [name]: val }))}
          />
          {app.status !== 'submitted' && (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-60"
            >
              <Send size={15} />
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
          {app.status === 'submitted' && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-sm text-emerald-700 font-medium">
              ✓ Submitted on {new Date(app.submitted_at).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <div className="bg-surface-50 border border-surface-200 rounded-2xl p-8 text-center text-sm text-ink-subtle">
          This application is still being processed...
        </div>
      )}
    </div>
  );
}
```

---

## src/pages/Settings.jsx

```jsx
import { useState } from 'react';
import useStore from '../store/useStore';

export default function Settings() {
  const { user } = useStore();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem('sf_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
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

      <div className="bg-white border border-surface-200 rounded-2xl p-6 shadow-card space-y-4">
        <div>
          <h2 className="text-base font-semibold text-ink">AI Configuration</h2>
          <p className="text-xs text-ink-subtle mt-0.5">Connect your Anthropic or OpenAI key for AI-powered form filling</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-muted mb-1.5">Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full border border-surface-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          />
        </div>
        <button
          onClick={handleSave}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm py-2.5 rounded-xl transition-colors"
        >
          {saved ? '✓ Saved' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
```

---

## HOW TO PLUG IN REAL BACKEND LATER

In `src/hooks/useMockApi.js`, replace each function body:

```js
// BEFORE (mock):
login: async (email, password) => {
  await delay(1200);
  return { user: MOCK_USER, token: 'mock-token-abc' };
}

// AFTER (real):
login: async (email, password) => {
  const res = await axios.post('/api/auth/login', { email, password });
  return res.data;
}
```

In `src/api/client.js`:
```js
import axios from 'axios';
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
});
client.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('sf_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});
export default client;
```

---

*End of frontend prompt. Build in the exact order of files listed.*
