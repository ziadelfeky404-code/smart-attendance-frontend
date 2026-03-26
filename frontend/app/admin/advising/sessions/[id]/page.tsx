import AdvisingSessionDetailsScreen from '@/components/advising-sessions/AdvisingSessionDetailsScreen';

interface AdminAdvisingSessionDetailsPageProps {
  params: { id: string };
}

export default function AdminAdvisingSessionDetailsPage({
  params,
}: AdminAdvisingSessionDetailsPageProps) {
  return (
    <AdvisingSessionDetailsScreen
      viewerRole="ADMIN"
      sessionId={params.id}
      backHref="/admin/advising/sessions"
      backLabel="العودة إلى جلسات الإرشاد"
      studentProfileBasePath="/admin/students"
    />
  );
}
