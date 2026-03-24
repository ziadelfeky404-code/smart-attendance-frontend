'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { advisingApi, caseApi, studyPlanApi, adminApi, AssignedStudent, AdvisingSession, Case, StudyPlan, Advisor, Student } from '@/lib/api';
import { Users, Calendar, AlertTriangle, BookOpen, Plus, Clock, X, CheckCircle, Edit2 } from 'lucide-react';

export default function DoctorAdvisingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assignedStudents, setAssignedStudents] = useState<AssignedStudent[]>([]);
  const [sessions, setSessions] = useState<AdvisingSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<AdvisingSession[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'sessions' | 'cases' | 'plans'>('students');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AssignedStudent | null>(null);
  const [sessionForm, setSessionForm] = useState({ scheduledAt: '', durationMinutes: 30, sessionType: 'FOLLOW_UP', location: '', summary: '', recommendations: '', status: '' });
  const [caseForm, setCaseForm] = useState({ title: '', description: '', caseType: 'GENERAL', priority: 'MEDIUM' });
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, sessionsRes, upcomingRes, casesRes] = await Promise.allSettled([
        advisingApi.getAssignedStudents(),
        advisingApi.getSessions(),
        advisingApi.getUpcomingSessions(),
        caseApi.getAdvisorCases()
      ]);

      const studentsResult = studentsRes.status === 'fulfilled' ? studentsRes.value : null;
      const sessionsResult = sessionsRes.status === 'fulfilled' ? sessionsRes.value : null;
      const upcomingResult = upcomingRes.status === 'fulfilled' ? upcomingRes.value : null;
      const casesResult = casesRes.status === 'fulfilled' ? casesRes.value : null;

      if (studentsResult?.success && studentsResult.data) setAssignedStudents(studentsResult.data.students);
      if (sessionsResult?.success && sessionsResult.data) setSessions(sessionsResult.data.sessions);
      if (upcomingResult?.success && upcomingResult.data) setUpcomingSessions(upcomingResult.data.sessions);
      if (casesResult?.success && casesResult.data) setCases(casesResult.data.cases);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!selectedStudent || !sessionForm.scheduledAt) return;
    try {
      await advisingApi.createSession({
        studentId: selectedStudent.id,
        advisorId: advisor?.id || '',
        scheduledAt: new Date(sessionForm.scheduledAt).toISOString(),
        durationMinutes: sessionForm.durationMinutes,
        sessionType: sessionForm.sessionType,
        location: sessionForm.location
      });
      setShowSessionModal(false);
      setSelectedStudent(null);
      setSessionForm({ scheduledAt: '', durationMinutes: 30, sessionType: 'FOLLOW_UP', location: '', summary: '', recommendations: '', status: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const completeSession = async (sessionId: string) => {
    try {
      await advisingApi.updateSession(sessionId, {
        status: 'COMPLETED',
        summary: sessionForm.summary,
        recommendations: sessionForm.recommendations
      });
      loadData();
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  const createCase = async () => {
    if (!selectedStudent || !caseForm.title) return;
    try {
      await caseApi.create({
        studentId: selectedStudent.id,
        title: caseForm.title,
        description: caseForm.description,
        caseType: caseForm.caseType,
        priority: caseForm.priority,
        assignedAdvisorId: advisor?.id
      });
      setShowCaseModal(false);
      setSelectedStudent(null);
      setCaseForm({ title: '', description: '', caseType: 'GENERAL', priority: 'MEDIUM' });
      loadData();
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const createStudyPlan = async (student: AssignedStudent) => {
    try {
      await studyPlanApi.createPlan({
        studentId: student.id,
        title: `خطة دراسية - ${student.full_name}`,
        description: 'خطة دراسية لتحسين الاداء',
        startDate: new Date().toISOString(),
        goals: 'تحسين نسبة الحضور والحصول على نتائج جيدة'
      });
      alert('تم إنشاء خطة دراسية');
    } catch (error) {
      console.error('Failed to create study plan:', error);
    }
  };

  const getRiskBadge = (level?: string) => {
    switch (level) {
      case 'CRITICAL': return <span className="badge badge-danger">خطر</span>;
      case 'WARNING': return <span className="badge badge-warning">تحذير</span>;
      default: return <span className="badge badge-success">جيد</span>;
    }
  };

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">الارشاد الاكاديمي</h1>
          <p className="text-dark-400">مرحباً، {user.fullName}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <Users size={20} />
              </div>
              <div>
                <div className="text-2xl font-black">{assignedStudents.length}</div>
                <p className="text-dark-400 text-sm">طلاب تابعين</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-500">
                <Calendar size={20} />
              </div>
              <div>
                <div className="text-2xl font-black">{upcomingSessions.length}</div>
                <p className="text-dark-400 text-sm">جلسات قادمة</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-red-500/20 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="text-2xl font-black">{cases.filter(c => c.status === 'OPEN' || c.status === 'ONGOING').length}</div>
                <p className="text-dark-400 text-sm">حالات نشطة</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                <BookOpen size={20} />
              </div>
              <div>
                <div className="text-2xl font-black">{assignedStudents.filter(s => s.risk_level === 'CRITICAL' || s.risk_level === 'WARNING').length}</div>
                <p className="text-dark-400 text-sm">طلاب في خطر</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {(['students', 'sessions', 'cases', 'plans'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-colors ${activeTab === tab ? 'bg-primary text-dark' : 'bg-dark-200 text-dark-400 hover:bg-dark-100'}`}
            >
              {tab === 'students' && 'الطلاب'}
              {tab === 'sessions' && 'الجلسات'}
              {tab === 'cases' && 'الحالات'}
              {tab === 'plans' && 'خطط الدراسة'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'students' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">الطلاب التابعين</h2>
                {assignedStudents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>الطالب</th>
                          <th>الرقم الجامعي</th>
                          <th>السنة</th>
                          <th>نسبة الحضور</th>
                          <th>حالة الخطر</th>
                          <th>اجراءات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedStudents.map(student => (
                          <tr key={student.id}>
                            <td>{student.full_name}</td>
                            <td>{student.student_code}</td>
                            <td>{student.year}</td>
                            <td>{student.attendance_rate ? `${student.attendance_rate}%` : '-'}</td>
                            <td>{getRiskBadge(student.risk_level)}</td>
                            <td>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => { setSelectedStudent(student); setShowSessionModal(true); }}
                                  className="btn-primary text-sm py-1 px-2"
                                >
                                  <Calendar size={14} />
                                </button>
                                <button
                                  onClick={() => { setSelectedStudent(student); setShowCaseModal(true); }}
                                  className="btn-secondary text-sm py-1 px-2"
                                >
                                  <AlertTriangle size={14} />
                                </button>
                                <button
                                  onClick={() => createStudyPlan(student)}
                                  className="btn-secondary text-sm py-1 px-2"
                                >
                                  <BookOpen size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا يوجد طلاب تابعين</p>
                )}
              </div>
            )}

            {activeTab === 'sessions' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">الجلسات الارشادية</h2>
                {sessions.length > 0 ? (
                  <div className="space-y-4">
                    {sessions.map(session => (
                      <div key={session.id} className="p-4 bg-dark-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-bold">{session.student_name}</h3>
                            <p className="text-dark-400 text-sm">{session.student_code}</p>
                          </div>
                          <span className={`badge ${session.status === 'COMPLETED' ? 'badge-success' : session.status === 'SCHEDULED' ? 'badge-warning' : 'badge-danger'}`}>
                            {session.status === 'COMPLETED' ? 'مكتملة' : session.status === 'SCHEDULED' ? 'مجدولة' : 'ملغاة'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-dark-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {new Date(session.scheduled_at).toLocaleString('ar-EG')}
                          </span>
                          <span>{session.duration_minutes} دقيقة</span>
                        </div>
                        {session.status === 'SCHEDULED' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedStudent(assignedStudents.find(s => s.id === session.student_id) || null);
                                setShowSessionModal(true);
                              }}
                              className="btn-primary text-sm"
                            >
                              تعديل
                            </button>
                          </div>
                        )}
                        {session.summary && (
                          <div className="mt-3 p-3 bg-dark-300 rounded">
                            <p className="text-sm font-bold mb-1">ملخص:</p>
                            <p className="text-dark-400 text-sm">{session.summary}</p>
                          </div>
                        )}
                        {session.recommendations && (
                          <div className="mt-2 p-3 bg-dark-300 rounded">
                            <p className="text-sm font-bold mb-1">التوصيات:</p>
                            <p className="text-dark-400 text-sm">{session.recommendations}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا توجد جلسات</p>
                )}
              </div>
            )}

            {activeTab === 'cases' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">الحالات</h2>
                {cases.length > 0 ? (
                  <div className="space-y-4">
                    {cases.map(caseItem => (
                      <div key={caseItem.id} className="p-4 bg-dark-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-bold">{caseItem.title}</h3>
                            <p className="text-dark-400 text-sm">{caseItem.student_name} - {caseItem.student_code}</p>
                          </div>
                          <div className="flex gap-2">
                            <span className={`badge ${caseItem.priority === 'HIGH' || caseItem.priority === 'URGENT' ? 'badge-danger' : 'badge-warning'}`}>
                              {caseItem.priority}
                            </span>
                            <span className={`badge ${caseItem.status === 'OPEN' ? 'badge-danger' : caseItem.status === 'ONGOING' ? 'badge-warning' : 'badge-success'}`}>
                              {caseItem.status === 'OPEN' ? 'مفتوحة' : caseItem.status === 'ONGOING' ? 'قيد التنفيذ' : 'مغلقة'}
                            </span>
                          </div>
                        </div>
                        {caseItem.description && (
                          <p className="text-dark-400 text-sm mb-2">{caseItem.description}</p>
                        )}
                        {caseItem.course_name && (
                          <p className="text-primary text-sm">المقرر: {caseItem.course_name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-dark-400 text-center py-8">لا توجد حالات</p>
                )}
              </div>
            )}

            {activeTab === 'plans' && (
              <div className="card">
                <h2 className="text-xl font-bold mb-4">خطط الدراسة</h2>
                <p className="text-dark-400 text-center py-8">اختر طالباً لعرض خططه الدراسية</p>
              </div>
            )}
          </>
        )}
      </main>

      {showSessionModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">جدولة جلسة ارشادية</h2>
              <button onClick={() => { setShowSessionModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-400 mb-4">الطالب: {selectedStudent.full_name}</p>
            <div className="space-y-4">
              <div>
                <label className="label">تاريخ ووقت الجلسة</label>
                <input
                  type="datetime-local"
                  value={sessionForm.scheduledAt}
                  onChange={e => setSessionForm({ ...sessionForm, scheduledAt: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">مدة الجلسة (دقيقة)</label>
                <input
                  type="number"
                  value={sessionForm.durationMinutes}
                  onChange={e => setSessionForm({ ...sessionForm, durationMinutes: parseInt(e.target.value) })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">نوع الجلسة</label>
                <select
                  value={sessionForm.sessionType}
                  onChange={e => setSessionForm({ ...sessionForm, sessionType: e.target.value })}
                  className="input-field"
                >
                  <option value="FOLLOW_UP">متابعة</option>
                  <option value="INITIAL">أولية</option>
                  <option value="CRISIS">أزمة</option>
                </select>
              </div>
              <div>
                <label className="label">المكان</label>
                <input
                  type="text"
                  value={sessionForm.location}
                  onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                  className="input-field"
                  placeholder="مكتب 101"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={createSession} className="btn-primary flex-1">جدولة</button>
              <button onClick={() => { setShowSessionModal(false); setSelectedStudent(null); }} className="btn-secondary">الغاء</button>
            </div>
          </div>
        </div>
      )}

      {showCaseModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">انشاء حالة جديدة</h2>
              <button onClick={() => { setShowCaseModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-400 mb-4">الطالب: {selectedStudent.full_name}</p>
            <div className="space-y-4">
              <div>
                <label className="label">عنوان الحالة</label>
                <input
                  type="text"
                  value={caseForm.title}
                  onChange={e => setCaseForm({ ...caseForm, title: e.target.value })}
                  className="input-field"
                  placeholder="مثال: ضعف في نسبة الحضور"
                />
              </div>
              <div>
                <label className="label">الوصف</label>
                <textarea
                  value={caseForm.description}
                  onChange={e => setCaseForm({ ...caseForm, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>
              <div>
                <label className="label">نوع الحالة</label>
                <select
                  value={caseForm.caseType}
                  onChange={e => setCaseForm({ ...caseForm, caseType: e.target.value })}
                  className="input-field"
                >
                  <option value="GENERAL">عامة</option>
                  <option value="ATTENDANCE">حضور</option>
                  <option value="ACADEMIC">أكاديمية</option>
                  <option value="BEHAVIORAL">سلوكية</option>
                </select>
              </div>
              <div>
                <label className="label">الأولوية</label>
                <select
                  value={caseForm.priority}
                  onChange={e => setCaseForm({ ...caseForm, priority: e.target.value })}
                  className="input-field"
                >
                  <option value="LOW">منخفضة</option>
                  <option value="MEDIUM">متوسطة</option>
                  <option value="HIGH">عالية</option>
                  <option value="URGENT">عاجلة</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={createCase} className="btn-primary flex-1">انشاء</button>
              <button onClick={() => { setShowCaseModal(false); setSelectedStudent(null); }} className="btn-secondary">الغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
