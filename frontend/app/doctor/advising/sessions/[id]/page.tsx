import AdvisingSessionDetailsScreen from '@/components/advising-sessions/AdvisingSessionDetailsScreen';

interface DoctorAdvisingSessionDetailsPageProps {
  params: { id: string };
}

export default function DoctorAdvisingSessionDetailsPage({
  params,
}: DoctorAdvisingSessionDetailsPageProps) {
  return (
    <AdvisingSessionDetailsScreen
      viewerRole="DOCTOR"
      sessionId={params.id}
      backHref="/doctor/advising/sessions"
      backLabel="العودة إلى الجلسات الإرشادية"
      studentProfileBasePath="/doctor/advising/students"
    />
  );
}
