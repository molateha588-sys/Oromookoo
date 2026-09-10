import React, { useState } from 'react';
import { 
  Link2, 
  Copy, 
  Check, 
  ExternalLink, 
  Shield, 
  User as UserIcon, 
  Lock, 
  X, 
  KeyRound, 
  Share2, 
  Mail, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck 
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';

interface PortalLinkModalProps {
  user: User;
  temporaryPassword?: string;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchUser?: (userId: number) => void;
}

export const PortalLinkModal: React.FC<PortalLinkModalProps> = ({
  user,
  temporaryPassword,
  isOpen,
  onClose,
  onShowToast,
  onSwitchUser
}) => {
  const [copiedSpecificLink, setCopiedSpecificLink] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'invite' | 'credentials'>('link');

  if (!isOpen) return null;

  const passwordToUse = temporaryPassword || user.password_hash || 'user123';
  const specificLoginUrl = storageService.generateLoginUrl(user.username);
  const fullInviteMessage = storageService.generateInviteTemplate(user);

  const copyToClipboard = async (text: string, type: 'specific' | 'invite' | 'credentials') => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }

      if (type === 'specific') {
        setCopiedSpecificLink(true);
        setTimeout(() => setCopiedSpecificLink(false), 2500);
        onShowToast('Specific Link Copied', `Portal login link for @${user.username} copied to clipboard!`, 'success');
      } else if (type === 'invite') {
        setCopiedInviteText(true);
        setTimeout(() => setCopiedInviteText(false), 2500);
        onShowToast('Invitation Message Copied', 'Full credential & access instructions copied ready to send.', 'success');
      } else {
        setCopiedCredentials(true);
        setTimeout(() => setCopiedCredentials(false), 2500);
        onShowToast('Credentials Copied', 'Username and password copied.', 'success');
      }
    } catch {
      onShowToast('Copy Failed', 'Please select and copy the text manually.', 'error');
    }
  };

  const handleTestLogin = () => {
    if (onSwitchUser) {
      onSwitchUser(user.id);
      onClose();
    } else {
      window.location.href = specificLoginUrl;
    }
  };

  const isAdmin = user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#005a9e] flex items-center justify-center">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">User Login Link & Credentials</h3>
              <p className="text-xs text-slate-500">Biiroo Eegumsa Fayyaa direct portal access credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Bar */}
        <div className="px-6 py-3.5 bg-blue-50/50 border-b border-blue-100/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: user.avatar_color || '#005a9e' }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>{user.full_name || `@${user.username}`}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isAdmin 
                    ? 'bg-blue-100 text-[#005a9e] border border-blue-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {isAdmin ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff'}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-mono">@{user.username} • {user.email}</div>
            </div>
          </div>

          <button
            onClick={handleTestLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#005a9e] bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-2xs"
            title="Open portal view as this user"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open as User</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 border-b border-slate-100 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'link'
                ? 'border-[#005a9e] text-[#005a9e]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Specific Login Link</span>
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'invite'
                ? 'border-[#005a9e] text-[#005a9e]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invitation Template</span>
          </button>
          <button
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-[#005a9e] text-[#005a9e]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Credentials</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-900 text-xs font-bold mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#005a9e]" />
                  <span>Specific User Login Link</span>
                </div>
                <p className="text-xs text-blue-700">
                  Send this specific link to <strong>@{user.username}</strong>. When opened, their assigned account will be recognized, and they enter their valid password to access their Biiroo Eegumsa Fayyaa workspace.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Specific Login URL
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 break-all select-all overflow-hidden max-h-20 overflow-y-auto">
                    {specificLoginUrl}
                  </div>
                  <button
                    onClick={() => copyToClipboard(specificLoginUrl, 'specific')}
                    className="px-4 py-2.5 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                  >
                    {copiedSpecificLink ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <strong>Password Authentication:</strong> The user must type their assigned password (<code>{passwordToUse}</code>).
              </div>
            </div>
          )}

          {activeTab === 'invite' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Pre-Formatted Invitation Slip</span>
                <button
                  onClick={() => copyToClipboard(fullInviteMessage, 'invite')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {copiedInviteText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied Message!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Message</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                rows={10}
                value={fullInviteMessage}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-700 leading-relaxed select-all focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Username</span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {user.username}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Assigned Password</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#005a9e] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {showPassword ? passwordToUse : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-500">Assigned Gmail</span>
                  <span className="text-xs text-slate-700">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-xs font-semibold text-slate-500">Portal Role</span>
                  <span className="text-xs font-bold text-[#005a9e]">
                    {isAdmin ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => copyToClipboard(`Username: ${user.username}\nPassword: ${passwordToUse}\nPortal URL: ${specificLoginUrl}`, 'credentials')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  {copiedCredentials ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCredentials ? 'Credentials Copied' : 'Copy Credentials'}</span>
                </button>

                <button
                  onClick={() => copyToClipboard(specificLoginUrl, 'specific')}
                  className="px-4 py-2 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Strict authentication: User will be required to input valid password.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
