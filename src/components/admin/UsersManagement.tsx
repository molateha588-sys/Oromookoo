import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  KeyRound, 
  Shield, 
  CheckCircle2, 
  Clock, 
  X, 
  AlertCircle,
  Mail,
  Lock,
  Link2,
  Share2,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  User as UserIcon,
  Phone
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { User, UserRole } from '../../types';
import { PortalLinkModal } from './PortalLinkModal';
import { UserLoginLinksModal } from './UserLoginLinksModal';

interface UsersManagementProps {
  initialOpenModal?: boolean;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onSwitchUser?: (userId: number) => void;
}

export const UsersManagement: React.FC<UsersManagementProps> = ({
  initialOpenModal = false,
  onShowToast,
  onSwitchUser
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(initialOpenModal);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [modalError, setModalError] = useState<string | null>(null);

  // Reset password inline modal
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [customPassword, setCustomPassword] = useState('');

  // Portal login link modal state
  const [activeLinkUser, setActiveLinkUser] = useState<User | null>(null);
  const [activeLinkPassword, setActiveLinkPassword] = useState<string | undefined>(undefined);
  const [quickCopiedId, setQuickCopiedId] = useState<number | null>(null);
  const [isLinksHubOpen, setIsLinksHubOpen] = useState(false);

  const allUsers = storageService.getUsers();
  const allSubmissions = storageService.getSubmissions();
  const allTableSubs = storageService.getTableSubmissions();

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const tempPass = newPassword;
    const result = storageService.createUser({
      username: newUsername,
      full_name: newFullName || undefined,
      email: newEmail,
      password: newPassword,
      role: newRole
    });

    if (!result.success || !result.user) {
      setModalError(result.error || 'Failed to create user');
      return;
    }

    const createdUser = result.user;
    onShowToast('User Created', `Added @${createdUser.username} to Biiroo Eegumsa Fayyaa.`, 'success');
    
    // Reset form fields
    setNewUsername('');
    setNewFullName('');
    setNewEmail('');
    setNewPassword('');
    setIsAddModalOpen(false);

    // Present the Specific Web Login Link modal
    setActiveLinkUser(createdUser);
    setActiveLinkPassword(tempPass);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === 1) {
      onShowToast('Action Blocked', 'Primary root administrator cannot be deleted.', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${user.username}"? All their associated drafts and submissions will also be removed.`)) {
      const result = storageService.deleteUser(user.id);
      if (result.success) {
        onShowToast('User Deleted', `User ${user.username} was removed from the portal.`, 'info');
      } else {
        onShowToast('Error', result.error || 'Failed to delete user', 'error');
      }
    }
  };

  const handleSaveResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !customPassword) return;

    const targetUser = resettingUser;
    const newPass = customPassword;
    
    storageService.updateUserPassword(targetUser.id, newPass);
    targetUser.password_hash = newPass;

    onShowToast('Password Reset', `Updated password for @${targetUser.username}. Specific login link ready.`, 'success');
    setResettingUser(null);
    setCustomPassword('');

    // Open link modal with the new password
    setActiveLinkUser(targetUser);
    setActiveLinkPassword(newPass);
  };

  const handleQuickCopyLink = async (user: User) => {
    const link = storageService.generateLoginUrl(user.username);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setQuickCopiedId(user.id);
      setTimeout(() => setQuickCopiedId(null), 2000);
      onShowToast('Link Copied', `Direct portal login link for @${user.username} copied.`, 'success');
    } catch {
      onShowToast('Error', 'Failed to copy link automatically.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header with Search and Actions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#005a9e] text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Biiroo Eegumsa Fayyaa Staff Accounts</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            User Accounts & Portal Access
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage healthcare staff members, assigned Gmail credentials, and direct login links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsLinksHubOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <Link2 className="w-4 h-4 text-[#005a9e]" />
            <span>View All Portal Links</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Healthcare User</span>
          </button>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/70">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by username, full name, or Gmail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs w-full focus:ring-2 focus:ring-[#005a9e] outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#005a9e] outline-none"
            >
              <option value="all">All Roles ({allUsers.length})</option>
              <option value="admin">Admin Biiroo Eegumsa Fayyaa</option>
              <option value="user">Healthcare Staff</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">User & Identity</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Submissions Activity</th>
                <th className="py-3.5 px-4">Portal Login Link</th>
                <th className="py-3.5 px-4">Account Created</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map(user => {
                const userSubs = allSubmissions.filter(s => s.user_id === user.id);
                const userTables = allTableSubs.filter(s => s.user_id === user.id);
                const isAdmin = user.role === 'admin';
                const isQuickCopied = quickCopiedId === user.id;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
                          style={{ backgroundColor: user.avatar_color || '#005a9e' }}
                        >
                          {user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {user.full_name || `@${user.username}`}
                            {user.id === 1 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">
                                Root
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">@{user.username} • {user.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isAdmin
                          ? 'bg-blue-100 text-[#005a9e] border border-blue-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {isAdmin ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff'}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {userTables.length} Tables
                        </span>
                        <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          {userSubs.length} Reports
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickCopyLink(user)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isQuickCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#005a9e] border-slate-200 hover:border-blue-200'
                          }`}
                          title="Copy 1-click web login link to clipboard"
                        >
                          {isQuickCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-slate-400" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveLinkUser(user);
                            setActiveLinkPassword(user.password_hash);
                          }}
                          className="p-1 text-slate-400 hover:text-[#005a9e] hover:bg-blue-50 rounded-lg transition-colors"
                          title="View link details & invitation slip"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setResettingUser(user);
                            setCustomPassword('user123');
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#005a9e] hover:bg-blue-50 rounded-lg transition-colors"
                          title="Reset Password & Create New Link"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {user.id !== 1 && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#005a9e] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add Healthcare Staff Member</h3>
                  <p className="text-xs text-slate-500">Create login credentials for Biiroo Eegumsa Fayyaa</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 flex items-start gap-2.5 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Full Name / Display Name
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Dr. Abebe Gemechu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005a9e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. abebe_g"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005a9e] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assigned Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#005a9e] outline-none bg-white"
                  >
                    <option value="user">Healthcare Staff</option>
                    <option value="admin">Admin Biiroo Eegumsa Fayyaa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Gmail Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="staff@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005a9e] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Initial Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="e.g. staff123"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005a9e] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#005a9e]" />
                <h3 className="text-sm font-bold text-slate-900">Reset User Password</h3>
              </div>
              <button
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-slate-600">
                Enter a new password for <strong className="text-slate-900">@{resettingUser.username}</strong>:
              </p>

              <div>
                <input
                  type="text"
                  required
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="New password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-[#005a9e] outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#005a9e] text-white text-xs font-bold shadow-xs"
                >
                  Save & Copy Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Individual Link Modal */}
      {activeLinkUser && (
        <PortalLinkModal
          isOpen={true}
          onClose={() => setActiveLinkUser(null)}
          user={activeLinkUser}
          password={activeLinkPassword}
          onShowToast={onShowToast}
        />
      )}

      {/* All Links Hub Modal */}
      {isLinksHubOpen && (
        <UserLoginLinksModal
          isOpen={isLinksHubOpen}
          onClose={() => setIsLinksHubOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
