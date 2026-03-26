'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  advisingApi,
  AdvisingSession,
  Advisor,
  AdvisorDashboardAlert,
  AdvisorDashboardSummary,
  AdvisorDashboardUpcomingSession,
  AdvisorRiskDashboard,
  DashboardRiskLevel,
  Notification,
  notificationApi,
  RiskDashboardAlert,
  RiskDashboardStudent,
  RiskLevelDistribution,
  riskApi,
} from '@/lib/api';

interface AdvisorDashboardWarnings {
  advisor?: string;
  summary?: string;
  risk?: string;
  sessions?: string;
  notifications?: string;
}

export interface AdvisorDashboardSessionItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  scheduledAt: string;
  sessionType: string;
  status: string;
  location: string;
}

export interface AdvisorDashboardAlertItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  department: string | null;
  riskLevel: DashboardRiskLevel;
  attendanceRate: number | null;
  courseId: string | null;
  courseName: string | null;
  recommendation: string | null;
  triggerEvent: string | null;
  createdAt: string;
}

export interface AdvisorDashboardCards {
  totalStudents: number;
  highRiskStudents: number;
  lowAttendanceStudents: number;
  unreadNotifications: number;
}

export interface AdvisorDashboardData {
  advisor: Advisor | null;
  setupRequired: boolean;
  cards: AdvisorDashboardCards;
  department: string | null;
  riskDistribution: RiskLevelDistribution;
  highRiskStudents: RiskDashboardStudent[];
  lowAttendanceStudents: RiskDashboardStudent[];
  recentAlerts: AdvisorDashboardAlertItem[];
  upcomingSessions: AdvisorDashboardSessionItem[];
  unreadNotifications: Notification[];
  viewerUnreadCount: number;
  warnings: AdvisorDashboardWarnings;
}

interface UseAdvisorDashboardDataOptions {
  enabled?: boolean;
}

const EMPTY_DISTRIBUTION: RiskLevelDistribution = {
  GOOD: 0,
  LOW: 0,
  MEDIUM: 0,
  HIGH: 0,
  CRITICAL: 0,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const isSetupRequiredError = (error: unknown) =>
  error instanceof Error && /registered as an advisor/i.test(error.message);

const mapSummarySession = (
  session: AdvisorDashboardUpcomingSession,
): AdvisorDashboardSessionItem => ({
  id: session.id,
  studentId: session.studentId,
  studentName: session.studentName,
  studentCode: session.studentCode,
  scheduledAt: session.scheduledAt,
  sessionType: session.sessionType,
  status: session.status,
  location: session.location,
});

const mapAdvisingSession = (
  session: AdvisingSession,
): AdvisorDashboardSessionItem => ({
  id: session.id,
  studentId: session.student_id,
  studentName: session.student_name,
  studentCode: session.student_code,
  scheduledAt: session.scheduled_at,
  sessionType: session.session_type,
  status: session.status,
  location: session.location,
});

const mapRiskAlert = (alert: RiskDashboardAlert): AdvisorDashboardAlertItem => ({
  id: alert.id,
  studentId: alert.studentId,
  studentName: alert.studentName,
  studentCode: alert.studentCode,
  department: alert.department,
  riskLevel: alert.riskLevel,
  attendanceRate: alert.attendanceRate,
  courseId: alert.courseId,
  courseName: alert.courseName,
  recommendation: alert.recommendation,
  triggerEvent: alert.triggerEvent,
  createdAt: alert.createdAt,
});

const mapSummaryAlert = (alert: AdvisorDashboardAlert): AdvisorDashboardAlertItem => ({
  id: alert.id,
  studentId: alert.studentId,
  studentName: alert.studentName,
  studentCode: alert.studentCode,
  department: null,
  riskLevel: alert.riskLevel,
  attendanceRate: alert.attendanceRate,
  courseId: alert.courseId,
  courseName: alert.courseName,
  recommendation: alert.recommendation,
  triggerEvent: null,
  createdAt: alert.createdAt,
});

const deriveDepartment = (riskDashboard: AdvisorRiskDashboard | null): string | null => {
  if (!riskDashboard) {
    return null;
  }

  return (
    riskDashboard.highRiskStudents.find((student) => student.department)?.department
    || riskDashboard.lowAttendanceStudents.find((student) => student.department)?.department
    || riskDashboard.recentAlerts.find((alert) => alert.department)?.department
    || null
  );
};

const buildCards = (
  summary: AdvisorDashboardSummary | null,
  riskDashboard: AdvisorRiskDashboard | null,
  viewerUnreadCount: number,
): AdvisorDashboardCards => ({
  totalStudents: summary?.totalStudents ?? riskDashboard?.totalStudents ?? 0,
  highRiskStudents: summary?.highRiskStudents ?? riskDashboard?.highRiskStudents.length ?? 0,
  lowAttendanceStudents: summary?.lowAttendanceStudents ?? riskDashboard?.lowAttendanceStudents.length ?? 0,
  unreadNotifications: summary?.unreadNotifications ?? viewerUnreadCount,
});

export function useAdvisorDashboardData(options: UseAdvisorDashboardDataOptions = {}) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<AdvisorDashboardData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [
      advisorResult,
      summaryResult,
      riskResult,
      sessionsResult,
      notificationsResult,
    ] = await Promise.allSettled([
      advisingApi.getMyAdvisorProfile(),
      advisingApi.getDashboard(),
      riskApi.getDashboard(),
      advisingApi.getSessions({ timeframe: 'UPCOMING', limit: '8' }),
      notificationApi.getAll({ unreadOnly: 'true', limit: '6' }),
    ]);

    const warnings: AdvisorDashboardWarnings = {};
    let setupRequired = false;
    let advisor: Advisor | null = null;

    if (
      advisorResult.status === 'fulfilled'
      && advisorResult.value.success
      && advisorResult.value.data
    ) {
      advisor = advisorResult.value.data;
    } else if (
      isSetupRequiredError(
        advisorResult.status === 'fulfilled' ? advisorResult.value.error : advisorResult.reason,
      )
    ) {
      setupRequired = true;
      warnings.advisor = 'هذا الحساب غير مربوط بعد بسجل مرشد أكاديمي داخل النظام.';
    } else if (
      advisorResult.status === 'fulfilled'
      || advisorResult.status === 'rejected'
    ) {
      warnings.advisor = getErrorMessage(
        advisorResult.status === 'fulfilled' ? advisorResult.value.error : advisorResult.reason,
        'تعذر تحميل ملف المرشد الحالي.',
      );
    }

    const summary =
      summaryResult.status === 'fulfilled'
      && summaryResult.value.success
      && summaryResult.value.data
        ? summaryResult.value.data
        : null;

    if (!summary && !setupRequired) {
      warnings.summary = getErrorMessage(
        summaryResult.status === 'fulfilled' ? summaryResult.value.error : summaryResult.reason,
        'تعذر تحميل ملخص لوحة الإرشاد.',
      );
    }

    const riskDashboard =
      riskResult.status === 'fulfilled'
      && riskResult.value.success
      && riskResult.value.data
        ? riskResult.value.data
        : null;

    if (!riskDashboard && !setupRequired) {
      warnings.risk = getErrorMessage(
        riskResult.status === 'fulfilled' ? riskResult.value.error : riskResult.reason,
        'تعذر تحميل مؤشرات المخاطر الحالية.',
      );
    }

    const viewerUnreadCount =
      notificationsResult.status === 'fulfilled'
      && notificationsResult.value.success
      && notificationsResult.value.data
        ? notificationsResult.value.data.unreadCount
        : 0;

    const unreadNotifications =
      notificationsResult.status === 'fulfilled'
      && notificationsResult.value.success
      && notificationsResult.value.data
        ? notificationsResult.value.data.notifications
        : [];

    if (
      notificationsResult.status !== 'fulfilled'
      || !notificationsResult.value.success
      || !notificationsResult.value.data
    ) {
      warnings.notifications = getErrorMessage(
        notificationsResult.status === 'fulfilled' ? notificationsResult.value.error : notificationsResult.reason,
        'تعذر تحميل الإشعارات غير المقروءة.',
      );
    }

    const upcomingSessions =
      sessionsResult.status === 'fulfilled'
      && sessionsResult.value.success
      && sessionsResult.value.data
        ? sessionsResult.value.data.sessions.map(mapAdvisingSession)
        : summary?.upcomingSessions.map(mapSummarySession) || [];

    if (
      (
        sessionsResult.status !== 'fulfilled'
        || !sessionsResult.value.success
        || !sessionsResult.value.data
      )
      && !setupRequired
    ) {
      warnings.sessions = summary?.upcomingSessions.length
        ? 'تعذر تحميل قائمة الجلسات القادمة الكاملة، وتم عرض الجلسات المتاحة من ملخص الإرشاد.'
        : getErrorMessage(
            sessionsResult.status === 'fulfilled' ? sessionsResult.value.error : sessionsResult.reason,
            'تعذر تحميل الجلسات الإرشادية القادمة.',
          );
    }

    const recentAlerts = riskDashboard?.recentAlerts.length
      ? riskDashboard.recentAlerts.map(mapRiskAlert)
      : summary?.recentAlerts.map(mapSummaryAlert) || [];

    const cards = buildCards(summary, riskDashboard, viewerUnreadCount);
    const department = deriveDepartment(riskDashboard);
    const hasUsableData = Boolean(
      advisor
      || summary
      || riskDashboard
      || upcomingSessions.length
      || unreadNotifications.length
      || setupRequired,
    );

    if (!hasUsableData) {
      setError('تعذر تحميل لوحة الإرشاد حالياً. حاول مرة أخرى بعد قليل.');
      setLoading(false);
      return;
    }

    setData({
      advisor,
      setupRequired,
      cards,
      department,
      riskDistribution: riskDashboard?.studentsByRiskLevel || EMPTY_DISTRIBUTION,
      highRiskStudents: riskDashboard?.highRiskStudents || [],
      lowAttendanceStudents: riskDashboard?.lowAttendanceStudents || [],
      recentAlerts,
      upcomingSessions,
      unreadNotifications,
      viewerUnreadCount,
      warnings,
    });
    setLoading(false);
  }, [enabled]);

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
