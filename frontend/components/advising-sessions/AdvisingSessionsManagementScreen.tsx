'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Filter,
  Plus,
  RefreshCcw,
  UserRound,
  X,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { advisingApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import {
  AdvisingSessionsFilters,
  useAdvisingSessionsManagementData,
} from '@/hooks/useAdvisingSessionsManagementData';
import {
  EmptyState,
  formatDateTime,
  normalizeFieldValue,
  normalizeOptionalText,
  PageErrorState,
  SectionCard,
  SESSION_STATUS_OPTIONS,
  SESSION_TIMEFRAME_OPTIONS,
  StatusBadge,
  toDateTimeLocalValue,
} from './shared';

interface AdvisingSessionsManagementScreenProps {
  viewerRole: 'ADMIN' | 'DOCTOR';
  title: string;
  subtitle: string;
  backHref: string;
  backLabel: string;
  detailBasePath: string;
  studentProfileBasePath: string;
}

interface SessionCreateFormState {
  studentId: string;
  advisorId: string;
  scheduledAt: string;
  durationMinutes: string;
  sessionType: string;
  location: string;
  meetingLink: string;
}

const PAGE_SIZE = 12;

const DEFAULT_FILTERS: AdvisingSessionsFilters = {
  status: '',
  timeframe: '',
  studentId: '',
  advisorId: '',
};

const createDefaultScheduledAt = () => toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000).toISOString());

const createDefaultForm = (): SessionCreateFormState => ({
  studentId: '',
  advisorId: '',
  scheduledAt: createDefaultScheduledAt(),
  durationMinutes: '30',
  sessionType: 'FOLLOW_UP',
  location: '',
  meetingLink: '',
});

function FiltersGrid({
  viewerRole,
  filters,
  onFilterChange,
  onReset,
  studentOptions,
  advisorOptions,
}: {
  viewerRole: 'ADMIN' | 'DOCTOR';
  filters: AdvisingSessionsFilters;
  onFilterChange: (key: keyof AdvisingSessionsFilters, value: string) => void;
  onReset: () => void;
  studentOptions: Array<{ id: string; label: string }>;
  advisorOptions: Array<{ id: string; label: string }>;
}) {
  const showStudentSelect = studentOptions.length > 0;
  const showAdvisorSelect = viewerRole === 'ADMIN' && advisorOptions.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div>
          <label className="label">الحالة</label>
          <select
            value={filters.status}
            onChange={(event) => onFilterChange('status', event.target.value)}
            className="input-field"
          >
            <option value="">كل الحالات</option>
            {SESSION_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">الفترة</label>
          <select
            value={filters.timeframe}
            onChange={(event) => onFilterChange('timeframe', event.target.value)}
            className="input-field"
          >
            <option value="">الكل</option>
            {SESSION_TIMEFRAME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">الطالب</label>
          {showStudentSelect ? (
            <select
              value={filters.studentId}
              onChange={(event) => onFilterChange('studentId', event.target.value)}
              className="input-field"
            >
              <option value="">كل الطلاب</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={filters.studentId}
              onChange={(event) => onFilterChange('studentId', event.target.value)}
              className="input-field"
              placeholder="رقم الطالب"
            />
          )}
        </div>

        {viewerRole === 'ADMIN' ? (
          <div>
            <label className="label">المرشد</label>
            {showAdvisorSelect ? (
              <select
                value={filters.advisorId}
                onChange={(event) => onFilterChange('advisorId', event.target.value)}
                className="input-field"
              >
                <option value="">كل المرشدين</option>
                {advisorOptions.map((advisor) => (
                  <option key={advisor.id} value={advisor.id}>
                    {advisor.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={filters.advisorId}
                onChange={(event) => onFilterChange('advisorId', event.target.value)}
                className="input-field"
                placeholder="رقم المرشد"
              />
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onReset} className="btn-secondary text-sm py-2 px-4">
          إعادة ضبط الفلاتر
        </button>
      </div>
    </div>
  );
}

function SessionsTable({
  sessions,
  detailBasePath,
  studentProfileBasePath,
}: {
  sessions: Array<{
    id: string;
    student_id: string;
    student_name: string;
    student_code: string;
    advisor_name: string;
    session_type: string;
    status: string;
    scheduled_at: string;
    location: string;
  }>;
  detailBasePath: string;
  studentProfileBasePath: string;
}) {
  if (sessions.length === 0) {
    return <EmptyState message="لا توجد جلسات إرشادية تطابق الفلاتر الحالية." />;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>الطالب</th>
            <th>المرشد</th>
            <th>نوع الجلسة</th>
            <th>الحالة</th>
            <th>الموعد</th>
            <th>المكان</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id}>
              <td>
                <div className="font-medium">{session.student_name}</div>
                <div className="text-dark-400 text-xs">{session.student_code}</div>
              </td>
              <td>{session.advisor_name || 'غير متوفر'}</td>
              <td>{session.session_type || 'غير محدد'}</td>
              <td>
                <StatusBadge status={session.status} />
              </td>
              <td>{formatDateTime(session.scheduled_at)}</td>
              <td>{session.location || 'غير محدد'}</td>
              <td>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`${studentProfileBasePath}/${session.student_id}`}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    ملف الطالب
                  </Link>
                  <Link
                    href={`${detailBasePath}/${session.id}`}
                    className="btn-secondary text-sm py-2 px-3"
                  >
                    تفاصيل الجلسة
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdvisingSessionsManagementScreen({
  viewerRole,
  title,
  subtitle,
  backHref,
  backLabel,
  detailBasePath,
  studentProfileBasePath,
}: AdvisingSessionsManagementScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdvisingSessionsFilters>(DEFAULT_FILTERS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<SessionCreateFormState>(createDefaultForm);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isAllowed = user?.role === viewerRole;
  const { data, loading, error, reload } = useAdvisingSessionsManagementData({
    enabled: Boolean(user && user.role === viewerRole),
    viewerRole,
    page,
    limit: PAGE_SIZE,
    filters,
  });

  useEffect(() => {
    if (!authLoading && user && user.role !== viewerRole) {
      router.push('/');
    }
  }, [authLoading, router, user, viewerRole]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(data.total / PAGE_SIZE)),
    [data.total],
  );

  const handleFilterChange = (key: keyof AdvisingSessionsFilters, value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
    setPage(1);
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setCreateForm(createDefaultForm());
    setActionError(null);
  };

  const handleCreateSession = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setActionError(null);

    try {
      const studentId = createForm.studentId.trim();
      const advisorId = createForm.advisorId.trim();

      if (!studentId) {
        throw new Error('اختر الطالب أولاً أو أدخل رقم الطالب.');
      }

      if (viewerRole === 'ADMIN' && !advisorId) {
        throw new Error('اختر المرشد أولاً أو أدخل رقم المرشد.');
      }

      const scheduledAt = new Date(createForm.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime())) {
        throw new Error('أدخل موعداً صحيحاً للجلسة.');
      }

      const response = await advisingApi.createSession({
        studentId,
        advisorId: viewerRole === 'ADMIN' ? advisorId : undefined,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: Number(createForm.durationMinutes) || 30,
        sessionType: normalizeOptionalText(createForm.sessionType),
        location: normalizeFieldValue(createForm.location),
        meetingLink: normalizeOptionalText(createForm.meetingLink),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'تعذر إنشاء الجلسة الإرشادية.');
      }

      closeCreateModal();
      await reload();
      router.push(`${detailBasePath}/${response.data.id}`);
    } catch (errorMessage: unknown) {
      setActionError(
        errorMessage instanceof Error
          ? errorMessage.message
          : 'تعذر إنشاء الجلسة الإرشادية.',
      );
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || (user && !isAllowed)) {
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
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors mb-4"
            >
              <ArrowRight size={16} />
              <span>{backLabel}</span>
            </Link>
            <h1 className="text-3xl font-black mb-2">{title}</h1>
            <p className="text-dark-400 max-w-3xl">{subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
              disabled={data.setupRequired}
            >
              <Plus size={18} />
              جلسة جديدة
            </button>
            <button
              onClick={() => void reload()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCcw size={16} />
              تحديث
            </button>
          </div>
        </div>

        {error ? (
          <PageErrorState
            title="تعذر تحميل إدارة الجلسات"
            message={error}
            onRetry={() => void reload()}
            backHref={backHref}
            backLabel={backLabel}
          />
        ) : loading ? (
          <div className="card">
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        ) : data.setupRequired ? (
          <SectionCard
            title="إعداد المرشد مطلوب"
            icon={UserRound}
            subtitle="هذه الصفحة تحتاج ربط حساب الدكتور بسجل مرشد أكاديمي داخل النظام"
            warning={data.warnings.setup}
          >
            <div className="flex flex-wrap gap-3">
              <Link href={backHref} className="btn-secondary">
                العودة
              </Link>
              <button onClick={() => void reload()} className="btn-primary inline-flex items-center gap-2">
                <RefreshCcw size={16} />
                إعادة المحاولة
              </button>
            </div>
          </SectionCard>
        ) : (
          <div className="space-y-6">
            <SectionCard
              title="فلاتر الجلسات"
              icon={Filter}
              subtitle="فلترة الجلسات حسب الحالة والوقت والطالب والمرشد"
              warning={data.warnings.students || data.warnings.advisors}
            >
              <FiltersGrid
                viewerRole={viewerRole}
                filters={filters}
                onFilterChange={handleFilterChange}
                onReset={handleResetFilters}
                studentOptions={data.studentOptions}
                advisorOptions={data.advisorOptions}
              />
            </SectionCard>

            <SectionCard
              title="قائمة الجلسات"
              icon={ClipboardList}
              subtitle={`إجمالي الجلسات المطابقة: ${data.total}`}
            >
              <SessionsTable
                sessions={data.sessions}
                detailBasePath={detailBasePath}
                studentProfileBasePath={studentProfileBasePath}
              />

              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
                <span className="px-4 text-dark-400">
                  صفحة {page} من {totalPages}
                </span>
                <button
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="btn-secondary p-2 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
              </div>
            </SectionCard>
          </div>
        )}
      </main>

      {showCreateModal ? (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">إنشاء جلسة إرشادية</h2>
                <p className="text-dark-400 text-sm mt-1">أدخل بيانات الجلسة الأساسية ثم افتح التفاصيل لإكمال المتابعة والملاحظات.</p>
              </div>
              <button onClick={closeCreateModal} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {(data.warnings.students || data.warnings.advisors) && (
              <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
                {data.warnings.students || data.warnings.advisors}
              </div>
            )}

            {actionError ? (
              <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {actionError}
              </div>
            ) : null}

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">الطالب</label>
                  {data.studentOptions.length > 0 ? (
                    <select
                      value={createForm.studentId}
                      onChange={(event) => setCreateForm((current) => ({ ...current, studentId: event.target.value }))}
                      className="input-field"
                    >
                      <option value="">اختر طالباً</option>
                      {data.studentOptions.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={createForm.studentId}
                      onChange={(event) => setCreateForm((current) => ({ ...current, studentId: event.target.value }))}
                      className="input-field"
                      placeholder="رقم الطالب"
                    />
                  )}
                </div>

                {viewerRole === 'ADMIN' ? (
                  <div>
                    <label className="label">المرشد</label>
                    {data.advisorOptions.length > 0 ? (
                      <select
                        value={createForm.advisorId}
                        onChange={(event) => setCreateForm((current) => ({ ...current, advisorId: event.target.value }))}
                        className="input-field"
                      >
                        <option value="">اختر مرشداً</option>
                        {data.advisorOptions.map((advisor) => (
                          <option key={advisor.id} value={advisor.id}>
                            {advisor.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={createForm.advisorId}
                        onChange={(event) => setCreateForm((current) => ({ ...current, advisorId: event.target.value }))}
                        className="input-field"
                        placeholder="رقم المرشد"
                      />
                    )}
                  </div>
                ) : null}

                <div>
                  <label className="label">الموعد</label>
                  <input
                    type="datetime-local"
                    value={createForm.scheduledAt}
                    onChange={(event) => setCreateForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="label">المدة بالدقائق</label>
                  <input
                    type="number"
                    value={createForm.durationMinutes}
                    onChange={(event) => setCreateForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                    className="input-field"
                    min={10}
                    max={240}
                  />
                </div>

                <div>
                  <label className="label">نوع الجلسة</label>
                  <input
                    type="text"
                    value={createForm.sessionType}
                    onChange={(event) => setCreateForm((current) => ({ ...current, sessionType: event.target.value }))}
                    className="input-field"
                    placeholder="FOLLOW_UP"
                  />
                </div>

                <div>
                  <label className="label">المكان</label>
                  <input
                    type="text"
                    value={createForm.location}
                    onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
                    className="input-field"
                    placeholder="مكتب الإرشاد أو رابط اجتماع"
                  />
                </div>
              </div>

              <div>
                <label className="label">رابط الاجتماع</label>
                <input
                  type="url"
                  value={createForm.meetingLink}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingLink: event.target.value }))}
                  className="input-field"
                  placeholder="https://..."
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={creating}>
                  <CalendarDays size={16} />
                  {creating ? 'جاري الإنشاء...' : 'إنشاء الجلسة'}
                </button>
                <button type="button" onClick={closeCreateModal} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
