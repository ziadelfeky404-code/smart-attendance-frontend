import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { sendAppointmentNotification } from '@/lib/notifications';

interface RouteParams {
  params: Promise<{ id?: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};

    if (session.user.role === 'STUDENT') {
      whereClause.studentId = session.user.studentId;
    } else if (session.user.role === 'DOCTOR' || session.user.role === 'TEACHING_ASSISTANT') {
      whereClause.advisorId = session.user.doctorId || session.user.taId;
    } else if (session.user.role === 'SUPER_ADMIN') {
      if (advisorId) whereClause.advisorId = advisorId;
      if (studentId) whereClause.studentId = studentId;
    }

    if (status) whereClause.status = status;

    const appointments = await prisma.advisoryAppointments.findMany({
      where: whereClause,
      include: {
        student: { include: { user: { select: { id: true, name: true, email: true } } } },
        advisor: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ success: false, error: 'خطأ في جلب المواعيد' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { advisorId, scheduledAt, reason } = body;

    let studentId: string;

    if (session.user.role === 'STUDENT') {
      studentId = session.user.studentId!;
    } else {
      return NextResponse.json({ success: false, error: 'فقط الطلاب يمكنهم حجز مواعيد' }, { status: 403 });
    }

    if (!advisorId || !scheduledAt) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 });
    }

    const scheduledDate = new Date(scheduledAt);

    if (scheduledDate <= new Date()) {
      return NextResponse.json({ success: false, error: 'لا يمكن حجز موعد في الماضي' }, { status: 400 });
    }

    const existingAppointment = await prisma.advisoryAppointments.findFirst({
      where: {
        advisorId,
        scheduledAt: scheduledDate,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });

    if (existingAppointment) {
      return NextResponse.json({ success: false, error: 'هذا الموعد محجوز مسبقاً' }, { status: 409 });
    }

    const appointment = await prisma.advisoryAppointments.create({
      data: {
        studentId,
        advisorId,
        scheduledAt: scheduledDate,
        reason: reason || 'طلب موعد إرشاد',
        status: 'PENDING',
      },
      include: {
        student: { include: { user: true } },
        advisor: { include: { user: true } },
      },
    });

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_APPOINTMENT',
        entityType: 'ADVISORY_APPOINTMENT',
        entityId: appointment.id,
        details: `تم حجز موعد مع المرشد ${appointment.advisor.user.name}`,
      },
    });

    await sendAppointmentNotification(appointment.id, 'CREATED');

    return NextResponse.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ success: false, error: 'خطأ في حجز الموعد' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    if (session.user.role !== 'DOCTOR' && session.user.role !== 'TEACHING_ASSISTANT' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بهذا الإجراء' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentId, action, suggestedTime } = body;

    if (!appointmentId || !action) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 });
    }

    const appointment = await prisma.advisoryAppointments.findUnique({
      where: { id: appointmentId },
      include: {
        advisor: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ success: false, error: 'الموعد غير موجود' }, { status: 404 });
    }

    const isAdvisor = (session.user.doctorId === appointment.advisorId || session.user.taId === appointment.advisorId);

    if (!isAdvisor && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح بهذا الإجراء' }, { status: 403 });
    }

    let updatedAppointment;

    if (action === 'APPROVE') {
      updatedAppointment = await prisma.advisoryAppointments.update({
        where: { id: appointmentId },
        data: { status: 'APPROVED' },
      });
      await sendAppointmentNotification(appointmentId, 'APPROVED');
    } else if (action === 'REJECT') {
      updatedAppointment = await prisma.advisoryAppointments.update({
        where: { id: appointmentId },
        data: { status: 'REJECTED' },
      });
      await sendAppointmentNotification(appointmentId, 'REJECTED');
    } else if (action === 'COMPLETE') {
      updatedAppointment = await prisma.advisoryAppointments.update({
        where: { id: appointmentId },
        data: { status: 'COMPLETED' },
      });
    } else if (action === 'RESCHEDULE' && suggestedTime) {
      updatedAppointment = await prisma.advisoryAppointments.update({
        where: { id: appointmentId },
        data: {
          scheduledAt: new Date(suggestedTime),
          status: 'PENDING',
        },
      });

      const existingAppointment = await prisma.advisoryAppointments.findFirst({
        where: {
          advisorId: appointment.advisorId,
          scheduledAt: new Date(suggestedTime),
          status: { in: ['PENDING', 'APPROVED'] },
          id: { not: appointmentId },
        },
      });

      if (existingAppointment) {
        return NextResponse.json({ success: false, error: 'هذا الموعد محجوز مسبقاً' }, { status: 409 });
      }

      await sendAppointmentNotification(appointmentId, 'CREATED');
    } else {
      return NextResponse.json({ success: false, error: 'إجراء غير صالح' }, { status: 400 });
    }

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: action === 'APPROVE' ? 'APPROVE_APPOINTMENT' : action === 'REJECT' ? 'REJECT_APPOINTMENT' : 'UPDATE_APPOINTMENT',
        entityType: 'ADVISORY_APPOINTMENT',
        entityId: appointmentId,
        details: `تم ${action === 'APPROVE' ? 'اعتماد' : action === 'REJECT' ? 'رفض' : 'تعديل'} الموعد`,
      },
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الموعد' }, { status: 500 });
  }
}
