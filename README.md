# EduPilot

Full-stack EduPilot: React + Vite + Tailwind frontend, Node/Express + MongoDB + Socket.IO backend.

## Run locally

```bash
# 1. Backend
cd backend
cp .env.example .env        # fill in MONGODB_URI and both JWT secrets
npm install
npm run seed                # creates the first super_admin (SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

## Roles

| Role                  | How you get it                                         | Can do                                                  |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------- |
| student               | Public signup (always)                                 | See own courses, deadlines, grades, contacts, resources |
| admin (instructor/TA) | super_admin promotes you, or instructor adds you as TA | Manage their own courses                                |
| super_admin           | `npm run seed`                                       | Everything, incl. semester archive and role changes     |

Set `ALLOWED_EMAIL_DOMAINS=itu.edu.pk` (comma-separated) in `backend/.env` to restrict signup to your university's domain.

## Typical workflow

1. Seed super_admin, log in, go to **Admin → Create course** (instructors need the `admin` role: `PUT /api/admin/users/:id/role`).
2. In the course's Admin panel: **Students** (enroll by email), **Settings** (grade weights, credit hours), then add assignments, announcements, resources, contacts, grades.
3. Students see everything update live via Socket.IO.

## API summary (all under `/api`, JWT bearer auth)

- `auth`: `POST /signup /login /refresh`, `GET /me`
- `courses`: `GET /`, `POST /`, `GET|PUT /:id`, `GET /:id/students`, `POST /:id/enroll`, `DELETE /:id/students/:sid`, `POST /:id/tas`
- `assignments`: `GET /?courseId&type&due=week`, `POST /:courseId`, `PUT|DELETE /:id`
- `grades`: `GET /me/cgpa`, `GET|POST /:courseId`, `DELETE /:gradeId`
- `announcements`: `GET /` (feed), `GET|POST /:courseId`, `PUT|DELETE /:id`
- `contacts`, `resources`: `GET|POST /:courseId`, `DELETE /:id`
- `admin`: `GET /dashboard/stats`, `POST /grades/import`, `POST /semester/archive`, `GET /users`, `PUT /users/:id/role`

## Deployment

- **Database:** MongoDB Atlas, copy the connection string into `MONGODB_URI`.
- **Backend (Render):** root `backend`, build `npm install`, start `npm start`, add env vars from `.env.example`; set `FRONTEND_URL` to your Vercel URL.
- **Frontend (Vercel):** root `frontend`, set `VITE_API_URL=https://<backend>/api` and `VITE_SOCKET_URL=https://<backend>`. Add a rewrite of all routes to `/index.html` (SPA).

## GPA scale

Percentage → 4.0 conversion lives in `backend/src/utils/gpa.js` and `frontend/src/utils/gpa.js`. Edit both to match your university's policy.

## What was fixed vs. the original draft

- Missing `Course` import in auth middleware (crashed every admin route); missing null-checks on lookups
- **Security:** anyone signing up with a `@faculty` email became admin; now signup is always student
- **Security:** Socket.IO events were broadcast to every user (grades included); now scoped to course/user rooms
- **Security:** `Object.assign(doc, req.body)` mass assignment replaced with field whitelists; roster hidden from students; helmet + auth rate limiting
- Socket client connected to `/api` (treated as a namespace) and hooks registered listeners before the socket existed; replaced with `SocketProvider` + `useSocketEvents`
- Token was saved under a different key than the axios interceptor read; `useAuth` could refetch forever; refresh flow retried login calls
- Duplicate `AssignmentCard` definition/import; `cgpa.toFixed` called on a string
- Grade weights were referenced but never existed on `Course`; GPA was a raw percentage. Added `gradeWeights`, weighted percentage, 4.0 scale, unique grade index that supports multiple quizzes (`label`)
- Enrollment lived in two places (`User.enrolledCourses` vs `Course.students`); `Course.students` is now the single source of truth
- Added everything that was imported but absent: SignupPage, AssignmentsPage, ContactsPage, ResourcesPage, Navbar/Layout, all Admin tabs, Vite/Tailwind/PostCSS config, `index.html`, `config/database.js`, seed script, `.env.example` files
- Semester archive now actually archives the courses; bulk grade import by email

## Notes / next steps

- Resources are stored as links (Drive, Dropbox…). Direct file upload would need multer + cloud storage (S3/Cloudinary).
- No test suite yet; a good next step is Jest + Supertest for the routes.
