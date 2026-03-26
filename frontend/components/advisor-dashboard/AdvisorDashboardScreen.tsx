'use client';

import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CalendarDays,
  GraduationCap,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { DashboardRiskLevel, Notification } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  AdvisorDashboardAlertItem,
  AdvisorDashboardSessionItem,
  useAdvisorDashboardData,
} from '@/hooks/useAdvisorDashboardData';

function SectionCard({
  id,
  title,
  icon: Icon,
  subtitle,
  warning,
  testId,
  children,
}: {
  id?: string;
  title: string;
  icon: ElementType;
  subtitle?: string;
  warning?: string;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="card" data-testid={testId}>
      <div className="flex flex-col gap-3 mb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Icon size={18} className="text-primary" />
            <h2 className="text-lg font-bold">{title}</h2>
          </div>
          {subtitle ? <p className="text-dark-400 text-sm">{subtitle}</p> : null}
        </div>
      </div>
      {warning ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          {warning}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  testId,
}: {
  label: string;
  value: number;
  icon: ElementType;
  tone: string;
  testId?: string;
}) {
  return (
    <div className="card" data-testid={testId}>
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${tone}`}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-black">{value}</div>
          <p className="text-dark-400 text-sm">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-dark-300 bg-dark-200/60 px-4 py-6 text-center text-dark-400 text-sm">
      {message}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'غير محدد';
  }

  return new Date(value).toLocaleString('ar-EG');
}

function formatNumber(value?: number | null, suffix = '') {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'غير متوفر';
  }

  return `${value}${suffix}`;
}

function getRiskBadgeClass(level: DashboardRiskLevel) {
  switch (level) {
    case 'CRITICAL':
    case 'HIGH':
      return 'badge-danger';
    case 'MEDIUM':
      return 'badge-warning';
    case 'LOW':
      return 'badge-info';
    default:
      return 'badge-success';
  }
}

function StudentList({
  items,
  emptyMessage,
}: {
  items: Array<{
    studentId: string;
    studentName: string;
    studentCode: string;
    riskLevel: DashboardRiskLevel;
    attendanceRate: number | null;
    courseName?: string | null;
    recommendation?: string | null;
  }>;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {items.map((student) => (
        <div key={`${student.studentId}-${student.courseName || 'general'}`} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{student.studentName}</p>
                <span className="text-dark-400 text-xs">{student.studentCode}</span>
              </div>
              <p className="text-dark-400 text-sm mb-1">
                {student.courseName || 'بدون مقرر محدد'}
              </p>
              <p className="text-dark-400 text-sm">
                الحضور: {formatNumber(student.attendanceRate, '%')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${getRiskBadgeClass(student.riskLevel)}`}>{student.riskLevel}</span>
              <Link
                href={`/doctor/advising/students/${student.studentId}`}
                className="btn-secondary text-sm py-2 px-3"
              >
                الملف الأكاديمي
              </Link>
            </div>
          </div>
          {student.recommendation ? (
            <p className="mt-3 text-dark-300 text-sm">{student.recommendation}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function AlertsList({
  alerts,
  emptyMessage,
}: {
  alerts: AdvisorDashboardAlertItem[];
  emptyMessage: string;
}) {
  if (alerts.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{alert.studentName}</p>
                <span className="text-dark-400 text-xs">{alert.studentCode}</span>
              </div>
              <p className="text-dark-400 text-sm mb-1">
                {alert.courseName || 'تنبيه عام'}
              </p>
              <p className="text-dark-400 text-sm">
                الحضور: {formatNumber(alert.attendanceRate, '%')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${getRiskBadgeClass(alert.riskLevel)}`}>{alert.riskLevel}</span>
              <span className="text-dark-400 text-xs">{formatDate(alert.createdAt)}</span>
            </div>
          </div>
          {alert.recommendation ? (
            <p className="mt-3 text-dark-300 text-sm">{alert.recommendation}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SessionsList({
  sessions,
}: {
  sessions: AdvisorDashboardSessionItem[];
}) {
  if (sessions.length === 0) {
    return <EmptyState message="لا توجد جلسات إرشادية قادمة حالياً." />;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{session.studentName}</p>
                <span className="text-dark-400 text-xs">{session.studentCode}</span>
              </div>
              <p className="text-dark-400 text-sm mb-1">{formatDate(session.scheduledAt)}</p>
              <p className="text-dark-400 text-sm">
                {session.sessionType} • {session.location || 'بدون موقع محدد'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${session.status === 'SCHEDULED' ? 'badge-warning' : session.status === 'COMPLETED' ? 'badge-success' : 'badge-danger'}`}>
                {session.status}
              </span>
              <Link
                href={`/doctor/advising/students/${session.studentId}`}
                className="btn-secondary text-sm py-2 px-3"
              >
                الملف الأكاديمي
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsList({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return <EmptyState message="لا توجد إشعارات غير مقروءة متاحة الآن." />;
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold mb-1">{notification.title}</p>
              <p className="text-dark-300 text-sm mb-2">{notification.message}</p>
              <p className="text-dark-400 text-xs">{formatDate(notification.created_at)}</p>
            </div>
            <span className="badge badge-info">{notification.type}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdvisorDashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, reload } = useAdvisorDashboardData({
    enabled: Boolean(user && user.role === 'DOCTOR'),
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'DOCTOR') {
      router.push('/');
    }
  }, [authLoading, router, user]);

  if (authLoading || (user && user.role !== 'DOCTOR')) {
    return (
      <div className="min-h-screen bg-dark">
        <Navbar />
        <main className="lg:pr-64 pt-24 p-6">
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-dark" data-testid="doctor-advising-page">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black mb-2">لوحة الإرشاد الأكاديمي</h1>
            <p className="text-dark-400">
              متابعة الطلاب، المخاطر، الجلسات القادمة، والتنبيهات من مكان واحد.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/doctor/advising/risk" className="btn-secondary text-sm py-2 px-4">
              عرض المخاطر
            </Link>
            <Link href="/doctor/advising/sessions" className="btn-secondary text-sm py-2 px-4">
              الجلسات القادمة
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error || !data ? (
          <div className="card text-center">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">تعذر تحميل لوحة الإرشاد</h2>
            <p className="text-dark-400 mb-6">{error || 'حدث خطأ غير متوقع أثناء تحميل البيانات.'}</p>
            <button onClick={() => void reload()} className="btn-primary inline-flex items-center gap-2">
              <RefreshCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <SectionCard
              title="ملف المرشد"
              icon={UserRound}
              subtitle="البيانات الأساسية وسجل ربط حساب الإرشاد"
              warning={data.warnings.advisor}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                  <p className="text-dark-400 text-sm mb-2">اسم المرشد</p>
                  <p className="text-xl font-black">{data.advisor?.doctor_name || user.fullName}</p>
                </div>
                <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                  <p className="text-dark-400 text-sm mb-2">القسم</p>
                  <p className="text-xl font-black">{data.department || 'غير متوفر'}</p>
                </div>
                <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                  <p className="text-dark-400 text-sm mb-2">البريد الإلكتروني</p>
                  <p className="text-sm font-bold break-all">{user.email}</p>
                </div>
                <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                  <p className="text-dark-400 text-sm mb-2">التخصص</p>
                  <p className="text-xl font-black">{data.advisor?.specialization || 'غير متوفر'}</p>
                </div>
              </div>

              {data.setupRequired ? (
                <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-4 text-warning" data-testid="doctor-advising-pending-setup">
                  <h3 className="font-bold mb-1">إعداد حساب الإرشاد غير مكتمل</h3>
                  <p className="text-sm">
                    هذا المستخدم يستطيع الدخول كدكتور، لكنه غير مربوط بعد بسجل مرشد أكاديمي داخل النظام. ستظل الإشعارات متاحة، بينما بيانات الطلاب والمخاطر والجلسات ستظهر بعد الربط.
                  </p>
                </div>
              ) : null}
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <SummaryCard
                label="إجمالي الطلاب"
                value={data.cards.totalStudents}
                icon={GraduationCap}
                tone="bg-primary/20 text-primary"
                testId="doctor-advising-students-card"
              />
              <SummaryCard
                label="طلاب عالي الخطورة"
                value={data.cards.highRiskStudents}
                icon={ShieldAlert}
                tone="bg-danger/20 text-danger"
              />
              <SummaryCard
                label="ضعف حضور"
                value={data.cards.lowAttendanceStudents}
                icon={AlertTriangle}
                tone="bg-warning/20 text-warning"
              />
              <SummaryCard
                label="إشعارات غير مقروءة"
                value={data.cards.unreadNotifications}
                icon={Bell}
                tone="bg-accent/20 text-accent"
              />
            </div>

            <SectionCard
              id="risk-overview"
              title="نظرة المخاطر"
              icon={ShieldAlert}
              subtitle="توزيع مستويات المخاطر وأهم الطلاب الذين يحتاجون متابعة"
              warning={data.warnings.risk || data.warnings.summary}
            >
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {Object.entries(data.riskDistribution).map(([level, count]) => (
                  <div key={level} className="rounded-2xl border border-dark-300 bg-dark-200 p-4 text-center">
                    <p className="text-dark-400 text-sm mb-2">{level}</p>
                    <p className={`text-2xl font-black ${level === 'CRITICAL' || level === 'HIGH' ? 'text-danger' : level === 'MEDIUM' ? 'text-warning' : level === 'LOW' ? 'text-accent' : 'text-success'}`}>
                      {count}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">الطلاب الأعلى خطراً</h3>
                  <StudentList
                    items={data.highRiskStudents}
                    emptyMessage="لا توجد حالات خطورة مرتفعة حالياً."
                  />
                </div>
                <div>
                  <h3 className="font-bold mb-3">الأقل حضوراً</h3>
                  <StudentList
                    items={data.lowAttendanceStudents}
                    emptyMessage="لا توجد حالات حضور منخفض تحتاج تدخلاً الآن."
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold mb-3">أحدث التنبيهات</h3>
                <AlertsList
                  alerts={data.recentAlerts.slice(0, 4)}
                  emptyMessage="لا توجد تنبيهات مخاطر حديثة الآن."
                />
              </div>
            </SectionCard>

            <SectionCard
              id="upcoming-sessions"
              title="الجلسات الإرشادية القادمة"
              icon={CalendarDays}
              subtitle="أقرب الجلسات المجدولة مع روابط سريعة للملف الأكاديمي"
              warning={data.warnings.sessions}
              testId="doctor-advising-sessions-card"
            >
              <SessionsList sessions={data.upcomingSessions} />
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="التنبيهات والإجراءات السريعة"
                icon={Sparkles}
                subtitle="ابدأ من أكثر العناصر احتياجاً ثم انتقل إلى التقارير والملفات"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <Link href="#risk-overview" className="btn-secondary text-center text-sm py-3 px-4">
                    عرض جميع الطلاب
                  </Link>
                  <Link href="/doctor/advising/risk" className="btn-secondary text-center text-sm py-3 px-4">
                    عرض لوحة المخاطر
                  </Link>
                  <Link href="/doctor/advising/sessions" className="btn-secondary text-center text-sm py-3 px-4">
                    عرض الجلسات
                  </Link>
                  <Link href="/doctor/reports" className="btn-secondary text-center text-sm py-3 px-4">
                    فتح التقارير
                  </Link>
                </div>

                <h3 className="font-bold mb-3">أحدث التنبيهات</h3>
                <AlertsList
                  alerts={data.recentAlerts.slice(0, 3)}
                  emptyMessage="لا توجد تنبيهات تحتاج تدخلاً عاجلاً حالياً."
                />
              </SectionCard>

              <SectionCard
                id="notifications"
                title="معاينة الإشعارات"
                icon={Bell}
                subtitle={`لديك ${data.viewerUnreadCount} إشعار غير مقروء حالياً`}
                warning={data.warnings.notifications}
              >
                <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-dark-400 text-sm">الإجمالي غير المقروء</p>
                    <span className="badge badge-info">{data.viewerUnreadCount}</span>
                  </div>
                </div>
                <NotificationsList notifications={data.unreadNotifications} />
              </SectionCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
