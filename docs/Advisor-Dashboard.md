# Advisor Dashboard

## Purpose

The advisor workflow is split across the doctor dashboard and the doctor advising workspace.

## Frontend pages

- `frontend/app/doctor/page.tsx`
- `frontend/app/doctor/advising/page.tsx`

## Main APIs

- `GET /api/advising/advisors/me`
  - Returns the logged-in doctor's advisor profile.
- `GET /api/advising/students/assigned?page=:page&limit=:limit&riskLevel=:riskLevel`
  - Returns students assigned to the advisor.
- `GET /api/advising/sessions?page=:page&limit=:limit&status=:status`
  - Returns advising sessions scoped to the current advisor.
- `GET /api/advising/sessions/upcoming`
  - Returns the next scheduled sessions for the current advisor.
- `POST /api/advising/sessions`
  - Creates a new advising session.
- `PUT /api/advising/sessions/:id`
  - Updates session status, summary, recommendations, and follow-up data.
- `GET /api/cases/advisor`
  - Returns advisor cases.
- `POST /api/cases`
  - Creates a new advisor case for a student.

## Security and access control

- Doctor requests are now scoped by the logged-in doctor's advisor mapping.
- Session reads and updates are checked against the owning advisor before data is returned.
- Admin users can still use broader advising queries for management workflows.

## Frontend data flow

The advising page now loads in two steps:

1. Load `GET /api/advising/advisors/me`
2. If the doctor is registered as an advisor, load students, sessions, upcoming sessions, and cases in parallel

If the doctor account is not linked to an advisor record yet, the page shows a setup-needed state instead of repeatedly calling advisor-only endpoints.

## Current environment note

The provided local doctor smoke user can log in and open the advising page, but in the current database state that doctor is not linked to an advisor record. The page now handles that safely.
