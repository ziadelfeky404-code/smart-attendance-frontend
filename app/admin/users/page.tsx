'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, X, Shield, User, GraduationCap, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  department: string | null;
  createdAt: string;
  student?: { studentId: string } | null;
  doctor?: { doctorId: string } | null;
  teachingAssistant?: { taId: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'STUDENT',
    department: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(pagination.page);
  }, [roleFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setFormData({ email: '', password: '', name: '', role: 'STUDENT', department: '' });
        fetchUsers(pagination.page);
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ في إنشاء المستخدم');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'TOGGLE_ACTIVE' }),
      });

      const data = await response.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !u.isActive } : u))
        );
      }
    } catch (error) {
      console.error('Error toggling user:', error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const styles = {
      SUPER_ADMIN: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      DOCTOR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      TEACHING_ASSISTANT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      STUDENT: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };

    const labels = {
      SUPER_ADMIN: 'مدير النظام',
      DOCTOR: 'دكتور',
      TEACHING_ASSISTANT: 'معيد',
      STUDENT: 'طالب',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm border ${styles[role as keyof typeof styles]}`}>
        {labels[role as keyof typeof labels]}
      </span>
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Shield className="w-5 h-5" />;
      case 'DOCTOR':
        return <GraduationCap className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-500" />
              إدارة المستخدمين
            </h1>
            <p className="text-slate-400 mt-1">إجمالي {pagination.total} مستخدم</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            إضافة مستخدم
          </button>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو البريد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">جميع الأدوار</option>
              <option value="SUPER_ADMIN">مدير النظام</option>
              <option value="DOCTOR">دكتور</option>
              <option value="TEACHING_ASSISTANT">معيد</option>
              <option value="STUDENT">طالب</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">لا توجد مستخدمين</h3>
            <p className="text-slate-400">لم يتم العثور على مستخدمين</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700">
                  <tr>
                    <th className="text-right py-4 px-6">المستخدم</th>
                    <th className="text-right py-4 px-6">الدور</th>
                    <th className="text-right py-4 px-6">القسم</th>
                    <th className="text-right py-4 px-6">الحالة</th>
                    <th className="text-right py-4 px-6">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                            {getRoleIcon(user.role)}
                          </div>
                          <div>
                            <p className="font-semibold">{user.name}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getRoleBadge(user.role)}
                        {user.student && (
                          <p className="text-xs text-slate-400 mt-1">{user.student.studentId}</p>
                        )}
                        {user.doctor && (
                          <p className="text-xs text-slate-400 mt-1">{user.doctor.doctorId}</p>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-400">
                        {user.department || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            user.isActive
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {user.isActive ? 'نشط' : 'متوقف'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'
                            }`}
                            title={user.isActive ? 'إيقاف' : 'تفعيل'}
                          >
                            {user.isActive ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-700">
                <button
                  onClick={() => fetchUsers(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  السابق
                </button>
                <span className="text-slate-400">
                  صفحة {pagination.page} من {pagination.pages}
                </span>
                <button
                  onClick={() => fetchUsers(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 rounded-lg transition-colors"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">إضافة مستخدم جديد</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="name@sed.menofia.edu.eg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">الدور</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="STUDENT">طالب</option>
                    <option value="DOCTOR">دكتور</option>
                    <option value="TEACHING_ASSISTANT">معيد</option>
                    <option value="SUPER_ADMIN">مدير النظام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">القسم (اختياري)</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 py-3 rounded-xl transition-colors"
                  >
                    {submitting ? 'جارٍ الإنشاء...' : 'إنشاء المستخدم'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
