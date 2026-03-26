'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Course } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', description: '', credits: '3', doctorId: '' });

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadCourses();
  }, [user, router, page, search]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await adminApi.courses.list({ page: String(page), limit: '10', search });
      if (res.success && res.data) { setCourses(res.data.courses); setTotal(res.data.total); }
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.courses.create({ ...form, credits: Number(form.credits), doctor_id: form.doctorId || undefined });
      setShowModal(false);
      setForm({ name: '', code: '', description: '', credits: '3', doctorId: '' });
      loadCourses();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-black mb-1">إدارة المقررات</h1><p className="text-dark-400">إجمالي {total} مقرر</p></div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> إضافة مقرر</button>
        </div>
        <div className="card mb-6"><div className="relative max-w-md"><Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" /><input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث بالمقرر..." className="input-field pr-12" /></div></div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الكود</th><th>الاسم</th><th>الوحدات</th><th>الدكتور</th><th>الحالة</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : courses.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا يوجد مقررات</td></tr>
               : courses.map((c, i) => (
                <tr key={c.id}>
                  <td>{(page - 1) * 10 + i + 1}</td>
                  <td className="font-mono text-sm text-primary">{c.code}</td>
                  <td className="font-medium">{c.name}</td>
                  <td>{c.credits}</td>
                  <td>{c.doctor_name || '-'}</td>
                  <td><span className={`badge ${c.is_active ? 'badge-success' : 'badge-danger'}`}>{c.is_active ? 'نشط' : 'متوقف'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card w-full max-w-lg">
            <h2 className="text-xl font-bold mb-6">إضافة مقرر جديد</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">اسم المقرر</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" required /></div>
              <div><label className="label">كود المقرر</label><input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-field" required /></div>
              <div><label className="label">الوحدات</label><input type="number" value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} className="input-field" min="1" required /></div>
              <div><label className="label">الوصف</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} /></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
