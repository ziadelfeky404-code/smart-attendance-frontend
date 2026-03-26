'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, AttendanceRecord } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DoctorAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    adminApi.attendance.list({ page: String(page), limit: '20', doctor_id: user!.id }).then(res => {
      if (res.success && res.data) setRecords(res.data.records);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router, page]);

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">الحضور</h1></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الطالب</th><th>المقرر</th><th>الحالة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : records.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-dark-400">لا يوجد</td></tr>
               : records.map((r, i) => (
                <tr key={r.id}>
                  <td>{(page - 1) * 20 + i + 1}</td>
                  <td>{r.student_name}</td>
                  <td>{r.course_name}</td>
                  <td><span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span></td>
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
