import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import AuraLogo from '../components/AuraLogo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(e => e.msg).join(' ') : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-[#2D372B]">
        <div className="absolute inset-0 bg-[#1A1D1A]/40 backdrop-blur-sm" />
        <div className="relative z-10 text-center p-12">
          <div className="flex justify-center mb-8">
            <AuraLogo size={44} variant="wordmark" className="drop-shadow-xl" theme="dark" />
          </div>
          <p className="text-[#F9F8F6]/80 font-['Figtree'] text-lg max-w-sm">Your autonomous AI advisor that thinks, plans, and acts for you.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <AuraLogo size={40} variant="wordmark" />
          </div>

          <h2 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight mb-2">Welcome back</h2>
          <p className="text-[#575E56] mb-8 font-['Figtree']">Sign in to continue to your productivity hub.</p>

          {error && (
            <div data-testid="login-error" className="mb-4 p-3 rounded-xl bg-[#D46B6B]/10 border border-[#D46B6B]/20 text-[#D46B6B] text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-semibold text-[#575E56] mb-2">Email</label>
              <input
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all text-[#1A1D1A] font-['Figtree']"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs tracking-[0.2em] uppercase font-semibold text-[#575E56] mb-2">Password</label>
              <div className="relative">
                <input
                  data-testid="login-password-input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all text-[#1A1D1A] font-['Figtree']"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#575E56] hover:text-[#C27A63]">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-['Figtree'] font-medium shadow-sm disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-[#575E56] text-sm font-['Figtree']">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#C27A63] hover:text-[#A6634D] font-medium" data-testid="signup-link">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
