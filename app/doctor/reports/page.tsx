'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, StudentReport } from '@/lib/api';
import { TrendingUp } from 'lucide-react';

export default function DoctorReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    adminApi.reports.studentAttendance({ limit: '50' }).then(res => {
      if (res.success && res.data) setReports(res.data.students);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">تقارير الطلاب</h1></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الطالب</th><th>الكود</th><th>حضور</th><th>غياب</th><th>النسبة</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : reports.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا يوجد</td></tr>
               : reports.map((r, i) => (
                <tr key={r.studentId}>
                  <td>{i + 1}</td><td>{r.fullName}</td><td>{r.studentCode}</td>
                  <td className="text-success">{r.present}</td><td className="text-danger">{r.absent}</td>
                  <td><span className={`font-bold ${r.presentRate >= 75 ? 'text-success' : r.presentRate >= 50 ? 'text-warning' : 'text-danger'}`}>{r.presentRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
