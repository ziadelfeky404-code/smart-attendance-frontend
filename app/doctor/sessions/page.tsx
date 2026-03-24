'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { adminApi, Session, Section } from '@/lib/api';
import { QrCode, Plus, X, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DoctorSessionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsRadius, setGpsRadius] = useState(100);
  const [creating, setCreating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (user?.role !== 'DOCTOR') { router.push('/'); return; }
    loadData();
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, sectionsRes] = await Promise.all([
        adminApi.lectures.sessions({ limit: '100' }),
        adminApi.sections.list()
      ]);
      if (sessionsRes.success && sessionsRes.data) setSessions(sessionsRes.data.sessions);
      if (sectionsRes.success && sectionsRes.data) setSections(sectionsRes.data.sections);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('المتصفح لا يدعم تحديد الموقع');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationError('');
      },
      () => setLocationError('فشل في الحصول على الموقع')
    );
  };

  const createSession = async () => {
    if (!selectedSection) return;
    setCreating(true);
    try {
      await adminApi.lectures.openSession({
        section_id: selectedSection.id,
        gps_latitude: gpsLocation?.lat,
        gps_longitude: gpsLocation?.lng,
        gps_radius_meters: gpsRadius
      });
      setShowCreateModal(false);
      setSelectedSection(null);
      setGpsLocation(null);
      loadData();
    } catch (error) {
      console.error('Failed to create session:', error);
    } finally {
      setCreating(false);
    }
  };

  const closeSession = async (sessionId: string) => {
    try {
      await adminApi.lectures.closeSession(sessionId);
      loadData();
    } catch (error) {
      console.error('Failed to close session:', error);
    }
  };

  if (user?.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black mb-1">الجلسات</h1>
            <p className="text-dark-400">إدارة جلسات الحضور</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> فتح جلسة جديدة
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-500"><Clock size={20} /></div>
              <div>
                <div className="text-2xl font-black">{sessions.filter(s => s.status === 'ACTIVE').length}</div>
                <p className="text-dark-400 text-sm">جلسة نشطة</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-green-500/20 text-green-500"><CheckCircle size={20} /></div>
              <div>
                <div className="text-2xl font-black">{sessions.filter(s => s.status === 'CLOSED').length}</div>
                <p className="text-dark-400 text-sm">جلسة مغلقة</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-500"><QrCode size={20} /></div>
              <div>
                <div className="text-2xl font-black">{sessions.length}</div>
                <p className="text-dark-400 text-sm">إجمالي الجلسات</p>
              </div>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>الشعبة</th>
                <th>الحالة</th>
                <th>تاريخ الفتح</th>
                <th>ينتهي في</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : sessions.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-dark-400">لا توجد جلسات</td></tr>
              ) : sessions.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.section_id?.slice(0, 8) || '-'}</td>
                  <td>
                    <span className={`badge ${
                      s.status === 'ACTIVE' ? 'badge-success' : 
                      s.status === 'EXPIRED' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {s.status === 'ACTIVE' ? 'نشط' : s.status === 'EXPIRED' ? 'منتهي' : 'مغلق'}
                    </span>
                  </td>
                  <td>{s.opened_at ? new Date(s.opened_at).toLocaleString('ar-EG') : '-'}</td>
                  <td>{s.expires_at ? new Date(s.expires_at).toLocaleString('ar-EG') : '-'}</td>
                  <td>
                    {s.status === 'ACTIVE' && (
                      <button onClick={() => closeSession(s.id)} className="btn-secondary text-sm py-1">
                        إغلاق
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">فتح جلسة حضور جديدة</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-dark-200 rounded-lg"><X size={20} /></button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="label">اختر الشعبة</label>
                  <select 
                    value={selectedSection?.id || ''} 
                    onChange={(e) => setSelectedSection(sections.find(s => s.id === e.target.value) || null)}
                    className="input-field"
                  >
                    <option value="">اختر الشعبة</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.course_name || s.name} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">الموقع الجغرافي (اختياري)</label>
                  <button onClick={getLocation} className="btn-secondary w-full flex items-center justify-center gap-2">
                    <MapPin size={18} /> {gpsLocation ? 'تم تحديد الموقع' : 'تحديد موقعك الحالي'}
                  </button>
                  {gpsLocation && (
                    <p className="text-sm text-dark-400 mt-2 text-center">
                     _lat: {gpsLocation.lat.toFixed(6)}, _lng: {gpsLocation.lng.toFixed(6)}
                    </p>
                  )}
                  {locationError && <p className="text-danger text-sm mt-2">{locationError}</p>}
                </div>

                {gpsLocation && (
                  <div>
                    <label className="label">نطاق الموقع (متر)</label>
                    <input 
                      type="number" 
                      value={gpsRadius} 
                      onChange={(e) => setGpsRadius(parseInt(e.target.value))}
                      className="input-field"
                      min={10}
                      max={500}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button onClick={createSession} disabled={!selectedSection || creating} className="btn-primary flex-1">
                  {creating ? '...' : 'فتح الجلسة'}
                </button>
                <button onClick={() => setShowCreateModal(false)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
