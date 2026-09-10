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
  Search, 
  Share2, 
  Mail, 
  Sparkles, 
  KeyRound, 
  ShieldAlert, 
  Send, 
  UserCheck 
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User } from '../../types';

interface UserLoginLinksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onNavigateToUser?: (userId: number) => void;
}

export const UserLoginLinksModal: React.FC<UserLoginLinksModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onNavigateToUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLinkUserId, setCopiedLinkUserId] = useState<number | null>(null);
  const [copiedInviteUserId, setCopiedInviteUserId] = useState<number | null>(null);
  const [copiedGeneralLink, setCopiedGeneralLink] = useState(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);

  if (!isOpen) return null;

  const users = storageService.getUsers();
  const staffUsers = users.filter(u => u.role === 'user');
  const adminUsers = users.filter(u => u.role === 'admin');

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generalUserPortalUrl = storageService.generateLoginUrl();
  const adminPortalUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?portal=admin` 
    : 'http://localhost:3000/?portal=admin';

  const handleCopyText = async (text: string, type: 'user_link' | 'user_invite' | 'general_user' | 'general_admin', userId?: number) => {
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

      if (type === 'user_link' && userId !== undefined) {
        setCopiedLinkUserId(userId);
        setTimeout(() => setCopiedLinkUserId(null), 2500);
        const u = users.find(x => x.id === userId);
        onShowToast('Specific Login Link Copied', `Portal login link for @${u?.username} copied to clipboard!`, 'success');
      } else if (type === 'user_invite' && userId !== undefined) {
        setCopiedInviteUserId(userId);
        setTimeout(() => setCopiedInviteUserId(null), 2500);
        const u = users.find(x => x.id === userId);
        onShowToast('Invitation Text Copied', `Credentials & login instructions for @${u?.username} copied.`, 'success');
      } else if (type === 'general_user') {
        setCopiedGeneralLink(true);
        setTimeout(() => setCopiedGeneralLink(false), 2500);
        onShowToast('User Portal Link Copied', 'Healthcare Staff Portal Login Link copied.', 'success');
      } else if (type === 'general_admin') {
        setCopiedAdminLink(true);
        setTimeout(() => setCopiedAdminLink(false), 2500);
        onShowToast('Admin Portal Link Copied', 'Admin Console Login Link copied.', 'success');
      }
    } catch {
      onShowToast('Copy Error', 'Please select and copy the text manually.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#005a9e] to-[#0b7285] text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs shadow-xs">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Biiroo Eegumsa Fayyaa Staff Portal Links
              </h3>
              <p className="text-xs text-blue-100/80">
                Direct login links and credentials for healthcare staff members
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg transition-colors bg-white/10 hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Universal Link Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[#005a9e] text-xs font-bold">
                <Shield className="w-4 h-4" />
                <span>Unified Portal Login Link</span>
              </div>
              <p className="text-[11px] text-blue-800 mt-0.5">
                All staff members use this same portal link. Each user logs in with their individual username and admin-assigned password.
              </p>
            </div>
            <button
              onClick={() => handleCopyText(generalUserPortalUrl, 'general_user')}
              className="px-3.5 py-2 bg-[#005a9e] hover:bg-[#004b85] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
            >
              {copiedGeneralLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Portal Link</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by username, full name, or Gmail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-300 bg-white text-xs w-full focus:ring-2 focus:ring-[#005a9e] outline-none"
            />
          </div>
        </div>

        {/* User Specific Links List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-100">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Assigned Healthcare Staff Members ({filteredUsers.length})
          </div>

          {filteredUsers.map(u => {
            const userLink = storageService.generateLoginUrl(u.username);
            const userInvite = storageService.generateInviteTemplate(u);
            const isCopiedLink = copiedLinkUserId === u.id;
            const isCopiedInvite = copiedInviteUserId === u.id;
            const isAdmin = u.role === 'admin';

            return (
              <div key={u.id} className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-2xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                    style={{ backgroundColor: u.avatar_color || '#005a9e' }}
                  >
                    {u.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {u.full_name || `@${u.username}`}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isAdmin 
                          ? 'bg-blue-100 text-[#005a9e]' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isAdmin ? 'Admin' : 'Healthcare Staff'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      @{u.username} • {u.email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyText(userLink, 'user_link', u.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isCopiedLink
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white hover:bg-blue-50 text-slate-700 hover:text-[#005a9e] border-slate-300'
                    }`}
                    title="Copy 1-click web login link"
                  >
                    {isCopiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleCopyText(userInvite, 'user_invite', u.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      isCopiedInvite
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-[#005a9e] hover:bg-[#004b85] text-white border-transparent'
                    }`}
                    title="Copy pre-formatted invitation slip"
                  >
                    {isCopiedInvite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Invite Copied!</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5" />
                        <span>Copy Invite Slip</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Direct portal links allow healthcare staff to access their assigned spreadsheet tables instantly.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
