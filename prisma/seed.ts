import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 بدء إنشاء البيانات التجريبية...');

  await prisma.auditLogs.deleteMany();
  await prisma.notifications.deleteMany();
  await prisma.advisoryAppointments.deleteMany();
  await prisma.attendanceRecords.deleteMany();
  await prisma.attendanceSessions.deleteMany();
  await prisma.enrollments.deleteMany();
  await prisma.sections.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.teachingAssistants.deleteMany();
  await prisma.doctors.deleteMany();
  await prisma.students.deleteMany();
  await prisma.otpTokens.deleteMany();
  await prisma.documentLibrary.deleteMany();
  await prisma.users.deleteMany();

  console.log('✅ تم حذف البيانات القديمة');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const doctorPassword = await bcrypt.hash('Doctor@123', 12);
  const studentPassword = await bcrypt.hash('Student@123', 12);

  const admin = await prisma.users.create({
    data: {
      email: 'admin@sed.menofia.edu.eg',
      password: adminPassword,
      name: 'مدير النظام',
      role: 'SUPER_ADMIN',
      isActive: true,
      department: 'تكنولوجيا المعلومات',
    },
  });
  console.log('✅ تم إنشاء المدير: admin@sed.menofia.edu.eg');

  const doctorUser = await prisma.users.create({
    data: {
      email: 'doctor@sed.menofia.edu.eg',
      password: doctorPassword,
      name: 'د. أحمد محمد',
      role: 'DOCTOR',
      isActive: true,
      department: 'علوم الحاسب',
    },
  });

  const doctor = await prisma.doctors.create({
    data: {
      userId: doctorUser.id,
      doctorId: 'DOC0001',
      title: 'أستاذ مساعد',
      office: 'مكتب 301',
    },
  });
  console.log('✅ تم إنشاء الدكتور: doctor@sed.menofia.edu.eg');

  const taUser = await prisma.users.create({
    data: {
      email: 'ta@sed.menofia.edu.eg',
      password: doctorPassword,
      name: 'م. خالد عبدالله',
      role: 'TEACHING_ASSISTANT',
      isActive: true,
      department: 'علوم الحاسب',
    },
  });

  const teachingAssistant = await prisma.teachingAssistants.create({
    data: {
      userId: taUser.id,
      taId: 'TA0001',
    },
  });
  console.log('✅ تم إنشاء المعيد: ta@sed.menofia.edu.eg');

  const studentUser1 = await prisma.users.create({
    data: {
      email: 'student@sed.menofia.edu.eg',
      password: studentPassword,
      name: 'محمد علي',
      role: 'STUDENT',
      isActive: true,
      department: 'علوم الحاسب',
    },
  });

  const student1 = await prisma.students.create({
    data: {
      userId: studentUser1.id,
      studentId: 'STU000001',
      year: 2024,
      level: 'ثانية',
      gpa: 3.2,
    },
  });

  const studentUser2 = await prisma.users.create({
    data: {
      email: 'student2@sed.menofia.edu.eg',
      password: studentPassword,
      name: 'فاطمة السيد',
      role: 'STUDENT',
      isActive: true,
      department: 'علوم الحاسب',
    },
  });

  const student2 = await prisma.students.create({
    data: {
      userId: studentUser2.id,
      studentId: 'STU000002',
      year: 2024,
      level: 'ثانية',
      gpa: 3.5,
    },
  });
  console.log('✅ تم إنشاء الطلاب التجريبية');

  const course1 = await prisma.courses.create({
    data: {
      code: 'CS101',
      name: 'أساسيات البرمجة',
      credits: 3,
      department: 'علوم الحاسب',
      maxAbsencePercentage: 25,
    },
  });

  const course2 = await prisma.courses.create({
    data: {
      code: 'CS102',
      name: 'هياكل البيانات',
      credits: 4,
      department: 'علوم الحاسب',
      maxAbsencePercentage: 25,
    },
  });

  const course3 = await prisma.courses.create({
    data: {
      code: 'MATH101',
      name: 'الرياضيات المتDiscrete',
      credits: 3,
      department: 'الرياضيات',
      maxAbsencePercentage: 25,
    },
  });

  console.log('✅ تم إنشاء المواد الدراسية');

  const section1 = await prisma.sections.create({
    data: {
      courseId: course1.id,
      doctorId: doctor.id,
      teachingAssistantId: teachingAssistant.id,
      sectionNumber: 1,
      dayOfWeek: 'SUNDAY',
      startTime: new Date('2024-01-01T10:00:00Z'),
      endTime: new Date('2024-01-01T12:00:00Z'),
      building: 'المبنى الرئيسي',
      room: 'قاعة 101',
      maxStudents: 50,
    },
  });

  const section2 = await prisma.sections.create({
    data: {
      courseId: course2.id,
      doctorId: doctor.id,
      sectionNumber: 1,
      dayOfWeek: 'MONDAY',
      startTime: new Date('2024-01-01T14:00:00Z'),
      endTime: new Date('2024-01-01T16:00:00Z'),
      building: 'المبنى الرئيسي',
      room: 'قاعة 202',
      maxStudents: 40,
    },
  });

  const section3 = await prisma.sections.create({
    data: {
      courseId: course3.id,
      doctorId: doctor.id,
      teachingAssistantId: teachingAssistant.id,
      sectionNumber: 1,
      dayOfWeek: 'TUESDAY',
      startTime: new Date('2024-01-01T08:00:00Z'),
      endTime: new Date('2024-01-01T10:00:00Z'),
      building: 'المبنى الثاني',
      room: 'قاعة 305',
      maxStudents: 45,
    },
  });

  console.log('✅ تم إنشاء السكاشن');

  await prisma.enrollments.create({
    data: {
      studentId: student1.id,
      courseId: course1.id,
      sectionId: section1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollments.create({
    data: {
      studentId: student1.id,
      courseId: course2.id,
      sectionId: section2.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollments.create({
    data: {
      studentId: student1.id,
      courseId: course3.id,
      sectionId: section3.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollments.create({
    data: {
      studentId: student2.id,
      courseId: course1.id,
      sectionId: section1.id,
      status: 'ACTIVE',
    },
  });

  await prisma.enrollments.create({
    data: {
      studentId: student2.id,
      courseId: course2.id,
      sectionId: section2.id,
      status: 'ACTIVE',
    },
  });

  console.log('✅ تم إنشاء التسجيلات');

  const session1 = await prisma.attendanceSessions.create({
    data: {
      sectionId: section1.id,
      status: 'COMPLETED',
      date: new Date('2024-01-15'),
      startTime: new Date('2024-01-15T10:00:00Z'),
      endTime: new Date('2024-01-15T12:00:00Z'),
      qrCode: 'session1-qr-code',
      qrExpiresAt: new Date('2024-01-15T12:30:00Z'),
    },
  });

  await prisma.attendanceRecords.create({
    data: {
      sessionId: session1.id,
      enrollmentId: (await prisma.enrollments.findFirst({ where: { studentId: student1.id, courseId: course1.id } }))!.id,
      status: 'PRESENT',
      timestamp: new Date('2024-01-15T10:05:00Z'),
      deviceInfo: 'Chrome on Windows',
    },
  });

  console.log('✅ تم إنشاء سجلات الحضور');

  await prisma.documentLibrary.create({
    data: {
      title: 'لائحة الطلاب الجامعية',
      description: 'تضم اللائحة جميع الحقوق والواجبات للطلاب في جامعة المنوفية',
      category: 'REGULATIONS',
      fileUrl: '/uploads/documents/regulations.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000,
      uploadedBy: admin.id,
      isActive: true,
    },
  });

  await prisma.documentLibrary.create({
    data: {
      title: 'إرشادات التسجيل',
      description: 'خطوات التسجيل في المواد والفصول الدراسية',
      category: 'GUIDELINES',
      fileUrl: '/uploads/documents/registration-guide.pdf',
      fileType: 'application/pdf',
      fileSize: 512000,
      uploadedBy: admin.id,
      isActive: true,
    },
  });

  await prisma.documentLibrary.create({
    data: {
      title: 'سياسة الغياب والتأخر',
      description: 'توضح السياسة نسبة الغياب المسموح بها والعقوبات المترتبة على تجاوزها',
      category: 'POLICIES',
      fileUrl: '/uploads/documents/absence-policy.pdf',
      fileType: 'application/pdf',
      fileSize: 256000,
      uploadedBy: admin.id,
      isActive: true,
    },
  });

  console.log('✅ تم إنشاء الوثائق');

  await prisma.behavioralProfiles.create({
    data: {
      studentId: student1.id,
      riskLevel: 'LOW',
      notes: 'طالب متفاعل ومنضبط',
    },
  });

  await prisma.behavioralProfiles.create({
    data: {
      studentId: student2.id,
      riskLevel: 'MEDIUM',
      notes: 'يحتاج متابعة في مادة أساسيات البرمجة',
    },
  });

  console.log('✅ تم إنشاء الملفات السلوكية');

  await prisma.auditLogs.create({
    data: {
      userId: admin.id,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: doctorUser.id,
      details: 'تم إنشاء حساب الدكتور التجريبي',
    },
  });

  await prisma.auditLogs.create({
    data: {
      userId: admin.id,
      action: 'CREATE_USER',
      entityType: 'USER',
      entityId: studentUser1.id,
      details: 'تم إنشاء حساب الطالب التجريبي',
    },
  });

  console.log('✅ تم إنشاء سجلات التدقيق');

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log('📋 بيانات الدخول:');
  console.log('');
  console.log('👤 المدير:');
  console.log('   البريد: admin@sed.menofia.edu.eg');
  console.log('   كلمة السر: Admin@123');
  console.log('');
  console.log('👨‍🏫 الدكتور:');
  console.log('   البريد: doctor@sed.menofia.edu.eg');
  console.log('   كلمة السر: Doctor@123');
  console.log('');
  console.log('👨‍🎓 الطالب:');
  console.log('   البريد: student@sed.menofia.edu.eg');
  console.log('   كلمة السر: Student@123');
  console.log('');
  console.log('═══════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في إنشاء البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
