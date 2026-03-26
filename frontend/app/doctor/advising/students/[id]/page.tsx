import StudentProfileScreen from '@/components/student-profile/StudentProfileScreen';

interface DoctorStudentProfilePageProps {
  params: { id: string };
}

export default function DoctorStudentProfilePage({
  params,
}: DoctorStudentProfilePageProps) {
  return (
    <StudentProfileScreen
      studentId={params.id}
      allowedRole="DOCTOR"
      backHref="/doctor/advising"
      backLabel="العودة إلى الإرشاد الأكاديمي"
    />
  );
}
