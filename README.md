# CampusMind - نظام الإرشاد الأكاديمي الذكي

**CampusMind** - نظام متكامل للإرشاد الأكاديمي والحضور الذكي.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql)

---

## نظرة عامة

نظام حضور ذكي يجمع بين الأمان العالي وتجربة المستخدم السلسة. يستخدم ثلاثة مستويات من التحقق:

| المستوى | الوصف |
|---------|-------|
| **QR Code** | رمز HMAC-SHA256 موقع رقمياً |
| **OTP** | كلمة مرور لمرة واحدة عبر البريد |
| **GPS** | التحقق من المسافة عبر خوارزمية Haversine |

---

## المميزات

### للإدارة
- [x] لوحة تحكم شاملة
- [x] إدارة الأطباء (إضافة/تعديل/حذف/إعادة تعيين كلمة المرور)
- [x] إدارة الطلاب (يدوي + استيراد CSV)
- [x] إدارة المقررات والشعب
- [x] تعيين وإزالة الطلاب من الشعب
- [x] عرض تقارير الحضور التفصيلية
- [x] سجل تدقيق كامل (من做了什么/旧值 →做了什么/新值)

### للأطباء
- [x] فتح جلسة حضور (QR + GPS)
- [x] عرض QR Code للطلاب
- [x] إغلاق الجلسات يدوياً
- [x] عرض حضور الشعب
- [x] تعديل سجلات الحضور
- [x] تقارير الأداء

### للطلاب
- [x] مسح QR Code أو إدخال الرمز يدوياً
- [x] طلب والتحقق من OTP
- [x] التحقق التلقائي من الموقع الجغرافي
- [x] عرض سجل الحضور
- [x] عرض نسبة الحضور

---

## الأمان

- [x] JWT Authentication مع Refresh Tokens
- [x] Rate Limiting (مخصص لكل endpoint)
- [x] Zod Validation لجميع المدخلات
- [x] HMAC-SHA256 Signed QR Tokens
- [x] SQL Injection Prevention (Parameterized Queries)
- [x] IDOR Protection (Authorization Checks)
- [x] Audit Logging مع Old/New Values
- [x] Security Headers (Helmet + HSTS + CSP)
- [x] Request Size Limiting
- [x] CORS Configuration

---

## البنية التقنية

### Backend
```
server/
├── src/
│   ├── index.ts                    # Express App
│   ├── config/                     # Environment Config
│   ├── database/                   # PostgreSQL + Schema
│   ├── types/                      # TypeScript Interfaces
│   ├── services/                   # Business Logic
│   ├── modules/                    # Controllers + Routes
│   ├── middleware/                 # Auth + Error Handler
│   ├── utils/                      # Validation + Helpers
│   └── email.service.ts            # Nodemailer Gmail SMTP
├── Dockerfile                      # Docker Build
├── render.yaml                     # Render Deployment
└── package.json
```

### Frontend
```
frontend/
├── app/
│   ├── admin/                      # Admin Pages (rtl)
│   ├── doctor/                     # Doctor Pages
│   ├── student/                    # Student Pages
│   └── login/                      # Auth Pages
├── components/                     # Reusable Components
├── hooks/                          # React Hooks
├── lib/                            # API Client
└── package.json
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React, Tailwind CSS, RTL Arabic |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL 15+ |
| **Auth** | JWT (HS256), Refresh Tokens |
| **Email** | Nodemailer + Gmail SMTP |
| **Validation** | Zod |
| **Security** | Helmet, Rate Limit, Bcrypt |

---

## التطوير المحلي

### المتطلبات

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### خطوات التثبيت

#### 1. استنساخ المشروع

```bash
cd "D:\مشروع الارشاد الاكاديمي"
```

#### 2. إعداد Backend

```bash
cd server

# تثبيت المكتبات
npm install

# نسخ ملف البيئة
cp .env.example .env

# تعديل .env مع بياناتك:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/attendance_db
# JWT_SECRET=your-64-char-secret
# SMTP_USER=your@gmail.com
# SMTP_PASS=your-app-password
```

#### 3. إعداد قاعدة البيانات

```bash
# تشغيل Schema
psql -U postgres -d attendance_db -f src/database/schema.sql

# تشغيل Seed (اختياري)
psql -U postgres -d attendance_db -f src/database/seed.sql
```

#### 4. إعداد Frontend

```bash
cd ../frontend
npm install

# إنشاء .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local
```

#### 5. تشغيل النظام

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

#### 6. الوصول

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

### بيانات الاختبار

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| Admin | admin@smartuniversity.edu | Admin@123 |
| Doctor | doctor@smartuniversity.edu | Doctor@123 |
| Student | student1@smartuniversity.edu | Student@123 |

---

## النشر

### الخدمات المجانية

| الخدمة | الغرض | الرابط |
|--------|-------|--------|
| **Vercel** | Frontend | https://vercel.com |
| **Render** | Backend | https://render.com |
| **Supabase** | PostgreSQL | https://supabase.com |

### دليل النشر الكامل

راجع [DEPLOYMENT.md](./DEPLOYMENT.md) للتعليمات التفصيلية.

### الخطوات المختصرة

1. **Supabase**: إنشاء مشروع + تشغيل schema.sql + seed.sql
2. **Render**: ربط GitHub + إضافة Environment Variables
3. **Vercel**: ربط GitHub + تعيين NEXT_PUBLIC_API_URL
4. تحديث CORS_ORIGIN في Backend

---

## الاختبار

### دليل الاختبار الكامل

راجع [TESTING.md](./TESTING.md) لسيناريوهات الاختبار الشاملة.

### ملخص الاختبارات

- **اختبارات Admin**: تسجيل الدخول، إدارة CRUD، التقارير
- **اختبارات Doctor**: فتح/إغلاق الجلسات، عرض الحضور
- **اختبارات Student**: QR + OTP + GPS Flow
- **اختبارات Security**: SQL Injection، IDOR، Rate Limiting

---

## هيكل قاعدة البيانات

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    admins   │     │   doctors   │     │  students   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ email       │     │ email       │     │ student_code│
│ password    │     │ password    │     │ email       │
│ full_name   │     │ full_name   │     │ password    │
│ created_at  │     │ department  │     │ full_name   │
└─────────────┘     │ created_at  │     │ year        │
                    └─────────────┘     │ created_at  │
                          │             └─────────────┘
                          │                   │
                          ▼                   ▼
                    ┌─────────────┐     ┌─────────────┐
                    │   courses   │     │  sections   │
                    ├─────────────┤     ├─────────────┤
                    │ id (PK)     │     │ id (PK)     │
                    │ name        │     │ name        │
                    │ code        │     │ course_id   │──┐
                    │ credits     │     │ doctor_id   │──┼─┐
                    │ created_at  │     │ created_at  │  │ │
                    └─────────────┘     └─────────────┘  │ │
                                        ┌────────────────┘ │
                                        │ section_students│
                                        ├──────────────────┤
                                        │ section_id (FK) │◄─┘
                                        │ student_id (FK) │◄─┘
                                        │ enrolled_at     │
                                        └─────────────────┘
                                                  
                    ┌─────────────┐     ┌─────────────┐
                    │  lectures   │     │   sessions  │
                    ├─────────────┤     ├─────────────┤
                    │ id (PK)     │     │ id (PK)     │
                    │ title       │     │ section_id  │──┐
                    │ course_id   │──┐  │ lecture_id  │  │
                    │ scheduled_* │  │  │ status      │  │
                    │ room        │  │  │ opened_at   │  │
                    │ building    │  │  │ closed_at   │  │
                    │ created_at  │  │  │ gps_lat     │  │
                    └─────────────┘  │  │ gps_lng     │  │
                                     │  │ gps_radius  │  │
                                     │  │ qr_token    │  │
                                     │  └─────────────┘  │
                                     └──────────────────┘
                                               │
                                               ▼
                    ┌─────────────────────────────────┐
                    │      attendance_records          │
                    ├─────────────────────────────────┤
                    │ id (PK)                          │
                    │ session_id (FK)                  │
                    │ student_id (FK)                  │
                    │ status (PRESENT/ABSENT/LATE)     │
                    │ otp_verified                     │
                    │ gps_verified                     │
                    │ distance_meters                 │
                    │ attended_at                      │
                    │ updated_at                       │
                    └─────────────────────────────────┘
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### OTP
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/otp/generate` | Generate OTP |
| POST | `/api/otp/verify` | Verify OTP |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/stats` | System stats |
| CRUD | `/api/doctors` | Manage doctors |
| CRUD | `/api/students` | Manage students |
| CRUD | `/api/courses` | Manage courses |
| CRUD | `/api/sections` | Manage sections |
| POST | `/api/sections/:id/assign-students` | Assign students |
| POST | `/api/sections/:id/remove-students` | Remove students |

### Lectures & Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| CRUD | `/api/lectures` | Manage lectures |
| GET | `/api/lectures/sessions` | List sessions |
| POST | `/api/lectures/sessions` | Open session |
| POST | `/api/lectures/sessions/:id/close` | Close session |
| GET | `/api/lectures/sessions/:id/qr` | Get QR token |

### Attendance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/attendance` | List records (admin/doctor) |
| PUT | `/api/attendance/:id` | Update record |
| GET | `/api/attendance/student/sessions/qr/:token` | Verify QR |
| POST | `/api/attendance/student/record` | Record attendance |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/students` | Student attendance |
| GET | `/api/reports/doctors` | Doctor performance |

---

## المساهمة

المشروع مرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء branch للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى Branch (`git push origin feature/amazing-feature`)
5. فتح Pull Request

---

## الترخيص

MIT License - استخدم بحرية!

---

## الدعم

للمشاكل والأسئلة:
- افتح Issue على GitHub
- راجع [DEPLOYMENT.md](./DEPLOYMENT.md)
- راجع [TESTING.md](./TESTING.md)

---

## التطوير المستقبلي

- [ ] تطبيق موبايل (React Native)
- [ ] إشعارات_push
- [ ] تكامل Microsoft Teams
- [ ] التحقق عبر Bluetooth Beacons
- [ ] تقارير PDF
- [ ] لوحة تحكم بيانية (Charts)

---

## Architecture Notes (English)

- Active app pair: `frontend/` + `server/`
- Frontend: Next.js 14
- Backend: Express + TypeScript
- Database: PostgreSQL
- Main backend pattern: `route -> controller -> service -> database`
- Shared backend infrastructure now includes request validation, structured logging, request IDs, and a global error handler
- Advising routes are now role-scoped more safely for doctor access

## Module Docs (English)

- [Student Profile API](./docs/Student-Profile-API.md)
- [Advisor Dashboard](./docs/Advisor-Dashboard.md)
- [Import System](./docs/Import-System.md)
- [Risk Engine](./docs/Risk-Engine.md)

## E2E Smoke Testing (English)

From `frontend/`:

```bash
npm run test:e2e:install
npm run test:e2e:local
```

Other useful commands:

```bash
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:vercel
```

Notes:

- Local Playwright starts the frontend on `http://127.0.0.1:3100`
- Local Playwright starts the backend on `http://127.0.0.1:5100`
- The provided Vercel URL is currently protected by Vercel authentication and returns `401 Authentication Required`, so deployed smoke runs skip cleanly until an unprotected URL is available
