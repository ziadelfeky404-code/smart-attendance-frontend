'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ChevronRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'مرحباً! أنا مساعد Smart Campus الذكي. كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن:\n• اللوائح والقوانين الجامعية\n• إجراءات التسجيل\n• سياسة الغياب\n• أي استفسار آخر',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const conversationHistory = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، لا يمكنني الاتصال حالياً. يرجى المحاولة لاحقاً.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white" dir="rtl">
      <div className="container mx-auto max-w-4xl p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-8 h-8 text-indigo-500" />
            المساعد الذكي
          </h1>
          <p className="text-slate-400 mt-1">اسأل أي سؤال عن الجامعة واللوائح</p>
        </div>

        <div className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-indigo-600'
                      : 'bg-emerald-600'
                  }`}
                >
                  {message.role === 'user' ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ الكتابة...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-700 p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 bg-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl px-6 py-3 flex items-center gap-2 transition-colors"
              >
                <span>إرسال</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            'ما هي لوائح الجامعة؟',
            'كيف أسجل في المواد؟',
            'ما هي سياسة الغياب؟',
            'كيف أتواصل مع مرشدي؟',
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setInput(suggestion)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-2 transition-colors"
            >
              <span>{suggestion}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
