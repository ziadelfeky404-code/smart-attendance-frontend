'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Session, AttendanceRecord } from '@/lib/api';
import { QrCode, Lock, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LecturesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [qrSession, setQrSession] = useState<{ qr_token: string; expires_at: string } | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'DOCTOR') { router.push('/'); return; }
    loadSessions();
  }, [user, router, page]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await adminApi.lectures.sessions({ page: String(page), limit: '10' });
      if (res.success && res.data) setSessions(res.data.sessions);
    } catch { } finally { setLoading(false); }
  };

  const handleOpenSession = async (sectionId: string) => {
    try {
      const res = await adminApi.lectures.openSession({ section_id: sectionId, gps_radius_meters: 100 });
      if (res.success) loadSessions();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  const handleCloseSession = async (id: string) => {
    try {
      await adminApi.lectures.closeSession(id);
      loadSessions();
    } catch {}
  };

  const showQR = async (id: string) => {
    try {
      const res = await adminApi.lectures.getQR(id);
      if (res.success && res.data) setQrSession(res.data);
    } catch {}
  };

  const showAttendance = async (id: string) => {
    setSelectedSession(id);
    try {
      const res = await adminApi.lectures.attendance(id);
      if (res.success && res.data) setAttendance(res.data);
    } catch {}
  };

  if (!user || (user.role !== 'ADMIN' && user.role !== 'DOCTOR')) return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">إدارة الجلسات</h1><p className="text-dark-400">جلسات الحضور النشطة والمنتهية</p></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الحالة</th><th>تاريخ الفتح</th><th>تاريخ الانتهاء</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : sessions.length === 0 ? <tr><td colSpan={5} className="text-center py-12 text-dark-400">لا يوجد جلسات</td></tr>
               : sessions.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : s.status === 'EXPIRED' ? 'badge-warning' : 'badge-danger'}`}>{s.status === 'ACTIVE' ? 'نشط' : s.status === 'EXPIRED' ? 'منتهي' : 'مغلق'}</span></td>
                  <td>{new Date(s.opened_at).toLocaleString('ar-EG')}</td>
                  <td>{s.expires_at ? new Date(s.expires_at).toLocaleString('ar-EG') : '-'}</td>
                  <td>
                    <div className="flex gap-2">
                      {s.status === 'ACTIVE' && <><button onClick={() => showQR(s.id)} className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"><QrCode size={14} /> QR</button><button onClick={() => handleCloseSession(s.id)} className="btn-danger flex items-center gap-1 text-sm px-3 py-1.5"><Lock size={14} /> إغلاق</button></>}
                      <button onClick={() => showAttendance(s.id)} className="btn-secondary flex items-center gap-1 text-sm px-3 py-1.5"><Eye size={14} /> الحضور</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {qrSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setQrSession(null)}>
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-4">QR Code للحضور</h2>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrSession.qr_token}`} alt="QR Code" className="w-48 h-48" />
            </div>
            <p className="text-dark-400 text-sm mb-2">ينتهي في: {new Date(qrSession.expires_at).toLocaleString('ar-EG')}</p>
            <p className="text-xs text-dark-400 font-mono break-all mb-4">{qrSession.qr_token.substring(0, 40)}...</p>
            <button onClick={() => setQrSession(null)} className="btn-secondary w-full">إغلاق</button>
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setSelectedSession(null)}>
          <div className="card w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">قائمة الحضور</h2>
            {attendance.length === 0 ? <p className="text-dark-400 text-center py-8">لا يوجد حضور</p> : (
              <table className="table">
                <thead><tr><th>الطالب</th><th>الحالة</th><th>المسافة</th><th>الوقت</th></tr></thead>
                <tbody>{attendance.map(a => (
                  <tr key={a.id}>
                    <td>{a.student_name} <span className="text-dark-400 text-xs">{a.student_code}</span></td>
                    <td><span className={`badge ${a.status === 'PRESENT' ? 'badge-success' : a.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                    <td>{a.distance_meters ? `${a.distance_meters}m` : '-'}</td>
                    <td>{new Date(a.attended_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <button onClick={() => setSelectedSession(null)} className="btn-secondary w-full mt-4">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
