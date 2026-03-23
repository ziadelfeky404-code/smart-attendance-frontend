'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { studentApi, AttendanceRecord, StudentSummary } from '@/lib/api';
import { TrendingUp, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'STUDENT') { router.push('/'); return; }
    loadData();
  }, [user, router, page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        studentApi.mySummary(),
        studentApi.myHistory({ page: String(page), limit: '20' }),
      ]);
      if (summaryRes.success && summaryRes.data) setSummary(summaryRes.data);
      if (historyRes.success && historyRes.data) { setRecords(historyRes.data.records); setTotal(historyRes.data.total); }
    } catch {} finally { setLoading(false); }
  };

  if (user?.role !== 'STUDENT') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
          <p className="text-dark-400">مرحباً، {user.fullName}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : summary ? (
          <>
            <div className="card mb-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-primary" /> نسبة الحضور</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center" style={{ borderColor: summary.presentRate >= 75 ? '#10B981' : summary.presentRate >= 50 ? '#F59E0B' : '#EF4444' }}>
                  <span className="text-3xl font-black" style={{ color: summary.presentRate >= 75 ? '#10B981' : summary.presentRate >= 50 ? '#F59E0B' : '#EF4444' }}>{summary.presentRate}%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                  <div className="text-center"><p className="text-success text-2xl font-black">{summary.present}</p><p className="text-dark-400 text-sm">حضور</p></div>
                  <div className="text-center"><p className="text-danger text-2xl font-black">{summary.absent}</p><p className="text-dark-400 text-sm">غياب</p></div>
                  <div className="text-center"><p className="text-warning text-2xl font-black">{summary.late}</p><p className="text-dark-400 text-sm">تأخير</p></div>
                  <div className="text-center"><p className="text-primary text-2xl font-black">{summary.totalSessions}</p><p className="text-dark-400 text-sm">الإجمالي</p></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {summary.sections.map(s => (
                <div key={s.sectionId} className="card">
                  <p className="font-bold mb-1">{s.courseName}</p>
                  <p className="text-dark-400 text-sm mb-3">{s.sectionName}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-dark-300 rounded-full overflow-hidden">
                      <div className="h-full bg-success rounded-full" style={{ width: `${s.presentRate}%` }} />
                    </div>
                    <span className="font-bold text-sm">{s.presentRate}%</span>
                  </div>
                  <p className="text-dark-400 text-xs mt-1">{s.totalSessions} جلسة</p>
                </div>
              ))}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-4">آخر سجلات الحضور</h2>
              <div className="table-wrapper">
                <table className="table">
                  <thead><tr><th>المقرر</th><th>الحالة</th><th>المسافة</th><th>التاريخ</th></tr></thead>
                  <tbody>
                    {records.length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-dark-400">لا يوجد سجلات</td></tr>
                     : records.map(r => (
                      <tr key={r.id}>
                        <td>{r.course_name || r.section_name}</td>
                        <td><span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span></td>
                        <td>{r.distance_meters ? `${r.distance_meters}m` : '-'}</td>
                        <td>{new Date(r.attended_at).toLocaleString('ar-EG')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
                <span className="px-4 text-dark-400">صفحة {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={records.length < 20} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-dark-400">فشل تحميل البيانات</div>
        )}
      </main>
    </div>
  );
}
