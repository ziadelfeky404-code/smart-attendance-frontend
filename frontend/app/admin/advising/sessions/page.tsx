import AdvisingSessionsManagementScreen from '@/components/advising-sessions/AdvisingSessionsManagementScreen';

export default function AdminAdvisingSessionsPage() {
  return (
    <AdvisingSessionsManagementScreen
      viewerRole="ADMIN"
      title="إدارة جلسات الإرشاد"
      subtitle="عرض جميع الجلسات الإرشادية على مستوى النظام مع فلاتر حسب الطالب والمرشد والحالة، وإنشاء جلسات جديدة عند الحاجة."
      backHref="/admin"
      backLabel="العودة إلى لوحة الإدارة"
      detailBasePath="/admin/advising/sessions"
      studentProfileBasePath="/admin/students"
    />
  );
}
