import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const isRead = searchParams.get('isRead');

    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (isRead !== null && isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notifications.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notifications.count({ where: whereClause }),
      prisma.notifications.count({
        where: {
          userId: session.user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ success: false, error: 'خطأ في جلب الإشعارات' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, action } = body;

    if (action === 'MARK_READ' && notificationId) {
      const notification = await prisma.notifications.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return NextResponse.json({ success: false, error: 'الإشعار غير موجود' }, { status: 404 });
      }

      if (notification.userId !== session.user.id && session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
      }

      await prisma.notifications.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, data: { id: notificationId } });
    }

    if (action === 'MARK_ALL_READ') {
      await prisma.notifications.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: { isRead: true },
      });

      return NextResponse.json({ success: true, data: { markedAll: true } });
    }

    return NextResponse.json({ success: false, error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({ success: false, error: 'خطأ في تحديث الإشعار' }, { status: 500 });
  }
}
