export type UserRole = 'admin' | 'doctor' | 'student';

export const testUsers = {
  admin: {
    email: process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@campusmind.edu',
    password: process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'Admin@123',
  },
  doctor: {
    email: process.env.PLAYWRIGHT_DOCTOR_EMAIL || 'dr.ahmed@campusmind.edu',
    password: process.env.PLAYWRIGHT_DOCTOR_PASSWORD || 'Doctor@123',
  },
  student: {
    email: process.env.PLAYWRIGHT_STUDENT_EMAIL || 'mohamed.ahmed@campusmind.edu',
    password: process.env.PLAYWRIGHT_STUDENT_PASSWORD || 'Student@123',
  },
} as const;
