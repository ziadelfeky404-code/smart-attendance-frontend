import AdvisingSessionsManagementScreen from '@/components/advising-sessions/AdvisingSessionsManagementScreen';

export default function DoctorAdvisingSessionsPage() {
  return (
    <AdvisingSessionsManagementScreen
      viewerRole="DOCTOR"
      title="إدارة الجلسات الإرشادية"
      subtitle="متابعة الجلسات القادمة والسابقة، إنشاء جلسات جديدة، والوصول السريع إلى ملفات الطلاب وتفاصيل الجلسات."
      backHref="/doctor/advising"
      backLabel="العودة إلى لوحة الإرشاد"
      detailBasePath="/doctor/advising/sessions"
      studentProfileBasePath="/doctor/advising/students"
    />
  );
}
