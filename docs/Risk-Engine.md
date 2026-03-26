# Risk Engine

## Purpose

The risk engine watches attendance patterns and flags students who may need intervention.

## Main routes

- `GET /api/risk/students`
- `GET /api/risk/students/:studentId`
- `GET /api/risk/analyze?studentId=:studentId&courseId=:courseId`
- `GET /api/risk/stats`
- `GET /api/risk/my-status`

## Core data flow

1. Read risk thresholds from `system_settings`
2. Aggregate attendance data from `attendance`, `section_sessions`, `sections`, and `courses`
3. Calculate attendance rate and consecutive absences
4. Save a new row in `risk_logs`
5. Send notifications when the risk level changes
6. Auto-create a case when the student crosses the configured critical threshold

## Thresholds used today

- `risk_warning_threshold`
- `risk_critical_threshold`
- `auto_create_case_threshold`
- `absence_streak_warning`

## Outputs used by the frontend

- Admin risk dashboard totals and cards
- Student risk status and recommendations
- Advisor student risk badges

## Current behavior notes

- Risk level is primarily driven by attendance percentage and absence streak.
- Warning and critical transitions can trigger notifications.
- Critical attendance can auto-create a case for follow-up.

## Scaling notes

The current implementation is good enough for smoke testing and small to medium data sets. As the dataset grows, the first backend optimization target should be reducing repeated queries inside consecutive-absence calculation.
