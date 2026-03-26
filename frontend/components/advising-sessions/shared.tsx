'use client';

import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { SessionStatus, SessionTimeframe, SessionNoteType } from '@/lib/api';

export const SESSION_STATUS_OPTIONS: Array<{ value: SessionStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'مجدولة' },
  { value: 'COMPLETED', label: 'مكتملة' },
  { value: 'CANCELLED', label: 'ملغاة' },
  { value: 'NO_SHOW', label: 'عدم حضور' },
];

export const SESSION_TIMEFRAME_OPTIONS: Array<{ value: SessionTimeframe; label: string }> = [
  { value: 'UPCOMING', label: 'قادمة' },
  { value: 'PAST', label: 'سابقة' },
];

export const SESSION_NOTE_TYPE_OPTIONS: Array<{ value: SessionNoteType; label: string }> = [
  { value: 'GENERAL', label: 'عام' },
  { value: 'OBSERVATION', label: 'ملاحظة' },
  { value: 'ACTION_ITEM', label: 'إجراء' },
  { value: 'FOLLOW_UP', label: 'متابعة' },
  { value: 'ACADEMIC_PLAN', label: 'خطة أكاديمية' },
];

export function SectionCard({
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

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-dark-300 bg-dark-200/60 px-4 py-6 text-center text-dark-400 text-sm">
      {message}
    </div>
  );
}

export function StatusBadge({ status }: { status: SessionStatus | string }) {
  let badgeClass = 'badge-info';
  let label = status;

  switch (status) {
    case 'SCHEDULED':
      badgeClass = 'badge-info';
      label = 'مجدولة';
      break;
    case 'COMPLETED':
      badgeClass = 'badge-success';
      label = 'مكتملة';
      break;
    case 'CANCELLED':
      badgeClass = 'badge-danger';
      label = 'ملغاة';
      break;
    case 'NO_SHOW':
      badgeClass = 'badge-warning';
      label = 'عدم حضور';
      break;
    default:
      label = status;
  }

  return <span className={`badge ${badgeClass}`}>{label}</span>;
}

export function PageErrorState({
  title,
  message,
  onRetry,
  backHref,
  backLabel,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="card text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={28} />
      </div>
      <h2 className="text-2xl font-black mb-3">{title}</h2>
      <p className="text-dark-400 max-w-2xl mx-auto mb-6">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button onClick={onRetry} className="btn-primary inline-flex items-center gap-2">
          <RefreshCcw size={16} />
          إعادة المحاولة
        </button>
        <Link href={backHref} className="btn-secondary">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export function formatDateTime(value?: string | null) {
  if (!value) {
    return 'غير محدد';
  }

  return new Date(value).toLocaleString('ar-EG');
}

export function formatDateOnly(value?: string | null) {
  if (!value) {
    return 'غير محدد';
  }

  return new Date(value).toLocaleDateString('ar-EG');
}

export function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return adjusted.toISOString().slice(0, 16);
}

export function normalizeOptionalText(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeFieldValue(value: string) {
  return value.trim();
}
