'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Calendar, Users, Clock, Check, X, RefreshCw } from 'lucide-react';

interface AtRiskStudent {
  id: string;
  studentId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  absenceRate: number;
  totalSessions: number;
  attendedSessions: number;
  courses: {
    id: string;
    name: string;
    code: string;
  }[];
}

interface Appointment {
  id: string;
  scheduledAt: string;
  reason: string;
  status: string;
  student: {
    user: {
      name: string;
    };
  };
}

export default function AdvisoryPage() {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [suggestedTime, setSuggestedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAtRiskStudents = async () => {
    try {
      const response = await fetch('/api/attendance/report?type=at-risk');
      const data = await response.json();
      if (data.success) {
        setAtRiskStudents(data.data);
      }
    } catch (error) {
      console.error('Error fetching at-risk students:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/advisory/appointments');
      const data = await response.json();
      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchAtRiskStudents(), fetchAppointments()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSuggestAppointment = (student: AtRiskStudent) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleSubmitSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !suggestedTime) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/advisory/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          scheduledAt: suggestedTime,
          reason: `اجتماع متابعة غياب - نسبة الغياب: ${selectedStudent.absenceRate}%`,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setSuggestedTime('');
        setSelectedStudent(null);
        fetchAppointments();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppointmentAction = async (appointmentId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const response = await fetch('/api/advisory/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action }),
      });

      const data = await response.json();
      if (data.success) {
        fetchAppointments();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-indigo-500" />
            الإرشاد الأكاديمي
          </h1>
          <p className="text-slate-400 mt-1">متابعة الطلاب وتحتاج إرشاد</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-200 text-sm">طلاب تجاوزوا 25% غياب</p>
                <p className="text-4xl font-bold mt-2">{atRiskStudents.length}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-red-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-200 text-sm">طلبات معلقة</p>
                <p className="text-4xl font-bold mt-2">
                  {appointments.filter((a) => a.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-300" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-200 text-sm">مواعيد اليوم</p>
                <p className="text-4xl font-bold mt-2">
                  {appointments.filter((a) => {
                    const today = new Date().toDateString();
                    return new Date(a.scheduledAt).toDateString() === today && a.status === 'APPROVED';
                  }).length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-emerald-300" />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              الطلاب المحتاجين متابعة
            </h2>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              </div>
            ) : atRiskStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Check className="w-12 h-12 mx-auto mb-3 text-emerald-500" />
                <p>لا يوجد طلاب تجاوزوا نسبة الغياب المسموح</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-700/50 rounded-xl p-4 border border-red-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{student.user.name}</h3>
                        <p className="text-sm text-slate-400">{student.user.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {student.courses.map((course) => (
                            <span key={course.id} className="text-xs bg-slate-600 px-2 py-1 rounded">
                              {course.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold text-red-400">
                          {student.absenceRate.toFixed(1)}%
                        </div>
                        <p className="text-xs text-slate-400">
                          {student.attendedSessions}/{student.totalSessions} حصة
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSuggestAppointment(student)}
                      className="mt-3 w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Calendar className="w-4 h-4" />
                      اقتراح موعد إرشاد
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              طلبات المواعيد
            </h2>

            {appointments.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-3" />
                <p>لا توجد طلبات مواعيد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.slice(0, 10).map((appointment) => (
                  <div key={appointment.id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{appointment.student.user.name}</h3>
                        <p className="text-sm text-slate-400">{appointment.reason}</p>
                        <div className="mt-2 text-sm text-slate-400">
                          {new Date(appointment.scheduledAt).toLocaleDateString('ar-EG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                      <div>
                        {appointment.status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAppointmentAction(appointment.id, 'APPROVE')}
                              className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                              title="اعتماد"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleAppointmentAction(appointment.id, 'REJECT')}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                              title="رفض"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <span
                            className={`px-3 py-1 rounded-full text-xs ${
                              appointment.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : appointment.status === 'REJECTED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {appointment.status === 'APPROVED'
                              ? 'تم الاعتماد'
                              : appointment.status === 'REJECTED'
                              ? 'مرفوض'
                              : 'مكتمل'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showModal && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">اقتراح موعد إرشاد</h2>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                <p className="text-red-400 font-semibold">{selectedStudent.user.name}</p>
                <p className="text-sm text-slate-400">
                  نسبة الغياب: {selectedStudent.absenceRate.toFixed(1)}%
                </p>
              </div>

              <form onSubmit={handleSubmitSuggestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">اقتراح موعد</label>
                  <input
                    type="datetime-local"
                    required
                    value={suggestedTime}
                    onChange={(e) => setSuggestedTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 py-3 rounded-xl transition-colors"
                  >
                    {submitting ? 'جارٍ الإرسال...' : 'إرسال الاقتراح'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedStudent(null);
                      setSuggestedTime('');
                    }}
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
