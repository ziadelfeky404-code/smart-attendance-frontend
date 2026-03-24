'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { riskApi, caseApi, advisingApi, AtRiskStudent, RiskStats, CaseStats, Advisor } from '@/lib/api';
import { AlertTriangle, Users, TrendingUp, Shield, XCircle, AlertCircle, CheckCircle, Eye, Plus, RefreshCw, X } from 'lucide-react';

export default function AdminRiskPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [stats, setStats] = useState<RiskStats | null>(null);
  const [caseStats, setCaseStats] = useState<CaseStats | null>(null);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [caseForm, setCaseForm] = useState({ title: '', description: '', caseType: 'ATTENDANCE', priority: 'HIGH', assignedAdvisorId: '' });

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [riskRes, statsRes, caseStatsRes, advisorRes] = await Promise.allSettled([
        riskApi.getAtRiskStudents(),
        riskApi.getRiskStats(),
        caseApi.getStats(),
        advisingApi.getAdvisors()
      ]);

      const riskResult = riskRes.status === 'fulfilled' ? riskRes.value : null;
      const statsResult = statsRes.status === 'fulfilled' ? statsRes.value : null;
      const caseResult = caseStatsRes.status === 'fulfilled' ? caseStatsRes.value : null;
      const advisorResult = advisorRes.status === 'fulfilled' ? advisorRes.value : null;

      if (riskResult?.success && riskResult.data) setAtRiskStudents(riskResult.data.students);
      if (statsResult?.success && statsResult.data) setStats(statsResult.data);
      if (caseResult?.success && caseResult.data) setCaseStats(caseResult.data);
      if (advisorResult?.success && advisorResult.data) setAdvisors(advisorResult.data.advisors);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeStudent = async (studentId: string, courseId?: string) => {
    try {
      await riskApi.analyzeStudent(studentId, courseId);
      loadData();
    } catch (error) {
      console.error('Failed to analyze student:', error);
    }
  };

  const createCase = async () => {
    if (!selectedStudent || !caseForm.title) return;
    try {
      await caseApi.create({
        studentId: selectedStudent.student_id,
        courseId: selectedStudent.course_id,
        title: caseForm.title,
        description: caseForm.description,
        caseType: caseForm.caseType,
        priority: caseForm.priority,
        assignedAdvisorId: caseForm.assignedAdvisorId || undefined,
        riskLevel: selectedStudent.risk_level
      });
      setShowCaseModal(false);
      setSelectedStudent(null);
      setCaseForm({ title: '', description: '', caseType: 'ATTENDANCE', priority: 'HIGH', assignedAdvisorId: '' });
      loadData();
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const assignAdvisor = async (studentId: string, advisorId: string) => {
    try {
      await advisingApi.assignStudent({ studentId, advisorId });
      setShowAssignModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to assign advisor:', error);
    }
  };

  const filteredStudents = filter === 'ALL' 
    ? atRiskStudents 
    : atRiskStudents.filter(s => s.risk_level === filter);

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <XCircle size={20} className="text-red-500" />;
      case 'WARNING': return <AlertTriangle size={20} className="text-yellow-500" />;
      default: return <CheckCircle size={20} className="text-green-500" />;
    }
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL': return <span className="badge badge-danger">خطر</span>;
      case 'WARNING': return <span className="badge badge-warning">تحذير</span>;
      default: return <span className="badge badge-success">جيد</span>;
    }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black mb-2">رصد المخاطر</h1>
            <p className="text-dark-400">نظام الانذار المبكر والارشاد الاكاديمي</p>
          </div>
          <button onClick={loadData} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} />
            تحديث
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <div className="card border-red-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-red-500/20 text-red-500">
                    <XCircle size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{stats?.critical || 0}</div>
                    <p className="text-dark-400 text-sm">حرج</p>
                  </div>
                </div>
              </div>
              <div className="card border-yellow-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-500">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{stats?.warning || 0}</div>
                    <p className="text-dark-400 text-sm">تحذير</p>
                  </div>
                </div>
              </div>
              <div className="card border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-green-500/20 text-green-500">
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{stats?.good || 0}</div>
                    <p className="text-dark-400 text-sm">جيد</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{caseStats?.open || 0}</div>
                    <p className="text-dark-400 text-sm">حالات مفتوحة</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 text-primary">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <div className="text-2xl font-black">{stats?.averageAttendance?.toFixed(1) || 0}%</div>
                    <p className="text-dark-400 text-sm">متوسط الحضور</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {(['ALL', 'CRITICAL', 'WARNING'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg transition-colors ${filter === f ? 'bg-primary text-dark' : 'bg-dark-200 text-dark-400 hover:bg-dark-100'}`}
                >
                  {f === 'ALL' ? 'الكل' : f === 'CRITICAL' ? 'حرج' : 'تحذير'}
                </button>
              ))}
            </div>

            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                الطلاب في خطر
              </h2>
              {filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>الرقم الجامعي</th>
                        <th>المقرر</th>
                        <th>نسبة الحضور</th>
                        <th>غياب متتالي</th>
                        <th>الحالة</th>
                        <th>اخر تحديث</th>
                        <th>اجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => (
                        <tr key={`${student.student_id}-${student.course_id}-${idx}`}>
                          <td>{student.student_name}</td>
                          <td>{student.student_code}</td>
                          <td>{student.course_name}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-dark-300 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${student.risk_level === 'CRITICAL' ? 'bg-red-500' : 'bg-yellow-500'}`}
                                  style={{ width: `${student.attendance_rate}%` }}
                                />
                              </div>
                              <span>{student.attendance_rate}%</span>
                            </div>
                          </td>
                          <td>{student.absence_streak}</td>
                          <td>{getRiskBadge(student.risk_level)}</td>
                          <td className="text-dark-400 text-sm">{new Date(student.last_updated).toLocaleDateString('ar-EG')}</td>
                          <td>
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setSelectedStudent(student); setShowCaseModal(true); }}
                                className="btn-primary text-sm py-1 px-2"
                                title="انشاء حالة"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                onClick={() => analyzeStudent(student.student_id, student.course_id)}
                                className="btn-secondary text-sm py-1 px-2"
                                title="اعادة تحليل"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button
                                onClick={() => { setSelectedStudent(student); setShowAssignModal(true); }}
                                className="btn-secondary text-sm py-1 px-2"
                                title="تعيين مرشد"
                              >
                                <Users size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">لا يوجد طلاب في خطر</p>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-xl font-bold mb-4">توزيع الحالات</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>مفتوحة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-dark-300 rounded-full h-2">
                        <div className="h-2 rounded-full bg-red-500" style={{ width: `${caseStats ? (caseStats.open / Math.max(caseStats.total, 1)) * 100 : 0}%` }} />
                      </div>
                      <span>{caseStats?.open || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>قيد التنفيذ</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-dark-300 rounded-full h-2">
                        <div className="h-2 rounded-full bg-yellow-500" style={{ width: `${caseStats ? (caseStats.ongoing / Math.max(caseStats.total, 1)) * 100 : 0}%` }} />
                      </div>
                      <span>{caseStats?.ongoing || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>مغلقة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-dark-300 rounded-full h-2">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: `${caseStats ? (caseStats.resolved / Math.max(caseStats.total, 1)) * 100 : 0}%` }} />
                      </div>
                      <span>{caseStats?.resolved || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold mb-4">توزيع حسب الاولوية</h2>
                <div className="space-y-3">
                  {caseStats?.byPriority && Object.entries(caseStats.byPriority).map(([priority, count]) => (
                    <div key={priority} className="flex justify-between items-center">
                      <span className={`badge ${priority === 'URGENT' ? 'badge-danger' : priority === 'HIGH' ? 'badge-danger' : priority === 'MEDIUM' ? 'badge-warning' : 'badge-success'}`}>
                        {priority}
                      </span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showCaseModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">انشاء حالة جديدة</h2>
              <button onClick={() => { setShowCaseModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-400 mb-4">الطالب: {selectedStudent.student_name}</p>
            <div className="space-y-4">
              <div>
                <label className="label">عنوان الحالة</label>
                <input
                  type="text"
                  value={caseForm.title}
                  onChange={e => setCaseForm({ ...caseForm, title: e.target.value })}
                  className="input-field"
                  placeholder={`تحسن حاجة: ${selectedStudent.student_name}`}
                />
              </div>
              <div>
                <label className="label">الوصف</label>
                <textarea
                  value={caseForm.description}
                  onChange={e => setCaseForm({ ...caseForm, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="تفاصيل الحالة..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">نوع الحالة</label>
                  <select value={caseForm.caseType} onChange={e => setCaseForm({ ...caseForm, caseType: e.target.value })} className="input-field">
                    <option value="ATTENDANCE">حضور</option>
                    <option value="ACADEMIC">اكاديمية</option>
                    <option value="BEHAVIORAL">سلوكية</option>
                    <option value="GENERAL">عامة</option>
                  </select>
                </div>
                <div>
                  <label className="label">الاولوية</label>
                  <select value={caseForm.priority} onChange={e => setCaseForm({ ...caseForm, priority: e.target.value })} className="input-field">
                    <option value="LOW">منخفضة</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="HIGH">عالية</option>
                    <option value="URGENT">عاجلة</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">المرشد المسؤول</label>
                <select value={caseForm.assignedAdvisorId} onChange={e => setCaseForm({ ...caseForm, assignedAdvisorId: e.target.value })} className="input-field">
                  <option value="">اختر مرشد...</option>
                  {advisors.map(advisor => (
                    <option key={advisor.id} value={advisor.id}>{advisor.doctor_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={createCase} className="btn-primary flex-1">انشاء الحالة</button>
              <button onClick={() => { setShowCaseModal(false); setSelectedStudent(null); }} className="btn-secondary">الغاء</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">تعيين مرشد اكاديمي</h2>
              <button onClick={() => { setShowAssignModal(false); setSelectedStudent(null); }} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <p className="text-dark-400 mb-4">الطالب: {selectedStudent.student_name}</p>
            <div className="space-y-2">
              {advisors.length > 0 ? (
                advisors.map(advisor => (
                  <button
                    key={advisor.id}
                    onClick={() => assignAdvisor(selectedStudent.student_id, advisor.id)}
                    className="w-full p-3 bg-dark-200 hover:bg-dark-100 rounded-lg text-right transition-colors"
                  >
                    <div className="font-bold">{advisor.doctor_name}</div>
                    <div className="text-dark-400 text-sm">{advisor.specialization}</div>
                    <div className="text-dark-500 text-xs mt-1">
                      {advisor.current_students}/{advisor.max_students} طلاب
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-dark-400 text-center py-4">لا يوجد مرشدين متاحين</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
