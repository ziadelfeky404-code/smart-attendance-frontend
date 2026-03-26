# CampusMind Playwright and Architecture Report

## 1. Detected stack

I inspected the repository before making changes.

- Frontend: Next.js 14 in `frontend/`
- Backend: Express + TypeScript in `server/`
- Database: PostgreSQL
- Active runtime pair: `frontend/` + `server/`
- Extra folder found: `backend/` looks like an alternate or older app and was not used for this setup
- Package manager:
  - `frontend/` uses `npm`
  - `server/` uses `npm`

## 2. Current system structure

The backend is already mostly organized around:

- route
- controller
- service
- database

Main backend modules found:

- auth
- students
- advisors and advising
- courses
- attendance
- risk
- notifications
- reports
- study-plans
- admin
- ai

Main frontend app areas found:

- public homepage
- login
- admin dashboard and admin management pages
- doctor dashboard and doctor advising pages
- student dashboard, attendance, history, and advising pages

## 3. What was added or changed

### Playwright setup

I added Playwright inside `frontend/` with reusable local and deployed support:

- `frontend/playwright.config.ts`
- `frontend/e2e/tests/`
- `frontend/e2e/utils/`
- `frontend/scripts/run-playwright.cjs`
- `frontend/scripts/start-frontend-for-playwright.cjs`
- `frontend/scripts/start-server-for-playwright.cjs`
- `frontend/.env.example`

I also added these frontend scripts:

- `test:e2e`
- `test:e2e:ui`
- `test:e2e:headed`
- `test:e2e:local`
- `test:e2e:vercel`
- `test:e2e:install`

### Smoke-test support changes

- Added stable `data-testid` hooks to key pages and navigation
- Added screenshots, traces, and videos on failure
- Added resilient auth and navigation helpers
- Increased local test timeouts to handle first-route Next.js compilation
- Added deployed URL preflight detection so protected Vercel deployments skip cleanly

### Backend fixes and refactors

- Fixed doctor section query usage to use `doctorId`
- Fixed attendance route order so student attendance routes are reached correctly
- Fixed `GET /api/sections?doctorId=...` for the live database schema by adding compatibility for older `sections` columns
- Fixed notifications reads and writes for the live database schema by supporting boolean `is_read` and missing `metadata`
- Added a safe Playwright fixture script that links the seeded doctor to an advisor, assigns the seeded student, ensures a usable section, and inserts a fixture notification
- Fixed attendance session response mapping so student active-session APIs return the same shape the frontend expects
- Fixed session-expiration handling to avoid broken `timestamp without time zone` comparisons in the current database
- Fixed OTP lookup and cleanup logic to avoid the same timestamp issue in `verification_codes`
- Reset old attendance OTPs for the seeded student before local Playwright runs so the suite is repeatable
- Hardened audit logging so system-triggered work does not try to write a non-UUID user ID into `audit_log`
- Added reusable Zod-based request validation middleware
- Added request ID middleware and exposed `X-Request-Id`
- Added structured logger usage for startup, errors, and audit failures
- Improved global error handling to include validation errors and request IDs
- Tightened CORS so unknown origins are rejected instead of accepted
- Added `ALLOWED_ORIGINS` guidance to backend environment example
- Replaced the admin dashboard count fan-out with one aggregated SQL query
- Normalized student admin import and create/update payloads so frontend `snake_case` can safely map to backend `camelCase`
- Added more audit logging around advisor creation, student assignment, unassignment, and session updates

### Advising module hardening

- Added `GET /api/advising/advisors/me` for the logged-in doctor advisor profile
- Scoped advising session reads and updates more safely by role
- Stopped the doctor advising page from calling advisor-only endpoints when the doctor is not linked to an advisor record
- Added a clear doctor advising setup-needed state in the frontend
- Ensured the seeded local doctor account is linked to a real advisor record for smoke testing

## 4. Test coverage added

I added smoke tests for:

- Public homepage and login page
- Admin browser login and main dashboard navigation
- Doctor login and advising workspace
- Student login, dashboard, history, and advising pages
- Attendance and OTP flow up to the OTP request step

The OTP flow is intentionally partial when the environment cannot fully open a valid attendance session.
The suite now reaches the OTP request step automatically in local runs.

## 5. Documentation added

I created:

- `docs/Student-Profile-API.md`
- `docs/Advisor-Dashboard.md`
- `docs/Import-System.md`
- `docs/Risk-Engine.md`

I also updated `README.md` with:

- architecture notes
- links to the new docs
- Playwright commands
- deployed URL behavior notes

## 6. What I verified

I ran these commands successfully:

- `server`: `npm run build`
- `frontend`: `npm run build`
- local Playwright run: `npm run test:e2e:local`

### Final local Playwright result

- 6 tests passed
- 0 tests skipped

This includes:

- admin smoke
- public/auth smoke
- doctor smoke
- student smoke
- attendance and OTP-step smoke

### Deployed Playwright behavior

The deployed target is supported, but the provided URL is currently blocked before the app loads:

- `https://campusmind-frontend-igufm6ijg-ziadelfeky404-codes-projects.vercel.app`

Current result:

- returns `401 Authentication Required`
- Playwright detects that protection and skips deployed tests cleanly

## 7. What works automatically now

- Local frontend and backend smoke testing from one command
- Failure screenshots, traces, and videos
- Browser login coverage for admin, doctor, and student
- Public page smoke coverage
- Admin dashboard smoke coverage
- Doctor dashboard and advising smoke coverage
- Student dashboard, history, and advising smoke coverage
- Student notifications load in the local smoke environment without backend `500`
- Doctor attendance flow can open or reuse a valid session in the local smoke environment
- OTP request flow now works repeatedly in local smoke runs
- Local and deployed Playwright base URL support
- Clean skip behavior for protected deployed URLs

## 8. Remaining blockers or manual items

- Final OTP entry is still only partially automated
- The local backend still logs Brevo SMTP authentication failures for OTP email sending, but test mode now continues safely after storing the OTP
- Deployed smoke is still skipped against the provided Vercel URL because that URL returns `401 Authentication Required`
- To run deployed smoke tests for real, you need an unprotected deployment URL or custom domain, or a deployment that does not require Vercel authentication

## 9. Commands to run

From the project root:

```powershell
cd frontend
```

Install dependencies if needed:

```powershell
npm install
```

Install the Playwright browser:

```powershell
npm run test:e2e:install
```

Run the full local smoke suite:

```powershell
npm run test:e2e:local
```

Run in headed mode:

```powershell
npm run test:e2e:headed
```

Open Playwright UI:

```powershell
npm run test:e2e:ui
```

Run against the provided deployed URL:

```powershell
npm run test:e2e:vercel
```

Run against a different deployed URL:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://your-campusmind.vercel.app"
npm run test:e2e:vercel
```

## 10. Plain summary

The Playwright setup is working and the smoke suite is runnable.

The local suite is stable enough for basic smoke testing:

- 6 passing tests
- 0 skipped tests

The main backend blockers from the earlier report are fixed:

- `/api/sections?doctorId=...` works
- student notifications no longer return `500` in the local smoke environment
- the seeded doctor account is linked to an advisor record
- the attendance smoke now reaches the OTP request step and passes

The repo also now has a cleaner testing setup, safer advising access rules, compatibility fixes for the live database schema, repeatable local fixtures, and lightweight module documentation for future development.

## 11. Advisor Dashboard API

### What was added

I added a new advisor dashboard summary endpoint inside the existing advising module.

Route:

- `GET /api/advising/dashboard`

Access:

- protected by `authenticate`
- restricted to `DOCTOR` users at the route layer
- the service resolves the logged-in doctor to an advisor row and returns `403` if the doctor is not registered as an advisor

### Files modified

- `server/src/modules/advising/routes/advising.routes.ts`
- `server/src/modules/advising/controllers/advising.controller.ts`
- `server/src/modules/advising/services/advising.service.ts`
- `server/src/modules/risk/services/risk-engine.service.ts`
- `CODEX_REPORT.md`

### Response shape

The new endpoint returns:

```json
{
  "totalStudents": 1,
  "highRiskStudents": 0,
  "lowAttendanceStudents": 0,
  "upcomingSessions": [
    {
      "id": "session-id",
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "scheduledAt": "2026-03-25T10:00:00.000Z",
      "sessionType": "FOLLOW_UP",
      "status": "SCHEDULED",
      "location": "Office 101"
    }
  ],
  "recentAlerts": [
    {
      "id": "risk-log-id",
      "type": "RISK_ALERT",
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "courseId": "course-id",
      "courseName": "Course Name",
      "riskLevel": "CRITICAL",
      "attendanceRate": 48,
      "recommendation": "Immediate advising session recommended",
      "createdAt": "2026-03-25T08:00:00.000Z"
    }
  ],
  "unreadNotifications": 0
}
```

### How it works

- `totalStudents`:
  counts active advisor assignments for the resolved advisor
- `highRiskStudents`:
  counts assigned students whose latest risk log is `CRITICAL`
- `lowAttendanceStudents`:
  counts assigned students whose latest risk log has `attendance_rate <= risk_warning_threshold`
- `upcomingSessions`:
  reuses the existing advisor upcoming sessions service and returns the next 5 sessions in a smaller summary shape
- `recentAlerts`:
  returns the latest warning and critical risk alerts for assigned students, grouped by latest student and course risk entry
- `unreadNotifications`:
  reuses the notifications service unread-count query for the logged-in doctor account

### Assumptions

- In CampusMind, advisor access is represented by a `DOCTOR` user linked to an `advisors` row, so there is no separate `ADVISOR` auth role yet
- `highRiskStudents` is treated as the urgent subset of advisor students, so it uses only latest `CRITICAL` risk states
- `lowAttendanceStudents` uses the existing risk-engine warning threshold rather than a hardcoded percentage
- The summary endpoint is designed for first-load dashboard data, so it returns compact list items instead of full advising-session or risk-log payloads

### Verification

I verified the backend change with:

- `cd server`
- `npm run build`
- a direct local service call for the seeded doctor account, which returned the new dashboard summary shape successfully

## 12. Student Academic Profile API

### What was added

I added a consolidated student academic profile endpoint for advisor and admin dashboards.

Route:

- `GET /api/students/:id/profile`

Access:

- protected by `authenticate`
- restricted to `ADMIN` and `DOCTOR` at the route layer
- doctors must also be linked to an active advisor record and can only open profiles for students actively assigned to that advisor

### Files modified

- `server/src/modules/students/routes/students.routes.ts`
- `server/src/modules/students/controllers/students.controller.ts`
- `server/src/modules/students/services/students.service.ts`
- `server/src/modules/advising/services/advising.service.ts`
- `server/src/modules/risk/services/risk-engine.service.ts`
- `server/src/modules/risk/controllers/risk.controller.ts`
- `docs/Student-Profile-API.md`
- `CODEX_REPORT.md`

### Response structure

The new endpoint returns one aggregated JSON object with:

- `basicInfo`
- `gpa`
- `academicStanding`
- `attendance`
- `currentCourses`
- `failedCourses`
- `advisor`
- `risk`
- `advisingSessions`
- `unreadNotifications`
- `graduationProgress`

Example high-level shape:

```json
{
  "basicInfo": {
    "id": "student-id",
    "name": "Student Name",
    "code": "2024001",
    "department": null,
    "program": null,
    "level": "Year 2"
  },
  "gpa": null,
  "academicStanding": null,
  "attendance": {
    "overallPercentage": 0,
    "totalSessions": 0
  },
  "currentCourses": [],
  "failedCourses": [],
  "advisor": null,
  "risk": {
    "level": "GOOD",
    "latestAlerts": []
  },
  "advisingSessions": [],
  "unreadNotifications": 0,
  "graduationProgress": {
    "earnedCredits": null,
    "requiredCredits": null,
    "progressPercentage": null,
    "isAvailable": false
  }
}
```

### How it works

- the `students` service owns the profile read model and keeps the controller thin
- student identity comes from the existing `students` module
- advisor access is resolved through the existing `advising` module
- attendance totals come from `attendance-engine.service`
- risk level and latest alerts come from a reusable `risk-engine.service` overview helper
- unread notification count comes from `notification.service`
- current courses come from the student section enrollments and are enriched with section attendance percentages

### Assumptions

- the active backend schema does not currently store student GPA, academic standing, department, program, earned credits, or required credits, so those fields return `null` until that data exists in the real schema
- `failedCourses` is currently an empty array because the active backend does not yet store course results or failure records
- `level` falls back to `Year {year}` when no dedicated student `level` column exists
- advising history is intentionally capped to the latest 10 sessions for first-load dashboard use

### Verification

I verified the new endpoint with:

- `cd server`
- `npm run db:fixtures:playwright`
- `npm run build`
- a direct local runtime call for the seeded doctor and student fixture accounts, which returned the expected aggregated profile shape successfully

## 13. Admin Dashboard API

### What was added

I upgraded the existing admin dashboard endpoint so it now returns a system-wide summary for the admin first-load dashboard.

Route:

- `GET /api/admin/dashboard`

Access:

- protected by `authenticate`
- restricted to `ADMIN` users by the existing admin route middleware

### Files modified

- `server/src/modules/admin/controllers/admin.controller.ts`
- `server/src/modules/admin/services/dashboard.service.ts`
- `server/src/modules/advising/services/advising.service.ts`
- `CODEX_REPORT.md`

### Response structure

The dashboard endpoint now returns these top-level summary fields:

- `totalStudents`
- `totalAdvisors`
- `totalCourses`
- `totalSections`
- `overallAttendanceRate`
- `highRiskStudents`
- `activeAlerts`
- `upcomingAdvisingSessions`
- `totalNotifications`
- `recentImports`

For backward compatibility with the current frontend, it also still returns:

- `stats`
- `recentActivity`

Example high-level shape:

```json
{
  "totalStudents": 16,
  "totalAdvisors": 1,
  "totalCourses": 7,
  "totalSections": 15,
  "overallAttendanceRate": 0,
  "highRiskStudents": 0,
  "activeAlerts": 0,
  "upcomingAdvisingSessions": [],
  "totalNotifications": 1,
  "recentImports": [],
  "stats": {
    "totalStudents": 16,
    "totalDoctors": 4,
    "totalCourses": 7,
    "totalSessions": 1,
    "totalSections": 15,
    "totalLectures": 8,
    "totalAdmins": 2,
    "activeSessions": 1,
    "todayAttendance": 0
  },
  "recentActivity": [
    { "type": "STUDENT_CREATED", "count": 1 }
  ]
}
```

### How it works

- one aggregated SQL snapshot query collects the global counts and rates
- upcoming advising sessions reuse the advising module through a new `AdvisingService.getUpcomingSessions()` helper
- recent imports are read from `audit_log` entries with import actions
- legacy `stats` are mapped from the same snapshot so `/api/admin/dashboard` stays compatible with the existing admin page

### Assumptions

- `totalAdvisors` counts rows in the `advisors` table, not all doctors
- `overallAttendanceRate` uses the same present-only formula already used in reporting and risk flows:
  `PRESENT / total attendance records * 100`
- `highRiskStudents` counts students whose latest risk state is `CRITICAL`
- `activeAlerts` counts the latest warning, at-risk, or critical risk state per student-course combination
- `upcomingAdvisingSessions` returns the next scheduled advising sessions as a compact list, not just a count
- `recentImports` is driven by audit-log import actions, so it returns an empty array until import activity exists in the environment

### Verification

I verified the admin dashboard backend with:

- `cd server`
- `npm run build`
- a direct local runtime call to `DashboardService.getDashboard()`, which returned the new summary fields plus the legacy `stats` and `recentActivity` keys successfully

## 14. Advising Sessions Management API

### What was added

I completed the advising sessions backend flow inside the existing advising module so admins and advisors can create, list, inspect, update, and manage session status and notes more cleanly.

### Routes created or updated

Existing routes kept and improved:

- `POST /api/advising/sessions`
- `GET /api/advising/sessions`
- `GET /api/advising/sessions/:id`
- `PUT /api/advising/sessions/:id`
- `GET /api/advising/sessions/:id/notes`
- `POST /api/advising/sessions/notes`

New or expanded management routes:

- `PATCH /api/advising/sessions/:id`
- `PATCH /api/advising/sessions/:id/status`
- `POST /api/advising/sessions/:id/notes`

Expanded filtering support:

- `GET /api/advising/sessions?studentId=...`
- `GET /api/advising/sessions?advisorId=...`
- `GET /api/advising/sessions?status=SCHEDULED`
- `GET /api/advising/sessions?timeframe=UPCOMING`
- `GET /api/advising/sessions?timeframe=PAST`

### Files modified

- `server/src/modules/advising/routes/advising.routes.ts`
- `server/src/modules/advising/controllers/advising.controller.ts`
- `server/src/modules/advising/services/advising.service.ts`
- `server/src/utils/validation.ts`
- `CODEX_REPORT.md`

### Response shape

Session list responses continue to return:

```json
{
  "sessions": [
    {
      "id": "session-id",
      "student_id": "student-id",
      "student_name": "Student Name",
      "student_code": "2024001",
      "advisor_id": "advisor-id",
      "advisor_name": "Advisor Name",
      "case_id": null,
      "scheduled_at": "2026-03-28T10:00:00.000Z",
      "duration_minutes": 45,
      "status": "SCHEDULED",
      "session_type": "FOLLOW_UP",
      "location": "Office 204",
      "meeting_link": null,
      "completed_at": null,
      "summary": null,
      "recommendations": null,
      "follow_up_required": false,
      "follow_up_date": null,
      "created_at": "2026-03-25T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

Single-session create, patch, and status responses return the same enriched session shape with student and advisor names already joined.

Session notes return:

```json
{
  "notes": [
    {
      "id": "note-id",
      "session_id": "session-id",
      "author_id": "staff-id",
      "author_name": "Staff Name",
      "author_role": "DOCTOR",
      "note_type": "FOLLOW_UP",
      "content": "Follow-up note",
      "is_private": true,
      "created_at": "2026-03-25T10:00:00.000Z"
    }
  ]
}
```

### How it works

- doctors still resolve to their linked advisor record before managing sessions
- doctor-created sessions are now restricted to students actively assigned to that advisor
- session creation validates the student, advisor, and optional linked case before insert
- session updates now support partial `PATCH` updates and a dedicated `PATCH /status` path
- session list filtering now supports `studentId`, `advisorId`, `status`, and `timeframe=UPCOMING|PAST`
- note reads and writes reuse the existing `session_notes` table and now resolve author names for both doctors and admins
- create and update operations now return the joined session detail shape instead of raw table rows

### Assumptions

- the existing `session_notes` table was reused, so no schema migration was needed for notes
- admins can manage all sessions, while doctors can only manage sessions tied to their own advisor record
- upcoming and past filtering is based on `scheduled_at` relative to `NOW()`
- the older `PUT /api/advising/sessions/:id` and `POST /api/advising/sessions/notes` routes were kept for compatibility while the new patch-style routes were added

### Verification

I verified the advising session flow with:

- `cd server`
- `npm run db:fixtures:playwright`
- `npm run build`
- a direct local runtime workflow that successfully:
  - created a session
  - listed sessions with `timeframe=UPCOMING`
  - patched the session details
  - updated the session status to `COMPLETED`
  - added both a doctor note and an admin note
  - fetched the final session detail and notes successfully

## 15. Risk Dashboard and Alerts APIs

### What was added

I extended the existing risk module with dashboard-focused APIs for advisors and admins, plus a single-student risk details endpoint for advisor and admin profile views.

### Routes added or updated

New routes:

- `GET /api/risk/dashboard`
- `GET /api/risk/student/:studentId`
- `GET /api/risk/admin-summary`

Existing routes tightened:

- `GET /api/risk/students`
- `GET /api/risk/students/:studentId`

The existing student-list routes now require `ADMIN` or `DOCTOR` access, and the `studentId` parameter is validated as a UUID before the controller runs.

### Files modified

- `server/src/modules/risk/routes/risk.routes.ts`
- `server/src/modules/risk/controllers/risk.controller.ts`
- `server/src/modules/risk/services/risk-engine.service.ts`
- `server/src/utils/validation.ts`
- `CODEX_REPORT.md`

### Response structure

Advisor dashboard:

```json
{
  "totalStudents": 12,
  "studentsByRiskLevel": {
    "GOOD": 8,
    "LOW": 0,
    "MEDIUM": 2,
    "HIGH": 1,
    "CRITICAL": 1
  },
  "highRiskStudents": [
    {
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "riskLevel": "CRITICAL",
      "attendanceRate": 42.5,
      "department": "Computer Science",
      "latestAlertAt": "2026-03-25T10:00:00.000Z"
    }
  ],
  "lowAttendanceStudents": [
    {
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "riskLevel": "CRITICAL",
      "attendanceRate": 42.5,
      "department": "Computer Science",
      "latestAlertAt": "2026-03-25T10:00:00.000Z"
    }
  ],
  "recentAlerts": [
    {
      "id": "risk-log-id",
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "courseId": "course-id",
      "courseName": "Algorithms",
      "riskLevel": "CRITICAL",
      "attendanceRate": 42.5,
      "createdAt": "2026-03-25T10:00:00.000Z"
    }
  ]
}
```

## 16. Notifications System APIs

### What was added

I completed the notifications module API so authenticated users can list notifications with pagination and filters, fetch unread counts, mark items as read, mark all as read, and create notifications through a clean REST-style interface.

### Routes added or updated

Primary routes:

- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `POST /api/notifications`

Supported query filters for `GET /api/notifications`:

- `page`
- `limit`
- `type`
- `unreadOnly=true`

Backward-compatible aliases kept:

- `POST /api/notifications/mark-all-read`
- `POST /api/notifications/:id/read`

Existing utility routes kept:

- `POST /api/notifications/:id/unread`
- `DELETE /api/notifications/:id`
- `DELETE /api/notifications/read/all`

### Files modified

- `server/src/modules/notifications/routes/notification.routes.ts`
- `server/src/modules/notifications/controllers/notification.controller.ts`
- `server/src/modules/notifications/services/notification.service.ts`
- `server/src/utils/validation.ts`
- `CODEX_REPORT.md`

### Response structure

Notifications list:

```json
{
  "notifications": [
    {
      "id": "notification-id",
      "user_id": "user-id",
      "user_type": "STUDENT",
      "type": "SYSTEM",
      "title": "System update",
      "message": "Your dashboard data was refreshed.",
      "related_id": null,
      "related_type": null,
      "is_read": "UNREAD",
      "read_at": null,
      "metadata": {},
      "link": null,
      "created_at": "2026-03-25T10:00:00.000Z"
    }
  ],
  "total": 12,
  "unreadCount": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

Unread count:

```json
{
  "count": 5
}
```

Mark single notification as read:

```json
{
  "id": "notification-id",
  "is_read": "READ",
  "read_at": "2026-03-25T10:05:00.000Z"
}
```

Mark all notifications as read:

```json
{
  "count": 5
}
```

Create notification request body:

```json
{
  "userId": "target-user-id",
  "title": "Risk alert",
  "message": "Attendance dropped below threshold.",
  "type": "RISK_CHANGE",
  "link": "https://campusmind.local/student/123"
}
```

### How it works

- all routes stay inside the existing notifications module and use the same `authenticate` middleware pattern as the rest of the backend
- query and body validation now run before the controller for pagination, filters, IDs, and create payloads
- the controller stays thin and delegates list, create, read-state updates, and unread counting to `NotificationService`
- notification creation can now resolve the target `userType` automatically from active `admins`, `doctors`, or `students` when it is not passed explicitly
- the module now returns pagination metadata directly with the notification list response
- REST-style `PATCH` routes were added while older POST routes were kept for compatibility
- the delete route ordering was corrected so `DELETE /read/all` no longer risks being captured by the `/:id` route

### Assumptions

- non-admin users can only create notifications for themselves, while admins can target any active admin, doctor, or student user
- `type` now supports `SYSTEM` in addition to the existing notification categories used by risk, advising, attendance, and study-plan flows
- the optional `link` value is stored inside notification `metadata` when the schema includes the `metadata` column
- the current local database still uses the legacy notifications table shape with boolean `is_read` and no `metadata` column, so `link` is accepted by the API but is not persisted in this environment
- the legacy `isRead` query param is still accepted internally for compatibility, but the preferred public filter is `unreadOnly=true`

### Verification

I verified the notifications backend with:

- `cd server`
- `npm run build`
- a direct local runtime workflow using `NotificationService` that successfully:
  - created a `SYSTEM` notification
  - created an `ADVISING_SESSION` notification
  - listed unread notifications with pagination
  - filtered notifications by `type=SYSTEM`
  - fetched unread counts
  - marked one notification as read
  - marked all notifications as read

The runtime validation returned:

```json
{
  "created": {
    "system": {
      "id": "9aadacbb-c170-4420-a41a-ce452b19fc4e",
      "type": "SYSTEM",
      "link": null,
      "isRead": "UNREAD"
    },
    "advising": {
      "id": "afb89224-adfb-4427-bab4-1506b3886a28",
      "type": "ADVISING_SESSION",
      "isRead": "UNREAD"
    }
  },
  "unreadList": {
    "total": 7,
    "unreadCount": 7,
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "returned": 7
  },
  "systemOnly": {
    "total": 1,
    "returned": 1
  },
  "counters": {
    "unreadBeforeMarking": 7,
    "unreadAfterSingleMark": 6,
    "markedAllCount": 6,
    "unreadAfterReadAll": 0
  },
  "markedNotification": {
    "id": "9aadacbb-c170-4420-a41a-ce452b19fc4e",
    "isRead": "READ",
    "readAt": "2026-03-25T18:08:38.602Z"
  }
}
```

Student risk details:

```json
{
  "currentRiskLevel": "CRITICAL",
  "attendanceRate": 42.5,
  "failedCourses": [],
  "lastAlerts": [
    {
      "id": "risk-log-id",
      "studentId": "student-id",
      "studentName": "Student Name",
      "studentCode": "2024001",
      "courseId": "course-id",
      "courseName": "Algorithms",
      "riskLevel": "CRITICAL",
      "attendanceRate": 42.5,
      "createdAt": "2026-03-25T10:00:00.000Z"
    }
  ],
  "recommendations": [
    "Schedule advisor follow-up"
  ]
}
```

Admin risk summary:

```json
{
  "totalStudents": 250,
  "studentsByRiskLevel": {
    "GOOD": 180,
    "LOW": 0,
    "MEDIUM": 30,
    "HIGH": 25,
    "CRITICAL": 15
  },
  "departmentsRiskSummary": [
    {
      "department": "Computer Science",
      "totalStudents": 90,
      "highRiskStudents": 8,
      "criticalStudents": 3,
      "activeAlerts": 11
    }
  ],
  "coursesRiskSummary": [
    {
      "courseId": "course-id",
      "courseCode": "CS401",
      "courseName": "Algorithms",
      "totalStudents": 45,
      "highRiskStudents": 6,
      "criticalStudents": 2,
      "activeAlerts": 7
    }
  ],
  "overallAttendanceRate": 87.3,
  "totalActiveAlerts": 22
}
```

### How it works

- the existing `RiskEngineService` remains the single place where risk calculations and risk history interpretation happen
- the new dashboard queries build scoped student sets first, then aggregate risk distribution, high-risk lists, low-attendance lists, and recent alerts from that same scope
- doctor access is resolved through the existing advising module so a doctor only sees risk data for students assigned to the linked advisor record
- admin summary uses aggregated SQL for department-level and course-level snapshots to keep the endpoint lightweight for dashboard first load
- the student details endpoint reuses the existing student risk overview and attendance calculations instead of creating a parallel risk model

### Assumptions

- dashboard bucket mapping is currently:
  - `GOOD -> GOOD`
  - `WARNING -> MEDIUM`
  - `AT_RISK -> HIGH`
  - `CRITICAL -> CRITICAL`
  - `LOW` currently always returns `0` because the existing engine does not have a separate low-risk state
- `departmentsRiskSummary` is derived from the active advisor assignment's doctor department, or `Unassigned`, because the current live `students` table does not include a department column
- `failedCourses` currently returns an empty array because the active schema does not store academic failure records
- summaries operate on active students in the scoped queries so inactive students do not inflate dashboard counts

### Verification

I verified the new risk APIs with:

- `cd server`
- `npm run build`
- a direct local runtime validation that:
  - ran `RiskEngineService.analyzeStudentRisk()` for the seeded Playwright student
  - fetched the advisor-scoped risk dashboard
  - fetched student risk details
  - fetched the admin risk summary

The runtime validation returned:

```json
{
  "advisorDashboard": {
    "totalStudents": 1,
    "studentsByRiskLevel": {
      "GOOD": 0,
      "LOW": 0,
      "MEDIUM": 0,
      "HIGH": 0,
      "CRITICAL": 1
    },
    "highRiskStudents": 1,
    "lowAttendanceStudents": 1,
    "recentAlerts": 2
  },
  "studentDetails": {
    "currentRiskLevel": "CRITICAL",
    "attendanceRate": 0,
    "failedCourses": 0,
    "lastAlerts": 2,
    "recommendations": 1
  },
  "adminSummary": {
    "totalStudents": 16,
    "studentsByRiskLevel": {
      "GOOD": 15,
      "LOW": 0,
      "MEDIUM": 0,
      "HIGH": 0,
      "CRITICAL": 1
    },
    "departments": 2,
    "courses": 4,
    "overallAttendanceRate": 0,
    "totalActiveAlerts": 2
  }
}
```

## 10. Import Data System backend

### Goal completed

I implemented an admin-only import backend that supports:

- Students
- Courses
- Sections
- Enrollments
- Advisors
- Attendance
- Grades preview support

The new APIs allow admins to upload a CSV or Excel file, preview the parsed rows and validation errors, confirm the import inside a database transaction, review import history, and inspect a single import job.

### Routes added

- `POST /api/import/upload`
- `GET /api/import/preview/:importId`
- `POST /api/import/confirm/:importId`
- `GET /api/import/history`
- `GET /api/import/:importId`

All import routes are protected with:

- `authenticate`
- `authorize('ADMIN')`

### Services and files added or updated

New import module files:

- `server/src/modules/import/routes/import.routes.ts`
- `server/src/modules/import/controllers/import.controller.ts`
- `server/src/modules/import/services/import.service.ts`
- `server/src/modules/import/middleware/import-upload.ts`

Updated backend files:

- `server/src/index.ts`
- `server/src/utils/validation.ts`
- `server/src/database/schema.sql`
- `server/package.json`
- `server/package-lock.json`

Small supporting refactors for reuse inside import transactions:

- `server/src/modules/students/services/students.service.ts`
- `server/src/modules/courses/services/courses.service.ts`
- `server/src/modules/sections/services/sections.service.ts`
- `server/src/modules/advising/services/advising.service.ts`

### Database tables used

Primary import log table:

- `import_jobs`

Existing domain tables reused by the import service:

- `students`
- `courses`
- `sections`
- `section_students`
- `advisors`
- `doctors`
- `attendance`
- `advising_sessions`
- `admins`
- `audit_log`

### Import workflow

1. Admin uploads a file to `POST /api/import/upload`
2. The backend parses CSV, XLS, or XLSX using `xlsx`
3. The import type is either taken from the request body or detected from headers
4. Rows are validated before any database writes
5. A preview job is stored in `import_jobs` with:
   - file name
   - file format
   - total rows
   - valid rows
   - invalid rows
   - preview rows
   - parsed valid rows
   - validation errors
   - uploader
6. `GET /api/import/preview/:importId` returns the stored preview
7. `POST /api/import/confirm/:importId` runs the actual writes inside one transaction
8. Each row uses a savepoint so one bad row does not discard the full import
9. Final counts are written back to `import_jobs`
10. `GET /api/import/history` and `GET /api/import/:importId` expose the saved results

### Response shape

The import endpoints return a clean import job object with fields like:

```json
{
  "id": "uuid",
  "importType": "STUDENTS",
  "status": "PREVIEW",
  "fileName": "students.csv",
  "fileFormat": "csv",
  "totalRows": 25,
  "validRows": 23,
  "invalidRows": 2,
  "successCount": 0,
  "failCount": 0,
  "previewRows": [],
  "validationErrors": [],
  "uploadedBy": {
    "id": "admin-id",
    "name": "System Admin"
  },
  "createdAt": "2026-03-25T20:00:00.000Z",
  "confirmedAt": null
}
```

History returns:

```json
{
  "imports": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

### Assumptions

- `GRADES` currently supports upload and preview only because the active backend schema does not have a grades table to write into safely
- the live database schema varies slightly from the checked-in SQL for sections, so the import service detects available columns at runtime and adapts without breaking either shape
- imports intentionally reuse the existing students, courses, sections, and advisors services instead of duplicating create logic
- `import_jobs` is also created defensively at runtime so imports can work in environments where the checked-in schema was not re-applied

### Verification

I verified the import system with:

- `cd server`
- `npm run build`
- a live HTTP run against the built backend on a temporary local port

Verified flow:

- uploaded a one-row students CSV through `POST /api/import/upload`
- fetched the preview through `GET /api/import/preview/:importId`
- confirmed the import through `POST /api/import/confirm/:importId`
- fetched history through `GET /api/import/history`
- fetched details through `GET /api/import/:importId`

The live verification returned:

```json
{
  "importId": "f80dd303-1a49-4a62-a74e-55000c6824d5",
  "uploadStatus": "PREVIEW",
  "previewRows": 1,
  "previewValidRows": 1,
  "previewInvalidRows": 0,
  "confirmStatus": "COMPLETED",
  "confirmSuccessCount": 1,
  "confirmFailCount": 0,
  "historyCount": 1,
  "detailFileName": "campusmind-import-20260325204714.csv",
  "detailType": "STUDENTS"
}
```

I removed the temporary imported student record after verification so the environment stays clean, and I kept the import job log itself for audit/history coverage.

## 11. Reports System backend

### Goal completed

I implemented a broader reports backend for CampusMind that now supports:

- attendance reports
- students summary reports
- risk reports
- advising reports
- courses reports
- imports reports
- single student reports

The reports module now serves admin, advisor/doctor, and student use cases with role-based scoping:

- `ADMIN` sees system-wide report data
- `DOCTOR` sees advisor-scoped data for assigned students where applicable
- `STUDENT` can access only their own report through `GET /api/reports/student/:id`

I also kept the legacy `GET /api/reports/doctors` route for the current admin/doctor reports UI, and I kept `GET /api/reports/students` backward-compatible by returning the old `students` list fields alongside the new students-summary fields.

### Routes added or updated

New or expanded report routes:

- `GET /api/reports/attendance`
- `GET /api/reports/students`
- `GET /api/reports/risk`
- `GET /api/reports/advising`
- `GET /api/reports/courses`
- `GET /api/reports/imports`
- `GET /api/reports/student/:id`

Legacy compatibility route kept:

- `GET /api/reports/doctors`

### Files modified

- `server/src/modules/reports/routes/reports.routes.ts`
- `server/src/modules/reports/controllers/reports.controller.ts`
- `server/src/modules/reports/services/reports.service.ts`
- `server/src/utils/validation.ts`
- `server/src/modules/students/services/students.service.ts`

### Query and aggregation approach

Attendance report:

- aggregated from `attendance`, `section_sessions`, `sections`, `courses`, and `students`
- supports:
  - `courseId`
  - `sectionId`
  - `dateFrom`
  - `dateTo`
  - legacy pagination and rate filters
- doctor scope is limited using `advisor_assignments`

Students report:

- uses a `scoped_students` CTE over `students`
- derives department from `students.department` when available, otherwise from the active advisor assignment doctor department
- derives level from `students.level` when available, otherwise from `year`
- returns new summary fields plus the legacy student attendance list for compatibility

Risk report:

- reuses `RiskEngineService.getRiskDashboard()`
- adds a scoped active-alert count query on top of `risk_logs`
- doctor scope is based on the linked advisor record

Advising report:

- aggregated from `advising_sessions`, `advisors`, and `doctors`
- returns overall session counts plus sessions per advisor

Courses report:

- aggregated from `courses`, `sections`, `section_students`, `section_sessions`, and `attendance`
- returns course counts, section counts, students per course, attendance per course, and a legacy paginated courses list
- doctor scope is based on students assigned to that advisor

Imports report:

- aggregated from `import_jobs`
- returns totals, success/fail row counts, and recent import jobs
- admin-only

Student report:

- reuses `StudentsService.getAcademicProfile()` instead of duplicating profile assembly logic
- includes attendance, risk, advising sessions, current courses, failed courses, and progress summary

### Response structure

Attendance report:

```json
{
  "attendanceRate": 84.5,
  "totalSessions": 42,
  "totalPresent": 210,
  "totalAbsent": 39,
  "students": [],
  "total": 15
}
```

Students report:

```json
{
  "totalStudents": 120,
  "activeStudents": 118,
  "studentsPerDepartment": [],
  "studentsPerLevel": [],
  "students": [],
  "total": 0
}
```

Risk report:

```json
{
  "studentsByRiskLevel": {
    "GOOD": 90,
    "LOW": 0,
    "MEDIUM": 12,
    "HIGH": 10,
    "CRITICAL": 8
  },
  "highRiskStudents": [],
  "lowAttendanceStudents": [],
  "recentAlerts": [],
  "alertsCount": 18
}
```

Advising report:

```json
{
  "totalSessions": 32,
  "completedSessions": 20,
  "upcomingSessions": 5,
  "sessionsPerAdvisor": []
}
```

Courses report:

```json
{
  "coursesCount": 12,
  "sectionsCount": 24,
  "studentsPerCourse": [],
  "attendancePerCourse": [],
  "courses": [],
  "total": 12
}
```

Imports report:

```json
{
  "totalImports": 4,
  "rowsImported": 250,
  "successVsFail": {
    "success": 245,
    "fail": 5
  },
  "lastImports": []
}
```

Student report:

```json
{
  "studentId": "student-id",
  "basicInfo": {},
  "advisor": {},
  "attendance": {},
  "risk": {},
  "advisingSessions": [],
  "courses": {
    "current": [],
    "failed": []
  },
  "progress": {
    "gpa": null,
    "academicStanding": null,
    "graduationProgress": {}
  }
}
```

### Assumptions

- the current app still has an older reports UI that calls `GET /api/reports/students` and `GET /api/reports/doctors`, so I preserved compatibility instead of breaking those screens
- advisor/doctor report scope is driven by `advisor_assignments`, not by all sections taught by the doctor
- `studentsPerDepartment` falls back to advisor-doctor department because the live `students` table may not store department
- `studentsPerLevel` falls back to `year` because the live `students` table may not store a separate level column
- if a doctor account is not linked to an advisor record, advisor-scoped report endpoints return empty scoped data rather than broad system-wide data
- attendance report totals may legitimately be zero in environments with no recorded attendance rows yet

### Shared access fix

To support `STUDENT` access to `GET /api/reports/student/:id` safely, I updated the shared student academic-profile access check so students can view only their own academic profile:

- `server/src/modules/students/services/students.service.ts`

This was necessary because the existing shared service previously allowed only admins and advisors.

### Verification

I verified the reports system with:

- `cd server`
- `npm run build`
- a live HTTP validation against the built backend on a temporary local port

Verified endpoints:

- `GET /api/reports/attendance`
- `GET /api/reports/students`
- `GET /api/reports/risk`
- `GET /api/reports/advising`
- `GET /api/reports/courses`
- `GET /api/reports/imports`
- `GET /api/reports/student/:id`
- `GET /api/reports/doctors`

The live validation returned:

```json
{
  "attendance": {
    "totalSessions": 0,
    "totalPresent": 0,
    "totalAbsent": 0,
    "students": 0
  },
  "students": {
    "totalStudents": 16,
    "activeStudents": 16,
    "departments": 2,
    "levels": 3,
    "legacyStudents": 0
  },
  "risk": {
    "critical": 1,
    "highRiskStudents": 1,
    "alertsCount": 2
  },
  "advising": {
    "totalSessions": 1,
    "completedSessions": 1,
    "upcomingSessions": 0,
    "advisors": 1
  },
  "courses": {
    "coursesCount": 7,
    "sectionsCount": 15,
    "studentsPerCourse": 7,
    "attendancePerCourse": 7,
    "legacyCourses": 5
  },
  "imports": {
    "totalImports": 1,
    "rowsImported": 1,
    "recentImports": 1
  },
  "studentReport": {
    "studentId": "52822445-1362-4132-b7f3-b75dfd39179a",
    "attendanceOverall": 0,
    "currentCourses": 4,
    "advisingSessions": 1
  },
  "doctorAttendance": {
    "students": 0,
    "totalSessions": 0
  },
  "legacyDoctors": {
    "total": 6,
    "doctors": 5
  }
}
```

## 13. AI Advising Summary backend

### Goal completed

I implemented an AI-ready advising summary endpoint for a single student inside the existing AI module.

Route:

- `GET /api/ai/students/:studentId/summary`

This endpoint is designed for later reuse by:

- Advisor Dashboard
- Student Dashboard
- AI Assistant

### Files modified

- `server/src/modules/ai/routes/ai.routes.ts`
- `server/src/modules/ai/services/ai.controller.ts`
- `server/src/modules/ai/services/ai.service.ts`
- `server/src/modules/students/services/students.service.ts`
- `CODEX_REPORT.md`

### Reuse strategy

The summary logic lives in the AI service layer and reuses the existing CampusMind services instead of creating a parallel student-analysis path.

Reused services:

- `StudentsService`
- `RiskEngineService`
- `AttendanceEngineService`
- `AdvisingService`
- `NotificationService`

Implementation approach:

1. the AI service calls `StudentsService.getAcademicProfile(...)`
2. that existing profile builder already aggregates:
   - risk
   - attendance
   - current courses
   - failed courses
   - advising sessions
   - unread notifications
3. the AI service then adds summary-specific logic:
   - `attendanceStatus`
   - `missedSessionsCount`
   - `upcomingAdvisingSessions`
   - recommendations
   - `summaryText`

I made one small refactor in `StudentsService` so the academic-profile data builder can be reused safely with different access rules for this AI endpoint, without changing the existing profile response shape.

### Access rules

Route middleware:

- `authenticate`
- `authorize('ADMIN', 'DOCTOR', 'STUDENT')`

Service-layer access logic:

- `ADMIN` can request any student summary
- `DOCTOR` can request any student summary
- `STUDENT` can request only their own summary

### Response structure

The endpoint returns:

- `riskLevel`
- `attendanceRate`
- `attendanceStatus`
- `missedSessionsCount`
- `upcomingAdvisingSessions`
- `unreadNotifications`
- `currentCoursesCount`
- `failedCoursesCount`
- `recommendations`
- `summaryText`

Example response shape:

```json
{
  "riskLevel": "WARNING",
  "attendanceRate": 68,
  "attendanceStatus": "WARNING",
  "missedSessionsCount": 3,
  "upcomingAdvisingSessions": [
    {
      "id": "session-id",
      "scheduledAt": "2026-03-27T09:00:00.000Z",
      "status": "SCHEDULED",
      "sessionType": "FOLLOW_UP",
      "location": "Advisor Office",
      "advisorName": "Dr. Ahmed"
    }
  ],
  "unreadNotifications": 2,
  "currentCoursesCount": 4,
  "failedCoursesCount": 0,
  "recommendations": [
    "Attendance is below the desired threshold. Encourage the student to attend all upcoming sessions.",
    "Use the next advising session to review attendance trends, notifications, and course progress."
  ],
  "summaryText": "This student is currently WARNING. Attendance is 68% (WARNING) with 3 missed class sessions. There is 1 upcoming advising session. 2 unread notifications are pending. The student is currently enrolled in 4 courses. No failed courses are currently recorded."
}
```

### Summary logic

The endpoint uses the existing student academic profile data and then derives:

- `attendanceStatus`
  - `GOOD` when attendance is above the warning threshold
  - `WARNING` when attendance is below the warning threshold or when no attendance sessions exist yet
  - `LOW` when attendance is at or below the critical threshold
- `missedSessionsCount`
  - based on recorded attendance absences
- `upcomingAdvisingSessions`
  - fetched from the existing advising sessions service using `status=SCHEDULED` and `timeframe=UPCOMING`
- `recommendations`
  - rule-based guidance based on risk, attendance, missed sessions, advising activity, notifications, and current/failed courses
- `summaryText`
  - a concise human-readable academic situation summary for dashboards and AI features

### Assumptions

- `riskLevel` uses the existing risk engine values as-is:
  - `GOOD`
  - `WARNING`
  - `CRITICAL`
  - `AT_RISK`
- `attendanceStatus` is intentionally simplified to:
  - `GOOD`
  - `WARNING`
  - `LOW`
- `missedSessionsCount` refers to missed attendance sessions, not missed advising sessions
- `upcomingAdvisingSessions` is returned as a compact array of session summaries because that is more useful for later dashboard and AI-assistant usage than returning a count only
- `failedCoursesCount` currently remains `0` in environments where no failed-course data exists yet, matching the current student academic profile behavior

### Documentation comment

I added a code-level documentation comment to the new controller method in:

- `server/src/modules/ai/services/ai.controller.ts`

### Verification

I verified the endpoint with:

- `cd server`
- `npm run build`
- a live HTTP validation against the built backend on a temporary local port in `NODE_ENV=test`

Verified access patterns:

1. `ADMIN` requesting another student summary -> `200`
2. `DOCTOR` requesting another student summary -> `200`
3. `STUDENT` requesting their own summary -> `200`
4. `STUDENT` requesting another student summary -> `403`

The live validation returned:

```json
{
  "admin": {
    "status": 200,
    "riskLevel": "GOOD",
    "attendanceStatus": "WARNING",
    "recommendations": 2
  },
  "doctor": {
    "status": 200,
    "riskLevel": "GOOD",
    "currentCoursesCount": 3,
    "upcomingAdvisingSessions": 0
  },
  "studentOwn": {
    "status": 200,
    "unreadNotifications": 0,
    "summaryText": "This student is currently CRITICAL. No attendance sessions have been recorded yet, so attendance should be reviewed carefully. There are 0 upcoming advising sessions. 0 unread notifications are pending. The student is currently enrolled in 4 courses. No failed courses are currently recorded."
  },
  "studentOtherForbidden": {
    "status": 403,
    "code": "FORBIDDEN",
    "error": "You can only view your own academic profile"
  }
}
```

## 12. AI Knowledge Base backend

### Goal completed

I implemented a local AI knowledge base backend inside the existing AI module so admins can upload academic documents and authenticated users can query grounded answers without using any paid external AI API.

Supported upload formats:

- PDF
- DOCX
- TXT
- CSV
- XLSX

### Routes added

- `POST /api/ai/sources/upload`
- `GET /api/ai/sources`
- `GET /api/ai/sources/:id`
- `PATCH /api/ai/sources/:id`
- `DELETE /api/ai/sources/:id`
- `GET /api/ai/sources/:id/chunks`
- `POST /api/ai/knowledge/query`

Access rules:

- source management routes require `authenticate` + `authorize('ADMIN')`
- knowledge query requires `authenticate`

### Files added or modified

New AI knowledge files:

- `server/src/modules/ai/controllers/knowledge-source.controller.ts`
- `server/src/modules/ai/services/knowledge-source.service.ts`
- `server/src/modules/ai/middleware/knowledge-upload.ts`

Updated files:

- `server/src/modules/ai/routes/ai.routes.ts`
- `server/src/utils/validation.ts`
- `server/src/database/schema.sql`
- `server/package.json`
- `server/package-lock.json`
- `CODEX_REPORT.md`

### Source storage design

Metadata is stored in:

- `ai_knowledge_sources`

Chunked searchable content is stored in:

- `ai_knowledge_chunks`

Uploaded files are stored locally on disk under:

- `server/uploads/ai-sources`

Stored source metadata includes:

- `id`
- `title`
- `fileName`
- `category`
- `department`
- `program`
- `version`
- `status`
- `uploadedBy`
- `uploadedAt`

Internal fields were also added for maintainability:

- `file_path`
- `mime_type`
- `updated_at`

### Chunking logic

The service parses each uploaded file into plain text first:

- PDF via `pdf-parse`
- DOCX via `mammoth`
- TXT and CSV via UTF-8 text extraction
- XLSX via `xlsx` sheet-to-CSV extraction

Then it:

1. normalizes whitespace
2. splits content by paragraphs
3. breaks oversized paragraphs by sentence or safe character boundaries
4. merges small segments into readable chunks
5. stores each chunk with:
   - `chunk_index`
   - `content`
   - normalized `search_text`
   - `char_count`

Current chunk target is roughly:

- about 1000 characters max per chunk
- with small segments merged up to about 250 characters minimum

### Query logic

The knowledge query endpoint is fully local and search-based.

Request:

```json
{
  "question": "What are the graduation requirements?"
}
```

Response fields:

- `answer`
- `matchedSources`
- `matchedChunks`

How the query works:

1. normalizes the question text
2. extracts keyword tokens
3. searches only `ACTIVE` sources
4. prefilters candidate chunks in PostgreSQL using:
   - `to_tsvector('simple', search_text)`
   - token-based `ILIKE` matching
5. ranks matches in the service layer using:
   - full-question match
   - token overlap in chunk text
   - title match
   - category, department, and program hints
6. returns a grounded answer composed from the top matching chunk excerpts

This endpoint does not call any paid AI provider and does not fabricate outside the matched source text.

### Response structure

Source upload and read responses return a source summary like:

```json
{
  "id": "uuid",
  "title": "Graduation Requirements",
  "fileName": "graduation-requirements.txt",
  "category": "Regulations",
  "department": "Computer Science",
  "program": "Academic Advising",
  "version": "2026.1",
  "status": "ACTIVE",
  "uploadedBy": {
    "id": "admin-id",
    "name": "Admin Name"
  },
  "uploadedAt": "2026-03-25T21:46:00.000Z",
  "updatedAt": "2026-03-25T21:46:00.000Z",
  "chunkCount": 1
}
```

Query responses return a grounded result like:

```json
{
  "answer": "Based on the uploaded CampusMind knowledge sources, these are the most relevant points: ...",
  "matchedSources": [
    {
      "id": "source-id",
      "title": "Graduation Requirements",
      "fileName": "graduation-requirements.txt",
      "category": "Regulations",
      "status": "ACTIVE",
      "matchScore": 15.5
    }
  ],
  "matchedChunks": [
    {
      "id": "chunk-id",
      "sourceId": "source-id",
      "sourceTitle": "Graduation Requirements",
      "chunkIndex": 0,
      "excerpt": "Students must complete at least 120 earned credits ...",
      "score": 15.5
    }
  ]
}
```

### Assumptions

- uploads are limited to 5 MB because the current backend already enforces a 5 MB multipart request limit globally
- the knowledge query searches uploaded knowledge sources only; it does not mix in the older JSON AI knowledge files or the Ollama chat path
- `DELETE /api/ai/sources/:id` is a hard delete and also removes the stored file from disk
- query answers are intentionally grounded excerpt summaries, not freeform generative answers
- XLSX is supported as requested; legacy `.xls` was left out to keep the API aligned with the stated requirement

### Verification

I verified the new AI knowledge base backend with:

- `cd server`
- `npm run build`
- a live HTTP validation against the built backend on a temporary local port in `NODE_ENV=test`

Verified flow:

1. logged in as seeded admin through `POST /api/auth/login`
2. logged in as seeded student through `POST /api/auth/login`
3. uploaded a sample TXT policy through `POST /api/ai/sources/upload`
4. listed sources through `GET /api/ai/sources`
5. fetched source details through `GET /api/ai/sources/:id`
6. fetched source chunks through `GET /api/ai/sources/:id/chunks`
7. queried the knowledge base as a student through `POST /api/ai/knowledge/query`
8. updated the source status through `PATCH /api/ai/sources/:id`
9. deleted the sample source through `DELETE /api/ai/sources/:id` to keep the environment clean

The live validation returned:

```json
{
  "upload": {
    "id": "57c07d9f-123a-4d19-95d9-61e54311634d",
    "title": "Graduation Requirements Test Source",
    "status": "ACTIVE",
    "chunkCount": 1
  },
  "list": {
    "total": 1,
    "returned": 1
  },
  "details": {
    "title": "Graduation Requirements Test Source",
    "category": "Regulations",
    "status": "ACTIVE"
  },
  "chunks": {
    "total": 1,
    "firstChunkPreview": "CampusMind Graduation Requirements..."
  },
  "query": {
    "matchedSources": 1,
    "matchedChunks": 1,
    "firstSourceTitle": "Graduation Requirements Test Source"
  },
  "update": {
    "status": "INACTIVE"
  }
}
```

## Frontend Student Profile Page

### What was added

Implemented a full frontend student academic profile page for advisor/admin usage and connected it to the existing backend APIs.

Because the frontend did not already have a student details screen, I used the closest existing dashboard structure and added two route entries that both reuse one shared student profile screen:

- `/admin/students/[id]`
- `/doctor/advising/students/[id]`

This keeps the UI modular and avoids duplicate page logic.

### Files modified

- `frontend/lib/api.ts`
- `frontend/hooks/useStudentProfileData.ts`
- `frontend/components/student-profile/StudentProfileScreen.tsx`
- `frontend/app/admin/students/[id]/page.tsx`
- `frontend/app/doctor/advising/students/[id]/page.tsx`
- `frontend/app/admin/students/page.tsx`
- `frontend/app/doctor/advising/page.tsx`

### APIs connected

The page now loads and combines these existing backend endpoints:

1. `GET /api/students/:id/profile`
2. `GET /api/ai/students/:id/summary`
3. `GET /api/risk/student/:id`
4. `GET /api/advising/sessions?studentId=:id`
5. `GET /api/notifications?unreadOnly=true`

### Sections implemented

The new student profile UI includes:

1. Basic Student Info
2. Academic Summary
3. Attendance Summary
4. Risk Summary
5. AI Advising Summary
6. Advising Sessions
7. Notifications
8. Current Courses

The page includes:

- loading state
- page-level error state with retry
- section-level fallback warnings for partial API failures
- empty states for missing sessions, alerts, notifications, and graduation data

### Frontend design and structure notes

- one shared data hook (`useStudentProfileData`) handles all API loading and fallback behavior
- one shared screen component (`StudentProfileScreen`) renders the full page for both admin and doctor routes
- existing list pages were updated with a direct "view academic profile" action so users can reach the new page naturally from current flows

### Assumptions

- there was no existing dedicated student details page for admin/advisor users, so I created the closest matching route structure already used by the frontend
- the notifications endpoint is scoped to the currently authenticated user, not directly to the viewed student
- because of that, the page shows:
  - the student's unread notifications count from `GET /api/ai/students/:id/summary`
  - the latest unread notifications visible to the current logged-in viewer from `GET /api/notifications?unreadOnly=true`
  - when possible, the UI prioritizes notifications whose `related_id` matches the viewed student
- if the risk details endpoint fails, the page falls back to the risk data already included in the student profile response
- if the advising sessions endpoint fails, the page falls back to the sessions already included in the student profile response

### Verification

I verified the frontend implementation with:

- `cd frontend`
- `npx tsc --noEmit`

TypeScript validation passed successfully.

## Frontend Risk Dashboard Page

### What was added

Implemented a dedicated frontend risk dashboard for doctor/advisor users inside the existing advising area and connected it to the backend risk and advising APIs with partial-failure fallback behavior.

The route used is:

- `/doctor/advising/risk`

This keeps the page inside the current doctor advising structure and reuses the same auth and layout pattern already used by the advisor dashboard and student profile routes.

### Files modified

- `frontend/hooks/useRiskDashboardPageData.ts`
- `frontend/components/risk-dashboard/DoctorRiskDashboardScreen.tsx`
- `frontend/app/doctor/advising/risk/page.tsx`
- `frontend/components/advisor-dashboard/AdvisorDashboardScreen.tsx`

### APIs connected

The risk page now integrates these existing backend endpoints:

1. `GET /api/risk/dashboard`
2. `GET /api/risk/student/:studentId`
3. `GET /api/advising/dashboard`
4. `GET /api/notifications?unreadOnly=true`

### Sections implemented

The new risk dashboard UI includes:

1. Risk Summary Cards
2. Risk Distribution Section
3. High Risk Students List
4. Low Attendance Students List
5. Recent Alerts List
6. Notifications Preview
7. Quick Actions

The page also includes:

- loading state
- page-level error state with retry
- empty states for missing risk data, alerts, and notifications
- setup-needed warning when the doctor account is not linked to an advisor record
- partial fallback behavior when one API fails but the others still return usable data

### Frontend structure notes

- one shared hook (`useRiskDashboardPageData`) now handles risk dashboard loading, fallback mapping, and top-student detail enrichment
- one screen component (`DoctorRiskDashboardScreen`) renders the route UI
- the route file (`frontend/app/doctor/advising/risk/page.tsx`) is a thin wrapper around the reusable screen component
- the existing advisor dashboard quick links were updated so “عرض المخاطر” now opens the dedicated risk page

### Assumptions

- `GET /api/risk/dashboard` is the primary source for distribution, high-risk students, low-attendance students, and recent alerts
- `GET /api/advising/dashboard` is used as a safe fallback for total students, low-attendance count, and recent alerts when the risk dashboard is temporarily unavailable
- `GET /api/risk/student/:studentId` is used to enrich the high-risk students list with the latest alert date and recommendations
- to keep the page lightweight, the frontend only requests per-student risk details for the first group of displayed high-risk students rather than every possible student in the dashboard
- there is not yet a dedicated standalone doctor advising sessions page separate from the advisor dashboard, so the “open advising sessions” quick action links back to the advisor dashboard sessions anchor:
  - `/doctor/advising#upcoming-sessions`

### Verification

I verified the frontend risk dashboard implementation with:

- `cd frontend`
- `npx tsc --noEmit`

TypeScript validation passed successfully.

## Frontend Advising Sessions Management Pages

### What was added

Implemented full frontend advising sessions management UI for doctor/advisor users and admins, connected to the existing advising backend APIs without creating duplicate logic.

The main frontend routes now used are:

- `/doctor/advising/sessions`
- `/doctor/advising/sessions/[id]`
- `/admin/advising/sessions`

To complete the required management flow cleanly for admins as well, I also added:

- `/admin/advising/sessions/[id]`

This keeps the implementation inside the existing doctor advising area and admin dashboard structure, while reusing the same shared screen components and data hooks for both roles.

### Files created or modified

Created:

- `frontend/components/advising-sessions/shared.tsx`
- `frontend/components/advising-sessions/AdvisingSessionsManagementScreen.tsx`
- `frontend/components/advising-sessions/AdvisingSessionDetailsScreen.tsx`
- `frontend/hooks/useAdvisingSessionsManagementData.ts`
- `frontend/hooks/useAdvisingSessionDetailsData.ts`
- `frontend/app/doctor/advising/sessions/page.tsx`
- `frontend/app/doctor/advising/sessions/[id]/page.tsx`
- `frontend/app/admin/advising/sessions/page.tsx`
- `frontend/app/admin/advising/sessions/[id]/page.tsx`

Updated:

- `frontend/lib/api.ts`
- `frontend/components/advisor-dashboard/AdvisorDashboardScreen.tsx`
- `frontend/components/risk-dashboard/DoctorRiskDashboardScreen.tsx`
- `frontend/scripts/start-frontend-for-playwright.cjs`
- `frontend/playwright.config.ts`

### APIs connected

The new pages are wired to the required backend advising APIs:

- `GET /api/advising/sessions`
- `GET /api/advising/sessions/:id`
- `POST /api/advising/sessions`
- `PATCH /api/advising/sessions/:id`
- `PATCH /api/advising/sessions/:id/status`
- `GET /api/advising/sessions/:id/notes`
- `POST /api/advising/sessions/:id/notes`

I also updated the frontend API client so it now supports:

- `PATCH` requests through the shared `ApiClient`
- route-specific advising notes creation through `/advising/sessions/:id/notes`
- status updates through `/advising/sessions/:id/status`

### Features completed

The implemented UI now supports:

- sessions list table with:
  - student name
  - advisor name
  - session type
  - status
  - scheduled date/time
  - location
  - student profile quick link
  - session details quick link
- filters for:
  - status
  - timeframe
  - studentId
  - advisorId on admin pages
- session details page with:
  - session info
  - status
  - summary
  - recommendations
  - follow-up
  - notes list
  - add note form
  - student quick link
- create session flow with:
  - student selector when available
  - manual studentId fallback when selector data is unavailable
  - advisor selector for admin when available
  - manual advisorId fallback for admin when selector data is unavailable
  - session type
  - scheduled date/time
  - duration
  - location
  - meeting link
- update session flow through the details page
- status update flow with backend-supported values:
  - `SCHEDULED`
  - `COMPLETED`
  - `CANCELLED`
  - `NO_SHOW`
- notes panel with:
  - notes list
  - note type
  - author name
  - author role when returned by the backend
  - created date
  - private note toggle
- loading, empty, and page-level error states
- partial fallback behavior when list-helper APIs fail:
  - sessions page still works even if student/advisor selector data cannot be loaded

### Assumptions

- Doctor/advisor users are represented by the existing `DOCTOR` role in the frontend and backend.
- Admin details support was added at `/admin/advising/sessions/[id]` even though only the admin list route was explicitly required, because viewing and managing a single session cleanly needs a details page.
- `summary` and `recommendations` are not currently supported on initial session creation by the backend create endpoint, so they are managed on the session details page after creation.
- Clearing an existing `meetingLink` or `followUpDate` is still limited by the current backend validation behavior, so the UI updates those fields safely when values are present but does not force destructive clearing behavior.

### Verification steps

I verified the implementation with:

- `cd frontend`
- `npx tsc --noEmit`
- `npm run test:e2e:local`

Results:

- TypeScript validation passed successfully.
- Local Playwright smoke suite passed successfully with `6 passed`.

I also made a small local-test stability improvement so the smoke suite can start the frontend more reliably in this environment:

- increased Node memory for the Playwright frontend startup process
- increased the frontend Playwright web server timeout to `240_000`

`next build` did not complete in this environment because the local machine ran out of memory during the Next.js production build worker phase before type validation finished. This appears to be an environment resource limit rather than a frontend code error, because the new route and component code passed strict TypeScript checking successfully.

`next lint` is not currently configured in this frontend project, so running `npm run lint` opens the interactive Next.js ESLint setup prompt instead of a real lint pass.

## Frontend Advisor Dashboard Page

### What was added

Implemented the frontend advisor dashboard for doctor/advisor users on the existing advising route and connected it to the backend dashboard APIs with partial-failure handling.

The existing route used is:

- `/doctor/advising`

I upgraded this route instead of creating a duplicate dashboard path.

### Files modified

- `frontend/lib/api.ts`
- `frontend/hooks/useAdvisorDashboardData.ts`
- `frontend/components/advisor-dashboard/AdvisorDashboardScreen.tsx`
- `frontend/app/doctor/advising/page.tsx`

### APIs connected

The dashboard now loads from these existing backend endpoints:

1. `GET /api/advising/dashboard`
2. `GET /api/risk/dashboard`
3. `GET /api/advising/advisors/me`
4. `GET /api/advising/sessions?timeframe=UPCOMING`
5. `GET /api/notifications?unreadOnly=true`

### Sections implemented

The dashboard UI now includes:

1. Advisor Header / Profile
2. Summary Cards
3. Risk Overview
4. Upcoming Advising Sessions
5. Recent Alerts / Quick Actions
6. Notifications Preview

The page also includes:

- loading state
- page-level error state with retry
- setup-needed warning when the logged-in doctor is not linked to an advisor profile
- empty states for alerts, sessions, and notifications
- partial fallback behavior when one API fails but others still succeed

### Frontend structure notes

- one shared data hook (`useAdvisorDashboardData`) now handles dashboard loading, fallback mapping, and warning messages
- one shared screen component (`AdvisorDashboardScreen`) renders the advising dashboard UI
- the existing route file (`frontend/app/doctor/advising/page.tsx`) is now a thin wrapper around the reusable screen component
- student quick links point to the new academic profile route:
  - `/doctor/advising/students/[id]`

### Assumptions

- `GET /api/advising/advisors/me` currently returns advisor assignment data but does not expose doctor department or email directly
- because of that:
  - advisor email is shown from the authenticated user context
  - advisor department is derived from the risk dashboard payload when available
  - if no risk data is available yet, department is shown as unavailable
- if `GET /api/advising/sessions?timeframe=UPCOMING` fails, the dashboard falls back to the smaller upcoming sessions list already returned by `GET /api/advising/dashboard`
- if `GET /api/risk/dashboard` fails, the dashboard falls back to recent alerts from `GET /api/advising/dashboard` where possible
- the "view all students" and "view risk dashboard" quick actions currently jump to the relevant sections inside the same advisor dashboard because there is not yet a separate doctor-only students dashboard route

### Verification

I verified the frontend advisor dashboard implementation with:

- `cd frontend`
- `npx tsc --noEmit`

TypeScript validation passed successfully.
