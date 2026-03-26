'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  adminApi,
  advisingApi,
  AdvisingSession,
  aiApi,
  AiStudentAdvisingSummary,
  Notification,
  notificationApi,
  riskApi,
  StudentAcademicProfile,
  StudentRiskDetails,
} from '@/lib/api';

interface StudentProfileWarnings {
  risk?: string;
  sessions?: string;
  notifications?: string;
}

export interface StudentProfileData {
  profile: StudentAcademicProfile;
  aiSummary: AiStudentAdvisingSummary;
  riskDetails: StudentRiskDetails;
  sessions: AdvisingSession[];
  unreadNotifications: Notification[];
  viewerUnreadCount: number;
  warnings: StudentProfileWarnings;
}

interface UseStudentProfileDataOptions {
  enabled?: boolean;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const mapProfileRiskToDetails = (profile: StudentAcademicProfile): StudentRiskDetails => ({
  currentRiskLevel: profile.risk.level,
  attendanceRate: profile.attendance.overallPercentage,
  failedCourses: profile.failedCourses,
  lastAlerts: profile.risk.latestAlerts.map((alert) => ({
    id: alert.id,
    riskLevel: alert.riskLevel,
    attendanceRate: alert.attendanceRate,
    courseId: alert.courseId,
    courseName: alert.courseName,
    recommendation: alert.recommendation,
    triggerEvent: alert.triggerEvent,
    createdAt: alert.createdAt,
  })),
  recommendations: Array.from(
    new Set(
      profile.risk.courses
        .map((course) => course.recommendation?.trim())
        .filter((recommendation): recommendation is string => Boolean(recommendation)),
    ),
  ),
});

const mapProfileSessionsToList = (profile: StudentAcademicProfile): AdvisingSession[] =>
  profile.advisingSessions.map((session) => ({
    id: session.id,
    student_id: profile.basicInfo.id,
    student_name: profile.basicInfo.name,
    student_code: profile.basicInfo.code,
    advisor_id: profile.advisor?.advisorId || '',
    advisor_name: session.advisorName,
    case_id: null,
    scheduled_at: session.scheduledAt,
    duration_minutes: 0,
    status: session.status,
    session_type: session.sessionType,
    location: session.location || '',
    meeting_link: '',
    completed_at: session.completedAt,
    summary: session.summary,
    recommendations: session.recommendations,
    follow_up_required: session.followUpRequired,
    follow_up_date: session.followUpDate,
    created_at: session.scheduledAt,
  }));

export function useStudentProfileData(
  studentId: string,
  options: UseStudentProfileDataOptions = {},
) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled || !studentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [profileResult, aiSummaryResult, riskResult, sessionsResult, notificationsResult] = await Promise.allSettled([
      adminApi.students.getProfile(studentId),
      aiApi.getStudentSummary(studentId),
      riskApi.getStudentRiskDetails(studentId),
      advisingApi.getSessions({ studentId, limit: '10' }),
      notificationApi.getAll({ unreadOnly: 'true', limit: '10' }),
    ]);

    if (
      profileResult.status !== 'fulfilled'
      || !profileResult.value.success
      || !profileResult.value.data
    ) {
      setError(getErrorMessage(
        profileResult.status === 'fulfilled' ? profileResult.value.error : profileResult.reason,
        'تعذر تحميل الملف الأكاديمي للطالب.',
      ));
      setLoading(false);
      return;
    }

    if (
      aiSummaryResult.status !== 'fulfilled'
      || !aiSummaryResult.value.success
      || !aiSummaryResult.value.data
    ) {
      setError(getErrorMessage(
        aiSummaryResult.status === 'fulfilled' ? aiSummaryResult.value.error : aiSummaryResult.reason,
        'تعذر تحميل الملخص الإرشادي الذكي.',
      ));
      setLoading(false);
      return;
    }

    const profile = profileResult.value.data;
    const aiSummary = aiSummaryResult.value.data;
    const warnings: StudentProfileWarnings = {};

    const riskDetails =
      riskResult.status === 'fulfilled' && riskResult.value.success && riskResult.value.data
        ? riskResult.value.data
        : (() => {
            warnings.risk = 'تعذر تحميل تفاصيل المخاطر الكاملة، وتم عرض آخر البيانات المتاحة من الملف الأكاديمي.';
            return mapProfileRiskToDetails(profile);
          })();

    const sessions =
      sessionsResult.status === 'fulfilled' && sessionsResult.value.success && sessionsResult.value.data
        ? sessionsResult.value.data.sessions
        : (() => {
            warnings.sessions = 'تعذر تحميل قائمة الجلسات من خدمة الإرشاد، وتم عرض الجلسات الأخيرة المتاحة.';
            return mapProfileSessionsToList(profile);
          })();

    const unreadNotifications =
      notificationsResult.status === 'fulfilled' && notificationsResult.value.success && notificationsResult.value.data
        ? notificationsResult.value.data.notifications
        : (() => {
            warnings.notifications = 'تعذر تحميل الإشعارات غير المقروءة الخاصة بحسابك حالياً.';
            return [];
          })();

    const viewerUnreadCount =
      notificationsResult.status === 'fulfilled' && notificationsResult.value.success && notificationsResult.value.data
        ? notificationsResult.value.data.unreadCount
        : 0;

    setData({
      profile,
      aiSummary,
      riskDetails,
      sessions,
      unreadNotifications,
      viewerUnreadCount,
      warnings,
    });
    setLoading(false);
  }, [enabled, studentId]);

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
