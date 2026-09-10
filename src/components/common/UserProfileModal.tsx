import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Key, 
  Calendar, 
  CheckCircle2, 
  X, 
  Phone, 
  Save, 
  FileSpreadsheet, 
  FileText
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onShowToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  onUserUpdated?: (user: User) => void;
  onOpenChangePassword?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onShowToast,
  onUserUpdated,
  onOpenChangePassword
}) => {
  if (!isOpen || !currentUser) return null;

  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [username, setUsername] = useState(currentUser.username || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const roleTitle = isAdmin ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff Member';

  // Calculate live activity statistics
  const userSubs = storageService.getUserSubmissions(currentUser.id);
  const userTableSubs = storageService.getTableSubmissions().filter(s => s.user_id === currentUser.id);
  const assignedTables = storageService.getUserAssignedTablesWithStatus(currentUser.id);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const updatePayload: any = {
      full_name: fullName,
      username: username,
      email: email,
      phone: phone
    };

    if (newPassword && newPassword.trim().length >= 4) {
      updatePayload.password = newPassword.trim();
    }

    const result = storageService.updateUserProfile(currentUser.id, updatePayload);

    setSaving(false);
    if (!result.success || !result.user) {
      onShowToast('Update Failed', result.error || 'Could not update profile', 'error');
      return;
    }

    if (onUserUpdated) {
      onUserUpdated(result.user);
    }
    setNewPassword('');
    setIsEditing(false);
    onShowToast('Credentials & Profile Updated', 'Your username, Gmail, and account settings have been saved successfully.', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header with Biiroo Eegumsa Fayyaa banner */}
        <div className="bg-gradient-to-r from-[#005a9e] to-[#0b7285] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg border-2 border-white/30 shrink-0"
              style={{ backgroundColor: currentUser.avatar_color || '#005a9e' }}
            >
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-cyan-100 mb-1 backdrop-blur-sm">
                <Shield className="w-3.5 h-3.5" />
                <span>{roleTitle}</span>
              </div>
              <h2 className="text-xl font-bold text-white truncate">
                {currentUser.full_name || `@${currentUser.username}`}
              </h2>
              <p className="text-xs text-blue-100/80 truncate">
                {currentUser.email}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Quick Statistics Overview */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-100 text-blue-700 mx-auto mb-1.5">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900">{userTableSubs.length}</div>
              <div className="text-[11px] font-semibold text-slate-500">Tables Filled</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 mx-auto mb-1.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900">{userSubs.length}</div>
              <div className="text-[11px] font-semibold text-slate-500">Reports Sent</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 mx-auto mb-1.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-slate-900">{assignedTables.length}</div>
              <div className="text-[11px] font-semibold text-slate-500">Assigned</div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Account Information
              </h3>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold text-[#005a9e] hover:underline"
                >
                  Edit Profile
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setFullName(currentUser.full_name || '');
                    setEmail(currentUser.email || '');
                    setPhone(currentUser.phone || '');
                    setIsEditing(false);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Full Name / Display Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#005a9e] text-sm outline-none"
                  />
                ) : (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                    {currentUser.full_name || '(Not specified)'}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#005a9e] text-sm outline-none font-mono"
                    />
                  ) : (
                    <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-mono text-xs">
                      @{currentUser.username}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    System Role
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-[#005a9e]" />
                    <span className="truncate">{roleTitle}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  User Gmail
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#005a9e] text-sm outline-none"
                  />
                ) : (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-2 font-medium">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Set New Password (optional)
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#005a9e] text-sm outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Enter a new password (min 4 characters) to update your login password immediately.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#005a9e] text-sm outline-none"
                  />
                ) : (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-2 font-medium">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{currentUser.phone || '(No phone listed)'}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Account Created: {new Date(currentUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {isEditing && (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 px-4 rounded-xl bg-[#005a9e] hover:bg-[#004b85] text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            )}
          </form>

          {/* Security & Password Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800">Security Credentials</div>
              <div className="text-[11px] text-slate-500">Update your login password</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenChangePassword) {
                  onOpenChangePassword();
                }
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
