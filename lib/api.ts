const API_BASE = 'https://server-d5tscppgb-ziadelfeky404-codes-projects.vercel.app/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'حدث خطأ غير متوقع');
    return data as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(res);
  }
}

export const api = new ApiClient();

export const authApi = {
  login: (email: string, password: string) => api.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>('/auth/login', { email, password }),
  refresh: (refreshToken: string) => api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }),
  me: () => api.get<ApiResponse<User>>('/auth/me'),
  logout: () => api.post<ApiResponse<null>>('/auth/logout', {}),
};

export const adminApi = {
  dashboard: () => api.get<ApiResponse<{ stats: DashboardStats; recentActivity: RecentActivity[] }>>('/admin/dashboard'),
  stats: () => api.get<ApiResponse<DashboardStats>>('/admin/stats'),
  doctors: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ doctors: Doctor[]; total: number }>>(`/doctors?${new URLSearchParams(params || {})}`), create: (data: Record<string, unknown>) => api.post<ApiResponse<unknown>>('/doctors', data), update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<unknown>>(`/doctors/${id}`, data), delete: (id: string) => api.delete<ApiResponse<unknown>>(`/doctors/${id}`), resetPassword: (id: string, password: string) => api.post<ApiResponse<unknown>>(`/doctors/${id}/reset-password`, { newPassword: password }) },
  students: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ students: Student[]; total: number }>>(`/students?${new URLSearchParams(params || {})}`), create: (data: Record<string, unknown>) => api.post<ApiResponse<unknown>>('/students', data), update: (id: string, data: Record<string, unknown>) => api.put<ApiResponse<unknown>>(`/students/${id}`, data), delete: (id: string) => api.delete<ApiResponse<unknown>>(`/students/${id}`), import: (rows: Record<string, unknown>[]) => api.post<ApiResponse<{ imported: number; skipped: number }>>('/students/import', { rows }) },
  courses: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ courses: Course[]; total: number }>>(`/courses?${new URLSearchParams(params || {})}`), create: (data: Partial<Course>) => api.post<ApiResponse<unknown>>('/courses', data), update: (id: string, data: Partial<Course>) => api.put<ApiResponse<unknown>>(`/courses/${id}`, data), delete: (id: string) => api.delete<ApiResponse<unknown>>(`/courses/${id}`) },
  sections: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ sections: Section[]; total: number }>>(`/sections?${new URLSearchParams(params || {})}`), create: (data: Partial<Section>) => api.post<ApiResponse<unknown>>('/sections', data), update: (id: string, data: Partial<Section>) => api.put<ApiResponse<unknown>>(`/sections/${id}`, data), delete: (id: string) => api.delete<ApiResponse<unknown>>(`/sections/${id}`), assignStudents: (id: string, studentIds: string[]) => api.post<ApiResponse<{ assigned: number }>>(`/sections/${id}/assign-students`, { studentIds }), removeStudents: (id: string, studentIds: string[]) => api.post<ApiResponse<{ removed: number }>>(`/sections/${id}/remove-students`, { studentIds }), getStudents: (id: string) => api.get<ApiResponse<SectionStudent[]>>(`/sections/${id}/students`) },
  lectures: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ lectures: Lecture[]; total: number }>>(`/lectures?${new URLSearchParams(params || {})}`), sessions: (params?: Record<string, string>) => api.get<ApiResponse<{ sessions: Session[]; total: number }>>(`/lectures/sessions?${new URLSearchParams(params || {})}`), openSession: (data: { section_id: string; lecture_id?: string; gps_latitude?: number; gps_longitude?: number; gps_radius_meters?: number }) => api.post<ApiResponse<{ id: string; qr_token: string; expires_at: string }>>('/lectures/sessions', data), closeSession: (id: string) => api.post<ApiResponse<unknown>>(`/lectures/sessions/${id}/close`, {}), getQR: (id: string) => api.get<ApiResponse<{ qr_token: string; expires_at: string }>>(`/lectures/sessions/${id}/qr`), attendance: (sessionId: string) => api.get<ApiResponse<AttendanceRecord[]>>(`/lectures/sessions/${sessionId}/attendance`) },
  attendance: { list: (params?: Record<string, string>) => api.get<ApiResponse<{ records: AttendanceRecord[]; total: number }>>(`/attendance?${new URLSearchParams(params || {})}`), update: (id: string, data: { status: string; reason?: string }) => api.put<ApiResponse<unknown>>(`/attendance/${id}`, data) },
  reports: { studentAttendance: (params?: Record<string, string>) => api.get<ApiResponse<{ students: StudentReport[]; total: number }>>(`/reports/students?${new URLSearchParams(params || {})}`), doctorPerformance: (params?: Record<string, string>) => api.get<ApiResponse<{ doctors: DoctorReport[]; total: number }>>(`/reports/doctors?${new URLSearchParams(params || {})}`) },
  auditLogs: (params?: Record<string, string>) => api.get<ApiResponse<{ logs: AuditLog[]; total: number }>>(`/admin/audit-logs?${new URLSearchParams(params || {})}`),
};

export const otpApi = {
  generate: (type: 'ATTENDANCE' | 'PASSWORD_RESET' | 'EMAIL_VERIFY') => api.post<ApiResponse<{ message: string }>>('/otp/generate', { type }),
  verify: (code: string, type: 'ATTENDANCE' | 'PASSWORD_RESET' | 'EMAIL_VERIFY') => api.post<ApiResponse<{ verified: boolean }>>('/otp/verify', { code, type }),
};

export const studentApi = {
  mySections: () => api.get<ApiResponse<StudentSection[]>>('/attendance/student/my-sections'),
  myHistory: (params?: Record<string, string>) => api.get<ApiResponse<{ records: AttendanceRecord[]; total: number }>>(`/attendance/student/my-history?${new URLSearchParams(params || {})}`),
  mySummary: () => api.get<ApiResponse<StudentSummary>>('/attendance/student/my-summary'),
  getSessionByQR: (qrToken: string) => api.get<ApiResponse<SessionPreview>>(`/attendance/student/sessions/qr/${qrToken}`),
  getActiveSession: (sectionId: string) => api.get<ApiResponse<{ exists: boolean; session?: SessionPreview }>>(`/attendance/student/sessions/section/${sectionId}`),
  record: (data: { sessionId: string; qrToken: string; otpCode: string; gpsLatitude: number; gpsLongitude: number }) => api.post<ApiResponse<AttendanceResult>>('/attendance/student/record', data),
};

export interface User {
  id: string; email: string; fullName: string; role: 'ADMIN' | 'DOCTOR' | 'TA' | 'STUDENT';
}
export interface DashboardStats {
  totalStudents: number; totalDoctors: number; totalCourses: number; totalSessions: number;
  totalSections: number; totalLectures: number; totalAdmins: number; activeSessions: number; todayAttendance: number;
}
export interface RecentActivity { type: string; count: number; }
export interface Doctor { id: string; email: string; full_name: string; department?: string; title?: string; phone?: string; is_active: boolean; created_at: string; }
export interface Student { id: string; student_code: string; email: string; full_name: string; phone?: string; year: number; is_active: boolean; created_at: string; }
export interface Course { id: string; name: string; code: string; description?: string; credits: number; doctor_id?: string; doctor_name?: string; is_active: boolean; }
export interface Section { id: string; name: string; course_id: string; course_name?: string; doctor_id: string; doctor_name?: string; ta_id?: string; semester: string; year: number; max_students: number; student_count?: number; is_active: boolean; }
export interface Lecture { id: string; title?: string; course_id: string; course_name?: string; doctor_name?: string; scheduled_start: string; scheduled_end: string; room?: string; building?: string; }
export interface Session { id: string; section_id: string; status: string; opened_at: string; expires_at: string; qr_token: string; }
export interface AttendanceRecord { id: string; student_id: string; student_code?: string; student_name?: string; status: string; otp_verified: boolean; gps_verified: boolean; attended_at: string; session_id: string; section_name?: string; course_name?: string; doctor_name?: string; distance_meters?: string; }
export interface StudentReport { studentId: string; studentCode: string; fullName: string; totalSessions: number; present: number; absent: number; late: number; presentRate: number; }
export interface DoctorReport { doctorId: string; doctorName: string; department?: string; totalSections: number; totalSessions: number; totalAttendance: number; avgAttendanceRate: number; }
export interface AuditLog { id: string; user_id: string; action: string; entity_type?: string; entity_id?: string; details?: Record<string, unknown>; ip_address?: string; created_at: string; }
export interface StudentSection { section_id: string; section_name: string; course_name: string; }
export interface StudentSummary { totalSessions: number; present: number; absent: number; late: number; presentRate: number; sections: { sectionId: string; sectionName: string; courseName: string; totalSessions: number; presentRate: number; }[]; }
export interface SessionPreview { sessionId: string; sectionId: string; sectionName: string; courseName: string; doctorName: string; openedAt: string; expiresAt: string; requiresGps: boolean; gpsRadius?: number; qrToken: string; }
export interface AttendanceResult { id: string; status: string; otpVerified: boolean; gpsVerified: boolean; distanceMeters: number; attendedAt: string; sessionInfo: { sectionName: string; courseName: string; doctorName: string; }; }
export interface SectionStudent { studentId: string; studentCode: string; fullName: string; enrolledAt: string; }
