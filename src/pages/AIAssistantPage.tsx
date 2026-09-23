import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, Cpu } from 'lucide-react';
import type { ChatMessage } from '@/types';
import type { ApiResponse } from '@/services/apiTypes';
import { apiClient } from '@/services/apiClient';
import { unwrapApiData } from '@/services/apiTypes';

interface AiChatData {
  reply?: string;
  message?: string;
}

const suggestions = [
  'What is the status of esp32-001?',
  'What is the current temperature?',
  'Turn on the buzzer for 5 seconds',
  'Create an automation for PIR motion',
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm your ESP32 IoT assistant. I can help you monitor devices, control actuators, and create automations. What would you like to do?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `u-${crypto.randomUUID?.() ?? Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post<ApiResponse<AiChatData>>('/ai/chat', {
        message: trimmed,
      });
      const data = unwrapApiData(response);

      const reply =
        data?.reply ??
        data?.message ??
        'The AI service returned an empty response.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${crypto.randomUUID?.() ?? Date.now()}`,
          role: 'assistant',
          content: reply,
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message)
          : 'The AI assistant is currently unavailable.';

      setMessages((prev) => [
        ...prev,
        {
          id: `e-${crypto.randomUUID?.() ?? Date.now()}`,
          role: 'assistant',
          content: message,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-accent-violet/20 border border-accent-violet/30 flex items-center justify-center">
          <Bot className="w-6 h-6 text-accent-violet" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">IoT AI Assistant</h2>
          <p className="text-sm text-gray-500">
            Ask about devices, sensors, actuators, or automations
          </p>
        </div>
      </div>

      <div className="glass-card flex flex-col h-[60vh]">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin"
          aria-live="polite"
          aria-busy={loading}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-accent-cyan/20'
                    : 'bg-accent-violet/20 border border-accent-violet/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <Cpu className="w-4 h-4 text-accent-cyan" />
                ) : (
                  <Bot className="w-4 h-4 text-accent-violet" />
                )}
              </div>
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap break-words ${
                  msg.role === 'user'
                    ? 'bg-accent-cyan/10 text-gray-200 rounded-tr-sm'
                    : 'bg-ink-700/60 text-gray-200 rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-lg bg-accent-violet/20 border border-accent-violet/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-accent-violet" />
              </div>
              <div className="bg-ink-700/60 rounded-xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1" aria-label="Generating response">
                  <span className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" />
                  <span
                    className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-gray-500 animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Try asking:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="text-xs text-gray-400 px-3 py-1.5 rounded-lg bg-ink-700/50 border border-white/5 hover:border-accent-cyan/30 hover:text-accent-cyan transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          className="border-t border-white/5 p-3 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={loading}
            placeholder="Ask about your IoT devices…"
            aria-label="Ask the IoT AI assistant"
            className="flex-1 bg-ink-700/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan/50 transition-colors disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Send message"
            className="p-2.5 rounded-lg bg-accent-cyan text-ink-900 hover:bg-accent-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
