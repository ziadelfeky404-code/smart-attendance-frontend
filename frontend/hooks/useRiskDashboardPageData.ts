'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  advisingApi,
  AdvisorDashboardSummary,
  DashboardRiskLevel,
  notificationApi,
  Notification,
  RiskDashboardAlert,
  RiskDashboardStudent,
  RiskLevelDistribution,
  riskApi,
  StudentRiskDetails,
} from '@/lib/api';

interface RiskDashboardWarnings {
  dashboard?: string;
  advising?: string;
  notifications?: string;
  studentDetails?: string;
}

export interface RiskDashboardSummaryCards {
  totalStudents: number;
  good: number;
  medium: number;
  high: number;
  critical: number;
  lowAttendanceStudents: number;
  recentAlerts: number;
}

export interface RiskDashboardHighRiskStudentItem extends RiskDashboardStudent {
  latestAlertDate: string | null;
  recommendations: string[];
}

export interface RiskDashboardAlertItem {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  riskLevel: DashboardRiskLevel;
  attendanceRate: number | null;
  courseId: string | null;
  courseName: string | null;
  createdAt: string;
}

export interface RiskDashboardPageData {
  setupRequired: boolean;
  summaryCards: RiskDashboardSummaryCards;
  distribution: RiskLevelDistribution;
  highRiskStudents: RiskDashboardHighRiskStudentItem[];
  lowAttendanceStudents: RiskDashboardStudent[];
  recentAlerts: RiskDashboardAlertItem[];
  unreadNotifications: Notification[];
  viewerUnreadCount: number;
  warnings: RiskDashboardWarnings;
}

interface UseRiskDashboardPageDataOptions {
  enabled?: boolean;
}

const EMPTY_DISTRIBUTION: RiskLevelDistribution = {
  GOOD: 0,
  LOW: 0,
  MEDIUM: 0,
  HIGH: 0,
  CRITICAL: 0,
};

const MAX_DETAIL_LOOKUPS = 8;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const isSetupRequiredError = (error: unknown) =>
  error instanceof Error && /registered as an advisor/i.test(error.message);

const mapRiskAlert = (alert: RiskDashboardAlert): RiskDashboardAlertItem => ({
  id: alert.id,
  studentId: alert.studentId,
  studentName: alert.studentName,
  studentCode: alert.studentCode,
  riskLevel: alert.riskLevel,
  attendanceRate: alert.attendanceRate,
  courseId: alert.courseId,
  courseName: alert.courseName,
  createdAt: alert.createdAt,
});

const mapAdvisingAlert = (
  alert: AdvisorDashboardSummary['recentAlerts'][number],
): RiskDashboardAlertItem => ({
  id: alert.id,
  studentId: alert.studentId,
  studentName: alert.studentName,
  studentCode: alert.studentCode,
  riskLevel: alert.riskLevel,
  attendanceRate: alert.attendanceRate,
  courseId: alert.courseId,
  courseName: alert.courseName,
  createdAt: alert.createdAt,
});

const buildFallbackHighRiskStudents = (
  alerts: RiskDashboardAlertItem[],
): RiskDashboardHighRiskStudentItem[] => {
  const seen = new Set<string>();
  const students: RiskDashboardHighRiskStudentItem[] = [];

  for (const alert of alerts) {
    if (seen.has(alert.studentId)) {
      continue;
    }

    seen.add(alert.studentId);
    students.push({
      studentId: alert.studentId,
      studentName: alert.studentName,
      studentCode: alert.studentCode,
      department: null,
      riskLevel: alert.riskLevel,
      attendanceRate: alert.attendanceRate,
      courseId: alert.courseId,
      courseName: alert.courseName,
      recommendation: null,
      lastUpdated: alert.createdAt,
      latestAlertDate: alert.createdAt,
      recommendations: [],
    });
  }

  return students.slice(0, MAX_DETAIL_LOOKUPS);
};

const buildSummaryCards = ({
  distribution,
  totalStudents,
  lowAttendanceCount,
  recentAlertsCount,
}: {
  distribution: RiskLevelDistribution;
  totalStudents: number;
  lowAttendanceCount: number;
  recentAlertsCount: number;
}): RiskDashboardSummaryCards => ({
  totalStudents,
  good: distribution.GOOD,
  medium: distribution.MEDIUM,
  high: distribution.HIGH,
  critical: distribution.CRITICAL,
  lowAttendanceStudents: lowAttendanceCount,
  recentAlerts: recentAlertsCount,
});

export function useRiskDashboardPageData(
  options: UseRiskDashboardPageDataOptions = {},
) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<RiskDashboardPageData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [riskResult, advisingResult, notificationsResult] = await Promise.allSettled([
      riskApi.getDashboard(),
      advisingApi.getDashboard(),
      notificationApi.getAll({ unreadOnly: 'true', limit: '6' }),
    ]);

    const warnings: RiskDashboardWarnings = {};
    const riskDashboard =
      riskResult.status === 'fulfilled'
      && riskResult.value.success
      && riskResult.value.data
        ? riskResult.value.data
        : null;
    const advisingDashboard =
      advisingResult.status === 'fulfilled'
      && advisingResult.value.success
      && advisingResult.value.data
        ? advisingResult.value.data
        : null;

    const setupRequired = isSetupRequiredError(
      riskResult.status === 'fulfilled' ? riskResult.value.error : riskResult.reason,
    ) || isSetupRequiredError(
      advisingResult.status === 'fulfilled' ? advisingResult.value.error : advisingResult.reason,
    );

    if (!riskDashboard && !setupRequired) {
      warnings.dashboard = getErrorMessage(
        riskResult.status === 'fulfilled' ? riskResult.value.error : riskResult.reason,
        'تعذر تحميل بيانات لوحة المخاطر.',
      );
    }

    if (!advisingDashboard && !setupRequired) {
      warnings.advising = getErrorMessage(
        advisingResult.status === 'fulfilled' ? advisingResult.value.error : advisingResult.reason,
        'تعذر تحميل ملخص الإرشاد البديل.',
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

    const recentAlerts = riskDashboard?.recentAlerts.length
      ? riskDashboard.recentAlerts.map(mapRiskAlert)
      : advisingDashboard?.recentAlerts.map(mapAdvisingAlert) || [];

    let highRiskStudents = riskDashboard?.highRiskStudents || [];
    if (!highRiskStudents.length && recentAlerts.length) {
      highRiskStudents = buildFallbackHighRiskStudents(recentAlerts);
    }

    const detailIds = Array.from(new Set(highRiskStudents.map((student) => student.studentId)))
      .slice(0, MAX_DETAIL_LOOKUPS);
    const detailResults = await Promise.allSettled(
      detailIds.map(async (studentId) => {
        const result = await riskApi.getStudentRiskDetails(studentId);
        return {
          studentId,
          details: result.success && result.data ? result.data : null,
        };
      }),
    );

    const studentDetailsMap = new Map<string, StudentRiskDetails>();
    const failedDetails = detailResults.some((result) => {
      if (result.status === 'fulfilled' && result.value.details) {
        studentDetailsMap.set(result.value.studentId, result.value.details);
        return false;
      }

      return true;
    });

    if (failedDetails && detailIds.length > 0) {
      warnings.studentDetails = 'تعذر تحميل بعض تفاصيل الطلاب عالية الخطورة، وتم عرض أحدث البيانات المتاحة.';
    }

    const enrichedHighRiskStudents: RiskDashboardHighRiskStudentItem[] = highRiskStudents.map((student) => {
      const details = studentDetailsMap.get(student.studentId);
      return {
        ...student,
        latestAlertDate: details?.lastAlerts[0]?.createdAt || student.lastUpdated,
        recommendations: details?.recommendations || [],
      };
    });

    const distribution = riskDashboard?.studentsByRiskLevel || EMPTY_DISTRIBUTION;
    const summaryCards = buildSummaryCards({
      distribution,
      totalStudents: riskDashboard?.totalStudents ?? advisingDashboard?.totalStudents ?? 0,
      lowAttendanceCount: riskDashboard?.lowAttendanceStudents.length ?? advisingDashboard?.lowAttendanceStudents ?? 0,
      recentAlertsCount: recentAlerts.length,
    });

    const hasUsableData = Boolean(
      setupRequired
      || riskDashboard
      || advisingDashboard
      || unreadNotifications.length
      || viewerUnreadCount,
    );

    if (!hasUsableData) {
      setError('تعذر تحميل لوحة المخاطر حالياً. حاول مرة أخرى بعد قليل.');
      setLoading(false);
      return;
    }

    setData({
      setupRequired,
      summaryCards,
      distribution,
      highRiskStudents: enrichedHighRiskStudents,
      lowAttendanceStudents: riskDashboard?.lowAttendanceStudents || [],
      recentAlerts,
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
