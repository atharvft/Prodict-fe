import React, { useState } from 'react';
import { overwhelmAPI } from '../services/api';
import { Heart, X, Loader2, Sparkles } from 'lucide-react';

export default function OverwhelmMode({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const trigger = async () => {
    setLoading(true);
    try {
      const { data: result } = await overwhelmAPI.trigger();
      setData(result);
      setTriggered(true);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!triggered) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D1A]/30 backdrop-blur-md" data-testid="overwhelm-overlay">
        <div className="bg-[#F9F8F6] rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl animate-fade-in-up text-center">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-[#E8E5DF] rounded-xl text-[#575E56]">
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-2xl bg-[#8BA38A]/20 flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-[#8BA38A]" />
          </div>
          <h2 className="font-['Manrope'] text-2xl font-bold text-[#1A1D1A] mb-3">Feeling Overwhelmed?</h2>
          <p className="text-[#575E56] font-['Figtree'] mb-6 leading-relaxed">
            That's okay. Let AURA simplify everything for you. We'll narrow your focus to just 3 things that matter most right now.
          </p>
          <button
            data-testid="overwhelm-activate-button"
            onClick={trigger}
            disabled={loading}
            className="w-full py-3.5 px-6 bg-[#8BA38A] text-[#F9F8F6] rounded-xl hover:bg-[#738C71] transition-colors font-['Figtree'] font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Finding your calm...</> : <><Sparkles className="w-5 h-5" /> Simplify My Day</>}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1D1A]/30 backdrop-blur-md" data-testid="overwhelm-mode">
      <div className="bg-[#F9F8F6] rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl animate-fade-in-up relative">
        <button onClick={onClose} data-testid="overwhelm-close-button" className="absolute top-4 right-4 p-2 hover:bg-[#E8E5DF] rounded-xl text-[#575E56]">
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[#8BA38A]/20 flex items-center justify-center mb-5">
          <Heart className="w-6 h-6 text-[#8BA38A]" />
        </div>

        <p className="text-[#1A1D1A] font-['Figtree'] text-lg leading-relaxed mb-6" data-testid="overwhelm-message">
          {data?.message || "Take a deep breath. Focus on just these tasks today."}
        </p>

        {data?.ai_unavailable && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-[#E8B273]/10 border border-[#E8B273]/20 text-[#E8B273] text-xs font-['Figtree']">
            AI is recharging. Here are your priorities based on task importance.
          </div>
        )}

        <div className="space-y-3 mb-6">
          {(data?.focus_tasks || []).map((task, i) => (
            <div key={i} className="flex gap-4 p-4 bg-[#F2F0EA] rounded-2xl animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }} data-testid={`overwhelm-task-${i}`}>
              <div className="w-8 h-8 rounded-full bg-[#8BA38A] text-[#F9F8F6] flex items-center justify-center text-sm font-bold flex-shrink-0 font-['Manrope']">
                {i + 1}
              </div>
              <div>
                <p className="font-['Manrope'] font-semibold text-[#1A1D1A]">{task.title}</p>
                <p className="text-sm text-[#575E56] font-['Figtree'] mt-0.5">{task.why}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#575E56] font-['Figtree']">
          Everything else can wait. You've got this.
        </p>
      </div>
    </div>
  );
}
