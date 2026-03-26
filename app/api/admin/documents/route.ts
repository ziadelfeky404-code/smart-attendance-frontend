import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const isActive = searchParams.get('isActive');

    const whereClause: Record<string, unknown> = {};
    if (category) whereClause.category = category;
    if (isActive !== null) whereClause.isActive = isActive === 'true';

    const documents = await prisma.documentLibrary.findMany({
      where: whereClause,
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ success: false, error: 'خطأ في جلب الملفات' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    if (!file || !title || !category) {
      return NextResponse.json({ success: false, error: 'بيانات ناقصة' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'نوع الملف غير مسموح' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ success: false, error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const document = await prisma.documentLibrary.create({
      data: {
        title,
        description: description || '',
        category,
        fileUrl: `/uploads/documents/${uniqueFileName}`,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: session.user.id,
        isActive: true,
      },
    });

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: document.id,
        details: `تم رفع ملف: ${title}`,
      },
    });

    return NextResponse.json({ success: true, data: document });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ success: false, error: 'خطأ في رفع الملف' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'معرف الملف مطلوب' }, { status: 400 });
    }

    const document = await prisma.documentLibrary.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'الملف غير موجود' }, { status: 404 });
    }

    if (document.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', document.fileUrl);
      try {
        await unlink(filePath);
      } catch (error) {
        console.warn('File deletion warning:', error);
      }
    }

    await prisma.documentLibrary.update({
      where: { id: documentId },
      data: { isActive: false },
    });

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: 'DELETE_DOCUMENT',
        entityType: 'DOCUMENT',
        entityId: documentId,
        details: `تم حذف ملف: ${document.title}`,
      },
    });

    return NextResponse.json({ success: true, data: { id: documentId } });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ success: false, error: 'خطأ في حذف الملف' }, { status: 500 });
  }
}
