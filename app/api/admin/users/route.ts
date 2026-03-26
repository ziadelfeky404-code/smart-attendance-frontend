import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const whereClause: Record<string, unknown> = {};

    if (role) whereClause.role = role;
    if (isActive !== null) whereClause.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        include: {
          student: true,
          doctor: true,
          teachingAssistant: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.users.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ success: false, error: 'خطأ في جلب المستخدمين' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password, name, role, studentId, doctorId, taId, department } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 });
    }

    const domain = process.env.UNIVERSITY_EMAIL_DOMAIN || 'sed.menofia.edu.eg';
    if (!email.endsWith(`@${domain}`)) {
      return NextResponse.json({ success: false, error: `يجب استخدام بريد جامعي ينتهي بـ @${domain}` }, { status: 400 });
    }

    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'هذا البريد مسجل مسبقاً' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let userData: Record<string, unknown> = {
      email,
      password: hashedPassword,
      name,
      role,
      department: department || null,
      isActive: true,
      deviceFingerprint: null,
    };

    if (role === 'STUDENT' && !studentId) {
      const lastStudent = await prisma.students.findFirst({
        orderBy: { id: 'desc' },
      });
      const newStudentId = `STU${String((lastStudent?.id ? parseInt(lastStudent.id.replace('STU', '')) : 0) + 1).padStart(6, '0')}`;

      const student = await prisma.students.create({
        data: {
          userId: '',
          studentId: newStudentId,
          year: new Date().getFullYear(),
          gpa: 0,
        },
      });

      userData.studentId = student.id;
    } else if (role === 'DOCTOR' && !doctorId) {
      const lastDoctor = await prisma.doctors.findFirst({
        orderBy: { id: 'desc' },
      });
      const newDoctorId = `DOC${String((lastDoctor?.id ? parseInt(lastDoctor.id.replace('DOC', '')) : 0) + 1).padStart(4, '0')}`;

      const doctor = await prisma.doctors.create({
        data: {
          userId: '',
          doctorId: newDoctorId,
          title: 'دكتور',
          office: '',
        },
      });

      userData.doctorId = doctor.id;
    } else if (role === 'TEACHING_ASSISTANT' && !taId) {
      const lastTA = await prisma.teachingAssistants.findFirst({
        orderBy: { id: 'desc' },
      });
      const newTaId = `TA${String((lastTA?.id ? parseInt(lastTA.id.replace('TA', '')) : 0) + 1).padStart(4, '0')}`;

      const ta = await prisma.teachingAssistants.create({
        data: {
          userId: '',
          taId: newTaId,
        },
      });

      userData.taId = ta.id;
    }

    const user = await prisma.users.create({
      data: userData as Parameters<typeof prisma.users.create>[0]['data'],
      include: {
        student: true,
        doctor: true,
        teachingAssistant: true,
      },
    });

    if (role === 'STUDENT' && user.student) {
      await prisma.students.update({
        where: { id: user.student.id },
        data: { userId: user.id },
      });
    } else if (role === 'DOCTOR' && user.doctor) {
      await prisma.doctors.update({
        where: { id: user.doctor.id },
        data: { userId: user.id },
      });
    } else if (role === 'TEACHING_ASSISTANT' && user.teachingAssistant) {
      await prisma.teachingAssistants.update({
        where: { id: user.teachingAssistant.id },
        data: { userId: user.id },
      });
    }

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: user.id,
        details: `تم إنشاء مستخدم جديد: ${email} بالدور ${role}`,
      },
    });

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ success: false, error: 'خطأ في إنشاء المستخدم' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, isActive, deviceFingerprint } = body;

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    let updatedUser;

    if (action === 'TOGGLE_ACTIVE') {
      updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { isActive: !user.isActive },
      });

      await prisma.auditLogs.create({
        data: {
          userId: session.user.id,
          action: user.isActive ? 'DEACTIVATE_USER' : 'ACTIVATE_USER',
          entityType: 'USER',
          entityId: userId,
          details: `${user.isActive ? 'تم إيقاف' : 'تم تفعيل'} حساب ${user.email}`,
        },
      });
    } else if (action === 'APPROVE_DEVICE') {
      updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          deviceFingerprint,
          isActive: true,
        },
      });

      await prisma.auditLogs.create({
        data: {
          userId: session.user.id,
          action: 'APPROVE_DEVICE_CHANGE',
          entityType: 'USER',
          entityId: userId,
          details: `تم اعتماد تغيير الجهاز للمستخدم ${user.email}`,
        },
      });
    } else if (action === 'UPDATE') {
      const { name, department } = body;
      updatedUser = await prisma.users.update({
        where: { id: userId },
        data: {
          name: name || user.name,
          department: department !== undefined ? department : user.department,
        },
      });

      await prisma.auditLogs.create({
        data: {
          userId: session.user.id,
          action: 'UPDATE_USER',
          entityType: 'USER',
          entityId: userId,
          details: `تم تحديث بيانات ${user.email}`,
        },
      });
    } else {
      return NextResponse.json({ success: false, error: 'إجراء غير صالح' }, { status: 400 });
    }

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, error: 'خطأ في تحديث المستخدم' }, { status: 500 });
  }
}
