import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/hooks/useAuth';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'CampusMind - نظام الإرشاد الأكاديمي',
  description: 'نظام الإرشاد الأكاديمي الذكي',
  icons: { 
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
