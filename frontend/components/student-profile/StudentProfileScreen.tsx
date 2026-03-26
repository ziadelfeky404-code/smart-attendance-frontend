'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  GraduationCap,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  UserRound,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { useStudentProfileData } from '@/hooks/useStudentProfileData';

type AllowedRole = 'ADMIN' | 'DOCTOR';

interface StudentProfileScreenProps {
  studentId: string;
  allowedRole: AllowedRole;
  backHref: string;
  backLabel: string;
}

function SectionCard({
  title,
  icon: Icon,
  subtitle,
  warning,
  children,
}: {
  title: string;
  icon: React.ElementType;
  subtitle?: string;
  warning?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-start justify-between gap-4 mb-5">
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

function MiniStat({
  label,
  value,
  tone = 'text-white',
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
      <p className="text-dark-400 text-sm mb-2">{label}</p>
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
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

function formatValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return 'غير متوفر';
  }

  return String(value);
}

function getRiskBadgeClass(level: string) {
  switch (level) {
    case 'CRITICAL':
    case 'HIGH':
    case 'AT_RISK':
      return 'badge-danger';
    case 'WARNING':
    case 'MEDIUM':
    case 'LOW':
      return 'badge-warning';
    default:
      return 'badge-success';
  }
}

function getAttendanceBadgeClass(status: 'GOOD' | 'WARNING' | 'LOW') {
  switch (status) {
    case 'LOW':
      return 'badge-danger';
    case 'WARNING':
      return 'badge-warning';
    default:
      return 'badge-success';
  }
}

export default function StudentProfileScreen({
  studentId,
  allowedRole,
  backHref,
  backLabel,
}: StudentProfileScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAllowed = user?.role === allowedRole;
  const { data, loading, error, reload } = useStudentProfileData(studentId, {
    enabled: Boolean(user && isAllowed),
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== allowedRole) {
      router.push('/');
    }
  }, [allowedRole, authLoading, router, user]);

  if (authLoading || (user && user.role !== allowedRole)) {
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

  if (!user || !isAllowed) {
    return null;
  }

  const linkedUnreadNotifications = data?.unreadNotifications.filter((notification) => notification.related_id === studentId) || [];
  const notificationsToShow = linkedUnreadNotifications.length > 0
    ? linkedUnreadNotifications.slice(0, 4)
    : (data?.unreadNotifications.slice(0, 4) || []);
  const notificationsSubtitle = linkedUnreadNotifications.length > 0
    ? 'أحدث الإشعارات غير المقروءة المرتبطة بهذا الطالب'
    : 'أحدث الإشعارات غير المقروءة الظاهرة في حسابك الحالي';

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
          <div>
            <Link href={backHref} className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4">
              <ArrowRight size={16} />
              <span>{backLabel}</span>
            </Link>
            <h1 className="text-3xl font-black mb-2">الملف الأكاديمي للطالب</h1>
            <p className="text-dark-400">
              صفحة موحدة لمتابعة الحالة الأكاديمية، المخاطر، الإرشاد، والإشعارات.
            </p>
          </div>
          {!loading && data ? (
            <div className="flex flex-wrap gap-2">
              <span className={`badge ${getRiskBadgeClass(data.riskDetails.currentRiskLevel)}`}>
                الخطر: {data.riskDetails.currentRiskLevel}
              </span>
              <span className={`badge ${getAttendanceBadgeClass(data.aiSummary.attendanceStatus)}`}>
                الحضور: {data.aiSummary.attendanceStatus}
              </span>
            </div>
          ) : null}
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
            <h2 className="text-xl font-bold mb-2">تعذر تحميل صفحة الطالب</h2>
            <p className="text-dark-400 mb-6">{error || 'حدث خطأ غير متوقع أثناء تحميل البيانات.'}</p>
            <button onClick={() => void reload()} className="btn-primary inline-flex items-center gap-2">
              <RefreshCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <SectionCard
              title="بيانات الطالب الأساسية"
              icon={UserRound}
              subtitle={`${data.profile.basicInfo.name} • ${data.profile.basicInfo.code}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <MiniStat label="اسم الطالب" value={data.profile.basicInfo.name} />
                <MiniStat label="الرقم الجامعي" value={data.profile.basicInfo.code} />
                <MiniStat label="القسم" value={formatValue(data.profile.basicInfo.department)} />
                <MiniStat label="البرنامج" value={formatValue(data.profile.basicInfo.program)} />
                <MiniStat label="المستوى" value={data.profile.basicInfo.level} />
                <MiniStat label="السنة" value={data.profile.basicInfo.year} />
                <MiniStat label="البريد" value={data.profile.basicInfo.email} />
                <MiniStat
                  label="المرشد الأكاديمي"
                  value={data.profile.advisor ? data.profile.advisor.doctorName : 'غير معين'}
                  tone={data.profile.advisor ? 'text-primary' : 'text-dark-400'}
                />
              </div>
              {data.profile.advisor ? (
                <div className="mt-4 rounded-2xl border border-dark-300 bg-dark-200 p-4">
                  <p className="text-sm font-bold mb-1">تخصص المرشد</p>
                  <p className="text-dark-400 text-sm">{formatValue(data.profile.advisor.specialization)}</p>
                </div>
              ) : null}
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard title="الملخص الأكاديمي" icon={GraduationCap}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <MiniStat label="GPA" value={formatValue(data.profile.gpa)} tone="text-primary" />
                  <MiniStat label="الحالة الأكاديمية" value={formatValue(data.profile.academicStanding)} />
                  <MiniStat label="عدد المقررات الحالية" value={data.aiSummary.currentCoursesCount} />
                  <MiniStat label="عدد المقررات المتعثرة" value={data.aiSummary.failedCoursesCount} tone={data.aiSummary.failedCoursesCount > 0 ? 'text-danger' : 'text-white'} />
                </div>

                {data.profile.graduationProgress.isAvailable ? (
                  <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-bold">التقدم نحو التخرج</p>
                      <span className="badge badge-info">
                        {data.profile.graduationProgress.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-dark-300 overflow-hidden mb-3">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(data.profile.graduationProgress.progressPercentage || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-dark-400 text-sm">
                      {data.profile.graduationProgress.earnedCredits} ساعة مكتسبة من أصل {data.profile.graduationProgress.requiredCredits}
                    </p>
                  </div>
                ) : (
                  <EmptyState message="لا توجد بيانات كافية حالياً لعرض تقدم التخرج." />
                )}
              </SectionCard>

              <SectionCard title="ملخص الحضور" icon={BookOpen}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <MiniStat label="نسبة الحضور الكلية" value={`${data.profile.attendance.overallPercentage}%`} tone="text-primary" />
                  <MiniStat label="إجمالي الجلسات" value={data.profile.attendance.totalSessions} />
                  <MiniStat label="الجلسات الفائتة" value={data.aiSummary.missedSessionsCount} tone={data.aiSummary.missedSessionsCount > 0 ? 'text-warning' : 'text-white'} />
                  <MiniStat label="حالة الحضور" value={data.aiSummary.attendanceStatus} tone={data.aiSummary.attendanceStatus === 'GOOD' ? 'text-success' : data.aiSummary.attendanceStatus === 'LOW' ? 'text-danger' : 'text-warning'} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-success">حضور: {data.profile.attendance.present}</span>
                  <span className="badge badge-danger">غياب: {data.profile.attendance.absent}</span>
                  <span className="badge badge-warning">تأخير: {data.profile.attendance.late}</span>
                  <span className="badge badge-info">عذر: {data.profile.attendance.excused}</span>
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="ملخص المخاطر"
                icon={ShieldAlert}
                warning={data.warnings.risk}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-dark-400 text-sm mb-1">مستوى الخطر الحالي</p>
                    <span className={`badge ${getRiskBadgeClass(data.riskDetails.currentRiskLevel)}`}>
                      {data.riskDetails.currentRiskLevel}
                    </span>
                  </div>
                  <div className="text-left">
                    <p className="text-dark-400 text-sm mb-1">متوسط الحضور</p>
                    <p className="text-2xl font-black text-primary">{data.riskDetails.attendanceRate}%</p>
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-bold mb-3">أحدث التنبيهات</h3>
                  {data.riskDetails.lastAlerts.length > 0 ? (
                    <div className="space-y-3">
                      {data.riskDetails.lastAlerts.slice(0, 4).map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className={`badge ${getRiskBadgeClass(alert.riskLevel)}`}>{alert.riskLevel}</span>
                            <span className="text-dark-400 text-xs">{formatDate(alert.createdAt)}</span>
                          </div>
                          <p className="font-bold mb-1">{formatValue(alert.courseName)}</p>
                          <p className="text-dark-400 text-sm mb-1">الحضور: {alert.attendanceRate}%</p>
                          <p className="text-dark-400 text-sm">{alert.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="لا توجد تنبيهات مخاطر حديثة لهذا الطالب." />
                  )}
                </div>

                <div>
                  <h3 className="font-bold mb-3">توصيات المتابعة</h3>
                  {data.riskDetails.recommendations.length > 0 ? (
                    <ul className="space-y-2 text-sm text-dark-300">
                      {data.riskDetails.recommendations.map((recommendation) => (
                        <li key={recommendation} className="rounded-xl bg-dark-200 px-4 py-3">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState message="لا توجد توصيات مخاطر إضافية حالياً." />
                  )}
                </div>
              </SectionCard>

              <SectionCard title="الملخص الإرشادي الذكي" icon={Sparkles}>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 mb-4">
                  <p className="text-sm leading-7 text-dark-300">{data.aiSummary.summaryText}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <MiniStat label="الجلسات الفائتة" value={data.aiSummary.missedSessionsCount} tone={data.aiSummary.missedSessionsCount > 0 ? 'text-warning' : 'text-white'} />
                  <MiniStat label="إشعارات الطالب غير المقروءة" value={data.aiSummary.unreadNotifications} />
                  <MiniStat label="الجلسات الإرشادية القادمة" value={data.aiSummary.upcomingAdvisingSessions.length} />
                </div>

                <div className="mb-4">
                  <h3 className="font-bold mb-3">التوصيات الذكية</h3>
                  {data.aiSummary.recommendations.length > 0 ? (
                    <ul className="space-y-2 text-sm text-dark-300">
                      {data.aiSummary.recommendations.map((recommendation) => (
                        <li key={recommendation} className="rounded-xl bg-dark-200 px-4 py-3">
                          {recommendation}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState message="لا توجد توصيات ذكية إضافية حالياً." />
                  )}
                </div>

                <div>
                  <h3 className="font-bold mb-3">الجلسات القادمة</h3>
                  {data.aiSummary.upcomingAdvisingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {data.aiSummary.upcomingAdvisingSessions.map((session) => (
                        <div key={session.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <p className="font-bold">{session.sessionType}</p>
                            <span className="badge badge-info">{session.status}</span>
                          </div>
                          <p className="text-dark-400 text-sm mb-1">{formatDate(session.scheduledAt)}</p>
                          <p className="text-dark-400 text-sm">{formatValue(session.location)} • {session.advisorName}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState message="لا توجد جلسات إرشادية قادمة لهذا الطالب حالياً." />
                  )}
                </div>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="جلسات الإرشاد"
                icon={CalendarDays}
                warning={data.warnings.sessions}
                subtitle="آخر الجلسات المسجلة لهذا الطالب"
              >
                {data.sessions.length > 0 ? (
                  <div className="space-y-3">
                    {data.sessions.slice(0, 6).map((session) => (
                      <div key={session.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-bold">{session.session_type}</p>
                          <span className={`badge ${session.status === 'COMPLETED' ? 'badge-success' : session.status === 'SCHEDULED' ? 'badge-warning' : 'badge-danger'}`}>
                            {session.status}
                          </span>
                        </div>
                        <p className="text-dark-400 text-sm mb-2">{formatDate(session.scheduled_at)}</p>
                        <p className="text-dark-400 text-sm mb-2">{formatValue(session.location)}</p>
                        {session.summary ? (
                          <p className="text-dark-300 text-sm">{session.summary}</p>
                        ) : (
                          <p className="text-dark-400 text-sm">لا يوجد ملخص مسجل لهذه الجلسة بعد.</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="لا توجد جلسات إرشاد مسجلة لهذا الطالب حالياً." />
                )}
              </SectionCard>

              <SectionCard
                title="الإشعارات"
                icon={Bell}
                warning={data.warnings.notifications}
                subtitle={notificationsSubtitle}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <MiniStat label="إشعارات الطالب غير المقروءة" value={data.aiSummary.unreadNotifications} />
                  <MiniStat label="إشعاراتك غير المقروءة" value={data.viewerUnreadCount} tone={data.viewerUnreadCount > 0 ? 'text-warning' : 'text-white'} />
                </div>

                {notificationsToShow.length > 0 ? (
                  <div className="space-y-3">
                    {notificationsToShow.map((notification) => (
                      <div key={notification.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <p className="font-bold">{notification.title}</p>
                          <span className="badge badge-info">{notification.type}</span>
                        </div>
                        <p className="text-dark-300 text-sm mb-2">{notification.message}</p>
                        <p className="text-dark-400 text-xs">{formatDate(notification.created_at)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="لا توجد إشعارات غير مقروءة متاحة للعرض حالياً." />
                )}
              </SectionCard>
            </div>

            {data.profile.currentCourses.length > 0 ? (
              <SectionCard title="المقررات الحالية" icon={BrainCircuit}>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {data.profile.currentCourses.map((course) => (
                    <div key={`${course.courseId}-${course.sectionId}`} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
                      <p className="font-bold mb-1">{course.courseName}</p>
                      <p className="text-dark-400 text-sm mb-2">{course.courseCode} • {course.sectionName}</p>
                      <p className="text-dark-400 text-sm mb-1">الفصل: {formatValue(course.semester)}</p>
                      <p className="text-dark-400 text-sm">
                        حضور هذا المقرر: {course.attendancePercentage !== null ? `${course.attendancePercentage}%` : 'غير متوفر'}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
