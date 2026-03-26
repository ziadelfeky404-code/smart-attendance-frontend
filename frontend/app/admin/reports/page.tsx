'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, StudentReport, DoctorReport } from '@/lib/api';
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'students' | 'doctors'>('students');
  const [studentReports, setStudentReports] = useState<StudentReport[]>([]);
  const [doctorReports, setDoctorReports] = useState<DoctorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'DOCTOR') { router.push('/'); return; }
    if (tab === 'students') loadStudentReports();
    else loadDoctorReports();
  }, [user, router, tab, page]);

  const loadStudentReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.reports.studentAttendance({ page: String(page), limit: '20' });
      if (res.success && res.data) setStudentReports(res.data.students);
    } catch { } finally { setLoading(false); }
  };

  const loadDoctorReports = async () => {
    setLoading(true);
    try {
      const res = await adminApi.reports.doctorPerformance({ page: String(page), limit: '20' });
      if (res.success && res.data) setDoctorReports(res.data.doctors);
    } catch { } finally { setLoading(false); }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'DOCTOR')) return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">التقارير</h1></div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => { setTab('students'); setPage(1); }} className={`px-6 py-3 rounded-xl font-medium transition-colors ${tab === 'students' ? 'bg-primary text-dark' : 'card hover:border-primary/30'}`}>تقرير الطلاب</button>
          <button onClick={() => { setTab('doctors'); setPage(1); }} className={`px-6 py-3 rounded-xl font-medium transition-colors ${tab === 'doctors' ? 'bg-primary text-dark' : 'card hover:border-primary/30'}`}>أداء الأطباء</button>
        </div>

        {tab === 'students' ? (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>الطالب</th><th>الكود</th><th>الحضور</th><th>الغياب</th><th>التأخير</th><th>نسبة الحضور</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
                 : studentReports.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-dark-400">لا يوجد بيانات</td></tr>
                 : studentReports.map((s, i) => (
                  <tr key={s.studentId}>
                    <td>{(page - 1) * 20 + i + 1}</td>
                    <td className="font-medium">{s.fullName}</td>
                    <td className="font-mono text-sm">{s.studentCode}</td>
                    <td className="text-success">{s.present}</td>
                    <td className="text-danger">{s.absent}</td>
                    <td className="text-warning">{s.late}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-dark-300 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.presentRate >= 75 ? 'bg-success' : s.presentRate >= 50 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${s.presentRate}%` }} />
                        </div>
                        <span className={`font-bold ${s.presentRate >= 75 ? 'text-success' : s.presentRate >= 50 ? 'text-warning' : 'text-danger'}`}>{s.presentRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>#</th><th>الدكتور</th><th>القسم</th><th>الشعب</th><th>الجلسات</th><th>الحضور</th><th>نسبة الحضور</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
                 : doctorReports.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-dark-400">لا يوجد بيانات</td></tr>
                 : doctorReports.map((d, i) => (
                  <tr key={d.doctorId}>
                    <td>{i + 1}</td>
                    <td className="font-medium">{d.doctorName}</td>
                    <td>{d.department || '-'}</td>
                    <td>{d.totalSections}</td>
                    <td>{d.totalSessions}</td>
                    <td>{d.totalAttendance}</td>
                    <td><span className={`font-bold ${d.avgAttendanceRate >= 75 ? 'text-success' : d.avgAttendanceRate >= 50 ? 'text-warning' : 'text-danger'}`}>{d.avgAttendanceRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          <span className="px-4 text-dark-400">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
        </div>
      </main>
    </div>
  );
}
