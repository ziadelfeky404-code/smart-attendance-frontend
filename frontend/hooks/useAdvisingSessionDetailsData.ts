'use client';

import { useCallback, useEffect, useState } from 'react';
import { advisingApi, AdvisingSession, SessionNote } from '@/lib/api';

interface AdvisingSessionDetailsWarnings {
  notes?: string;
}

export interface AdvisingSessionDetailsData {
  session: AdvisingSession;
  notes: SessionNote[];
  warnings: AdvisingSessionDetailsWarnings;
}

interface UseAdvisingSessionDetailsDataOptions {
  enabled?: boolean;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

export function useAdvisingSessionDetailsData(
  sessionId: string,
  options: UseAdvisingSessionDetailsDataOptions = {},
) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<AdvisingSessionDetailsData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled || !sessionId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [sessionResult, notesResult] = await Promise.allSettled([
      advisingApi.getSessionById(sessionId),
      advisingApi.getSessionNotes(sessionId),
    ]);

    if (
      sessionResult.status !== 'fulfilled'
      || !sessionResult.value.success
      || !sessionResult.value.data
    ) {
      setError(
        getErrorMessage(
          sessionResult.status === 'fulfilled'
            ? sessionResult.value.error
            : sessionResult.reason,
          'تعذر تحميل تفاصيل الجلسة الإرشادية.',
        ),
      );
      setLoading(false);
      return;
    }

    const warnings: AdvisingSessionDetailsWarnings = {};
    const notes =
      notesResult.status === 'fulfilled'
      && notesResult.value.success
      && notesResult.value.data
        ? notesResult.value.data.notes
        : (() => {
            warnings.notes = getErrorMessage(
              notesResult.status === 'fulfilled'
                ? notesResult.value.error
                : notesResult.reason,
              'تعذر تحميل ملاحظات الجلسة حالياً.',
            );
            return [];
          })();

    setData({
      session: sessionResult.value.data,
      notes,
      warnings,
    });
    setLoading(false);
  }, [enabled, sessionId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    reload: loadData,
  };
}
