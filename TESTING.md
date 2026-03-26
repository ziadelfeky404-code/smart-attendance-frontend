# CampusMind - Testing Guide

Complete end-to-end testing scenarios for the CampusMind system.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Test Accounts](#test-accounts)
3. [Admin Workflow Tests](#admin-workflow-tests)
4. [Doctor Workflow Tests](#doctor-workflow-tests)
5. [Student Workflow Tests](#student-workflow-tests)
6. [Security Tests](#security-tests)
7. [API Tests](#api-tests)

---

## Prerequisites

- System deployed and running (see [DEPLOYMENT.md](./DEPLOYMENT.md))
- All test accounts created (from seed data)
- Browser with JavaScript enabled
- GPS location enabled on testing device

---

## Test Accounts

| Role | Email | Password | Used For |
|------|-------|----------|----------|
| Admin | admin@smartuniversity.edu | Admin@123 | System administration |
| Doctor | doctor@smartuniversity.edu | Doctor@123 | Opening sessions, managing attendance |
| Student | student1@smartuniversity.edu | Student@123 | Recording attendance via QR/OTP/GPS |

---

## Admin Workflow Tests

### Test 1: Admin Login

**Steps:**
1. Open frontend URL (e.g., `http://localhost:3000`)
2. Click **تسجيل الدخول** (Login)
3. Enter email: `admin@smartuniversity.edu`
4. Enter password: `Admin@123`
5. Click **دخول** (Submit)
6. **Expected:** Redirect to admin dashboard with sidebar navigation

**Pass Criteria:**
- Login successful
- Arabic UI displays correctly (RTL)
- Sidebar shows: لوحة التحكم, الأطباء, الطلاب, المقررات, الشعب, الحصص, etc.

---

### Test 2: View Dashboard Statistics

**Steps:**
1. After login, verify dashboard shows:
   - عدد الطلاب (Total Students)
   - عدد الأطباء (Total Doctors)
   - عدد المقررات (Total Courses)
   - عدد الشعب (Total Sections)
   - عدد الجلسات (Total Sessions)
   - حضور اليوم (Today's Attendance)

**Pass Criteria:**
- All statistics display with correct numbers
- Numbers match seeded data

---

### Test 3: Manage Doctors (CRUD)

**Steps:**

#### Create Doctor:
1. Go to **الأطباء** (Doctors)
2. Click **إضافة طبيب** (Add Doctor)
3. Fill form:
   - الاسم الكامل: `د. أحمد محمد`
   - البريد الإلكتروني: `ahmed.doctor@smartuniversity.edu`
   - القسم: `علوم الحاسب`
   - اللقب: `أستاذ مساعد`
   - الهاتف: `0501234567`
   - كلمة المرور: `Doctor@123`
4. Click **حفظ** (Save)
5. **Expected:** Doctor added to list

**Pass Criteria:**
- New doctor appears in list
- Audit log entry created

#### Edit Doctor:
1. Find the doctor you just created
2. Click edit icon (pencil)
3. Change title to `أستاذ`
4. Click **حفظ**
5. **Expected:** Title updated

**Pass Criteria:**
- Change reflected in list
- Audit log entry created

#### Reset Password:
1. Click password reset icon (key)
2. Enter new password: `NewPass@123`
3. Click **إرسال** (Send)
4. **Expected:** Password reset, email notification sent

**Pass Criteria:**
- Success message displayed
- Doctor can login with new password

---

### Test 4: Manage Students (CRUD + Import)

**Steps:**

#### Create Student Manually:
1. Go to **الطلاب** (Students)
2. Click **إضافة طالب** (Add Student)
3. Fill form:
   - الرقم الجامعي: `202345678`
   - الاسم الكامل: `فاطمة علي`
   - البريد الإلكتروني: `fatima@student.edu`
   - الهاتف: `0509876543`
   - السنة: `3`
4. Click **حفظ**
5. **Expected:** Student added to list

**Pass Criteria:**
- Student appears in list with correct data
- Student can login with student code and default password

#### Import Students via CSV:
1. Go to **الطلاب**
2. Click **استيراد CSV** (Import CSV)
3. Prepare CSV file:
   ```csv
   student_code,email,full_name,phone,year
   2023001,student001@uni.edu,أحمد الأول,0501111111,1
   2023002,student002@uni.edu,سارة الثاني,0502222222,1
   2023003,student003@uni.edu,خالد الثالث,0503333333,1
   ```
4. Upload CSV file
5. Click **استيراد** (Import)
6. **Expected:** Multiple students added

**Pass Criteria:**
- All valid rows imported
- Duplicate student_code rows skipped
- Summary shows: imported/skipped counts

---

### Test 5: Manage Courses (CRUD)

**Steps:**
1. Go to **المقررات** (Courses)
2. Click **إضافة مقرر** (Add Course)
3. Fill form:
   - اسم المقرر: `أساسيات البرمجة`
   - رمز المقرر: `CS101`
   - الوصف: `مقرر تعريفي بالبرمجة`
   - الساعات المعتمدة: `3`
4. Click **حفظ**
5. **Expected:** Course added to list

**Pass Criteria:**
- Course appears in list
- Course can be edited and deleted

---

### Test 6: Manage Sections (CRUD + Student Assignment)

**Steps:**

#### Create Section:
1. Go to **الشعب** (Sections)
2. Click **إضافة شعبة** (Add Section)
3. Fill form:
   - اسم الشعبة: `شعبة أ - صباحي`
   - المقرر: Select `أساسيات البرمجة`
   - الطبيب: Select a doctor
   - الفصل الدراسي: `الفصل الأول`
   - السنة: `2026`
   - الحد الأقصى: `30`
4. Click **حفظ**
5. **Expected:** Section created

**Pass Criteria:**
- Section appears in list with course and doctor names

#### Assign Students to Section:
1. Go to **الشعب**
2. Click **إدارة الطلاب** (Manage Students) for your section
3. **Expected:** Navigate to section assignment page

**Pass Criteria:**
- Page shows enrolled students (if any)
- Search/filter students by name or ID
- Checkbox selection for adding students

4. Select 2-3 students from the list
5. Click **إضافة المحددين** (Add Selected)
6. **Expected:** Students added to section

**Pass Criteria:**
- Students appear in enrolled list
- Student count updates

#### Remove Students from Section:
1. In section management, check some enrolled students
2. Click **إزالة المحددين** (Remove Selected)
3. **Expected:** Students removed from section

**Pass Criteria:**
- Students removed from enrolled list
- Student count updates

---

### Test 7: Manage Lectures and Sessions

**Steps:**

#### Create Lecture:
1. Go to **الحصص** (Lectures)
2. Click **إضافة حصة** (Add Lecture)
3. Fill form:
   - العنوان: `المحاضرة الأولى`
   - المقرر: Select `أساسيات البرمجة`
   - تاريخ البدء: Pick today's date
   - وقت البدء: `09:00`
   - وقت الانتهاء: `10:30`
   - القاعة: `مدرج 1`
   - المبنى: `المبنى الرئيسي`
4. Click **حفظ**

**Pass Criteria:**
- Lecture appears in list

---

### Test 8: View Attendance Reports

**Steps:**
1. Go to **التقارير** (Reports)
2. Select report type: **تقارير الحضور** (Attendance Reports)
3. Filter by:
   - Course: Select a course
   - Section: Select a section
   - Date range: This week
4. Click **عرض** (Show)
5. **Expected:** Table shows attendance records

**Pass Criteria:**
- Only records for selected course/section shown
- Pagination works
- Export to PDF/Excel (if implemented)

---

### Test 9: View Audit Logs

**Steps:**
1. Go to **سجل التدقيق** (Audit Logs) - may be in settings
2. View recent actions:
   - Logins
   - CRUD operations
   - Attendance records

**Pass Criteria:**
- Logs show: who, what, when, from which IP
- Old/new values shown for updates

---

## Doctor Workflow Tests

### Test 10: Doctor Login and Dashboard

**Steps:**
1. Logout from admin account
2. Login as doctor: `doctor@smartuniversity.edu` / `Doctor@123`
3. **Expected:** Doctor dashboard shows:
   - شعبةي (My Sections)
   - حصصي (My Sessions)
   - الحضور (Attendance)

**Pass Criteria:**
- Only doctor's sections shown
- Can open new attendance session

---

### Test 11: Open Attendance Session (Generate QR)

**Steps:**

#### Open Session with QR Only:
1. Go to **فتح جلسة حضور** (Open Attendance Session)
2. Select a section
3. Toggle GPS off (for QR-only test)
4. Click **فتح الجلسة** (Open Session)
5. **Expected:** 
   - QR code displayed
   - Session token generated
   - Timer counting down (5 minutes default)

**Pass Criteria:**
- QR code renders correctly
- Token is HMAC-signed (not plain text)
- Expiry countdown visible

#### Open Session with GPS:
1. Open a new session
2. Toggle GPS on
3. Set radius to `100` meters
4. Click **فتح الجلسة**
5. **Expected:** QR code with GPS coordinates embedded

**Pass Criteria:**
- QR code displayed
- GPS radius shown in session info

---

### Test 12: Close Attendance Session

**Steps:**
1. While session is open, click **إغلاق الجلسة** (Close Session)
2. Confirm closure
3. **Expected:** 
   - Session status changes to "closed"
   - QR code no longer valid
   - Session moved to history

**Pass Criteria:**
- No new attendance records can be created
- Session marked as closed in database

---

### Test 13: View Section Attendance

**Steps:**
1. Go to **حضور الشعب** (Section Attendance)
2. Select a section
3. View attendance records:
   - Student name
   - Status (حاضر/غائب/متأخر)
   - OTP verified (نعم/لا)
   - GPS verified (نعم/لا)
   - Distance from venue

**Pass Criteria:**
- Only this doctor's sections shown
- Records paginated correctly

---

### Test 14: Edit Attendance Record

**Steps:**
1. Find an attendance record
2. Click edit icon
3. Change status from `ABSENT` to `PRESENT`
4. Add reason: `حضور متأخر بعذر`
5. Click **حفظ**
6. **Expected:** Record updated, audit log created

**Pass Criteria:**
- Status change reflected
- Reason saved
- Audit log shows old/new values

---

## Student Workflow Tests

### Test 15: Student Login

**Steps:**
1. Logout from doctor account
2. Login as student: `student1@smartuniversity.edu` / `Student@123`
3. **Expected:** Student dashboard shows:
   - نسبه حضورك (Your Attendance Rate)
   - شعبك (Your Sections)
   - سجل الحضور (Attendance History)

**Pass Criteria:**
- Circular progress showing attendance percentage
- List of enrolled sections

---

### Test 16: Record Attendance via QR Scan

**Steps:**

#### Get Session QR from Doctor:
1. Login as doctor
2. Open attendance session for a section
3. Copy the QR token or display it for student
4. Note the session token

#### Student Records Attendance:
1. Login as student
2. Go to **تسجيل الحضور** (Record Attendance)
3. Enter the QR token manually (or scan if you have QR)
4. Click **تحقق من الكود** (Verify Code)
5. **Expected:** 
   - Session info displayed: section name, course, doctor
   - OTP request button appears
   - GPS status shown

**Pass Criteria:**
- Valid QR token accepted
- Session details shown correctly

---

### Test 17: Request and Enter OTP

**Steps:**

1. After QR verification, click **طلب رمز OTP** (Request OTP)
2. **Expected:** 
   - OTP sent to student's email
   - Success message shown

3. Check student's email inbox for OTP code
4. Enter the 6-digit code
5. Click **تحقق** (Verify)
6. **Expected:** 
   - OTP verified successfully
   - GPS step activated

**Pass Criteria:**
- OTP email received
- Correct code accepted
- Wrong code rejected with error

---

### Test 18: GPS Verification

**Steps:**

1. After OTP verified, GPS check activates
2. System detects current GPS coordinates
3. **Expected:** 
   - Distance to venue calculated
   - If within radius: "تم التحقق من الموقع"
   - If outside radius: Error message

**Pass Criteria:**
- GPS coordinates detected
- Haversine distance calculated correctly
- Within radius = success
- Outside radius = failure

---

### Test 19: Complete Attendance Flow

**Steps:**
1. Complete all three steps:
   - QR Token ✓
   - OTP Verified ✓
   - GPS Verified ✓
2. Click **تسجيل الحضور** (Record Attendance)
3. **Expected:**
   - Attendance recorded successfully
   - Status: PRESENT
   - Confirmation message with details

**Pass Criteria:**
- Record created in database
- Attendance percentage updated
- Can view in history

---

### Test 20: View Attendance History

**Steps:**
1. Go to **سجل الحضور** (Attendance History)
2. View records with filters:
   - Date range
   - Course
   - Section
3. **Expected:** 
   - List of all attended sessions
   - Status, date, section, course shown

**Pass Criteria:**
- All past attendance records shown
- Pagination works
- Correct status displayed

---

### Test 21: Student Gets Absent Marked (Auto)

**Steps:**
1. Doctor opens session for a section
2. Student does NOT attend (no QR scan)
3. Session closes after timeout (5 minutes)
4. **Expected:** 
   - After session closes, absent students auto-marked
   - Student sees ABSENT in history

**Pass Criteria:**
- Absent students automatically marked
- Student notification (if implemented)

---

## Security Tests

### Test 22: SQL Injection Prevention

**Steps:**
1. Try entering in various form fields:
   - Email: `' OR '1'='1`
   - Name: `Robert'; DROP TABLE students;--`
   - Student Code: `1234; DELETE FROM attendance;`

2. **Expected:** 
   - All inputs sanitized
   - Errors shown but no data leaked
   - Database remains intact

**Pass Criteria:**
- No SQL errors exposed
- No data deletion
- Form validation rejects unusual characters

---

### Test 23: Unauthorized Access (IDOR Prevention)

**Steps:**

#### Student tries to access another student's data:
1. Login as student1
2. Try to access URL directly:
   ```
   /api/attendance/student/my-history?studentId=OTHER_STUDENT_ID
   ```
3. **Expected:** Access denied

**Pass Criteria:**
- 403 Forbidden or 401 Unauthorized
- Only own data returned

#### Doctor tries to edit another doctor's section:
1. Login as doctor1
2. Try to edit attendance for doctor2's section
3. **Expected:** Access denied

**Pass Criteria:**
- Authorization check fails
- Cannot modify others' data

---

### Test 24: Rate Limiting

**Steps:**

#### Login Rate Limit:
1. Try to login with wrong password 10 times rapidly
2. **Expected:** After 10 attempts, blocked for 15 minutes

**Pass Criteria:**
- 429 Too Many Requests returned
- Can login after cooldown

#### OTP Rate Limit:
1. Request OTP 5 times in quick succession
2. **Expected:** Blocked after 5 requests

**Pass Criteria:**
- Error: "تم تجاوز الحد الأقصى من المحاولات"

---

### Test 25: JWT Token Expiration

**Steps:**

1. Login successfully
2. Wait for access token to expire (15 minutes)
3. Try to make an API request
4. **Expected:** 
   - 401 Unauthorized
   - Should attempt refresh token
   - Or redirect to login

**Pass Criteria:**
- Expired token rejected
- System handles gracefully

---

### Test 26: XSS Prevention

**Steps:**

1. Try to enter script tags in any text field:
   ```
   <script>alert('xss')</script>
   ```
2. View the field later
3. **Expected:** 
   - Script not executed
   - Text displayed as plain text

**Pass Criteria:**
- `<script>` tags escaped/removed
- No JavaScript execution

---

## API Tests

### Test 27: Health Check

```bash
curl https://your-backend.onrender.com/api/health
```

**Expected:** `{"success":true,"message":"Server is running"}`

---

### Test 28: Login API

```bash
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@smartuniversity.edu","password":"Admin@123"}'
```

**Expected:** Response with access token and refresh token

---

### Test 29: Protected Endpoint

```bash
# Get access token first, then:
curl https://your-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** User profile data

---

### Test 30: Invalid Token

```bash
curl https://your-backend.onrender.com/api/auth/me \
  -H "Authorization: Bearer invalid_token_here"
```

**Expected:** `401 Unauthorized`

---

### Test 31: QR Token Verification

```bash
# As doctor, get session QR token, then verify as student:
curl https://your-backend.onrender.com/api/attendance/student/sessions/qr/YOUR_QR_TOKEN
```

**Expected:** Session details if valid, error if expired/invalid

---

### Test 32: Attendance Recording

```bash
curl -X POST https://your-backend.onrender.com/api/attendance/student/record \
  -H "Authorization: Bearer STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "qrToken": "QR_TOKEN",
    "otpCode": "123456",
    "gpsLatitude": 24.7136,
    "gpsLongitude": 46.6753
  }'
```

**Expected:** Attendance record created

---

## Test Data Setup

### Before Running Tests

1. Ensure database is seeded with:
   - 1 admin account
   - 1 doctor account  
   - 3 student accounts
   - 2 courses
   - 2 sections
   - 1 lecture

2. Ensure at least one section has enrolled students

### Reset Test Data

If you need to reset test data:

```sql
-- Clear attendance records
TRUNCATE TABLE attendance_records CASCADE;

-- Clear sessions
TRUNCATE TABLE sessions CASCADE;

-- Reset student passwords
UPDATE students SET password_hash = '$2b$12$...' WHERE email = 'student1@smartuniversity.edu';
```

---

## Expected Test Results Summary

| Test | Description | Expected Result | Status |
|------|-------------|-----------------|--------|
| 1 | Admin Login | Success, Arabic UI | [] |
| 2 | Dashboard Stats | Numbers display | [] |
| 3 | Doctor CRUD | Create/Edit/Reset works | [] |
| 4 | Student CRUD + CSV | Import 3 students | [] |
| 5 | Course CRUD | Create course | [] |
| 6 | Section CRUD + Assign | Assign students | [] |
| 7 | Lecture CRUD | Create lecture | [] |
| 8 | Reports | View attendance | [] |
| 9 | Audit Logs | View changes | [] |
| 10 | Doctor Login | Dashboard loads | [] |
| 11 | Open Session QR | QR displayed | [] |
| 12 | Close Session | Session closed | [] |
| 13 | Section Attendance | View records | [] |
| 14 | Edit Attendance | Update works | [] |
| 15 | Student Login | Dashboard loads | [] |
| 16 | QR Scan | Token verified | [] |
| 17 | OTP Request | Email sent | [] |
| 18 | GPS Verify | Distance shown | [] |
| 19 | Full Flow | Attendance recorded | [] |
| 20 | History | Records listed | [] |
| 21 | Auto Absent | Marked correctly | [] |
| 22 | SQL Injection | Prevented | [] |
| 23 | IDOR | Blocked | [] |
| 24 | Rate Limit | Blocked | [] |
| 25 | Token Expire | Handled | [] |
| 26 | XSS | Prevented | [] |
| 27-32 | API Tests | As documented | [] |

---

## Troubleshooting Failed Tests

### QR Code Not Displaying
- Check browser console for errors
- Verify QR library loaded correctly
- Check canvas element exists

### OTP Not Received
- Check spam folder
- Verify SMTP settings
- Check Gmail app password

### GPS Not Working
- Enable location services in browser
- Allow location permission when prompted
- Test on HTTPS (required for GPS)

### Session Expired
- Refresh page
- Login again if token expired
- Check system time is correct

### Database Connection Error
- Verify DATABASE_URL in Render
- Check Supabase project status
- Ensure no IP restrictions blocking
