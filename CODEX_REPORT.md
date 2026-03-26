CampusMind - CODEX REPORT
---------------------------------
This document records pages, components, APIs connected, and features implemented as part of the current task: implementing the public homepage and landing experience, and the Notifications pages with API integration.

Pages Created
- / (index.tsx) - Public homepage with hero, features overview, how it works, system modules grid, and contact/footer.
- /about (about.tsx) - Public about page describing CampusMind.
- /features (features.tsx) - Public features overview page.
- /contact (contact.tsx) - Public contact page with a simple form placeholder.
- /login (login.tsx) - Public login page to simulate authentication and role switching.
- /notifications (notifications/index.tsx) - Dashboard-style notifications list with filters, pagination, and actions.
- /admin/notifications (admin/notifications/index.tsx) - Admin-specific notifications page (reuses components/layout).
- /doctor/notifications (doctor/notifications/index.tsx) - Doctor-specific notifications page (reuses components/layout).
- /student/notifications (student/notifications/index.tsx) - Student-specific notifications page (reuses components/layout).

Components Created
- src/components/Layout/PublicLayout.tsx - Public-facing site layout with Navbar and Footer.
- src/components/Layout/DashboardLayout.tsx - Protected dashboard-like layout with a left navigation and content area.
- src/components/NotificationList.tsx - Reusable list for rendering notifications with actions.
- src/components/NotificationIcon.tsx - Bell icon with unread badge for header.
- src/components/Footer.tsx - Simple reusable footer.
- src/components/Card.tsx - Lightweight card wrapper for consistent styling.
- src/components/Icon.tsx - Lightweight icon component for future reuse.
- src/pages/_app.tsx - App shell to wire layouts (public vs dashboard).

APIs Connected
- GET /api/notifications - Fetch paginated notifications with filters.
- GET /api/notifications/unread-count - Fetch unread notification count.
- PATCH /api/notifications/:id/read - Mark a notification as read.
- PATCH /api/notifications/read-all - Mark all notifications as read.
- DELETE /api/notifications/:id - Delete a notification.

Features Implemented
- Notifications list with title, message, type, created date, read/unread status, and links when present.
- Filters: unread-only toggle, type filter, and date range filter.
- Mark as read per-notification and Mark all as read.
- Delete notification action.
- Pagination with page navigation.
- Empty state, loading state, and error state with retry.
- UI: Notification icon with unread badge in header, dropdown preview, and full page view.
- Public homepage with hero, features, how-it-works, modules grid, placeholders for screenshots, and contact/footer.
- Role-based layout separation (PublicLayout vs DashboardLayout) for protected routes.

Notes
- This is an initial iteration; further refinements to match the existing design system can be added as needed.

Updates after initial task
- Added homepage and landing experience pages under src/pages: index.tsx, about.tsx, features.tsx, contact.tsx, login.tsx.
- Implemented a full Notifications feature set across /notifications, /admin/notifications, /doctor/notifications, /student/notifications with API wiring and a reusable NotificationsPanel component.
- Added public layout (PublicLayout) and dashboard layout (DashboardLayout) for role-based pages.
- Created shared components: NotificationIcon, Card, and API wrapper layer for notifications (src/api/notifications.ts, src/types/Notification.ts, src/utils/api.ts).
- Created GitHub Actions workflow for automated deployment to Vercel (.github/workflows/deploy.yml).
- Wired deployment by adding a deploy step (requires VERCEL_TOKEN and related IDs in GitHub secrets).
