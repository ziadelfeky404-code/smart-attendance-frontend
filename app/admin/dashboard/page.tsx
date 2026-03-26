'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, Calendar, Activity, Shield, Smartphone, RefreshCw } from 'lucide-react';

interface Stats {
  totalStudents: number;
  totalDoctors: number;
  totalTeachingAssistants: number;
  activeSessions: number;
  todayAttendance: number;
  pendingDeviceChanges: number;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  details: string;
  createdAt: string;
  user: {
    name: string;
  };
}

interface PendingDeviceChange {
  id: string;
  user: {
    name: string;
    email: string;
    role: string;
  };
  deviceFingerprint: string;
  requestedAt: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalDoctors: 0,
    totalTeachingAssistants: 0,
    activeSessions: 0,
    todayAttendance: 0,
    pendingDeviceChanges: 0,
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingDeviceChanges, setPendingDeviceChanges] = useState<PendingDeviceChange[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [usersRes, sessionsRes, auditRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/attendance/session?status=ACTIVE'),
        fetch('/api/admin/audit'),
      ]);

      const usersData = await usersRes.json();
      const sessionsData = await sessionsRes.json();
      const auditData = await auditRes.json();

      if (usersData.success) {
        const users = usersData.data.users;
        setStats((prev) => ({
          ...prev,
          totalStudents: users.filter((u: { role: string }) => u.role === 'STUDENT').length,
          totalDoctors: users.filter((u: { role: string }) => u.role === 'DOCTOR').length,
          totalTeachingAssistants: users.filter((u: { role: string }) => u.role === 'TEACHING_ASSISTANT').length,
          pendingDeviceChanges: users.filter((u: { isActive: boolean; deviceFingerprint: string | null }) => !u.isActive && !u.deviceFingerprint).length,
        }));
      }

      if (sessionsData.success) {
        setStats((prev) => ({
          ...prev,
          activeSessions: sessionsData.data?.length || 0,
        }));
      }

      if (auditData.success) {
        setAuditLogs(auditData.data.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleApproveDevice = async (userId: string, fingerprint: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'APPROVE_DEVICE',
          deviceFingerprint: fingerprint,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPendingDeviceChanges((prev) => prev.filter((u) => u.id !== userId));
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error approving device:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      CREATE_USER: 'إنشاء مستخدم',
      UPDATE_USER: 'تحديث مستخدم',
      DELETE_USER: 'حذف مستخدم',
      ACTIVATE_USER: 'تفعيل حساب',
      DEACTIVATE_USER: 'إيقاف حساب',
      APPROVE_DEVICE_CHANGE: 'اعتماد جهاز',
      CREATE_APPOINTMENT: 'حجز موعد',
      APPROVE_APPOINTMENT: 'اعتماد موعد',
      REJECT_APPOINTMENT: 'رفض موعد',
      AI_CHAT: 'محادثة ذكاء اصطناعي',
      UPLOAD_DOCUMENT: 'رفع ملف',
      DELETE_DOCUMENT: 'حذف ملف',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return 'text-emerald-400 bg-emerald-500/20';
    if (action.includes('DELETE')) return 'text-red-400 bg-red-500/20';
    if (action.includes('UPDATE') || action.includes('APPROVE')) return 'text-blue-400 bg-blue-500/20';
    return 'text-slate-400 bg-slate-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-500" />
              لوحة تحكم المسؤول
            </h1>
            <p className="text-slate-400 mt-1">إدارة النظام والمستخدمين</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            تحديث
          </button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-200 text-sm">إجمالي الطلاب</p>
                <p className="text-4xl font-bold mt-2">{stats.totalStudents}</p>
              </div>
              <Users className="w-12 h-12 text-indigo-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm">الدكاترة</p>
                <p className="text-4xl font-bold mt-2">{stats.totalDoctors}</p>
              </div>
              <BookOpen className="w-12 h-12 text-emerald-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-200 text-sm">المعيدين</p>
                <p className="text-4xl font-bold mt-2">{stats.totalTeachingAssistants}</p>
              </div>
              <Users className="w-12 h-12 text-amber-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-rose-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-200 text-sm">الجلسات المفتوحة</p>
                <p className="text-4xl font-bold mt-2">{stats.activeSessions}</p>
              </div>
              <Calendar className="w-12 h-12 text-rose-300" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              آخر العمليات
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-3" />
                <p>لا توجد عمليات مسجلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                          <span className="text-slate-400 text-sm">{log.user.name}</span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1">{log.details}</p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-amber-500" />
              طلبات تغيير الجهاز المعلقة
            </h2>

            {pendingDeviceChanges.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Smartphone className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>لا توجد طلبات معلقة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingDeviceChanges.map((change) => (
                  <div key={change.id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{change.user.name}</p>
                        <p className="text-sm text-slate-400">{change.user.email}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDate(change.requestedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleApproveDevice(change.id, change.deviceFingerprint)}
                        className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        اعتماد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">روابط سريعة</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="bg-slate-700 hover:bg-slate-600 rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <Users className="w-8 h-8 text-indigo-500" />
              <div>
                <p className="font-semibold">إدارة المستخدمين</p>
                <p className="text-sm text-slate-400">إضافة أو تعديل أو إيقاف</p>
              </div>
            </a>
            <a
              href="/admin/documents"
              className="bg-slate-700 hover:bg-slate-600 rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <BookOpen className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="font-semibold">إدارة الوثائق</p>
                <p className="text-sm text-slate-400">رفع أو حذف الملفات</p>
              </div>
            </a>
            <a
              href="/admin/reports"
              className="bg-slate-700 hover:bg-slate-600 rounded-xl p-4 flex items-center gap-3 transition-colors"
            >
              <Activity className="w-8 h-8 text-amber-500" />
              <div>
                <p className="font-semibold">التقارير</p>
                <p className="text-sm text-slate-400">عرض وتحليل البيانات</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
