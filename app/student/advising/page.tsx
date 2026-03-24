'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { riskApi, advisingApi, caseApi, studyPlanApi, notificationApi, RiskStatus, AdvisingSession, Case, StudyPlan, Notification } from '@/lib/api';
import { AlertTriangle, TrendingUp, Calendar, BookOpen, Bell, CheckCircle, Clock, XCircle, ArrowLeft } from 'lucide-react';

export default function StudentAdvisingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [riskStatus, setRiskStatus] = useState<RiskStatus | null>(null);
  const [myAdvisor, setMyAdvisor] = useState<{ advisor: { doctor_name: string; specialization: string }; assignedAt: string } | null>(null);
  const [mySessions, setMySessions] = useState<AdvisingSession[]>([]);
  const [myCases, setMyCases] = useState<Case[]>([]);
  const [myPlans, setMyPlans] = useState<StudyPlan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'plans' | 'notifications'>('overview');

  useEffect(() => {
    if (user?.role !== 'STUDENT') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [riskRes, advisorRes, sessionsRes, casesRes, plansRes, notifRes] = await Promise.allSettled([
        riskApi.getMyRiskStatus(),
        advisingApi.getMyAdvisor(),
        advisingApi.getMySessions(),
        caseApi.getMyCases(),
        studyPlanApi.getMyPlans(),
        notificationApi.getAll({ limit: '10' })
      ]);

      const riskResult = riskRes.status === 'fulfilled' ? riskRes.value : null;
      const advisorResult = advisorRes.status === 'fulfilled' ? advisorRes.value : null;
      const sessionsResult = sessionsRes.status === 'fulfilled' ? sessionsRes.value : null;
      const casesResult = casesRes.status === 'fulfilled' ? casesRes.value : null;
      const plansResult = plansRes.status === 'fulfilled' ? plansRes.value : null;
      const notifResult = notifRes.status === 'fulfilled' ? notifRes.value : null;

      if (riskResult?.success && riskResult.data) setRiskStatus(riskResult.data);
      if (advisorResult?.success) setMyAdvisor(advisorResult.data as { advisor: { doctor_name: string; specialization: string }; assignedAt: string } | null);
      if (sessionsResult?.success && sessionsResult.data) setMySessions(sessionsResult.data.sessions);
      if (casesResult?.success && casesResult.data) setMyCases(casesResult.data.cases);
      if (plansResult?.success && plansResult.data) setMyPlans(plansResult.data.plans);
      if (notifResult?.success && notifResult.data) setNotifications(notifResult.data.notifications);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 'READ' } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'WARNING': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      default: return 'text-green-500 bg-green-500/20 border-green-500/30';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <XCircle size={20} />;
      case 'WARNING': return <AlertTriangle size={20} />;
      default: return <CheckCircle size={20} />;
    }
  };

  if (user?.role !== 'STUDENT') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => router.push('/student')} className="p-2 hover:bg-dark-200 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-black mb-2">الارشاد الاكاديمي</h1>
            <p className="text-dark-400">مرحباً، {user.fullName}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`card border ${riskStatus?.overallStatus === 'CRITICAL' ? 'border-red-500/50' : riskStatus?.overallStatus === 'WARNING' ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${getRiskColor(riskStatus?.overallStatus || 'GOOD')}`}>
                    {getRiskIcon(riskStatus?.overallStatus || 'GOOD')}
                  </div>
                  <div>
                    <h3 className="font-bold">حالة الحضور</h3>
                    <p className="text-dark-400 text-sm">{riskStatus?.overallStatus === 'CRITICAL' ? 'خطر' : riskStatus?.overallStatus === 'WARNING' ? 'تحذير' : 'جيد'}</p>
                  </div>
                </div>
                <div className="text-3xl font-black">{riskStatus?.averageAttendance || 0}%</div>
                <p className="text-dark-400 text-sm">متوسط نسبة الحضور</p>
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">المرشد الاكاديمي</h3>
                    <p className="text-dark-400 text-sm">{myAdvisor ? 'تم التعيين' : 'لم يتم التعيين'}</p>
                  </div>
                </div>
                {myAdvisor ? (
                  <>
                    <div className="font-bold">{myAdvisor.advisor.doctor_name}</div>
                    <p className="text-dark-400 text-sm">{myAdvisor.advisor.specialization}</p>
                  </>
                ) : (
                  <p className="text-dark-400 text-sm">لم يتم تعيين مرشد لك بعد</p>
                )}
              </div>

              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">الجلسات المجدولة</h3>
                    <p className="text-dark-400 text-sm">{mySessions.filter(s => s.status === 'SCHEDULED').length} جلسة</p>
                  </div>
                </div>
                <div className="text-3xl font-black">{mySessions.filter(s => s.status === 'SCHEDULED').length}</div>
                <p className="text-dark-400 text-sm">جلسات مستقبلية</p>
              </div>
            </div>

            <div className="flex gap-2 mb-6 overflow-x-auto">
              {(['overview', 'sessions', 'plans', 'notifications'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-dark-200 text-dark-400 hover:bg-dark-100'}`}
                >
                  {tab === 'overview' && 'نظرة عامة'}
                  {tab === 'sessions' && 'الجلسات'}
                  {tab === 'plans' && 'خطط الدراسة'}
                  {tab === 'notifications' && 'الاشعارات'}
                </button>
              ))}
            </div>

            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary" />
                    حالة المقررات
                  </h2>
                  {riskStatus?.courses && riskStatus.courses.length > 0 ? (
                    <div className="space-y-3">
                      {riskStatus.courses.map((course, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${getRiskColor(course.riskLevel)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{course.courseName}</span>
                            <span className="text-sm">{course.attendanceRate}%</span>
                          </div>
                          <div className="w-full bg-dark-300 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${course.riskLevel === 'CRITICAL' ? 'bg-red-500' : course.riskLevel === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${course.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-center py-8">لا توجد بيانات حضور</p>
                  )}
                </div>

                <div className="card">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-yellow-500" />
                    الحالات النشطة
                  </h2>
                  {myCases.filter(c => c.status === 'OPEN' || c.status === 'ONGOING').length > 0 ? (
                    <div className="space-y-3">
                      {myCases.filter(c => c.status === 'OPEN' || c.status === 'ONGOING').map(caseItem => (
                        <div key={caseItem.id} className="p-3 bg-dark-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{caseItem.title}</span>
                            <span className={`badge ${caseItem.priority === 'HIGH' || caseItem.priority === 'URGENT' ? 'badge-danger' : 'badge-warning'}`}>
                              {caseItem.priority}
                            </span>
                          </div>
                          <p className="text-dark-400 text-sm">{caseItem.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-dark-400 text-center py-8">لا توجد حالات نشطة</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">جلساتي الارشادية</h2>
                {mySessions.length > 0 ? (
                  <div className="space-y-3">
                    {mySessions.map(session => (
                      <div key={session.id} className="p-4 bg-dark-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-dark-400" />
                            <span className="font-bold">{new Date(session.scheduled_at).toLocaleDateString('ar-EG')}</span>
                          </div>
                          <span className={`badge ${session.status === 'COMPLETED' ? 'badge-success' : session.status === 'SCHEDULED' ? 'badge-warning' : 'badge-danger'}`}>
                            {session.status === 'COMPLETED' ? 'مكتملة' : session.status === 'SCHEDULED' ? 'مجدولة' : 'ملغاة'}
                          </span>
                        </div>
                        <p className="text-dark-400 text-sm mb-2">مع: {session.advisor_name}</p>
                        {session.summary && (
                          <p className="text-dark-400 text-sm bg-dark-300 p-2 rounded">{session.summary}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا توجد جلسات ارشادية</p>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">خطط الدراسة</h2>
                {myPlans.length > 0 ? (
                  <div className="space-y-4">
                    {myPlans.map(plan => (
                      <div key={plan.id} className="p-4 bg-dark-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold">{plan.title}</h3>
                          <span className={`badge ${plan.status === 'ACTIVE' ? 'badge-success' : plan.status === 'COMPLETED' ? 'badge-primary' : 'badge-danger'}`}>
                            {plan.status === 'ACTIVE' ? 'نشط' : plan.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-dark-400 text-sm mb-3">{plan.description}</p>
                        )}
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>التقدم</span>
                            <span>{plan.progress}%</span>
                          </div>
                          <div className="w-full bg-dark-300 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${plan.progress}%` }}
                            />
                          </div>
                        </div>
                        {plan.tasks && plan.tasks.length > 0 && (
                          <div className="space-y-2 mt-3 border-t border-dark-300 pt-3">
                            <p className="text-sm font-bold">المهام:</p>
                            {plan.tasks.slice(0, 3).map(task => (
                              <div key={task.id} className="flex items-center gap-2 text-sm">
                                {task.status === 'COMPLETED' ? (
                                  <CheckCircle size={14} className="text-green-500" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-dark-400" />
                                )}
                                <span className={task.status === 'COMPLETED' ? 'line-through text-dark-400' : ''}>{task.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا توجد خطط دراسة</p>
                )}
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  الاشعارات
                </h2>
                {notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${notif.is_read === 'READ' ? 'bg-dark-200' : 'bg-dark-300 border-r-4 border-primary'}`}
                        onClick={() => notif.is_read === 'UNREAD' && markNotificationRead(notif.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{notif.title}</span>
                          <span className={`badge badge-sm ${notif.type === 'CRITICAL' ? 'badge-danger' : notif.type === 'WARNING' ? 'badge-warning' : 'badge-primary'}`}>
                            {notif.type === 'CRITICAL' ? 'عاجل' : notif.type === 'WARNING' ? 'تحذير' : 'معلومات'}
                          </span>
                        </div>
                        <p className="text-dark-400 text-sm">{notif.message}</p>
                        <p className="text-dark-500 text-xs mt-2">{new Date(notif.created_at).toLocaleString('ar-EG')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا توجد اشعارات</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
