'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, Plus, AlertCircle } from 'lucide-react';

interface Appointment {
  id: string;
  scheduledAt: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  advisor: {
    user: {
      name: string;
      email: string;
    };
  };
}

interface Advisor {
  id: string;
  doctorId: string;
  user: {
    name: string;
    email: string;
  };
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    advisorId: '',
    scheduledAt: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/advisory/appointments');
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisors = async () => {
    try {
      const response = await fetch('/api/admin/users?role=DOCTOR');
      const data = await response.json();
      if (data.success) {
        const doctorAdvisors = data.data.users
          .filter((u: { doctor: unknown }) => u.doctor)
          .map((u: { doctor: Advisor }) => ({
            id: u.doctor.id,
            doctorId: u.doctor.doctorId,
            user: u.user,
          }));
        setAdvisors(doctorAdvisors);
      }
    } catch (error) {
      console.error('Error fetching advisors:', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchAdvisors();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/advisory/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowModal(false);
        setFormData({ advisorId: '', scheduledAt: '', reason: '' });
        fetchAppointments();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ في حجز الموعد');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
      COMPLETED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    const labels = {
      PENDING: 'قيد الانتظار',
      APPROVED: 'تم الاعتماد',
      REJECTED: 'مرفوض',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغي',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8 text-indigo-500" />
              مواعيد الإرشاد الأكاديمي
            </h1>
            <p className="text-slate-400 mt-1">Manage your advisory appointments</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            طلب موعد جديد
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-slate-800 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-300 mb-2">لا توجد مواعيد</h3>
            <p className="text-slate-400 mb-6">لم تقم بحجز أي موعد إرشاد بعد</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              احجز موعد جديد
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{appointment.advisor.user.name}</h3>
                      <p className="text-slate-400 text-sm">{appointment.advisor.user.email}</p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-slate-300">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(appointment.scheduledAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(appointment.scheduledAt)}
                        </span>
                      </div>
                      {appointment.reason && (
                        <p className="mt-3 text-slate-400 text-sm">
                          <span className="font-semibold">السبب:</span> {appointment.reason}
                        </p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                {appointment.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    بانتظار اعتماد المرشد الأكاديمي
                  </div>
                )}

                {appointment.status === 'APPROVED' && (
                  <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 text-emerald-400 text-sm">
                    <Check className="w-4 h-4" />
                    تم اعتماد الموعد - يرجى الحضور في الموعد المحدد
                  </div>
                )}

                {appointment.status === 'REJECTED' && (
                  <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-2 text-red-400 text-sm">
                    <X className="w-4 h-4" />
                    تم رفض الموعد - يمكنك حجز موعد جديد
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">طلب موعد إرشاد جديد</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">المرشد الأكاديمي</label>
                  <select
                    required
                    value={formData.advisorId}
                    onChange={(e) => setFormData({ ...formData, advisorId: e.target.value })}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">اختر المرشد</option>
                    {advisors.map((advisor) => (
                      <option key={advisor.id} value={advisor.id}>
                        {advisor.user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">التاريخ والوقت</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">سبب الزيارة (اختياري)</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="اكتب سبب طلب الموعد..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 text-white py-3 rounded-xl transition-colors"
                  >
                    {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
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
