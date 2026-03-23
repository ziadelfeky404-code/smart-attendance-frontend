'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { studentApi, otpApi, StudentSection, SessionPreview, StudentSummary, AttendanceResult } from '@/lib/api';
import { QrCode, MapPin, KeyRound, CheckCircle, XCircle, Navigation, Clock, Send, AlertCircle } from 'lucide-react';

type Step = 'sections' | 'scan' | 'otp' | 'success' | 'error';

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('sections');
  const [sections, setSections] = useState<StudentSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<StudentSection | null>(null);
  const [session, setSession] = useState<SessionPreview | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [resultError, setResultError] = useState('');

  useEffect(() => {
    if (user?.role !== 'STUDENT') { router.push('/'); return; }
    loadSections();
  }, [user, router]);

  const loadSections = async () => {
    try {
      const res = await studentApi.mySections();
      if (res.success && res.data) setSections(res.data);
    } catch {}
  };

  const selectSection = async (section: StudentSection) => {
    setSelectedSection(section);
    try {
      const res = await studentApi.getActiveSession(section.section_id);
      if (res.success && res.data) {
        if (res.data.exists && res.data.session) {
          setSession(res.data.session);
          setStep('scan');
        } else {
          setResultError('لا توجد جلسة نشطة حالياً لهذه الشعبة');
          setStep('error');
        }
      }
    } catch {
      setResultError('لا توجد جلسة نشطة حالياً');
      setStep('error');
    }
  };

  const getLocation = useCallback((): Promise<{ lat: number; lon: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('المتصفح لا يدعم تحديد الموقع'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, []);

  const handleSendOtp = async () => {
    setOtpLoading(true);
    setOtpError('');
    try {
      await otpApi.generate('ATTENDANCE');
      setOtpSent(true);
    } catch (err: unknown) {
      setOtpError((err as Error).message || 'فشل إرسال رمز التحقق');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyAndRecord = async () => {
    if (!session || !otpCode || otpCode.length !== 6) {
      setOtpError('يرجى إدخال رمز التحقق المكون من 6 أرقام');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    setGpsLoading(true);

    try {
      const pos = await getLocation();
      setPosition(pos);
      setGpsLoading(false);

      const res = await studentApi.record({
        sessionId: session.sessionId,
        qrToken: session.qrToken,
        otpCode,
        gpsLatitude: pos.lat,
        gpsLongitude: pos.lon,
      });

      if (res.success && res.data) {
        setResult(res.data);
        setStep('success');
      } else {
        setResultError(res.error || 'فشل تسجيل الحضور');
        setStep('error');
      }
    } catch (err: unknown) {
      setGpsLoading(false);
      const msg = (err as GeolocationPositionError & Error).message || 'حدث خطأ';
      if (msg.includes('location') || msg.includes('Location') || msg.includes('موقع')) {
        setOtpError('يرجى السماح بالوصول للموقع الجغرافي');
      } else {
        setResultError(msg);
        setStep('error');
      }
    } finally {
      setOtpLoading(false);
    }
  };

  if (user?.role !== 'STUDENT') return null;

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-2">تسجيل الحضور</h1>
          <p className="text-dark-400">اختر الشعبة ثم امسح QR وأدخل رمز التحقق</p>
        </div>

        {step === 'sections' && (
          <div className="space-y-3">
            {sections.length === 0 ? (
              <div className="card text-center py-12 text-dark-400">
                <p>لا توجد شعب مسجل فيها</p>
              </div>
            ) : (
              sections.map(s => (
                <button key={s.section_id} onClick={() => selectSection(s)} className="card w-full text-right hover:border-primary/30 transition-all">
                  <p className="font-bold text-lg">{s.course_name}</p>
                  <p className="text-dark-400 text-sm">{s.section_name}</p>
                </button>
              ))
            )}
          </div>
        )}

        {step === 'scan' && session && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><CheckCircle size={20} className="text-success" /></div>
                <div><p className="font-bold">تم العثور على جلسة نشطة</p><p className="text-dark-400 text-sm">{session.courseName} - {session.sectionName}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-dark-200 rounded-lg p-3"><p className="text-dark-400">الدكتور</p><p className="font-medium">{session.doctorName}</p></div>
                <div className="bg-dark-200 rounded-lg p-3"><p className="text-dark-400">ينتهي في</p><p className="font-medium">{new Date(session.expiresAt).toLocaleTimeString('ar-EG')}</p></div>
              </div>
              {session.requiresGps && (
                <div className="flex items-center gap-2 text-sm text-warning mb-4">
                  <MapPin size={14} /> نطاق الموقع: {session.gpsRadius} متر
                </div>
              )}
              <button onClick={handleSendOtp} disabled={otpLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                {otpLoading ? '...' : <><Send size={18} /> إرسال رمز التحقق</>}
              </button>
            </div>

            {otpSent && (
              <div className="card">
                <h3 className="font-bold mb-4 flex items-center gap-2"><KeyRound size={18} className="text-primary" /> أدخل رمز التحقق</h3>
                <input
                  type="text"
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  placeholder="000000"
                  className="input-field text-center text-3xl font-mono tracking-[1em] text-2xl"
                  dir="ltr"
                />
                {otpError && <p className="text-danger text-sm mt-2 flex items-center gap-1"><AlertCircle size={14} />{otpError}</p>}
                <button onClick={handleVerifyAndRecord} disabled={otpLoading || gpsLoading || otpCode.length !== 6} className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                  {otpLoading || gpsLoading ? (
                    <><div className="w-5 h-5 border-2 border-dark/30 border-t-dark rounded-full animate-spin" /> جاري التحقق...</>
                  ) : <><Navigation size={18} /> تسجيل الحضور</>}
                </button>
              </div>
            )}

            <button onClick={() => setStep('sections')} className="btn-secondary w-full">العودة للشعب</button>
          </div>
        )}

        {step === 'success' && result && (
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-success" />
            </div>
            <h2 className="text-2xl font-black text-success mb-2">تم تسجيل الحضور!</h2>
            <p className="text-dark-400 mb-6">{result.sessionInfo.courseName} - {result.sessionInfo.sectionName}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-dark-200 rounded-xl p-3">
                <p className="text-dark-400 text-xs">الحالة</p>
                <p className={`font-bold ${result.status === 'PRESENT' ? 'text-success' : 'text-warning'}`}>{result.status}</p>
              </div>
              <div className="bg-dark-200 rounded-xl p-3">
                <p className="text-dark-400 text-xs">المسافة</p>
                <p className="font-bold">{result.distanceMeters}m</p>
              </div>
              <div className="bg-dark-200 rounded-xl p-3">
                <p className="text-dark-400 text-xs">الوقت</p>
                <p className="font-bold text-sm">{new Date(result.attendedAt).toLocaleTimeString('ar-EG')}</p>
              </div>
            </div>
            <div className="flex gap-2 text-sm">
              <span className={`badge ${result.gpsVerified ? 'badge-success' : 'badge-danger'}`}>GPS {result.gpsVerified ? '✓' : '✗'}</span>
              <span className={`badge ${result.otpVerified ? 'badge-success' : 'badge-danger'}`}>OTP {result.otpVerified ? '✓' : '✗'}</span>
            </div>
            <button onClick={() => { setStep('sections'); setOtpSent(false); setOtpCode(''); }} className="btn-primary w-full mt-6">تسجيل حضور آخر</button>
          </div>
        )}

        {step === 'error' && (
          <div className="card text-center">
            <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-danger" />
            </div>
            <h2 className="text-2xl font-black text-danger mb-2">فشل التسجيل</h2>
            <p className="text-dark-400 mb-6">{resultError}</p>
            <button onClick={() => setStep('sections')} className="btn-primary w-full">العودة للشعب</button>
          </div>
        )}
      </main>
    </div>
  );
}
