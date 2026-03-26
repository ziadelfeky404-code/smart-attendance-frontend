import StudentProfileScreen from '@/components/student-profile/StudentProfileScreen';

interface AdminStudentProfilePageProps {
  params: { id: string };
}

export default function AdminStudentProfilePage({
  params,
}: AdminStudentProfilePageProps) {
  return (
    <StudentProfileScreen
      studentId={params.id}
      allowedRole="ADMIN"
      backHref="/admin/students"
      backLabel="العودة إلى الطلاب"
    />
  );
}
