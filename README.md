# HireNex 🚀
### AI-Powered Interview Preparation Platform & ATS Resume Builder

HireNex is a full-stack, enterprise-grade AI preparation platform engineered on the MERN stack. It empowers job seekers to analyze target job descriptions against their verified qualifications, synthesize deep tailored interview strategies using Google Gemini AI, track historical preparation analytics, and build ATS-optimized resumes with pixel-perfect, server-side PDF generation.

---

## 🌟 Key Features

### 1. Robust Authentication & Session Security
- **HTTP-Only Cookies & Bearer Tokens:** Dual support for strict cookie-based sessions and mobile/API Bearer token headers.
- **Bcrypt Password Hashing:** Salted password hashing with automated stripping from JSON responses.
- **Defensive HTTP Headers:** Built-in mitigation for clickjacking, XSS, and MIME-sniffing (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
- **CSRF Origin Verification:** Origin and Referer validation on state-modifying endpoints.
- **Brute-Force Rate Limiting:** Dedicated rate limiters protecting authentication endpoints from credential-stuffing attacks.

### 2. AI-Powered Interview Strategy Engine (Google Gemini)
- **Official `@google/genai` Integration:** Fully isolated backend Gemini reasoning pipelines utilizing `gemini-2.5-flash`.
- **Match Score & Deep Explanation:** Non-hallucinatory evaluation of candidate technical alignment with the target position.
- **Strengths & Skill Gap Identification:** Pinpoints matched strengths and critical missing competencies with actionable study topics.
- **15 Technical Questions:** Categorized by topic and difficulty (Easy, Medium, Hard) with exhaustive architectural answers and rationale.
- **10 STAR Behavioral Scenarios:** Structured Situation-Task-Action-Result interview blueprints tailored to the target role.
- **7-Day Sprint Roadmap:** Day-by-day actionable study curriculum with estimated study time and objectives.

### 3. Real-Time Report Visualizer & History Management
- **Interactive SVG Progress Ring:** Circular score visualizer with contextual score tiers (*Strong Alignment*, *Competitive Fit*, *Targeted Growth*, *Foundational Match*).
- **Search, Filter & Sort:** Search reports by role or company, filter by completion status, and sort by date or match score.
- **Server-Side Pagination:** Scalable report browsing with minimal network overhead.
- **Aggregate Database Analytics:** Real-time metrics calculated via MongoDB Aggregation Pipelines (Total Plans, Completed Plans, Average Score, Technical Questions).
- **Sticky Table of Contents & Print-Friendly Styles:** High-contrast reading layout and formatted print styles.

### 4. ATS Resume Builder & Server-Side PDF Generation
- **Dynamic Multi-Entry Builder:** Real-time form for personal info, summary, technical skills, experience, education, projects, certifications, and achievements.
- **3 ATS-Optimized Templates:**
  - *Classic ATS:* Traditional serif typography, linear layout, maximal machine readability.
  - *Modern Professional:* Sans-serif hierarchy with subtle indigo headers and balanced layout.
  - *Software Developer:* Monospace tech stack chips, project-first section arrangement.
- **Live Split-Screen Preview:** Instant preview synchronizing as you type.
- **AI ATS Matcher & Optimizer:** Compares resumes to target job descriptions to identify missing keywords and craft targeted summaries.
- **Puppeteer PDF Engine:** Headless Chromium rendering crisp, high-resolution A4 PDFs with `page-break-inside: avoid` rules.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons, React Hot Toast, Axios |
| **Backend** | Node.js (ESM), Express 4, Express Rate Limit, Cookie Parser, CORS, Multer |
| **Database** | MongoDB & Mongoose 8 (Supports MongoDB Atlas & Local MongoDB with automatic fallback) |
| **AI Integration** | Official Google GenAI SDK (`@google/genai`), Google Gemini 2.5 Flash |
| **PDF Processing** | Puppeteer (Server-side rendering), `pdf-parse` (Magic byte validation & text extraction) |
| **Data Validation** | Zod (Strict schema enforcement on all API requests and AI outputs) |

---

## 📂 Project Folder Structure

```
HireNex/
├── package.json                 # Monorepo root scripts (concurrent dev runner)
├── README.md                    # Platform documentation
├── backend/
│   ├── package.json             # Backend dependencies & test suites
│   ├── uploads/resumes/         # Secure private upload storage (gitignored)
│   ├── src/
│   │   ├── app.js               # Express app configuration & middleware pipeline
│   │   ├── server.js            # Server entrypoint with env validation
│   │   ├── config/              # MongoDB connection & Gemini SDK configuration
│   │   ├── controllers/         # Auth, Interview, Resume & PDF controllers
│   │   ├── middleware/          # JWT auth, Multer upload, Rate limiters, Security headers
│   │   ├── models/              # Mongoose schemas (User, InterviewReport) with indexes
│   │   ├── prompts/             # System instructions & structured prompt builders
│   │   ├── routes/              # Modular Express route declarations
│   │   ├── services/            # Gemini AI, PDF generation, and resume text extractors
│   │   ├── utils/               # JWT token utilities & cookie managers
│   │   └── validations/         # Zod schemas for auth, interviews, and resume builder
│   ├── test-auth.js             # Automated auth verification (22 tests)
│   ├── test-interviews.js       # Interview CRUD API suite (28 tests)
│   ├── test-resumes.js          # Resume upload & parser suite (22 tests)
│   ├── test-gemini.js           # Gemini AI service suite (24 tests)
│   ├── test-phase7-flow.js      # Generation integration suite (25 tests)
│   ├── test-phase8-report.js    # Report retrieval suite (32 tests)
│   ├── test-phase9-history.js   # History & stats suite (34 tests)
│   ├── test-phase10-resume-builder.js # Resume builder & PDF suite (30 tests)
│   └── test-phase11-audit.js    # Master security & API audit suite (57 tests)
└── frontend/
    ├── package.json             # Frontend dependencies & Vite scripts
    ├── vite.config.js           # Vite build configuration
    ├── tailwind.config.js       # Tailwind CSS theme and color tokens
    └── src/
        ├── App.jsx              # Routes with React.lazy code-splitting & ErrorBoundary
        ├── api/apiClient.js     # Centralized Axios client (60s timeout, credentials)
        ├── components/
        │   ├── common/          # ErrorBoundary, LoadingFallback, Navbar, Footer
        │   └── dashboard/       # Inputs, ReportCard, RecentReports, Navbar
        ├── context/AuthContext.jsx # React Context managing authenticated session
        └── pages/
            ├── Home.jsx         # Modern landing page
            ├── Login.jsx        # User login
            ├── Signup.jsx       # User registration
            ├── Dashboard.jsx    # Interview creator dashboard & live database stats
            ├── MyReports.jsx    # Interview history with search, filters & pagination
            ├── InterviewReport.jsx # Complete AI report analysis & question viewer
            └── ResumeBuilder.jsx # ATS resume builder with live preview & PDF download
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/hirenex
JWT_SECRET=your_super_secret_64_character_random_hex_string
JWT_EXPIRES_IN=7d
GOOGLE_GENAI_API_KEY=your_gemini_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-2.5-flash
```

### Frontend (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 🚀 Installation & Quickstart

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** MongoDB Community Server running locally on port 27017 or a MongoDB Atlas cluster URI.
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com/).

### Step 1: Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
cd ..
```

### Step 2: Start Full-Stack Development Server
From the root directory, start both the backend API and Vite frontend simultaneously:
```bash
npm run dev
```
- Backend starts at: `http://localhost:5000`
- Frontend starts at: `http://localhost:5173`

---

## 📖 REST API Documentation

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user, set HTTP-Only JWT cookie | No |
| `POST` | `/api/auth/login` | Authenticate credentials & set JWT cookie | No |
| `POST` | `/api/auth/logout` | Clear auth cookie and terminate session | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Yes (JWT) |

### Interview & AI Endpoints (`/api/interviews`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/interviews/generate` | Generate complete AI strategy via Gemini & save | Yes (JWT) |
| `GET` | `/api/interviews` | List user reports (search, status, sort, paginate) | Yes (JWT) |
| `GET` | `/api/interviews/stats` | Aggregated metrics (total, completed, avg score) | Yes (JWT) |
| `GET` | `/api/interviews/:id` | Fetch specific report by ID (tenant-isolated) | Yes (JWT) |
| `PATCH` | `/api/interviews/:id` | Update allowed report fields | Yes (JWT) |
| `DELETE` | `/api/interviews/:id` | Delete report permanently | Yes (JWT) |

### Resume & PDF Endpoints (`/api/resumes`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/resumes/upload` | Upload PDF resume, validate `%PDF-`, extract text | Yes (JWT) |
| `POST` | `/api/resumes/generate-pdf` | Generate high-fidelity A4 PDF using Puppeteer | Yes (JWT) |
| `POST` | `/api/resumes/ai-optimize` | AI ATS match analysis against target job description | Yes (JWT) |
| `DELETE` | `/api/resumes/:fileName` | Securely delete uploaded resume file from disk | Yes (JWT) |

---

## 🧪 Automated Testing

The HireNex backend features **9 comprehensive test suites** covering **274 automated assertions** with zero external mocking requirements:

```bash
# Run all backend test suites
cd backend
npm run test:all
```

### Suite Breakdown
1. `test-auth.js` (22 tests): Registration, duplicate emails, password hashing, cookies, session persistence.
2. `test-interviews.js` (28 tests): CRUD operations, ObjectId validation, data isolation between users.
3. `test-resumes.js` (22 tests): Magic signature checks (`%PDF-`), upload size limits, corrupted PDF rejection.
4. `test-gemini.js` (24 tests): Gemini configuration, model fallback, transient 429 retry backoff, Zod schema validation.
5. `test-phase7-flow.js` (25 tests): End-to-end generation sequence, status transitions (`processing` -> `completed`/`failed`).
6. `test-phase8-report.js` (32 tests): Score calculation, strength cards, technical question detail expanders.
7. `test-phase9-history.js` (34 tests): Search, multi-criteria sorting, status filtering, MongoDB aggregation stats.
8. `test-phase10-resume-builder.js` (30 tests): Template rendering, Puppeteer PDF generation, ATS optimizer.
9. `test-phase11-audit.js` (57 tests): Master security audit, rate limiting headers, defensive headers, multi-tenancy isolation.

**Total Verified Tests:** **274 / 274 Passing (0 Failures)**

---

## 🚢 Production Deployment

### Frontend (e.g. Vercel / Netlify)
1. Build production static bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Set environment variable:
   `VITE_API_BASE_URL=https://your-backend-domain.com/api`
3. Output directory: `frontend/dist`

### Backend (e.g. Render / Railway / AWS EC2)
1. Set production environment variables in your hosting provider:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `CLIENT_URL=https://your-frontend-domain.com`
   - `MONGO_URI=mongodb+srv://...`
   - `JWT_SECRET=your_production_secret`
   - `GOOGLE_GENAI_API_KEY=your_gemini_api_key`
2. Start command:
   ```bash
   npm start
   ```

---

## 📄 License
This project is licensed under the MIT License.
