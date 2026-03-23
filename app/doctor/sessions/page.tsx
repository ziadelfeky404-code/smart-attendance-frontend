'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Session } from '@/lib/api';
import { QrCode, Lock, Eye } from 'lucide-react';

export default function DoctorSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    adminApi.lectures.sessions({ limit: '100' }).then(res => {
      if (res.success && res.data) setSessions(res.data.sessions);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">الجلسات</h1></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الحالة</th><th>تاريخ الفتح</th><th>تاريخ الانتهاء</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={4} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : sessions.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-dark-400">لا توجد جلسات</td></tr>
               : sessions.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : s.status === 'EXPIRED' ? 'badge-warning' : 'badge-danger'}`}>{s.status}</span></td>
                  <td>{new Date(s.opened_at).toLocaleString('ar-EG')}</td>
                  <td>{s.expires_at ? new Date(s.expires_at).toLocaleString('ar-EG') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
