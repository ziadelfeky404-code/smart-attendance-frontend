'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  Users, BookOpen, QrCode, BarChart3, GraduationCap,
  ArrowLeft, ScanLine, Lock
} from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  const features = [
    { icon: QrCode, title: 'تسجيل بالحضور', desc: 'امسح الكود وادخل رقم التحقق', color: 'text-primary' },
    { icon: Lock, title: 'تحقق آمن', desc: 'التحقق من الموقع والوقت', color: 'text-accent' },
    { icon: BarChart3, title: 'تقارير دقيقة', desc: 'متابعة الحضور والغياب', color: 'text-success' },
    { icon: GraduationCap, title: 'لجميع الأدوار', desc: 'إدارة شاملة للطلاب والأطباء', color: 'text-warning' },
  ];

  return (
    <div className="min-h-screen bg-dark">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 h-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-dark font-bold">SU</span>
            </div>
            <span className="font-bold text-xl">Smart University</span>
          </div>
          {user ? (
            <Link
              href={user.role === 'ADMIN' ? '/admin' : user.role === 'DOCTOR' ? '/doctor' : '/student'}
              className="btn-primary text-sm"
            >
              لوحة التحكم
            </Link>
          ) : (
            <Link href="/login" className="btn-primary text-sm">
              تسجيل الدخول
            </Link>
          )}
        </nav>

        <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 pt-20 pb-32">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <ScanLine size={16} />
              نظام حضور ذكي ومتطور
            </div>
            <h1 className="text-4xl lg:text-6xl font-black mb-6 leading-tight">
              سجّل حضورك
              <br />
              <span className="text-primary">بسهولة وأمان</span>
            </h1>
            <p className="text-dark-400 text-lg lg:text-xl max-w-2xl mx-auto mb-10">
              نظام حضور ذكي يستخدم QR Code وOTP وGPS لضمان دقة عالية وسهولة في الاستخدام
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <Link
                  href={user.role === 'STUDENT' ? '/student/attendance' : `/${user.role.toLowerCase()}`}
                  className="btn-primary text-lg px-8 py-4"
                >
                  ابدأ الآن
                </Link>
              ) : (
                <>
                  <Link href="/login" className="btn-primary text-lg px-8 py-4">
                    تسجيل الدخول
                  </Link>
                  <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                    معرفة المزيد
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 lg:px-12 -mt-20 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <div key={i} className="card hover:border-primary/30 transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl ${f.color} bg-current/10 flex items-center justify-center mb-4`}>
                <f.icon size={24} />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-dark-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 lg:px-12 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-black mb-4">كيف يعمل النظام؟</h2>
          <p className="text-dark-400 text-lg">خطوات بسيطة لتسجيل حضورك</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'تسجيل الدخول', desc: 'ادخل ببريدك الجامعي وكلمة المرور' },
            { step: '02', title: 'استلام رمز OTP', desc: 'ستصلك رسالة على بريدك برمز التحقق' },
            { step: '03', title: 'مسح QR وتسجيل', desc: 'امسح الكود وأدخل الرمز وموقعك GPS' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-primary font-black text-2xl">{item.step}</span>
              </div>
              <h3 className="font-bold text-xl mb-2">{item.title}</h3>
              <p className="text-dark-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-dark-300 py-8 text-center text-dark-400 text-sm">
        <p>© 2025 Smart University. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
