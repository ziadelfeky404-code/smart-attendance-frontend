import { prisma } from './prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'APPOINTMENT';
  link?: string;
}

export async function sendInAppNotification(data: NotificationData) {
  return prisma.notifications.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      isRead: false,
    },
  });
}

export async function sendEmailNotification(
  to: string,
  subject: string,
  htmlContent: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}

export async function sendAbsenceAlert(studentId: string, courseId: string) {
  const student = await prisma.users.findUnique({
    where: { id: studentId },
    include: { student: true },
  });

  const course = await prisma.courses.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          teachingAssistant: { include: { user: true } },
          doctor: { include: { user: true } },
        },
      },
    },
  });

  if (!student || !course) return;

  const enrollments = await prisma.enrollments.findMany({
    where: { studentId: student.student?.id, courseId },
    include: {
      attendanceRecords: true,
    },
  });

  let totalSessions = 0;
  let attendedSessions = 0;

  for (const enrollment of enrollments) {
    const sessions = await prisma.attendanceSessions.count({
      where: {
        section: {
          courseId,
        },
        status: 'COMPLETED',
        date: { lte: new Date() },
      },
    });
    totalSessions = sessions;
    attendedSessions = enrollment.attendanceRecords.filter(r => r.status === 'PRESENT').length;
  }

  if (totalSessions === 0) return;

  const absenceRate = ((totalSessions - attendedSessions) / totalSessions) * 100;

  if (absenceRate >= 25) {
    const studentName = student.name || 'الطالب';
    const courseName = course.name;
    const alertMessage = `تنبيه: نسبة غيابك في مادة ${courseName} وصلت ${absenceRate.toFixed(1)}%`;

    await sendInAppNotification({
      userId: studentId,
      title: 'تنبيه غياب',
      message: alertMessage,
      type: 'ALERT',
      link: '/student/attend',
    });

    const sections = course.sections;
    for (const section of sections) {
      if (section.doctor) {
        await sendInAppNotification({
          userId: section.doctor.userId,
          title: 'طالب تجاوز 25% غياب',
          message: `الطالب ${studentName} تجاوز نسبة 25% غياب في مادة ${courseName}`,
          type: 'ALERT',
          link: '/doctor/advisory',
        });
      }
      if (section.teachingAssistant) {
        await sendInAppNotification({
          userId: section.teachingAssistant.userId,
          title: 'طالب تجاوز 25% غياب',
          message: `الطالب ${studentName} تجاوز نسبة 25% غياب في مادة ${courseName}`,
          type: 'ALERT',
          link: '/doctor/advisory',
        });
      }
    }

    const emailHtml = `
      <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
        <h2 style="color: #ef4444;">⚠️ تنبيه غياب</h2>
        <p>مرحباً ${studentName},</p>
        <p>نسبة غيابك في مادة <strong>${courseName}</strong> وصلت <strong>${absenceRate.toFixed(1)}%</strong>.</p>
        <p>يرجى التواصل مع المرشد الأكاديمي للتظلم أو شرح الأسباب.</p>
        <p>مع أطيب التحيات،<br>نظام Smart Campus - جامعة المنوفية</p>
      </div>
    `;

    await sendEmailNotification(
      student.email,
      `⚠️ تنبيه غياب - ${courseName}`,
      emailHtml
    );
  }
}

export async function sendAppointmentNotification(
  appointmentId: string,
  type: 'CREATED' | 'APPROVED' | 'REJECTED' | 'REMINDER'
) {
  const appointment = await prisma.advisoryAppointments.findUnique({
    where: { id: appointmentId },
    include: {
      student: { include: { user: true } },
      advisor: { include: { user: true } },
    },
  });

  if (!appointment) return;

  const studentName = appointment.student.user.name || 'الطالب';
  const advisorName = appointment.advisor.user.name || 'الدكتور';
  const dateStr = new Date(appointment.scheduledAt).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let title: string;
  let message: string;
  let studentEmailHtml: string;
  let advisorEmailHtml: string;

  switch (type) {
    case 'CREATED':
      title = 'طلب موعد إرشاد جديد';
      message = `تم إرسال طلب موعد إرشاد للدكتور ${advisorName} يوم ${dateStr}`;
      studentEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #6366f1;">📅 تم إرسال طلب موعد الإرشاد</h2>
          <p>مرحباً ${studentName},</p>
          <p>تم إرسال طلب موعد إرشاد للدكتور ${advisorName}.</p>
          <p>الموعد المطلوب: <strong>${dateStr}</strong></p>
          <p>سيتم إخطارك عند اعتماد الموعد.</p>
        </div>
      `;
      advisorEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #6366f1;">📅 طلب موعد إرشاد جديد</h2>
          <p>أ.د ${advisorName},</p>
          <p>لديك طلب موعد إرشاد جديد من الطالب ${studentName}.</p>
          <p>الموعد المطلوب: <strong>${dateStr}</strong></p>
          <p>يرجى مراجعة الطلب واعتماده أو رفضه.</p>
        </div>
      `;
      break;

    case 'APPROVED':
      title = 'تم اعتماد موعد الإرشاد';
      message = `تم اعتماد موعد الإرشاد يوم ${dateStr}`;
      studentEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #10b981;">✅ تم اعتماد موعد الإرشاد</h2>
          <p>مرحباً ${studentName},</p>
          <p>تم اعتماد موعد الإرشاد الخاص بك.</p>
          <p>الموعد: <strong>${dateStr}</strong></p>
          <p>مع أ.د ${advisorName}</p>
        </div>
      `;
      advisorEmailHtml = '';
      break;

    case 'REJECTED':
      title = 'تم رفض موعد الإرشاد';
      message = `تم رفض موعد الإرشاد. يمكنك محاولة حجز موعد آخر.`;
      studentEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #f59e0b;">❌ تم رفض موعد الإرشاد</h2>
          <p>مرحباً ${studentName},</p>
          <p>نأسف، تم رفض موعد الإرشاد المطلوب.</p>
          <p>يمكنك محاولة حجز موعد آخر من خلال النظام.</p>
        </div>
      `;
      advisorEmailHtml = '';
      break;

    case 'REMINDER':
      title = 'تذكير بموعد الإرشاد';
      message = `تذكير: لديك موعد إرشاد غداً الساعة ${new Date(appointment.scheduledAt).toLocaleTimeString('ar-EG')}`;
      studentEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #6366f1;">⏰ تذكير بموعد الإرشاد</h2>
          <p>مرحباً ${studentName},</p>
          <p>تذكير: لديك موعد إرشاد غداً.</p>
          <p>الموعد: <strong>${dateStr}</strong></p>
          <p>مع أ.د ${advisorName}</p>
        </div>
      `;
      advisorEmailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right;">
          <h2 style="color: #6366f1;">⏰ تذكير بموعد الإرشاد</h2>
          <p>أ.د ${advisorName},</p>
          <p>تذكير: لديك موعد إرشاد غداً مع الطالب ${studentName}.</p>
          <p>الموعد: <strong>${dateStr}</strong></p>
        </div>
      `;
      break;

    default:
      return;
  }

  await sendInAppNotification({
    userId: appointment.student.userId,
    title,
    message,
    type: 'APPOINTMENT',
    link: '/student/appointments',
  });

  if (type !== 'REMINDER' || studentEmailHtml) {
    await sendEmailNotification(
      appointment.student.user.email,
      title,
      studentEmailHtml
    );
  }

  if (advisorEmailHtml) {
    await sendEmailNotification(
      appointment.advisor.user.email,
      title,
      advisorEmailHtml
    );
  }
}
