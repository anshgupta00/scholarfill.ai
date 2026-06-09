# scholarfill.ai — Project Status

> **Last updated:** June 7, 2026 · 19:00 NPT
> **Stack:** FastAPI + SQLite (backend) · React + Vite (frontend) · Playwright + Claude AI (automation)

---

## 🗺 Architecture Overview

```
scholarfill.ai-backend/          scholarfill.ai-frontend/
├── core/                     ├── src/
│   ├── config.py             │   ├── api/client.js
│   ├── database.py           │   ├── hooks/useMockApi.js
│   └── security.py          │   ├── store/useStore.js
├── models/                   │   ├── pages/
│   ├── user.py               │   │   ├── Login.jsx
│   ├── application.py        │   │   ├── Register.jsx
│   └── cv_profile.py        │   │   ├── Dashboard.jsx
├── schemas/                  │   │   ├── AddForm.jsx
│   ├── user.py               │   │   ├── UploadCV.jsx
│   ├── application.py        │   │   ├── ApplicationDetail.jsx
│   └── cv_profile.py        │   │   └── Settings.jsx
├── routers/                  │   └── components/
│   ├── auth.py               │       ├── Layout.jsx
│   ├── cv.py                 │       ├── Sidebar.jsx
│   ├── forms.py              │       ├── Topbar.jsx
│   └── applications.py      │       ├── ApplicationCard.jsx
├── services/                 │       ├── FieldReviewTable.jsx
│   ├── cv_parser.py          │       ├── Modal.jsx
│   ├── ai_mapper.py          │       ├── StatusBadge.jsx
│   ├── form_scraper.py       │       └── EmptyState.jsx
│   └── form_submitter.py    └── ...
└── main.py
```

---

## ✅ Backend — Done

### Core Infrastructure
| File | What it does | Status |
|---|---|---|
| `core/config.py` | Loads `.env` settings via Pydantic Settings | ✅ Done |
| `core/database.py` | Async SQLAlchemy engine + session factory | ✅ Done |
| `core/security.py` | JWT token creation/verification, password hashing | ✅ Done |
| `main.py` | FastAPI app, CORS, router registration | ✅ Done |

### Database Models
| File | What it does | Status |
|---|---|---|
| `models/user.py` | User table (id, email, hashed_password) | ✅ Done |
| `models/application.py` | Application table (form_url, fields, filled_data, status, screenshots) | ✅ Done |
| `models/cv_profile.py` | CV profile table (raw text + structured JSON) | ✅ Done |

### API Routers
| Router | Endpoints | Status |
|---|---|---|
| `routers/auth.py` | `POST /register`, `POST /login` (returns JWT) | ✅ Done |
| `routers/cv.py` | `POST /upload` (PDF→text→AI parse), `GET /` | ✅ Done |
| `routers/forms.py` | `POST /scrape`, `POST /fill`, `POST /preview` | ✅ Done |
| `routers/applications.py` | `GET /`, `GET /:id`, `PUT /:id/review`, `POST /:id/submit`, `DELETE /:id` | ✅ Done |

### Services (Core Logic)
| File | What it does | Status |
|---|---|---|
| `services/cv_parser.py` | PyMuPDF PDF text extraction → Claude AI structured JSON | ✅ Done |
| `services/ai_mapper.py` | Claude AI maps CV fields → form fields (smart matching) | ✅ Done |
| `services/form_scraper.py` | Playwright scrapes form fields + extracts `entry.XXXXXXX` IDs | ✅ Done |
| `services/form_submitter.py` | Playwright fills form via pre-fill URL or DOM, before+after screenshots | ✅ Done |

---

## ✅ Frontend — Done

### Infrastructure
| File | What it does | Status |
|---|---|---|
| `api/client.js` | Axios instance with base URL + JWT auth header | ✅ Done |
| `hooks/useMockApi.js` | Mock API hook for UI development without backend | ✅ Done |
| `store/useStore.js` | Zustand global state (user, applications, CV) | ✅ Done |
| `App.jsx` | React Router setup, protected routes, layout wrapping | ✅ Done |

### Pages
| Page | What it shows | Status |
|---|---|---|
| `Login.jsx` | Email + password login form | ✅ Done |
| `Register.jsx` | Registration form | ✅ Done |
| `Dashboard.jsx` | List of all applications with status badges + pagination | ✅ Done |
| `AddForm.jsx` | URL input → scrape → AI fill → show filled fields preview | ✅ Done |
| `UploadCV.jsx` | PDF drag-and-drop upload + parsed data display | ✅ Done |
| `ApplicationDetail.jsx` | View/edit filled fields, preview screenshot, submit | ✅ Done |
| `Settings.jsx` | User settings page | ✅ Done |

### Components
| Component | What it does | Status |
|---|---|---|
| `Layout.jsx` | Sidebar + Topbar wrapper | ✅ Done |
| `Sidebar.jsx` | Navigation links | ✅ Done |
| `Topbar.jsx` | Header bar with user info | ✅ Done |
| `ApplicationCard.jsx` | Card showing form title, status, date | ✅ Done |
| `FieldReviewTable.jsx` | Editable table of AI-filled form fields | ✅ Done |
| `Modal.jsx` | Reusable modal dialog | ✅ Done |
| `StatusBadge.jsx` | Color-coded status pill (pending/reviewed/submitted/failed) | ✅ Done |
| `EmptyState.jsx` | Empty placeholder when no applications exist | ✅ Done |
| `ErrorBoundary.jsx` | Catches React errors and prevents page crashes | ✅ Done |

---

## ⏳ Remaining / Not Started

### 🟢 Nice to Have
| Task | Description |
|---|---|
| **Re-scrape button** | Re-run scraper on a form if fields changed |
| **Export as PDF** | Export filled application as downloadable PDF |
| **Application history** | Track all submission attempts per application |
| **Multi-CV support** | Allow user to keep multiple CV versions |
| **Dark mode toggle** | UI preference persistence |

---


## 🔁 Full User Flow (End-to-End)

```
1. Register / Login  →  JWT stored in browser
2. Upload CV (PDF)   →  Claude AI parses → structured profile saved
3. Add Form (URL)    →  Playwright scrapes fields + entry IDs
                    →  Claude AI maps CV → form fields
                    →  Application record created (status: pending)
4. Review            →  User edits AI-filled values in table
                    →  Saved (status: reviewed)
5. Preview           →  Playwright fills form in browser → screenshot shown
6. Submit            →  Playwright submits → before+after screenshot returned
                    →  Application status → submitted / failed
```

---

*See `CHANGELOG.md` for a detailed log of individual code changes by date.*
