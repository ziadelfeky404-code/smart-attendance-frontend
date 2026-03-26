'use client';
import React, { useState, useRef, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { Bot, Send, User, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعد CampusMind الذكي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('https://server-pied-nu.vercel.app/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'ما هي نسبة حضورك؟',
    'كيف أتحقق من جدولي؟',
    'ما هي شروط التخرج؟',
    'كيف أتواصل مع مرشدي؟',
  ];

  return (
    <div className="min-h-screen bg-dark">
      <Navbar />
      <main className="lg:pr-64 pt-24 p-4 h-screen flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-black mb-2">المساعد الذكي</h1>
          <p className="text-dark-400">اسأل أي سؤال عن النظام الأكاديمي</p>
        </div>

        <div className="flex-1 card flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-primary' : 'bg-accent'
                }`}>
                  {msg.role === 'user' ? (
                    <User size={20} />
                  ) : (
                    <Bot size={20} />
                  )}
                </div>
                <div className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20 text-right' 
                    : 'bg-dark-200 text-right'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs text-dark-400 mt-2">
                    {msg.timestamp.toLocaleTimeString('ar-EG')}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <Bot size={20} />
                </div>
                <div className="bg-dark-200 rounded-2xl p-4">
                  <Loader2 size={20} className="animate-spin text-accent" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3 items-center text-danger bg-danger/10 rounded-xl p-4">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <p className="text-sm text-dark-400 mb-2">أسئلة سريعة:</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t border-dark-300">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 input-field"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary px-4"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
