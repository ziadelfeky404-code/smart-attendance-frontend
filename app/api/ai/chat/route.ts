import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function getStudentContext(userId: string): Promise<string> {
  const student = await prisma.students.findFirst({
    where: { userId },
    include: {
      user: true,
      enrollments: {
        include: {
          course: true,
        },
      },
    },
  });

  if (!student) {
    return 'طالب غير مسجل في أي مواد';
  }

  const courses = student.enrollments.map(e => e.course.name).join(', ') || 'لا توجد مواد مسجلة';
  const absenceCount = await prisma.attendanceRecords.count({
    where: {
      enrollment: { studentId: student.id },
      status: 'ABSENT',
    },
  });

  return `
الاسم: ${student.user.name}
الرقم الجامعي: ${student.studentId}
السنة الدراسية: ${student.year}
المستوى: ${student.level}
المواد المسجلة: ${courses}
إجمالي الغياب: ${absenceCount} غياب
`;
}

async function searchDocuments(query: string): Promise<string> {
  const documents = await prisma.documentLibrary.findMany({
    where: {
      isActive: true,
      category: { in: ['REGULATIONS', 'GUIDELINES', 'POLICIES'] },
    },
  });

  if (documents.length === 0) {
    return 'لا توجد وثائق متاحة في قاعدة المعرفة';
  }

  const relevantDocs = documents.filter(doc => {
    const searchLower = query.toLowerCase();
    return (
      doc.title.toLowerCase().includes(searchLower) ||
      doc.description.toLowerCase().includes(searchLower)
    );
  });

  return relevantDocs
    .map(doc => `[${doc.category}]: ${doc.title}\n${doc.description}`)
    .join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'الرسالة مطلوبة' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'خدمة الذكاء الاصطناعي غير متاحة حالياً'
      }, { status: 503 });
    }

    const studentContext = await getStudentContext(session.user.id);
    const knowledgeBase = await searchDocuments(message);

    const systemPrompt = `أنت مساعد ذكي لجامعة المنوفية، كلية التربية النوعية. مهمتك هي مساعدة الطلاب في الإجابة على استفساراتهم الأكاديمية والإرشادية.

معلومات الطالب الحالي:
${studentContext}

قاعدة المعرفة:
${knowledgeBase}

قواعد مهمة:
1. يجب الرد باللغة العربية فقط
2. كن ودوداً ومهنياً
3. إذا لم تجد إجابة في قاعدة المعرفة، أخبر الطالب بذلك واقترح عليه التواصل مع المرشد الأكاديمي
4. قدم معلومات دقيقة ومفيدة
5. لا تخترع معلومات غير موجودة في قاعدة المعرفة
6. راعِ السياق الأكاديمي للطالب (مواده، نسبة غيابه، etc.)
7. إذا سأل عن لوائح أو قوانين، ابحث في قاعدة المعرفة أولاً`;

    const messages: Anthropic.MessageParam[] = [
      ...(conversationHistory || []).slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const assistantMessage = response.content[0];
    let responseText = '';

    if (assistantMessage.type === 'text') {
      responseText = assistantMessage.text;
    }

    await prisma.auditLogs.create({
      data: {
        userId: session.user.id,
        action: 'AI_CHAT',
        entityType: 'CHAT',
        entityId: null,
        details: `سؤال: ${message.substring(0, 100)}...`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: responseText,
        conversationId: session.user.id,
      },
    });
  } catch (error) {
    console.error('AI Chat error:', error);

    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json({
        success: false,
        error: 'حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي'
      }, { status: 503 });
    }

    return NextResponse.json({
      success: false,
      error: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
    }, { status: 500 });
  }
}
