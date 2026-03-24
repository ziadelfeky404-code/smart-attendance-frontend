'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, BookOpen, Calendar, GraduationCap, ScrollText,
  LogOut, Menu, X, QrCode, Bell, Settings, ChevronDown, ClipboardList
} from 'lucide-react';

const navItems = {
  ADMIN: [
    { href: '/admin', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/admin/doctors', label: 'الأطباء', icon: Users },
    { href: '/admin/students', label: 'الطلاب', icon: GraduationCap },
    { href: '/admin/courses', label: 'المقررات', icon: BookOpen },
    { href: '/admin/sections', label: 'الشعب', icon: Calendar },
    { href: '/admin/section-assignment', label: 'تعيين الطلاب', icon: Users },
    { href: '/admin/lectures', label: 'المحاضرات', icon: ClipboardList },
    { href: '/admin/attendance', label: 'الحضور', icon: QrCode },
    { href: '/admin/reports', label: 'التقارير', icon: ScrollText },
  ],
  DOCTOR: [
    { href: '/doctor', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/doctor/sections', label: 'شعبتي', icon: Calendar },
    { href: '/doctor/sessions', label: 'الجلسات', icon: QrCode },
    { href: '/doctor/attendance', label: 'الحضور', icon: ClipboardList },
    { href: '/doctor/reports', label: 'التقارير', icon: ScrollText },
  ],
  STUDENT: [
    { href: '/student', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/student/attendance', label: 'تسجيل الحضور', icon: QrCode },
    { href: '/student/history', label: 'سجل الحضور', icon: ScrollText },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const items = user ? navItems[user.role as keyof typeof navItems] || [] : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!user) return null;

  return (
    <>
      <nav className="fixed top-0 right-0 left-0 z-50 glass border-b border-dark-300">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-lg hover:bg-dark-200">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logo.png" 
                alt="CampusMind" 
                width={36} 
                height={36}
                className="object-contain"
              />
              <span className="font-bold text-lg hidden sm:block">CampusMind</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-dark-200 relative">
              <Bell size={20} className="text-dark-400" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
            </button>
            <div ref={profileRef} className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-dark-200 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{user.fullName.charAt(0)}</span>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium">{user.fullName}</p>
                  <p className="text-xs text-dark-400">{user.role === 'ADMIN' ? 'مدير' : user.role === 'DOCTOR' ? 'دكتور' : 'طالب'}</p>
                </div>
                <ChevronDown size={16} className="text-dark-400 hidden sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute left-0 top-full mt-2 w-56 card p-2 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-dark-300 mb-2">
                    <p className="text-sm font-medium">{user.fullName}</p>
                    <p className="text-xs text-dark-400">{user.email}</p>
                  </div>
                  <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-danger hover:bg-danger/10 transition-colors text-sm">
                    <LogOut size={16} /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <aside className={`fixed top-16 right-0 bottom-0 w-64 bg-dark-100 border-l border-dark-300 z-40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <nav className="p-4 space-y-1 overflow-y-auto h-full">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
