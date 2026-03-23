'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Doctor } from '@/lib/api';
import { Plus, Search, Edit2, Trash2, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DoctorsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editDoctor, setEditDoctor] = useState<Doctor | null>(null);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', department: '', title: 'LECTURER', phone: '' });
  const [modalLoading, setModalLoading] = useState(false);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadDoctors();
  }, [user, router, page, search]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await adminApi.doctors.list({ page: String(page), limit: '10', search });
      if (res.success && res.data) {
        setDoctors(res.data.doctors);
        setTotal(res.data.total);
      }
    } catch { } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      if (editDoctor) {
        await adminApi.doctors.update(editDoctor.id, form);
      } else {
        await adminApi.doctors.create(form);
      }
      setShowModal(false);
      setEditDoctor(null);
      setForm({ email: '', password: '', full_name: '', department: '', title: 'LECTURER', phone: '' });
      loadDoctors();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally { setModalLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطبيب؟')) return;
    try { await adminApi.doctors.delete(id); loadDoctors(); } catch {}
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword) return;
    try {
      await adminApi.doctors.resetPassword(resetPasswordId, newPassword);
      setResetPasswordId(null);
      setNewPassword('');
      alert('تم تغيير كلمة المرور بنجاح');
    } catch (err: unknown) { alert((err as Error).message); }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black mb-1">إدارة الأطباء</h1>
            <p className="text-dark-400">إجمالي {total} طبيب</p>
          </div>
          <button onClick={() => { setEditDoctor(null); setForm({ email: '', password: '', full_name: '', department: '', title: 'LECTURER', phone: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> إضافة طبيب
          </button>
        </div>

        <div className="card mb-6">
          <div className="relative max-w-md">
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="ابحث بالاسم أو البريد..." className="input-field pr-12" />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>#</th><th>الاسم</th><th>البريد</th><th>القسم</th><th>المنصب</th><th>الحالة</th><th>الإجراءات</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : doctors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-dark-400">لا يوجد أطباء</td></tr>
              ) : (
                doctors.map((d, i) => (
                  <tr key={d.id}>
                    <td>{(page - 1) * 10 + i + 1}</td>
                    <td className="font-medium">{d.full_name}</td>
                    <td className="text-dark-400">{d.email}</td>
                    <td>{d.department || '-'}</td>
                    <td>{d.title || 'LECTURER'}</td>
                    <td><span className={`badge ${d.is_active ? 'badge-success' : 'badge-danger'}`}>{d.is_active ? 'نشط' : 'متوقف'}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditDoctor(d); setForm({ email: d.email, password: '', full_name: d.full_name, department: d.department || '', title: d.title || 'LECTURER', phone: d.phone || '' }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-dark-200 text-accent"><Edit2 size={16} /></button>
                        <button onClick={() => setResetPasswordId(d.id)} className="p-2 rounded-lg hover:bg-dark-200 text-warning"><KeyRound size={16} /></button>
                        <button onClick={() => handleDelete(d.id)} className="p-2 rounded-lg hover:bg-dark-200 text-danger"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary p-2"><ChevronRight size={18} /></button>
          <span className="px-4 py-2 text-dark-400">صفحة {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={doctors.length < 10} className="btn-secondary p-2"><ChevronLeft size={18} /></button>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="card w-full max-w-lg">
            <h2 className="text-xl font-bold mb-6">{editDoctor ? 'تعديل طبيب' : 'إضافة طبيب جديد'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="label">الاسم الكامل</label><input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="input-field" required /></div>
              <div><label className="label">البريد الإلكتروني</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" required disabled={!!editDoctor} /></div>
              {!editDoctor && <div><label className="label">كلمة المرور</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field" required /></div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">القسم</label><input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input-field" /></div>
                <div><label className="label">المنصب</label><select value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field"><option value="LECTURER">مدرس</option><option value="ASSISTANT_PROFESSOR">أستاذ مساعد</option><option value="ASSOCIATE_PROFESSOR">أستاذ مشارك</option><option value="PROFESSOR">أستاذ</option></select></div>
              </div>
              <div><label className="label">رقم الهاتف</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" /></div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={modalLoading} className="btn-primary flex-1">{modalLoading ? '...' : 'حفظ'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setResetPasswordId(null)}>
          <div className="card w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">إعادة تعيين كلمة المرور</h2>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="كلمة المرور الجديدة" className="input-field mb-4" required />
            <div className="flex gap-3">
              <button onClick={handleResetPassword} className="btn-primary flex-1">تغيير</button>
              <button onClick={() => setResetPasswordId(null)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
