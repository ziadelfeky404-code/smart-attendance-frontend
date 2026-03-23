'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Course, Doctor, Section } from '@/lib/api';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState({ name: '', courseId: '', doctorId: '', semester: 'First', year: '2025', maxStudents: '30' });

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadSections();
    loadOptions();
  }, [user, router, page]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await adminApi.sections.list({ page: String(page), limit: '10' });
      if (res.success && res.data) { setSections(res.data.sections); setTotal(res.data.total); }
    } catch { } finally { setLoading(false); }
  };

  const loadOptions = async () => {
    try {
      const [coursesRes, doctorsRes] = await Promise.all([
        adminApi.courses.list({ limit: '100' }),
        adminApi.doctors.list({ limit: '100' }),
      ]);
      if (coursesRes.success && coursesRes.data) setCourses(coursesRes.data.courses);
      if (doctorsRes.success && doctorsRes.data) setDoctors(doctorsRes.data.doctors);
    } catch { }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.sections.create({ ...form, year: Number(form.year), max_students: Number(form.maxStudents) });
      setShowModal(false);
      setForm({ name: '', courseId: '', doctorId: '', semester: 'First', year: '2025', maxStudents: '30' });
      loadSections();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-black mb-1">إدارة الشعب</h1><p className="text-dark-400">إجمالي {total} شعبة</p></div>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> إضافة شعبة</button>
        </div>
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الشعبة</th><th>المقرر</th><th>الدكتور</th><th>الفصل</th><th>الطلاب</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : sections.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا يوجد شعب</td></tr>
               : sections.map((s, i) => (
                <tr key={s.id}>
                  <td>{(page - 1) * 10 + i + 1}</td>
                  <td className="font-medium">{s.name}</td>
                  <td>{s.course_name}</td>
                  <td>{s.doctor_name}</td>
                  <td>{s.semester} {s.year}</td>
                  <td>{s.student_count || 0} / {s.max_students}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          <span className="px-4 text-dark-400">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={sections.length < 10} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card w-full max-w-lg">
            <h2 className="text-xl font-bold mb-6">إضافة شعبة جديدة</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">اسم الشعبة</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="شعبة أ" required /></div>
              <div>
                <label className="label">المقرر</label>
                <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className="input-field" required>
                  <option value="">اختر المقرر</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div>
                <label className="label">الدكتور</label>
                <select value={form.doctorId} onChange={e => setForm({ ...form, doctorId: e.target.value })} className="input-field" required>
                  <option value="">اختر الدكتور</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">الفصل</label><select value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="input-field"><option value="First">الأول</option><option value="Second">الثاني</option></select></div>
                <div><label className="label">السنة</label><input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input-field" required /></div>
              </div>
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
