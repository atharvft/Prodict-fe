import React, { useState, useEffect, useRef } from 'react';
import { chatAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Send, Trash2, Sparkles, User, Lightbulb, Heart, Mic, MicOff } from 'lucide-react';
import AuraLogo from '../components/AuraLogo';
import OverwhelmMode from '../components/OverwhelmMode';

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
  const [showOverwhelm, setShowOverwhelm] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { loadHistory(); return () => { if (recognitionRef.current) recognitionRef.current.abort(); }; }, []);
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
    setMessages(prev => [...prev, { role: 'user', content: text, id: Date.now() + '-u' }]);
    setInput('');
    setSending(true);
    try {
      const { data } = await chatAPI.send(text);
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, id: data.id + '-a' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', id: Date.now() + '-err' }]);
    } finally { setSending(false); inputRef.current?.focus(); }
  };

  const clearHistory = async () => { try { await chatAPI.clear(); setMessages([]); } catch (e) { console.error(e); } };
  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) { alert('Voice input not supported in this browser'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
    recognition.onresult = (e) => { const text = e.results[0][0].transcript; setInput(prev => prev + ' ' + text); setListening(false); };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return (
    <div className="flex flex-col h-full" data-testid="advisor-chat-page">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)', background: 'var(--glass-bg)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <AuraLogo size={36} />
          </div>
          <div>
            <h2 className="font-['Manrope'] text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AURA Advisor</h2>
            <p className="text-xs font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Your AI productivity coach</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearHistory} data-testid="clear-chat-button" className="p-2 rounded-xl transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <Trash2 className="w-5 h-5" />
          </button>
          <button onClick={() => setShowOverwhelm(true)} data-testid="chat-overwhelm-button" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)' }}>
            <Heart className="w-4 h-4" /> Overwhelmed?
          </button>
        </div>
      </div>

      {showOverwhelm && <OverwhelmMode onClose={() => setShowOverwhelm(false)} />}

      <div className="flex-1 overflow-y-auto px-6 py-6" data-testid="chat-messages">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
              <AuraLogo size={48} />
            </div>
            <h3 className="font-['Manrope'] text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Hi {user?.name?.split(' ')[0]}!</h3>
            <p className="font-['Figtree'] mb-8" style={{ color: 'var(--text-secondary)' }}>I'm your AI advisor. Ask me about productivity, priorities, decisions, or anything that's on your mind.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button key={i} data-testid={`suggested-prompt-${i}`} onClick={() => sendMessage(p)}
                  className="text-left p-3 rounded-xl transition-all text-sm font-['Figtree'] flex items-start gap-2"
                  style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />{p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                    <AuraLogo size={28} />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed font-['Figtree'] ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                  style={msg.role === 'user' ? { background: 'var(--brand-primary)', color: 'var(--text-inverse)' } : { background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}
                  data-testid={`chat-message-${msg.role}`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}>
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {sending && (
              <div className="flex gap-3 animate-fade-in-up">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                  <AuraLogo size={28} />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-light)' }}>
                  <div className="flex gap-1.5"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
          <input ref={inputRef} data-testid="chat-input" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AURA anything..." disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl outline-none transition-all font-['Figtree'] disabled:opacity-50 t-input" />
          <button type="button" data-testid="voice-input-chat" onClick={toggleVoice}
            className="px-3 py-3 rounded-xl transition-colors"
            style={{ background: listening ? 'var(--danger)' : 'var(--bg-secondary)', color: listening ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
            {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button data-testid="chat-send-button" type="submit" disabled={sending || !input.trim()}
            className="px-4 py-3 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
            style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
