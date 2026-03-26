'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Search, Plus, Edit, Trash2, X } from 'lucide-react';

interface Regulation {
  id: string;
  title: string;
  content: string;
  category: string;
  version: string;
  is_active: boolean;
  created_at: string;
}

export default function RegulationsPage() {
  const { user } = useAuth();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Regulation | null>(null);
  const [form, setForm] = useState({ title: '', content: '', category: '' });

  const categories = ['الكل', 'الحضور', 'الانضباط', 'التحويل', 'الدراسة'];

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('https://server-pied-nu.vercel.app/api/regulations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRegulations(data.data || []);
    } catch (error) {
      console.error('Error loading regulations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const url = editing 
        ? `https://server-pied-nu.vercel.app/api/regulations/${editing.id}`
        : 'https://server-pied-nu.vercel.app/api/regulations';
      const method = editing ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        loadRegulations();
        setShowModal(false);
        setEditing(null);
        setForm({ title: '', content: '', category: '' });
      }
    } catch (error) {
      console.error('Error saving regulation:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه اللائحة؟')) return;
    try {
      const token = localStorage.getItem('accessToken');
      await fetch(`https://server-pied-nu.vercel.app/api/regulations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadRegulations();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const filtered = regulations.filter(r => {
    const matchSearch = r.title.includes(search) || r.content.includes(search);
    const matchCategory = selectedCategory === 'الكل' || r.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black mb-2">الوائح والقوانين</h1>
            <p className="text-dark-400">إدارة لوائح وقوانين الجامعة</p>
          </div>
          <button onClick={() => { setEditing(null); setForm({ title: '', content: '', category: 'الحضور' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> إضافة لائحة
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث..." className="input-field pr-12 w-full" />
          </div>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="input-field">
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="card text-center py-12 text-dark-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>لا توجد لوائح</p>
            </div>
          ) : filtered.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-bold mb-1">{r.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary">{r.category}</span>
                    <span className="text-xs text-dark-400">الإصدار {r.version}</span>
                  </div>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(r); setForm({ title: r.title, content: r.content, category: r.category }); setShowModal(true); }} className="p-2 rounded-lg hover:bg-dark-200">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-danger/10 text-danger">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-dark-400 text-sm whitespace-pre-wrap">{r.content}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{editing ? 'تعديل اللائحة' : 'إضافة لائحة جديدة'}</h2>
                <button onClick={() => setShowModal(false)}><X size={24} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">العنوان</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} className="input-field w-full" required />
                </div>
                <div>
                  <label className="label">التصنيف</label>
                  <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="input-field w-full">
                    <option value="الحضور">الحضور</option>
                    <option value="الانضباط">الانضباط</option>
                    <option value="التحويل">التحويل</option>
                    <option value="الدراسة">الدراسة</option>
                  </select>
                </div>
                <div>
                  <label className="label">المحتوى</label>
                  <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} className="input-field w-full h-32 resize-none" required />
                </div>
                <button type="submit" className="btn-primary w-full">حفظ</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
