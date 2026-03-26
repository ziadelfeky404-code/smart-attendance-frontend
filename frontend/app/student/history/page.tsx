'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { studentApi, AttendanceRecord } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function StudentHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'STUDENT') { router.push('/'); return; }
    loadHistory();
  }, [user, router, page]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await studentApi.myHistory({ page: String(page), limit: '20' });
      if (res.success && res.data) { setRecords(res.data.records); setTotal(res.data.total); }
    } catch {} finally { setLoading(false); }
  };

  if (user?.role !== 'STUDENT') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">سجل الحضور</h1><p className="text-dark-400">إجمالي {total} سجل</p></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>المقرر</th><th>الحالة</th><th>المسافة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : records.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-dark-400">لا يوجد سجلات</td></tr>
               : records.map((r, i) => (
                <tr key={r.id}>
                  <td>{(page - 1) * 20 + i + 1}</td>
                  <td>{r.course_name || r.section_name}</td>
                  <td><span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>{r.status}</span></td>
                  <td>{r.distance_meters ? `${r.distance_meters}m` : '-'}</td>
                  <td>{new Date(r.attended_at).toLocaleString('ar-EG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          <span className="px-4 text-dark-400">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={records.length < 20} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
        </div>
      </main>
    </div>
  );
}
