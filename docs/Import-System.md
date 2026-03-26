# Import System

## Purpose

CampusMind currently supports student bulk import from the admin students page.

## Entry point

- `POST /api/students/import`

## Request shape

```json
{
  "rows": [
    {
      "studentCode": "20240001",
      "email": "student@example.edu",
      "fullName": "Student Name",
      "phone": "01000000000",
      "year": 2
    }
  ]
}
```

## Validation rules

- `studentCode` must be present
- `email` must look like an email
- `fullName` must be at least 2 characters
- `year` must be between 1 and 5

## Current implementation details

- Route validation is handled before the controller reaches the service layer.
- Frontend admin payloads that arrive in `snake_case` are normalized into the `camelCase` service contract.
- Duplicate students are skipped instead of overwriting data.
- Missing import passwords are auto-generated so the import stays non-destructive.
- An audit log entry is written after the import finishes.

## Response summary

The backend returns:

- `imported`
- `skipped`
- `errors`

This makes the import safe for admin use and simple to surface in the UI.

## Frontend source

- `frontend/app/admin/students/page.tsx`

The current UI uses pasted row data rather than file upload. That is enough for admin seeding and smoke testing without adding a more complex upload pipeline.
