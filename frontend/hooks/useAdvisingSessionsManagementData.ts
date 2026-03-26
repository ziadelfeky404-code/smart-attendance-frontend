'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  advisingApi,
  AdvisingSession,
  Advisor,
  AssignedStudent,
  SessionStatus,
  SessionTimeframe,
  Student,
} from '@/lib/api';

export interface AdvisingSessionsFilters {
  status: SessionStatus | '';
  timeframe: SessionTimeframe | '';
  studentId: string;
  advisorId: string;
}

export interface AdvisingStudentOption {
  id: string;
  label: string;
  code: string;
}

export interface AdvisingAdvisorOption {
  id: string;
  label: string;
  specialization: string;
}

interface AdvisingSessionsManagementWarnings {
  students?: string;
  advisors?: string;
  setup?: string;
}

export interface AdvisingSessionsManagementData {
  sessions: AdvisingSession[];
  total: number;
  studentOptions: AdvisingStudentOption[];
  advisorOptions: AdvisingAdvisorOption[];
  warnings: AdvisingSessionsManagementWarnings;
  setupRequired: boolean;
}

interface UseAdvisingSessionsManagementDataOptions {
  enabled?: boolean;
  viewerRole: 'ADMIN' | 'DOCTOR';
  page: number;
  limit?: number;
  filters: AdvisingSessionsFilters;
}

const EMPTY_DATA: AdvisingSessionsManagementData = {
  sessions: [],
  total: 0,
  studentOptions: [],
  advisorOptions: [],
  warnings: {},
  setupRequired: false,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const isSetupRequiredError = (error: unknown) =>
  error instanceof Error && /registered as an advisor/i.test(error.message);

const buildSessionsParams = (
  page: number,
  limit: number,
  filters: AdvisingSessionsFilters,
) => {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(limit),
  };

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.timeframe) {
    params.timeframe = filters.timeframe;
  }

  if (filters.studentId.trim()) {
    params.studentId = filters.studentId.trim();
  }

  if (filters.advisorId.trim()) {
    params.advisorId = filters.advisorId.trim();
  }

  return params;
};

const mapAssignedStudents = (students: AssignedStudent[]): AdvisingStudentOption[] =>
  students.map((student) => ({
    id: student.id,
    label: `${student.full_name} (${student.student_code})`,
    code: student.student_code,
  }));

const mapAdminStudents = (students: Student[]): AdvisingStudentOption[] =>
  students.map((student) => ({
    id: student.id,
    label: `${student.full_name} (${student.student_code})`,
    code: student.student_code,
  }));

const mapAdvisors = (advisors: Advisor[]): AdvisingAdvisorOption[] =>
  advisors.map((advisor) => ({
    id: advisor.id,
    label: advisor.doctor_name,
    specialization: advisor.specialization,
  }));

export function useAdvisingSessionsManagementData({
  enabled = true,
  viewerRole,
  page,
  limit = 12,
  filters,
}: UseAdvisingSessionsManagementDataOptions) {
  const [data, setData] = useState<AdvisingSessionsManagementData>(EMPTY_DATA);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const sessionsResult = await Promise.allSettled([
      advisingApi.getSessions(buildSessionsParams(page, limit, filters)),
      viewerRole === 'DOCTOR'
        ? advisingApi.getAssignedStudents({ limit: '200' })
        : adminApi.students.list({ limit: '200' }),
      viewerRole === 'ADMIN'
        ? advisingApi.getAdvisors({ isActive: 'true' })
        : Promise.resolve(null),
    ]);

    const [sessionsResponse, studentsResponse, advisorsResponse] = sessionsResult;

    if (
      sessionsResponse.status !== 'fulfilled'
      || !sessionsResponse.value.success
      || !sessionsResponse.value.data
    ) {
      const reason =
        sessionsResponse.status === 'fulfilled'
          ? sessionsResponse.value.error
          : sessionsResponse.reason;

      if (isSetupRequiredError(reason)) {
        setData({
          ...EMPTY_DATA,
          setupRequired: true,
          warnings: {
            setup: 'هذا الحساب غير مربوط بعد بسجل مرشد أكاديمي داخل النظام، لذلك لا يمكن إدارة الجلسات من هذه الصفحة حالياً.',
          },
        });
        setLoading(false);
        return;
      }

      setError(getErrorMessage(reason, 'تعذر تحميل قائمة الجلسات الإرشادية.'));
      setLoading(false);
      return;
    }

    const warnings: AdvisingSessionsManagementWarnings = {};

    let studentOptions: AdvisingStudentOption[] = [];
    if (
      studentsResponse.status === 'fulfilled'
      && studentsResponse.value.success
      && studentsResponse.value.data
    ) {
      studentOptions =
        viewerRole === 'DOCTOR'
          ? mapAssignedStudents(studentsResponse.value.data.students as AssignedStudent[])
          : mapAdminStudents(studentsResponse.value.data.students as Student[]);
    } else {
      warnings.students = getErrorMessage(
        studentsResponse.status === 'fulfilled'
          ? studentsResponse.value.error
          : studentsResponse.reason,
        viewerRole === 'DOCTOR'
          ? 'تعذر تحميل قائمة الطلاب المرتبطين بك، ويمكنك إدخال رقم الطالب يدوياً.'
          : 'تعذر تحميل قائمة الطلاب، ويمكنك إدخال رقم الطالب يدوياً.',
      );
    }

    let advisorOptions: AdvisingAdvisorOption[] = [];
    if (viewerRole === 'ADMIN') {
      if (
        advisorsResponse.status === 'fulfilled'
        && advisorsResponse.value
        && advisorsResponse.value.success
        && advisorsResponse.value.data
      ) {
        advisorOptions = mapAdvisors(advisorsResponse.value.data.advisors);
      } else {
        warnings.advisors = getErrorMessage(
          advisorsResponse.status === 'fulfilled'
            ? advisorsResponse.value?.error
            : advisorsResponse.reason,
          'تعذر تحميل قائمة المرشدين، ويمكنك إدخال رقم المرشد يدوياً.',
        );
      }
    }

    setData({
      sessions: sessionsResponse.value.data.sessions,
      total: sessionsResponse.value.data.total,
      studentOptions,
      advisorOptions,
      warnings,
      setupRequired: false,
    });
    setLoading(false);
  }, [enabled, filters, limit, page, viewerRole]);

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
