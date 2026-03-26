'use client';

import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  GraduationCap,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { DashboardRiskLevel, Notification, RiskDashboardStudent } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  RiskDashboardAlertItem,
  RiskDashboardHighRiskStudentItem,
  useRiskDashboardPageData,
} from '@/hooks/useRiskDashboardPageData';

function SectionCard({
  title,
  icon: Icon,
  subtitle,
  warning,
  children,
}: {
  title: string;
  icon: ElementType;
  subtitle?: string;
  warning?: string;
  children: ReactNode;
}) {
  return (
    <section className="card">
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
}: {
  label: string;
  value: number;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-dark-300 bg-dark-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${tone}`}>
          <Icon size={18} />
        </div>
        <div>
          <p className="text-dark-400 text-sm mb-1">{label}</p>
          <p className="text-2xl font-black">{value}</p>
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

function formatRate(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'غير متوفر';
  }

  return `${value}%`;
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

function getRiskBarColor(level: DashboardRiskLevel) {
  switch (level) {
    case 'CRITICAL':
      return 'bg-danger';
    case 'HIGH':
      return 'bg-danger';
    case 'MEDIUM':
      return 'bg-warning';
    case 'LOW':
      return 'bg-accent';
    default:
      return 'bg-success';
  }
}

function StudentQuickLink({ studentId }: { studentId: string }) {
  return (
    <Link
      href={`/doctor/advising/students/${studentId}`}
      className="btn-secondary text-sm py-2 px-3"
    >
      الملف الأكاديمي
    </Link>
  );
}

function HighRiskStudentsList({
  students,
}: {
  students: RiskDashboardHighRiskStudentItem[];
}) {
  if (students.length === 0) {
    return <EmptyState message="لا توجد حالات خطورة مرتفعة حالياً." />;
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <div key={`${student.studentId}-${student.courseId || 'general'}`} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{student.studentName}</p>
                <span className="text-dark-400 text-xs">{student.studentCode}</span>
              </div>
              <p className="text-dark-400 text-sm mb-1">
                {student.courseName || 'متابعة عامة'}
              </p>
              <div className="flex flex-wrap gap-3 text-dark-400 text-sm">
                <span>الحضور: {formatRate(student.attendanceRate)}</span>
                <span>آخر تنبيه: {formatDate(student.latestAlertDate)}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${getRiskBadgeClass(student.riskLevel)}`}>{student.riskLevel}</span>
              <StudentQuickLink studentId={student.studentId} />
            </div>
          </div>
          {student.recommendations[0] ? (
            <p className="mt-3 text-dark-300 text-sm">{student.recommendations[0]}</p>
          ) : student.recommendation ? (
            <p className="mt-3 text-dark-300 text-sm">{student.recommendation}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function LowAttendanceList({
  students,
}: {
  students: RiskDashboardStudent[];
}) {
  if (students.length === 0) {
    return <EmptyState message="لا توجد حالات حضور منخفض تحتاج تدخلاً حالياً." />;
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <div key={`${student.studentId}-${student.courseId || 'general'}`} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{student.studentName}</p>
                <span className="text-dark-400 text-xs">{student.studentCode}</span>
              </div>
              <p className="text-dark-400 text-sm mb-1">{student.courseName || 'متابعة عامة'}</p>
              <p className="text-dark-400 text-sm">الحضور: {formatRate(student.attendanceRate)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${getRiskBadgeClass(student.riskLevel)}`}>{student.riskLevel}</span>
              <StudentQuickLink studentId={student.studentId} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentAlertsList({
  alerts,
}: {
  alerts: RiskDashboardAlertItem[];
}) {
  if (alerts.length === 0) {
    return <EmptyState message="لا توجد تنبيهات مخاطر حديثة حالياً." />;
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
              <div className="flex flex-wrap gap-3 text-dark-400 text-sm">
                <span>الحضور: {formatRate(alert.attendanceRate)}</span>
                <span>التاريخ: {formatDate(alert.createdAt)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${getRiskBadgeClass(alert.riskLevel)}`}>{alert.riskLevel}</span>
              <StudentQuickLink studentId={alert.studentId} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationsPreview({ notifications }: { notifications: Notification[] }) {
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

export default function DoctorRiskDashboardScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, loading, error, reload } = useRiskDashboardPageData({
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

  const primaryStudent = data?.highRiskStudents[0] || data?.lowAttendanceStudents[0] || null;
  const distributionEntries: Array<{
    level: DashboardRiskLevel;
    count: number;
  }> = data
    ? [
        { level: 'GOOD', count: data.distribution.GOOD },
        { level: 'MEDIUM', count: data.distribution.MEDIUM },
        { level: 'HIGH', count: data.distribution.HIGH },
        { level: 'CRITICAL', count: data.distribution.CRITICAL },
      ]
    : [];

  return (
    <div className="min-h-screen bg-dark" data-testid="doctor-risk-page">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <Link href="/doctor/advising" className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4">
              <ArrowRight size={16} />
              <span>العودة إلى لوحة الإرشاد</span>
            </Link>
            <h1 className="text-3xl font-black mb-2">لوحة المخاطر</h1>
            <p className="text-dark-400">
              متابعة التوزيع الحالي للمخاطر، الطلاب الأعلى خطراً، والتنبيهات الحديثة مع روابط مباشرة للملفات الأكاديمية.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/doctor/advising" className="btn-secondary text-sm py-2 px-4">
              لوحة الإرشاد
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
            <h2 className="text-xl font-bold mb-2">تعذر تحميل لوحة المخاطر</h2>
            <p className="text-dark-400 mb-6">{error || 'حدث خطأ غير متوقع أثناء تحميل البيانات.'}</p>
            <button onClick={() => void reload()} className="btn-primary inline-flex items-center gap-2">
              <RefreshCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {data.setupRequired ? (
              <div className="rounded-2xl border border-warning/30 bg-warning/10 px-4 py-4 text-warning">
                <h2 className="font-bold mb-1">إعداد حساب الإرشاد غير مكتمل</h2>
                <p className="text-sm">
                  هذا الحساب غير مربوط بعد بسجل مرشد أكاديمي داخل النظام، لذلك لن تظهر بيانات المخاطر الكاملة قبل اكتمال الربط.
                </p>
              </div>
            ) : null}

            <SectionCard
              title="ملخص المخاطر"
              icon={ShieldAlert}
              subtitle="أرقام سريعة للحالات الحالية التي تحتاج متابعة"
              warning={data.warnings.dashboard || data.warnings.advising}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                <SummaryCard label="إجمالي الطلاب" value={data.summaryCards.totalStudents} icon={GraduationCap} tone="bg-primary/20 text-primary" />
                <SummaryCard label="GOOD" value={data.summaryCards.good} icon={ShieldAlert} tone="bg-success/20 text-success" />
                <SummaryCard label="MEDIUM" value={data.summaryCards.medium} icon={AlertTriangle} tone="bg-warning/20 text-warning" />
                <SummaryCard label="HIGH" value={data.summaryCards.high} icon={AlertTriangle} tone="bg-danger/10 text-danger" />
                <SummaryCard label="CRITICAL" value={data.summaryCards.critical} icon={AlertTriangle} tone="bg-danger/20 text-danger" />
                <SummaryCard label="ضعف حضور" value={data.summaryCards.lowAttendanceStudents} icon={ShieldAlert} tone="bg-accent/20 text-accent" />
                <SummaryCard label="تنبيهات حديثة" value={data.summaryCards.recentAlerts} icon={Bell} tone="bg-warning/20 text-warning" />
              </div>
            </SectionCard>

            <SectionCard
              title="توزيع المخاطر"
              icon={ShieldAlert}
              subtitle="ملخص بصري يوضح أين تتركز الحالات الحالية"
            >
              {distributionEntries.length === 0 || data.summaryCards.totalStudents === 0 ? (
                <EmptyState message="لا توجد بيانات توزيع متاحة حالياً." />
              ) : (
                <div className="space-y-4">
                  {distributionEntries.map((entry) => {
                    const percentage = data.summaryCards.totalStudents > 0
                      ? (entry.count / data.summaryCards.totalStudents) * 100
                      : 0;

                    return (
                      <div key={entry.level} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`badge ${getRiskBadgeClass(entry.level)}`}>{entry.level}</span>
                            <span className="text-dark-400 text-sm">{entry.count} طالب</span>
                          </div>
                          <span className="text-dark-400 text-sm">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-dark-300 overflow-hidden">
                          <div
                            className={`h-full ${getRiskBarColor(entry.level)} rounded-full transition-all duration-300`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="الطلاب الأعلى خطراً"
                icon={AlertTriangle}
                subtitle="أعلى الحالات التي تحتاج متابعة عاجلة"
                warning={data.warnings.studentDetails}
              >
                <HighRiskStudentsList students={data.highRiskStudents} />
              </SectionCard>

              <SectionCard
                title="الطلاب الأقل حضوراً"
                icon={AlertTriangle}
                subtitle="حالات انخفاض الحضور التي تحتاج تدخل سريع"
              >
                <LowAttendanceList students={data.lowAttendanceStudents} />
              </SectionCard>
            </div>

            <SectionCard
              title="أحدث التنبيهات"
              icon={Bell}
              subtitle="آخر التنبيهات المسجلة عبر نظام المخاطر"
            >
              <RecentAlertsList alerts={data.recentAlerts} />
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="الإشعارات غير المقروءة"
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
                <NotificationsPreview notifications={data.unreadNotifications} />
              </SectionCard>

              <SectionCard
                title="إجراءات سريعة"
                icon={Sparkles}
                subtitle="اختصارات مباشرة لأهم الصفحات المرتبطة بالمتابعة"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {primaryStudent ? (
                    <Link
                      href={`/doctor/advising/students/${primaryStudent.studentId}`}
                      className="btn-secondary text-center text-sm py-3 px-4"
                    >
                      فتح ملف الطالب
                    </Link>
                  ) : (
                    <div className="btn-secondary text-center text-sm py-3 px-4 opacity-60 cursor-not-allowed">
                      فتح ملف الطالب
                    </div>
                  )}
                  <Link href="/doctor/advising" className="btn-secondary text-center text-sm py-3 px-4">
                    العودة إلى لوحة الإرشاد
                  </Link>
                  <Link href="/doctor/advising/sessions" className="btn-secondary text-center text-sm py-3 px-4">
                    فتح الجلسات الإرشادية
                  </Link>
                  <Link href="/doctor/reports" className="btn-secondary text-center text-sm py-3 px-4">
                    فتح التقارير
                  </Link>
                </div>
              </SectionCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
