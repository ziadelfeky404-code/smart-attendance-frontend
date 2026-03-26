'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, DashboardStats, RecentActivity } from '@/lib/api';
import {
  Users, GraduationCap, BookOpen, Calendar, Activity,
  TrendingUp, Clock, AlertTriangle, ArrowUpRight
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, trend }: { icon: React.ElementType; label: string; value: number; color: string; trend?: string }) {
  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl ${color} bg-current/10 flex items-center justify-center flex-shrink-0`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-dark-400 text-sm">{label}</p>
        <p className="text-2xl font-black">{value.toLocaleString('ar-EG')}</p>
        {trend && <p className="text-xs text-success flex items-center gap-1"><TrendingUp size={12} />{trend}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const res = await adminApi.dashboard();
      if (res.success && res.data) {
        setStats(res.data.stats);
        setActivity(res.data.recentActivity);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark" data-testid="admin-dashboard">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
          <p className="text-dark-400">مرحباً، {user.fullName}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div data-testid="admin-stat-students"><StatCard icon={GraduationCap} label="إجمالي الطلاب" value={stats.totalStudents} color="text-primary" /></div>
              <div data-testid="admin-stat-doctors"><StatCard icon={Users} label="إجمالي الأطباء" value={stats.totalDoctors} color="text-accent" /></div>
              <div data-testid="admin-stat-courses"><StatCard icon={BookOpen} label="إجمالي المقررات" value={stats.totalCourses} color="text-warning" /></div>
              <div data-testid="admin-stat-sessions"><StatCard icon={Calendar} label="إجمالي الجلسات" value={stats.totalSessions} color="text-success" /></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Activity} label="الجلسات النشطة" value={stats.activeSessions} color="text-danger" />
              <StatCard icon={Clock} label="حضور اليوم" value={stats.todayAttendance} color="text-primary" />
              <StatCard icon={Calendar} label="إجمالي الشعب" value={stats.totalSections} color="text-accent" />
              <StatCard icon={BookOpen} label="إجمالي المحاضرات" value={stats.totalLectures} color="text-warning" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card" data-testid="admin-recent-activity">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-primary" /> النشاط الأخير
                </h2>
                {activity.length > 0 ? (
                  <div className="space-y-3">
                    {activity.map((a, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-dark-300 last:border-0">
                        <span className="text-sm text-dark-400">{a.type}</span>
                        <span className="badge badge-primary">{a.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-sm text-center py-8">لا يوجد نشاط حديث</p>
                )}
              </div>

              <div className="card" data-testid="admin-quick-actions">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-warning" /> إجراءات سريعة
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { href: '/admin/doctors', label: 'إضافة طبيب', color: 'text-accent' },
                    { href: '/admin/students', label: 'إضافة طالب', color: 'text-primary' },
                    { href: '/admin/courses', label: 'إضافة مقرر', color: 'text-warning' },
                    { href: '/admin/sections', label: 'إنشاء شعبة', color: 'text-success' },
                  ].map((action) => (
                    <a key={action.href} href={action.href} className="card hover:border-primary/30 transition-colors cursor-pointer">
                      <p className={`font-bold ${action.color}`}>{action.label}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-dark-400">
            <p>فشل تحميل البيانات</p>
          </div>
        )}
      </main>
    </div>
  );
}
