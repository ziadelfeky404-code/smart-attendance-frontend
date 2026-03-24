'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Section, Session } from '@/lib/api';
import { QrCode, Lock, Eye, MapPin, Clock, Plus, X } from 'lucide-react';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false });

export default function DoctorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState('');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsData, setGpsData] = useState({ lat: 0, lon: 0, radius: 100 });
  const [qrSession, setQrSession] = useState<{ qr_token: string; expires_at: string } | null>(null);
  const [attendance, setAttendance] = useState<{ id: string; student_name?: string; student_code?: string; status: string; attended_at: string }[]>([]);
  const [showAttendance, setShowAttendance] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, sessionsRes] = await Promise.all([
        adminApi.sections.list({ doctor_id: user!.id, limit: '50' }),
        adminApi.lectures.sessions({ limit: '10' }),
      ]);
      if (sectionsRes.success && sectionsRes.data) setSections(sectionsRes.data.sections);
      if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data.sessions.filter((s: Session) => s.status === 'ACTIVE'));
    } catch { } finally { setLoading(false); }
  };

  const handleLocationChange = (lat: number, lon: number) => {
    setGpsData({ ...gpsData, lat, lon });
  };

  const handleRadiusChange = (radius: number) => {
    setGpsData({ ...gpsData, radius });
  };

  const openSession = async () => {
    if (!openSection) return;
    try {
      const res = await adminApi.lectures.openSession({
        section_id: openSection,
        gps_latitude: gpsEnabled && gpsData.lat ? gpsData.lat : undefined,
        gps_longitude: gpsEnabled && gpsData.lon ? gpsData.lon : undefined,
        gps_radius_meters: gpsEnabled ? gpsData.radius : undefined,
      });
      if (res.success) {
        loadData();
        if (res.data) setQrSession({ qr_token: (res.data as unknown as { qr_token?: string }).qr_token || '', expires_at: '' });
        setShowMap(false);
      }
    } catch (err: unknown) { alert((err as Error).message); }
  };

  const closeSession = async (id: string) => {
    try {
      await adminApi.lectures.closeSession(id);
      loadData();
    } catch {}
  };

  const showQR = async (id: string) => {
    try {
      const res = await adminApi.lectures.getQR(id);
      if (res.success && res.data) setQrSession(res.data);
    } catch {}
  };

  const viewAttendance = async (id: string) => {
    setShowAttendance(id);
    try {
      const res = await adminApi.lectures.attendance(id);
      if (res.success && res.data) setAttendance(res.data);
    } catch {}
  };

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
          <p className="text-dark-400">مرحباً، {user.fullName}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            {sessions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock size={20} className="text-success" /> جلسات نشطة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sessions.map(s => (
                    <div key={s.id} className="card border-success/30">
                      <div className="flex items-center justify-between mb-3">
                        <span className="badge badge-success">نشط</span>
                        <span className="text-dark-400 text-xs">{new Date(s.opened_at).toLocaleString('ar-EG')}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => showQR(s.id)} className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1"><QrCode size={14} /> QR</button>
                        <button onClick={() => viewAttendance(s.id)} className="btn-secondary flex-1 text-sm py-2 flex items-center justify-center gap-1"><Eye size={14} /> الحضور</button>
                        <button onClick={() => closeSession(s.id)} className="btn-danger text-sm py-2 px-3 flex items-center justify-center gap-1"><Lock size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus size={20} className="text-primary" /> فتح جلسة جديدة</h2>
              
              <div className="mb-4">
                <label className="label">اختر الشعبة</label>
                <select value={openSection} onChange={e => setOpenSection(e.target.value)} className="input-field">
                  <option value="">اختر شعبة...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.course_name} - {s.name}</option>)}
                </select>
              </div>

              <div className="mb-4 p-4 bg-dark-200 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <label className="label mb-0">تحديد منطقة الحضور</label>
                  <button
                    type="button"
                    onClick={() => setGpsEnabled(!gpsEnabled)}
                    className={`px-4 py-2 rounded-lg transition-colors ${gpsEnabled ? 'bg-primary text-dark' : 'bg-dark-300 text-dark-400 hover:bg-dark-100'}`}
                  >
                    <MapPin size={16} className="inline ml-2" />
                    {gpsEnabled ? 'مفعل' : 'تفعيل الموقع'}
                  </button>
                </div>

                {gpsEnabled && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-dark-400">
                        {gpsData.lat && gpsData.lon 
                          ? `الموقع: ${gpsData.lat.toFixed(6)}, ${gpsData.lon.toFixed(6)}`
                          : 'اضغط على الخريطة لتحديد الموقع'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="text-primary text-sm hover:underline"
                      >
                        {gpsData.lat ? 'تعديل الموقع' : 'فتح الخريطة'}
                      </button>
                    </div>
                    
                    <div className="mt-3">
                      <label className="label text-sm">نصف القطر: {gpsData.radius} متر</label>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        value={gpsData.radius}
                        onChange={(e) => handleRadiusChange(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-dark-400 mt-1">
                        <span>50 م</span>
                        <span className="text-primary">{gpsData.radius} م</span>
                        <span>500 م</span>
                      </div>
                    </div>

                    <p className="text-dark-400 text-xs mt-3 bg-dark-300 p-2 rounded">
                      الطلاب يجب أن يكونوا في نطاق {gpsData.radius} متر من الموقع المحدد على الخريطة لتسجيل الحضور
                    </p>
                  </div>
                )}

                {!gpsEnabled && (
                  <p className="text-dark-400 text-sm">
                    الطلاب سيسجلون الحضور بالـ QR Code فقط بدون التحقق من الموقع
                  </p>
                )}
              </div>

              <button onClick={openSession} disabled={!openSection || (gpsEnabled && (!gpsData.lat || !gpsData.lon))} className="btn-primary w-full md:w-auto text-lg py-3">
                <QrCode size={20} className="inline ml-2" /> فتح جلسة الحضور
              </button>
            </div>
          </>
        )}
      </main>

      {showMap && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">تحديد موقع الحضور</h2>
              <button onClick={() => setShowMap(false)} className="p-2 hover:bg-dark-200 rounded-lg">
                <X size={24} />
              </button>
            </div>
            <p className="text-dark-400 text-sm mb-4">
              اضغط على الخريطة لتحديد موقع الحضور. الدائرة الزرقاء تحدد نطاق {gpsData.radius} متر
            </p>
            <LocationPicker
              lat={gpsData.lat}
              lon={gpsData.lon}
              radius={gpsData.radius}
              onLocationChange={handleLocationChange}
              onRadiusChange={handleRadiusChange}
            />
            <button onClick={() => setShowMap(false)} className="btn-primary w-full mt-4">
              تأكيد الموقع
            </button>
          </div>
        </div>
      )}

      {qrSession && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setQrSession(null)}>
          <div className="card text-center">
            <h2 className="text-xl font-bold mb-4">QR Code للحضور</h2>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrSession.qr_token}`} alt="QR" className="w-48 h-48" />
            </div>
            <p className="text-xs text-dark-400 font-mono break-all mb-4">{qrSession.qr_token.substring(0, 50)}...</p>
            <button onClick={() => setQrSession(null)} className="btn-secondary w-full">إغلاق</button>
          </div>
        </div>
      )}

      {showAttendance && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowAttendance(null)}>
          <div className="card w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">قائمة الحضور</h2>
            {attendance.length === 0 ? <p className="text-dark-400 text-center py-8">لا يوجد حضور</p> : (
              <table className="table">
                <thead><tr><th>الطالب</th><th>الحالة</th><th>الوقت</th></tr></thead>
                <tbody>{attendance.map(a => (
                  <tr key={a.id}>
                    <td>{a.student_name} <span className="text-dark-400 text-xs">{a.student_code}</span></td>
                    <td><span className={`badge ${a.status === 'PRESENT' ? 'badge-success' : a.status === 'ABSENT' ? 'badge-danger' : 'badge-warning'}`}>{a.status}</span></td>
                    <td>{new Date(a.attended_at).toLocaleString('ar-EG')}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <button onClick={() => setShowAttendance(null)} className="btn-secondary w-full mt-4">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
