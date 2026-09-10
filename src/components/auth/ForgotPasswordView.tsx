import React, { useState } from 'react';
import { 
  KeyRound, 
  ArrowLeft, 
  Mail, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle2
} from 'lucide-react';
import { storageService } from '../../services/storageService';

interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  prefillCode?: string;
  prefillEmail?: string;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onBackToLogin,
  onShowToast,
  prefillCode = '',
  prefillEmail = ''
}) => {
  const [step, setStep] = useState<'request' | 'verify'>(prefillCode ? 'verify' : 'request');
  const [usernameOrEmail, setUsernameOrEmail] = useState(prefillEmail);
  const [code, setCode] = useState(prefillCode);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [targetEmail, setTargetEmail] = useState<string>(prefillEmail);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const result = await storageService.requestPasswordReset(usernameOrEmail);
      setLoading(false);

      if (!result.success || !result.code) {
        setError(result.error || 'Failed to dispatch verification code to Gmail.');
        return;
      }

      setTargetEmail(result.email || usernameOrEmail);
      setStep('verify');
      setStatusMessage(`Real verification code has been dispatched to ${result.email || usernameOrEmail}. Please check your Gmail.`);
      onShowToast('Code Sent to Gmail', `6-digit verification code sent to ${result.email || usernameOrEmail}`, 'success');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred while sending the code.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedCode = (code || '').trim();
    const trimmedNewPass = (newPassword || '').trim();
    const trimmedConfirmPass = (confirmPassword || '').trim();

    if (!trimmedCode) {
      setError('Please enter the 6-digit verification code sent to your Gmail.');
      return;
    }

    if (!trimmedNewPass || !trimmedConfirmPass) {
      setError('Please enter and confirm your new password.');
      return;
    }

    if (trimmedNewPass !== trimmedConfirmPass) {
      setError('Passwords do not match.');
      return;
    }

    if (trimmedNewPass.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    const result = storageService.verifyAndResetPassword(usernameOrEmail, trimmedCode, trimmedNewPass);
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Invalid verification code. Please check your Gmail and try again.');
      return;
    }

    onShowToast('Password Updated', 'Your password has been changed successfully. Please log in with your new password.', 'success');
    onBackToLogin();
  };

  return (
    <div className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#0b1319] overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-[#0b7285]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-[#0078d7]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10 my-auto">
        <button
          id="forgot-back-btn"
          onClick={onBackToLogin}
          className="flex items-center gap-2 text-xs font-bold text-blue-200 hover:text-white mb-4 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Login</span>
        </button>

        {/* Portal Container */}
        <div 
          className="rounded-[36px] sm:rounded-[40px] p-8 sm:p-9 text-white border border-white/20 backdrop-blur-md shadow-2xl relative"
          style={{
            background: 'rgba(0, 120, 215, 0.22)',
            boxShadow: '0 0 40px rgba(0, 150, 255, 0.35)'
          }}
        >
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#005a9e]/80 text-cyan-200 mx-auto flex items-center justify-center mb-3 shadow-lg border border-white/20">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {step === 'request' ? 'Reset Password' : 'Enter Gmail Code'}
            </h1>
            <p className="text-xs text-blue-200/80 mt-1">
              {step === 'request'
                ? 'Enter your User Gmail to receive a real 6-digit verification code.'
                : `Enter the 6-digit code sent to ${targetEmail} and choose a new password.`}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl border border-rose-400/40 bg-rose-950/70 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl border border-emerald-400/40 bg-emerald-950/70 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-100/90 mb-1.5 ml-1" htmlFor="forgot-identifier">
                  User Gmail
                </label>
                <div 
                  className="flex items-center rounded-xl px-3.5 py-3 transition-all border border-white/20 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/30"
                  style={{ background: 'rgba(0, 70, 140, 0.65)' }}
                >
                  <Mail className="w-4 h-4 text-blue-200 shrink-0" />
                  <input
                    id="forgot-identifier"
                    type="text"
                    required
                    autoFocus
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="Enter your Gmail address"
                    className="w-full bg-transparent border-none text-white placeholder-blue-200/50 text-sm pl-2.5 outline-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="request-code-submit-btn"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm tracking-wider uppercase shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 mt-5 flex items-center justify-center gap-2 cursor-pointer"
                style={{
                  background: '#005a9e',
                  boxShadow: '0 4px 18px rgba(0, 90, 158, 0.45)'
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span>Send Code to Gmail</span>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-blue-100/90 mb-1 ml-1" htmlFor="reset-code">
                  6-Digit Gmail Verification Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full py-2.5 px-3 text-center text-lg font-mono font-bold tracking-widest rounded-xl border border-white/25 bg-blue-950/60 text-white placeholder-blue-300/40 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-100/90 mb-1 ml-1" htmlFor="reset-new-password">
                  New Password
                </label>
                <div 
                  className="flex items-center rounded-xl px-3 py-2.5 transition-all border border-white/20 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/30 relative"
                  style={{ background: 'rgba(0, 70, 140, 0.65)' }}
                >
                  <Lock className="w-4 h-4 text-blue-200 shrink-0" />
                  <input
                    id="reset-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-transparent border-none text-white placeholder-blue-200/50 text-sm pl-2.5 pr-8 outline-none focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-blue-200 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-100/90 mb-1 ml-1" htmlFor="reset-confirm-password">
                  Confirm New Password
                </label>
                <div 
                  className="flex items-center rounded-xl px-3 py-2.5 transition-all border border-white/20 focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/30 relative"
                  style={{ background: 'rgba(0, 70, 140, 0.65)' }}
                >
                  <Lock className="w-4 h-4 text-blue-200 shrink-0" />
                  <input
                    id="reset-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full bg-transparent border-none text-white placeholder-blue-200/50 text-sm pl-2.5 pr-8 outline-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="w-1/3 py-3 px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  Resend Code
                </button>
                <button
                  type="submit"
                  id="reset-password-submit-btn"
                  disabled={loading}
                  className="w-2/3 py-3 px-4 rounded-xl text-white font-bold text-xs tracking-wider uppercase shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: '#005a9e',
                    boxShadow: '0 4px 18px rgba(0, 90, 158, 0.45)'
                  }}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span>Set New Password</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
