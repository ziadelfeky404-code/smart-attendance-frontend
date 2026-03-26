# Student Profile API

## Purpose

CampusMind now exposes a consolidated academic profile read model for advisor and admin workflows.

Route:

- `GET /api/students/:id/profile`

## Access rules

- `ADMIN` can access any student profile
- `DOCTOR` can access the profile only when the doctor is linked to an active advisor record and that advisor is actively assigned to the student
- Other roles are denied

## Response shape

```json
{
  "basicInfo": {
    "id": "student-id",
    "name": "Student Name",
    "code": "2024001",
    "email": "student@campusmind.edu",
    "phone": null,
    "department": null,
    "program": null,
    "level": "Year 2",
    "year": 2,
    "isActive": true
  },
  "gpa": null,
  "academicStanding": null,
  "attendance": {
    "overallPercentage": 83,
    "totalSessions": 12,
    "present": 10,
    "absent": 1,
    "late": 1,
    "excused": 0
  },
  "currentCourses": [
    {
      "courseId": "course-id",
      "courseCode": "CS201",
      "courseName": "Data Structures",
      "credits": 3,
      "sectionId": "section-id",
      "sectionName": "Section 1",
      "semester": "Second Semester 2024-2025",
      "academicYear": "2025",
      "enrolledAt": "2026-03-25T10:00:00.000Z",
      "attendancePercentage": 75
    }
  ],
  "failedCourses": [],
  "advisor": {
    "advisorId": "advisor-id",
    "doctorId": "doctor-id",
    "doctorName": "Dr. Advisor",
    "specialization": "Academic Advising",
    "assignedAt": "2026-03-25T10:00:00.000Z"
  },
  "risk": {
    "level": "GOOD",
    "averageAttendance": 100,
    "latestUpdate": null,
    "latestAlerts": [],
    "courses": []
  },
  "advisingSessions": [],
  "unreadNotifications": 1,
  "graduationProgress": {
    "earnedCredits": null,
    "requiredCredits": null,
    "progressPercentage": null,
    "isAvailable": false
  }
}
```

## Data sources reused

- `students` module for the core student record
- `attendance-engine.service` for overall attendance summary
- `advising.service` for advisor assignment and session history
- `risk-engine.service` for the student risk overview and latest alerts
- `notification.service` for unread notification count

## Current schema assumptions

- The active backend schema does not currently store student GPA, academic standing, department, program, or graduation-credit totals, so those fields return `null` until the schema provides them
- `failedCourses` is currently an empty array because the active backend does not yet store academic results or course-failure records
- `level` falls back to `Year {year}` when no dedicated student `level` column exists
- Advising history is returned as the latest student sessions from the existing advising module
