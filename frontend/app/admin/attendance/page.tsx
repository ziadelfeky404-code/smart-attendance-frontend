'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, AttendanceRecord } from '@/lib/api';
import { Search, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', dateFrom: '', dateTo: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('PRESENT');

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'DOCTOR') { router.push('/'); return; }
    loadAttendance();
  }, [user, router, page, filters]);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filters.status) params.status = filters.status;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await adminApi.attendance.list(params);
      if (res.success && res.data) { setRecords(res.data.records); setTotal(res.data.total); }
    } catch { } finally { setLoading(false); }
  };

  const handleEdit = async () => {
    if (!editId) return;
    try {
      await adminApi.attendance.update(editId, { status: editStatus, reason: 'تم التعديل من لوحة الإدارة' });
      setEditId(null);
      loadAttendance();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'DOCTOR')) return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">سجل الحضور</h1><p className="text-dark-400">إجمالي {total} سجل</p></div>
        <div className="card mb-6">
          <div className="flex flex-wrap gap-4">
            <select value={filters.status} onChange={e => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="input-field w-auto">
              <option value="">كل الحالات</option>
              <option value="PRESENT">حاضر</option><option value="ABSENT">غائب</option><option value="LATE">متأخر</option><option value="EXCUSED">معذور</option>
            </select>
            <input type="date" value={filters.dateFrom} onChange={e => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1); }} className="input-field w-auto" />
            <input type="date" value={filters.dateTo} onChange={e => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1); }} className="input-field w-auto" />
          </div>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الطالب</th><th>المقرر</th><th>الشعبة</th><th>الدكتور</th><th>الحالة</th><th>المسافة</th><th>التاريخ</th><th></th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : records.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-dark-400">لا يوجد سجلات</td></tr>
               : records.map((r, i) => (
                <tr key={r.id}>
                  <td>{(page - 1) * 20 + i + 1}</td>
                  <td>{r.student_name}<br /><span className="text-dark-400 text-xs">{r.student_code}</span></td>
                  <td>{r.course_name}</td>
                  <td>{r.section_name}</td>
                  <td>{r.doctor_name}</td>
                  <td><span className={`badge ${r.status === 'PRESENT' ? 'badge-success' : r.status === 'ABSENT' ? 'badge-danger' : r.status === 'LATE' ? 'badge-warning' : 'badge-info'}`}>{r.status}</span></td>
                  <td>{r.distance_meters ? `${r.distance_meters}m` : '-'}</td>
                  <td>{new Date(r.attended_at).toLocaleString('ar-EG')}</td>
                  <td><button onClick={() => { setEditId(r.id); setEditStatus(r.status); }} className="btn-secondary p-1.5"><Edit2 size={14} /></button></td>
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

      {editId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setEditId(null)}>
          <div className="card w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">تعديل الحالة</h2>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="input-field mb-4">
              <option value="PRESENT">حاضر</option><option value="ABSENT">غائب</option><option value="LATE">متأخر</option><option value="EXCUSED">معذور</option>
            </select>
            <div className="flex gap-3">
              <button onClick={handleEdit} className="btn-primary flex-1">حفظ</button>
              <button onClick={() => setEditId(null)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
