'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    const redirect = user.role === 'ADMIN' ? '/admin' : user.role === 'DOCTOR' ? '/doctor' : '/student';
    router.push(redirect);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      const token = localStorage.getItem('user');
      if (token) {
        const u = JSON.parse(token);
        router.push(u.role === 'ADMIN' ? '/admin' : u.role === 'DOCTOR' ? '/doctor' : '/student');
      }
    } catch (err: unknown) {
      setError((err as Error).message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image 
            src="/logo.png" 
            alt="CampusMind Logo" 
            width={80} 
            height={80}
            className="object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-black mb-2">CampusMind</h1>
          <p className="text-dark-400">نظام الإرشاد الأكاديمي الذكي</p>
        </div>

        <div className="card">
          {error && (
            <div className="flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-xl p-4 mb-6">
              <AlertCircle size={20} className="text-danger flex-shrink-0" />
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pr-12"
                  placeholder="email@smartuniversity.edu"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">كلمة المرور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  جاري التحميل...
                </span>
              ) : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-dark-300">
            <p className="text-dark-400 text-sm text-center mb-3">بيانات الدخول التجريبية</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { role: 'مدير', email: 'admin@smartuniversity.edu', pass: 'Admin@123' },
                { role: 'دكتور', email: 'doctor@smartuniversity.edu', pass: 'Doctor@123' },
                { role: 'طالب', email: 'student1@smartuniversity.edu', pass: 'Student@123' },
              ].map((demo) => (
                <button
                  key={demo.role}
                  onClick={() => { setEmail(demo.email); setPassword(demo.pass); }}
                  className="p-2 rounded-lg bg-dark-200 hover:bg-dark-300 text-center transition-colors"
                >
                  <p className="font-medium text-primary">{demo.role}</p>
                  <p className="text-dark-400 truncate">{demo.email.split('@')[0]}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
