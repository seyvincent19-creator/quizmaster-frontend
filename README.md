# QuizMaster — Frontend (React SPA)

Single-page application built with **React + Vite**. Connects to the Laravel API backend.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build tool | Vite |
| Routing | React Router v6 |
| State management | Zustand |
| HTTP client | Axios |
| Styling | TailwindCSS v3 |
| Charts | Recharts |
| Notifications | react-hot-toast |

## Setup

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

Requires the backend API running at `http://localhost:8000` (or configure `VITE_API_URL` in `.env`).

## Pages

### User
| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `Login.jsx` | User login |
| `/register` | `Register.jsx` | User registration |
| `/dashboard` | `Dashboard.jsx` | Start quiz (subject picker), attempt history |
| `/quiz/:code` | `Quiz.jsx` | Active quiz — timer, navigation, answer locking |
| `/result/:code` | `Result.jsx` | Score, answer review with explanations |
| `/profile` | `Profile.jsx` | Update name/email/password |

### Admin
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin/login` | `admin/Login.jsx` | Admin login |
| `/admin/dashboard` | `admin/Dashboard.jsx` | Analytics charts, summary stats |
| `/admin/subjects` | `admin/Subjects.jsx` | Subject CRUD + activate/deactivate |
| `/admin/questions` | `admin/Questions.jsx` | Question bank — filter by subject, CRUD, JSON import |
| `/admin/users` | `admin/Users.jsx` | User list, activate/deactivate, view attempts |
| `/admin/reports` | `admin/Reports.jsx` | Filterable reports, Excel/PDF export |

## Key Files

```
src/
  lib/
    api.js              # All API calls (authApi, quizApi, subjectsApi, adminSubjectsApi, ...)
  stores/
    authStore.js        # User + admin auth state (Zustand)
    quizStore.js        # Active quiz state, timer, answers
  pages/
    Dashboard.jsx       # Subject picker modal + history table
    Quiz.jsx            # Timer, question navigator, answer locking
    admin/
      Subjects.jsx      # Subject management
      Questions.jsx     # Question bank with subject filter
  components/
    AdminLayout.jsx     # Sidebar nav (Dashboard, Subjects, Questions, Users, Reports)
    Layout.jsx          # User layout (header + nav)
    ProtectedRoute.jsx  # Auth guards for user and admin routes
    ui/                 # Modal, Spinner, Pagination, SkeletonCard
```

## Quiz Flow

1. User clicks **Start New Quiz** on the dashboard
2. Subject picker modal appears — choose a subject or **All Subjects**
3. Quiz starts: questions displayed one at a time with a 60-second countdown
4. Answer is **locked** on confirm (or when timer hits 0) — cannot be changed
5. Question navigator lets users jump to any question
6. On finish, score and full review are shown with correct answers and explanations

## Auth

- Tokens stored in `localStorage` under key `token`
- User and admin share the same token key (only one session at a time)
- 401 responses auto-redirect to the appropriate login page
