'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Student } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Upload, Send } from 'lucide-react';

export default function StudentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({ student_code: '', email: '', password: '', full_name: '', phone: '', year: '1' });
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadStudents();
  }, [user, router, page, search]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await adminApi.students.list({ page: String(page), limit: '10', search });
      if (res.success && res.data) { setStudents(res.data.students); setTotal(res.data.total); }
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editStudent) {
        await adminApi.students.update(editStudent.id, { full_name: form.full_name, phone: form.phone, year: Number(form.year) });
      } else {
        await adminApi.students.create({ 
          student_code: form.student_code || `STU${Date.now()}`, 
          email: form.email, 
          password: form.password, 
          full_name: form.full_name, 
          phone: form.phone, 
          year: Number(form.year) 
        });
      }
      setShowModal(false);
      setEditStudent(null);
      setForm({ student_code: '', email: '', password: '', full_name: '', phone: '', year: '1' });
      loadStudents();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد؟')) return;
    try { await adminApi.students.delete(id); loadStudents(); } catch {}
  };

  const handleImport = async () => {
    try {
      const rows = importData.trim().split('\n').map(line => {
        const [student_code, email, full_name, year, phone] = line.split(',').map(s => s.trim());
        return { student_code, email, full_name, year: Number(year) || 1, phone };
      });
      const res = await adminApi.students.import(rows);
      setImportResult(res.success && res.data ? res.data : null);
      if (res.success) loadStudents();
    } catch (err: unknown) { alert((err as Error).message); }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-black mb-1">إدارة الطلاب</h1><p className="text-dark-400">إجمالي {total} طالب</p></div>
          <div className="flex gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-2"><Upload size={18} /> استيراد</button>
            <button onClick={() => { setEditStudent(null); setForm({ student_code: '', email: '', password: '', full_name: '', phone: '', year: '1' }); setShowModal(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> إضافة طالب</button>
          </div>
        </div>

        <div className="card mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث بالاسم أو الكود..." className="input-field pr-12" />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الكود</th><th>الاسم</th><th>البريد</th><th>السنة</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
               : students.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-dark-400">لا يوجد طلاب</td></tr>
               : students.map((s, i) => (
                <tr key={s.id}>
                  <td>{(page - 1) * 10 + i + 1}</td>
                  <td className="font-mono text-sm">{s.student_code}</td>
                  <td className="font-medium">{s.full_name}</td>
                  <td className="text-dark-400">{s.email}</td>
                  <td>السنة {s.year}</td>
                  <td><span className={`badge ${s.is_active ? 'badge-success' : 'badge-danger'}`}>{s.is_active ? 'نشط' : 'متوقف'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditStudent(s); setForm({ student_code: s.student_code, email: s.email, password: '', full_name: s.full_name, phone: s.phone || '', year: String(s.year) }); setShowModal(true); }} className="btn-danger p-2"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(s.id)} className="btn-danger p-2"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          <span className="px-4 text-dark-400">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={students.length < 10} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card w-full max-w-lg">
            <h2 className="text-xl font-bold mb-6">{editStudent ? 'تعديل طالب' : 'إضافة طالب جديد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!editStudent && (
                <>
                  <div><label className="label">كود الطالب</label><input type="text" value={form.student_code} onChange={e => setForm({ ...form, student_code: e.target.value })} className="input-field" required /></div>
                  <div><label className="label">البريد الإلكتروني</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required /></div>
                  <div><label className="label">كلمة المرور</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required /></div>
                </>
              )}
              <div><label className="label">الاسم الكامل</label><input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">السنة</label><select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} className="input-field"><option value="1">السنة الأولى</option><option value="2">السنة الثانية</option><option value="3">السنة الثالثة</option><option value="4">السنة الرابعة</option><option value="5">السنة الخامسة</option></select></div>
                <div><label className="label">الهاتف</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowImport(false)}>
          <div className="card w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">استيراد طلاب من CSV</h2>
            <p className="text-dark-400 text-sm mb-4"> التنسيق: student_code, email, full_name, year, phone (سطر واحد لكل طالب)</p>
            <textarea value={importData} onChange={e => setImportData(e.target.value)} rows={10} className="input-field font-mono text-sm mb-4" placeholder="S001, s1@edu.com, أحمد محمد, 1, 0501234567" />
            {importResult && (
              <div className="flex gap-4 mb-4">
                <span className="badge badge-success">تم استيراد: {importResult.imported}</span>
                <span className="badge badge-warning">تم تخطي: {importResult.skipped}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleImport} className="btn-primary flex items-center gap-2"><Upload size={16} /> استيراد</button>
              <button onClick={() => { setShowImport(false); setImportData(''); setImportResult(null); }} className="btn-secondary flex-1">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
