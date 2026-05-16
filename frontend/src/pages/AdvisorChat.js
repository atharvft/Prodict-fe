import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Send, Trash2, Sparkles, User, AlertCircle, Lightbulb } from 'lucide-react';
import AuraLogo from '../components/AuraLogo';

const SUGGESTED_PROMPTS = [
  "What should I focus on today?",
  "I feel overwhelmed, help me simplify my day",
  "Help me decide what to prioritize this week",
  "I'm procrastinating on a big task, any advice?",
];

export default function AdvisorChat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadHistory = async () => {
    try {
      const { data } = await chatAPI.history();
      const formatted = data.flatMap(c => [
        { role: 'user', content: c.message, id: c.id + '-u' },
        { role: 'assistant', content: c.response, id: c.id + '-a' },
      ]);
      setMessages(formatted);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || sending) return;
    const userMsg = { role: 'user', content: text, id: Date.now() + '-u' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const { data } = await chatAPI.send(text);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: data.id + '-a' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: Date.now() + '-err' }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const clearHistory = async () => {
    try { await chatAPI.clear(); setMessages([]); } catch (e) { console.error(e); }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  return (
    <div className="flex flex-col h-full" data-testid="advisor-chat-page">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D372B]/8 backdrop-blur-xl bg-[#F9F8F6]/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F2F0EA] flex items-center justify-center overflow-hidden">
            <AuraLogo size={36} />
          </div>
          <div>
            <h2 className="font-['Manrope'] text-lg font-bold text-[#1A1D1A]">AURA Advisor</h2>
            <p className="text-xs text-[#575E56] font-['Figtree']">Your AI productivity coach</p>
          </div>
        </div>
        <button onClick={clearHistory} data-testid="clear-chat-button" className="p-2 rounded-xl hover:bg-[#E8E5DF] text-[#575E56] hover:text-[#D46B6B] transition-colors" title="Clear history">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6" data-testid="chat-messages">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#F2F0EA] flex items-center justify-center mb-6 overflow-hidden">
              <AuraLogo size={48} />
            </div>
            <h3 className="font-['Manrope'] text-2xl font-bold text-[#1A1D1A] mb-2">Hi {user?.name?.split(' ')[0]}!</h3>
            <p className="text-[#575E56] font-['Figtree'] mb-8">I'm your AI advisor. Ask me about productivity, priorities, decisions, or anything that's on your mind.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  data-testid={`suggested-prompt-${i}`}
                  onClick={() => sendMessage(p)}
                  className="text-left p-3 rounded-xl border border-[#2D372B]/10 hover:border-[#C27A63]/30 hover:bg-[#F2F0EA] transition-all text-sm text-[#575E56] font-['Figtree'] flex items-start gap-2"
                >
                  <Lightbulb className="w-4 h-4 text-[#E8B273] flex-shrink-0 mt-0.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-[#F2F0EA] flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden">
                    <AuraLogo size={28} />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-['Figtree'] ${
                  msg.role === 'user'
                    ? 'bg-[#C27A63] text-[#F9F8F6] rounded-br-md'
                    : 'bg-[#F2F0EA] text-[#1A1D1A] rounded-bl-md border border-[#2D372B]/5'
                }`} data-testid={`chat-message-${msg.role}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-[#8BA38A] flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-[#F9F8F6]" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-lg bg-[#F2F0EA] flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <AuraLogo size={28} />
                </div>
                <div className="bg-[#F2F0EA] px-4 py-3 rounded-2xl rounded-bl-md border border-[#2D372B]/5">
                  <div className="flex gap-1.5"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-[#2D372B]/8 bg-[#F9F8F6]">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AURA anything..."
            disabled={sending}
            className="flex-1 px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree'] disabled:opacity-50"
          />
          <button
            data-testid="chat-send-button"
            type="submit"
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors disabled:opacity-50 shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
