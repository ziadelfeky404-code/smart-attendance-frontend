'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Section, Session } from '@/lib/api';
import { QrCode, Lock, Eye } from 'lucide-react';

export default function DoctorSectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    adminApi.sections.list({ doctorId: user!.id, limit: '100' }).then(res => {
      if (res.success && res.data) setSections(res.data.sections);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user, router]);

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6"><h1 className="text-3xl font-black mb-1">شعبتي</h1></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>المقرر</th><th>الشعبة</th><th>الفصل</th><th>الطلاب</th><th>الحالة</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : sections.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا توجد شعب</td></tr>
               : sections.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td><td>{s.course_name}</td><td>{s.name}</td>
                  <td>{s.semester} {s.year}</td>
                  <td>{s.student_count || 0} / {s.max_students}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'نشط' : 'متوقف'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
