'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Section, Student, SectionStudent } from '@/lib/api';
import { UserPlus, UserMinus, Users, X, Check, ChevronRight, ChevronLeft } from 'lucide-react';

export default function SectionAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<SectionStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { router.push('/'); return; }
    loadSections();
  }, [user, router]);

  const loadSections = async () => {
    setLoading(true);
    try {
      const res = await adminApi.sections.list({ limit: '100' });
      if (res.success && res.data) setSections(res.data.sections);
    } catch {} finally { setLoading(false); }
  };

  const selectSection = async (section: Section) => {
    setSelectedSection(section);
    setSelectedToAdd([]);
    setSelectedToRemove([]);
    setShowAddPanel(false);
    try {
      const [enrolledRes, allStudentsRes] = await Promise.all([
        adminApi.sections.getStudents(section.id),
        adminApi.students.list({ limit: '500', isActive: 'true' }),
      ]);

      if (enrolledRes.success && enrolledRes.data) {
        setEnrolledStudents(enrolledRes.data);
      }
      if (allStudentsRes.success && allStudentsRes.data) {
        const enrolledIds = new Set((enrolledRes.data || []).map((s: SectionStudent) => s.studentId));
        const available = allStudentsRes.data.students.filter((s: Student) => !enrolledIds.has(s.id));
        setAvailableStudents(available);
      }
    } catch {}
  };

  const toggleAddStudent = (studentId: string) => {
    setSelectedToAdd(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const toggleRemoveStudent = (studentId: string) => {
    setSelectedToRemove(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleAddStudents = async () => {
    if (!selectedSection || selectedToAdd.length === 0) return;
    setSaving(true);
    try {
      await adminApi.sections.assignStudents(selectedSection.id, selectedToAdd);
      await selectSection(selectedSection);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
      setSelectedToAdd([]);
      setShowAddPanel(false);
    }
  };

  const handleRemoveStudents = async () => {
    if (!selectedSection || selectedToRemove.length === 0) return;
    if (!confirm(`تأكيد إزالة ${selectedToRemove.length} طالب من الشعبة؟`)) return;
    setSaving(true);
    try {
      await adminApi.sections.removeStudents(selectedSection.id, selectedToRemove);
      await selectSection(selectedSection);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
      setSelectedToRemove([]);
    }
  };

  if (user?.role !== 'ADMIN') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-black mb-1">تعيين الطلاب للشعب</h1>
          <p className="text-dark-400">اختر الشعبة لإدارة طلابها</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <h2 className="font-bold mb-4 flex items-center gap-2"><Users size={18} className="text-primary" /> الشعب</h2>
            {loading ? (
              <div className="text-center py-8"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
            ) : sections.length === 0 ? (
              <p className="text-dark-400 text-center py-8">لا توجد شعب</p>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => selectSection(s)}
                    className={`w-full text-right p-3 rounded-lg transition-all ${
                      selectedSection?.id === s.id
                        ? 'bg-primary/10 border border-primary/30'
                        : 'bg-dark-200 hover:bg-dark-300 border border-transparent'
                    }`}
                  >
                    <p className="font-medium">{s.course_name}</p>
                    <p className="text-dark-400 text-sm">{s.name} - {s.semester} {s.year}</p>
                    <p className="text-dark-500 text-xs mt-1">{s.student_count || 0} طالب</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedSection ? (
              <div className="space-y-4">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedSection.course_name}</h2>
                      <p className="text-dark-400">{selectedSection.name} - د/ {selectedSection.doctor_name}</p>
                    </div>
                    <button
                      onClick={() => setShowAddPanel(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <UserPlus size={16} /> إضافة طلاب
                    </button>
                  </div>
                  <p className="text-dark-400 text-sm">إجمالي: {enrolledStudents.length} / {selectedSection.max_students} طالب</p>
                </div>

                {enrolledStudents.length > 0 && selectedToRemove.length > 0 && (
                  <div className="card bg-danger/10 border border-danger/20">
                    <div className="flex items-center justify-between">
                      <p className="text-danger font-medium">تم تحديد {selectedToRemove.length} طالب للإزالة</p>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedToRemove([])} className="btn-secondary text-sm p-2"><X size={14} /></button>
                        <button onClick={handleRemoveStudents} disabled={saving} className="btn-danger text-sm flex items-center gap-1">
                          <UserMinus size={14} /> {saving ? '...' : 'إزالة'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th><input type="checkbox" disabled className="w-4 h-4" /></th>
                        <th>#</th>
                        <th>الكود</th>
                        <th>الاسم</th>
                        <th>تاريخ التسجيل</th>
                        <th>إزالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا يوجد طلاب مسجلين</td></tr>
                      ) : enrolledStudents.map((s, i) => (
                        <tr key={s.studentId} className={selectedToRemove.includes(s.studentId) ? 'bg-danger/10' : ''}>
                          <td><input type="checkbox" checked={selectedToRemove.includes(s.studentId)} onChange={() => toggleRemoveStudent(s.studentId)} className="w-4 h-4" /></td>
                          <td>{i + 1}</td>
                          <td className="font-mono text-sm">{s.studentCode}</td>
                          <td className="font-medium">{s.fullName}</td>
                          <td className="text-dark-400 text-sm">{new Date(s.enrolledAt).toLocaleDateString('ar-EG')}</td>
                          <td>
                            <button onClick={() => toggleRemoveStudent(s.studentId)} className={`p-2 rounded-lg transition-all ${selectedToRemove.includes(s.studentId) ? 'bg-danger text-white' : 'bg-dark-200 hover:bg-danger/20 text-danger'}`}>
                              <UserMinus size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card text-center py-16">
                <Users size={48} className="text-dark-600 mx-auto mb-4" />
                <p className="text-dark-400">اختر شعبة من القائمة لعرض وإدارة طلابها</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {showAddPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">إضافة طلاب للشعبة</h2>
              <button onClick={() => setShowAddPanel(false)} className="btn-secondary p-2"><X size={18} /></button>
            </div>

            <p className="text-dark-400 text-sm mb-4">
              {availableStudents.length} طالب متاح - {selectedToAdd.length} محدد
            </p>

            <div className="flex-1 overflow-y-auto max-h-[50vh] space-y-2 mb-4">
              {availableStudents.length === 0 ? (
                <p className="text-center py-8 text-dark-400">جميع الطلاب مسجلون في هذه الشعبة</p>
              ) : availableStudents.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleAddStudent(s.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-right transition-all ${
                    selectedToAdd.includes(s.id)
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-dark-200 hover:bg-dark-300 border border-transparent'
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedToAdd.includes(s.id) ? 'bg-primary border-primary' : 'border-dark-500'
                  }`}>
                    {selectedToAdd.includes(s.id) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{s.full_name}</p>
                    <p className="text-dark-400 text-sm">{s.student_code} - السنة {s.year}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddStudents}
                disabled={selectedToAdd.length === 0 || saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? '...' : <><UserPlus size={16} /> إضافة {selectedToAdd.length} طالب</>}
              </button>
              <button onClick={() => setShowAddPanel(false)} className="btn-secondary flex-1">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
