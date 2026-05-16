import React, { useState } from 'react';
import { overwhelmAPI } from '../services/api';
import { Heart, X, Loader2, Sparkles } from 'lucide-react';

export default function OverwhelmMode({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const trigger = async () => {
    setLoading(true);
    try { const { data: result } = await overwhelmAPI.trigger(); setData(result); setTriggered(true); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!triggered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--text-primary) 30%, transparent)', backdropFilter: 'blur(8px)' }} data-testid="overwhelm-overlay">
        <div className="rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up text-center relative" style={{ background: 'var(--bg-primary)' }}>
          <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }}><X className="w-5 h-5" /></button>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
            <Heart className="w-8 h-8" style={{ color: 'var(--success)' }} />
          </div>
          <h2 className="font-['Manrope'] text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Feeling Overwhelmed?</h2>
          <p className="font-['Figtree'] mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            That's okay. Let AURA simplify everything for you. We'll narrow your focus to just 3 things that matter most right now.
          </p>
          <button data-testid="overwhelm-activate-button" onClick={trigger} disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl font-['Figtree'] font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}>
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Finding your calm...</> : <><Sparkles className="w-5 h-5" /> Simplify My Day</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--text-primary) 30%, transparent)', backdropFilter: 'blur(8px)' }} data-testid="overwhelm-mode">
      <div className="rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-fade-in-up relative" style={{ background: 'var(--bg-primary)' }}>
        <button onClick={onClose} data-testid="overwhelm-close-button" className="absolute top-4 right-4 p-2 rounded-xl" style={{ color: 'var(--text-secondary)' }}><X className="w-5 h-5" /></button>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)' }}>
          <Heart className="w-6 h-6" style={{ color: 'var(--success)' }} />
        </div>
        <p className="font-['Figtree'] text-lg leading-relaxed mb-6" style={{ color: 'var(--text-primary)' }} data-testid="overwhelm-message">{data?.message || "Take a deep breath. Focus on just these tasks today."}</p>
        {data?.ai_unavailable && (
          <div className="mb-4 px-3 py-2 rounded-lg text-xs font-['Figtree']" style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', color: 'var(--warning)' }}>
            AI is recharging. Here are your priorities based on task importance.
          </div>
        )}
        <div className="space-y-3 mb-6">
          {(data?.focus_tasks || []).map((task, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl animate-fade-in-up" style={{ background: 'var(--bg-tertiary)', animationDelay: `${i * 0.1}s` }} data-testid={`overwhelm-task-${i}`}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 font-['Manrope']" style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}>{i + 1}</div>
              <div>
                <p className="font-['Manrope'] font-semibold" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                <p className="text-sm mt-0.5 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>{task.why}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Everything else can wait. You've got this.</p>
      </div>
    </div>
  );
}
