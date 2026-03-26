'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Link2,
  MapPin,
  MessageSquare,
  RefreshCcw,
  Save,
  UserRound,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { advisingApi, SessionNoteType, SessionStatus } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useAdvisingSessionDetailsData } from '@/hooks/useAdvisingSessionDetailsData';
import {
  EmptyState,
  formatDateOnly,
  formatDateTime,
  normalizeFieldValue,
  normalizeOptionalText,
  PageErrorState,
  SectionCard,
  SESSION_NOTE_TYPE_OPTIONS,
  SESSION_STATUS_OPTIONS,
  StatusBadge,
  toDateTimeLocalValue,
} from './shared';

interface AdvisingSessionDetailsScreenProps {
  viewerRole: 'ADMIN' | 'DOCTOR';
  sessionId: string;
  backHref: string;
  backLabel: string;
  studentProfileBasePath: string;
}

interface SessionEditFormState {
  scheduledAt: string;
  durationMinutes: string;
  sessionType: string;
  location: string;
  meetingLink: string;
}

interface SessionStatusFormState {
  status: SessionStatus;
  summary: string;
  recommendations: string;
  followUpRequired: boolean;
  followUpDate: string;
}

interface SessionNoteFormState {
  noteType: SessionNoteType;
  content: string;
  isPrivate: boolean;
}

const DEFAULT_NOTE_FORM: SessionNoteFormState = {
  noteType: 'GENERAL',
  content: '',
  isPrivate: false,
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
      <p className="text-dark-400 text-sm mb-2">{label}</p>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

function NotesList({
  notes,
}: {
  notes: Array<{
    id: string;
    note_type: string;
    content: string;
    author_name: string;
    author_role?: string | null;
    is_private: boolean;
    created_at: string;
  }>;
}) {
  if (notes.length === 0) {
    return <EmptyState message="لا توجد ملاحظات مسجلة لهذه الجلسة حتى الآن." />;
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="rounded-2xl border border-dark-300 bg-dark-200 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-bold">{note.author_name}</span>
                {note.author_role ? (
                  <span className="text-dark-400 text-xs">{note.author_role}</span>
                ) : null}
                <span className="badge badge-info">{note.note_type}</span>
                {note.is_private ? <span className="badge badge-warning">خاص</span> : null}
              </div>
              <p className="text-dark-300 text-sm whitespace-pre-wrap">{note.content}</p>
            </div>
            <span className="text-dark-400 text-xs">{formatDateTime(note.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdvisingSessionDetailsScreen({
  viewerRole,
  sessionId,
  backHref,
  backLabel,
  studentProfileBasePath,
}: AdvisingSessionDetailsScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAllowed = user?.role === viewerRole;
  const { data, loading, error, reload } = useAdvisingSessionDetailsData(sessionId, {
    enabled: Boolean(user && user.role === viewerRole),
  });

  const [editForm, setEditForm] = useState<SessionEditFormState>({
    scheduledAt: '',
    durationMinutes: '30',
    sessionType: '',
    location: '',
    meetingLink: '',
  });
  const [statusForm, setStatusForm] = useState<SessionStatusFormState>({
    status: 'SCHEDULED',
    summary: '',
    recommendations: '',
    followUpRequired: false,
    followUpDate: '',
  });
  const [noteForm, setNoteForm] = useState<SessionNoteFormState>(DEFAULT_NOTE_FORM);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role !== viewerRole) {
      router.push('/');
    }
  }, [authLoading, router, user, viewerRole]);

  useEffect(() => {
    if (!data) {
      return;
    }

    setEditForm({
      scheduledAt: toDateTimeLocalValue(data.session.scheduled_at),
      durationMinutes: String(data.session.duration_minutes || 30),
      sessionType: data.session.session_type || '',
      location: data.session.location || '',
      meetingLink: data.session.meeting_link || '',
    });
    setStatusForm({
      status: (data.session.status as SessionStatus) || 'SCHEDULED',
      summary: data.session.summary || '',
      recommendations: data.session.recommendations || '',
      followUpRequired: Boolean(data.session.follow_up_required),
      followUpDate: data.session.follow_up_date
        ? toDateTimeLocalValue(data.session.follow_up_date)
        : '',
    });
  }, [data]);

  const resetMessages = () => {
    setActionError(null);
    setActionMessage(null);
  };

  const handleSaveDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setSavingDetails(true);

    try {
      const payload: {
        scheduledAt?: string;
        durationMinutes?: number;
        sessionType?: string;
        location?: string;
        meetingLink?: string;
      } = {};

      const scheduledAt = new Date(editForm.scheduledAt);
      if (!Number.isNaN(scheduledAt.getTime())) {
        payload.scheduledAt = scheduledAt.toISOString();
      }

      payload.durationMinutes = Number(editForm.durationMinutes) || 30;
      payload.sessionType = normalizeOptionalText(editForm.sessionType);
      payload.location = normalizeFieldValue(editForm.location);

      const meetingLink = normalizeOptionalText(editForm.meetingLink);
      if (meetingLink) {
        payload.meetingLink = meetingLink;
      }

      const response = await advisingApi.updateSession(sessionId, payload);
      if (!response.success) {
        throw new Error(response.error || 'تعذر تحديث الجلسة.');
      }

      setActionMessage('تم تحديث بيانات الجلسة بنجاح.');
      await reload();
    } catch (errorMessage: unknown) {
      setActionError(
        errorMessage instanceof Error ? errorMessage.message : 'تعذر تحديث الجلسة.',
      );
    } finally {
      setSavingDetails(false);
    }
  };

  const handleSaveStatus = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setSavingStatus(true);

    try {
      const payload: {
        status: SessionStatus;
        summary?: string;
        recommendations?: string;
        followUpRequired?: boolean;
        followUpDate?: string;
      } = {
        status: statusForm.status,
        followUpRequired: statusForm.followUpRequired,
      };

      const summary = normalizeOptionalText(statusForm.summary);
      if (summary) {
        payload.summary = summary;
      }

      const recommendations = normalizeOptionalText(statusForm.recommendations);
      if (recommendations) {
        payload.recommendations = recommendations;
      }

      if (statusForm.followUpDate) {
        const followUpDate = new Date(statusForm.followUpDate);
        if (!Number.isNaN(followUpDate.getTime())) {
          payload.followUpDate = followUpDate.toISOString();
        }
      }

      const response = await advisingApi.updateSessionStatus(sessionId, payload);
      if (!response.success) {
        throw new Error(response.error || 'تعذر تحديث حالة الجلسة.');
      }

      setActionMessage('تم تحديث حالة الجلسة والمتابعة بنجاح.');
      await reload();
    } catch (errorMessage: unknown) {
      setActionError(
        errorMessage instanceof Error ? errorMessage.message : 'تعذر تحديث حالة الجلسة.',
      );
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddNote = async (event: React.FormEvent) => {
    event.preventDefault();
    resetMessages();
    setSavingNote(true);

    try {
      const response = await advisingApi.addSessionNote(sessionId, {
        noteType: noteForm.noteType,
        content: noteForm.content.trim(),
        isPrivate: noteForm.isPrivate,
      });

      if (!response.success) {
        throw new Error(response.error || 'تعذر إضافة الملاحظة.');
      }

      setActionMessage('تمت إضافة الملاحظة بنجاح.');
      setNoteForm(DEFAULT_NOTE_FORM);
      await reload();
    } catch (errorMessage: unknown) {
      setActionError(
        errorMessage instanceof Error ? errorMessage.message : 'تعذر إضافة الملاحظة.',
      );
    } finally {
      setSavingNote(false);
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
            <h1 className="text-3xl font-black mb-2">تفاصيل الجلسة الإرشادية</h1>
            <p className="text-dark-400 max-w-3xl">
              عرض معلومات الجلسة، تحديث حالتها، وإدارة الملاحظات والمتابعة من مكان واحد.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void reload()} className="btn-secondary inline-flex items-center gap-2">
              <RefreshCcw size={16} />
              تحديث البيانات
            </button>
          </div>
        </div>

        {error ? (
          <PageErrorState
            title="تعذر تحميل تفاصيل الجلسة"
            message={error}
            onRetry={() => void reload()}
            backHref={backHref}
            backLabel={backLabel}
          />
        ) : loading || !data ? (
          <div className="card">
            <div className="flex items-center justify-center py-24">
              <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {actionError ? (
              <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {actionError}
              </div>
            ) : null}
            {actionMessage ? (
              <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
                {actionMessage}
              </div>
            ) : null}

            <SectionCard
              title="ملخص الجلسة"
              icon={CalendarDays}
              subtitle="معلومات أساسية وروابط سريعة للطالب والجلسة"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <DetailItem label="الطالب" value={data.session.student_name} />
                <DetailItem label="المرشد" value={data.session.advisor_name || 'غير متوفر'} />
                <DetailItem label="نوع الجلسة" value={data.session.session_type || 'غير محدد'} />
                <DetailItem label="الحالة" value={<StatusBadge status={data.session.status} />} />
                <DetailItem label="الموعد" value={formatDateTime(data.session.scheduled_at)} />
                <DetailItem label="المدة" value={`${data.session.duration_minutes || 30} دقيقة`} />
                <DetailItem label="المكان" value={data.session.location || 'غير محدد'} />
                <DetailItem
                  label="رابط الاجتماع"
                  value={
                    data.session.meeting_link ? (
                      <a
                        href={data.session.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-2"
                      >
                        <Link2 size={14} />
                        فتح الرابط
                      </a>
                    ) : (
                      'غير متوفر'
                    )
                  }
                />
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href={`${studentProfileBasePath}/${data.session.student_id}`}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <UserRound size={16} />
                  ملف الطالب
                </Link>
              </div>
            </SectionCard>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="تحديث بيانات الجلسة"
                icon={Clock3}
                subtitle="تعديل الموعد والمدة والنوع وبيانات المكان"
              >
                <form onSubmit={handleSaveDetails} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الموعد</label>
                      <input
                        type="datetime-local"
                        value={editForm.scheduledAt}
                        onChange={(event) => setEditForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label">المدة بالدقائق</label>
                      <input
                        type="number"
                        value={editForm.durationMinutes}
                        onChange={(event) => setEditForm((current) => ({ ...current, durationMinutes: event.target.value }))}
                        className="input-field"
                        min={10}
                        max={240}
                      />
                    </div>

                    <div>
                      <label className="label">نوع الجلسة</label>
                      <input
                        type="text"
                        value={editForm.sessionType}
                        onChange={(event) => setEditForm((current) => ({ ...current, sessionType: event.target.value }))}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="label">المكان</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))}
                        className="input-field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">رابط الاجتماع</label>
                    <input
                      type="url"
                      value={editForm.meetingLink}
                      onChange={(event) => setEditForm((current) => ({ ...current, meetingLink: event.target.value }))}
                      className="input-field"
                      placeholder="https://..."
                    />
                  </div>

                  <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={savingDetails}>
                    <Save size={16} />
                    {savingDetails ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                  </button>
                </form>
              </SectionCard>

              <SectionCard
                title="الحالة والمتابعة"
                icon={CheckCircle2}
                subtitle="تحديث حالة الجلسة، الملخص، والتوصيات وخطة المتابعة"
              >
                <form onSubmit={handleSaveStatus} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">الحالة</label>
                      <select
                        value={statusForm.status}
                        onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value as SessionStatus }))}
                        className="input-field"
                      >
                        {SESSION_STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label">موعد المتابعة</label>
                      <input
                        type="datetime-local"
                        value={statusForm.followUpDate}
                        onChange={(event) => setStatusForm((current) => ({ ...current, followUpDate: event.target.value }))}
                        className="input-field"
                        disabled={!statusForm.followUpRequired}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">ملخص الجلسة</label>
                    <textarea
                      value={statusForm.summary}
                      onChange={(event) => setStatusForm((current) => ({ ...current, summary: event.target.value }))}
                      className="input-field"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="label">التوصيات</label>
                    <textarea
                      value={statusForm.recommendations}
                      onChange={(event) => setStatusForm((current) => ({ ...current, recommendations: event.target.value }))}
                      className="input-field"
                      rows={4}
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={statusForm.followUpRequired}
                      onChange={(event) => setStatusForm((current) => ({ ...current, followUpRequired: event.target.checked }))}
                    />
                    <span>تحتاج الجلسة إلى متابعة لاحقة</span>
                  </label>

                  <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={savingStatus}>
                    <CheckCircle2 size={16} />
                    {savingStatus ? 'جاري التحديث...' : 'تحديث الحالة'}
                  </button>
                </form>
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <SectionCard
                title="تفاصيل إضافية"
                icon={FileText}
                subtitle="قراءة سريعة لحالة الجلسة الحالية وما تم تسجيله"
              >
                <div className="space-y-4">
                  <DetailItem label="تاريخ الإنشاء" value={formatDateTime(data.session.created_at)} />
                  <DetailItem label="تاريخ الإكمال" value={formatDateTime(data.session.completed_at)} />
                  <DetailItem label="تاريخ المتابعة" value={formatDateOnly(data.session.follow_up_date)} />
                  <DetailItem
                    label="هل توجد متابعة؟"
                    value={data.session.follow_up_required ? 'نعم' : 'لا'}
                  />
                  <DetailItem label="الملخص الحالي" value={data.session.summary || 'لا يوجد ملخص مسجل'} />
                  <DetailItem
                    label="التوصيات الحالية"
                    value={data.session.recommendations || 'لا توجد توصيات مسجلة'}
                  />
                </div>
              </SectionCard>

              <SectionCard
                title="إضافة ملاحظة"
                icon={MessageSquare}
                subtitle="أضف ملاحظة عامة أو متابعة أو إجراء مرتبط بهذه الجلسة"
              >
                <form onSubmit={handleAddNote} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">نوع الملاحظة</label>
                      <select
                        value={noteForm.noteType}
                        onChange={(event) => setNoteForm((current) => ({ ...current, noteType: event.target.value as SessionNoteType }))}
                        className="input-field"
                      >
                        {SESSION_NOTE_TYPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <label className="flex items-center gap-3 text-sm pb-3">
                        <input
                          type="checkbox"
                          checked={noteForm.isPrivate}
                          onChange={(event) => setNoteForm((current) => ({ ...current, isPrivate: event.target.checked }))}
                        />
                        <span>ملاحظة خاصة</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label">المحتوى</label>
                    <textarea
                      value={noteForm.content}
                      onChange={(event) => setNoteForm((current) => ({ ...current, content: event.target.value }))}
                      className="input-field"
                      rows={5}
                      required
                    />
                  </div>

                  <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={savingNote}>
                    <MessageSquare size={16} />
                    {savingNote ? 'جاري الإضافة...' : 'إضافة الملاحظة'}
                  </button>
                </form>
              </SectionCard>
            </div>

            <SectionCard
              title="ملاحظات الجلسة"
              icon={MessageSquare}
              subtitle="سجل كامل بالملاحظات والإجراءات المرتبطة بهذه الجلسة"
              warning={data.warnings.notes}
            >
              <NotesList notes={data.notes} />
            </SectionCard>

            <div className="flex flex-wrap gap-3">
              <Link href={backHref} className="btn-secondary">
                {backLabel}
              </Link>
              <Link
                href={`${studentProfileBasePath}/${data.session.student_id}`}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <MapPin size={16} />
                فتح ملف الطالب
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
