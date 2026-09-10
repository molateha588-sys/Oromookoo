import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, AlertCircle, Mail, Lock, User as UserIcon, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User as UserType } from '../../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  onNavigateToForgot: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToForgot,
  onShowToast
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const trimmedIdentifier = (identifier || '').trim();
    const trimmedPass = (password || '').trim();

    if (!trimmedIdentifier || !trimmedPass) {
      setError('Please enter both your Username/Gmail and Password.');
      setLoading(false);
      return;
    }

    try {
      const result = await storageService.login(trimmedIdentifier, trimmedPass);
      
      if (!result.success || !result.user) {
        setError(result.error || 'Invalid Username/Gmail or Password. Access denied.');
        setPassword('');
        setLoading(false);
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
        return;
      }

      // Clear login credentials from memory
      setIdentifier('');
      setPassword('');

      onShowToast('Signed In', `Welcome back, ${result.user.full_name || result.user.username}!`, 'success');
      onLoginSuccess(result.user);
    } catch (err: any) {
      setError(err.message || 'An unexpected authentication error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0b1319] overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#0b7285]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#0078d7]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 my-auto">
        {/* Portal Login Container */}
        <div 
          className="rounded-[36px] sm:rounded-[40px] p-7 sm:p-9 text-white border border-white/20 backdrop-blur-md shadow-2xl relative"
          style={{
            background: 'rgba(0, 120, 215, 0.22)',
            boxShadow: '0 0 40px rgba(0, 150, 255, 0.35)'
          }}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/15 border border-white/25 text-cyan-200 mb-3 shadow-sm">
              <ShieldCheck className="w-7 h-7 text-cyan-200" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Biiroo Eegumsa Fayyaa
            </h1>
            <p className="text-xs text-blue-100/80 mt-1 font-medium">
              Health Operational Portal & Spreadsheet Hub
            </p>
          </div>

          {error && (
            <div id="login-error-banner" className="mb-4 p-3.5 rounded-2xl border border-rose-400/40 bg-rose-950/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input: Username or Gmail */}
            <div>
              <label htmlFor="login-username" className="block text-xs font-bold text-blue-100/90 mb-1.5 ml-1">
                Username or Gmail
              </label>
              <div 
                className="flex items-center rounded-2xl px-3.5 py-3 transition-all border border-white/20 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/30"
                style={{ background: 'rgba(0, 70, 140, 0.65)' }}
              >
                <UserIcon className="w-4 h-4 text-blue-200 shrink-0" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter Username or Gmail"
                  className="w-full bg-transparent border-none text-white placeholder-blue-200/50 text-sm pl-2.5 outline-none focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Input: Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
                <label htmlFor="login-password" className="text-xs font-bold text-blue-100/90">
                  Password
                </label>
                <button
                  type="button"
                  id="login-forgot-link"
                  onClick={onNavigateToForgot}
                  className="text-xs text-cyan-200 hover:text-white hover:underline transition-colors font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div 
                className="flex items-center rounded-2xl px-3.5 py-3 transition-all border border-white/20 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/30 relative"
                style={{ background: 'rgba(0, 70, 140, 0.65)' }}
              >
                <Lock className="w-4 h-4 text-blue-200 shrink-0" />
                <input
                  ref={passwordInputRef}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full bg-transparent border-none text-white placeholder-blue-200/50 text-sm pl-2.5 pr-8 outline-none focus:outline-none focus:ring-0"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-blue-200 hover:text-white transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl text-white font-black text-sm tracking-wider uppercase shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-5 flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: '#005a9e',
                boxShadow: '0 4px 18px rgba(0, 90, 158, 0.45)'
              }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>LOGIN TO PORTAL</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
