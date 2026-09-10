import React, { useState } from 'react';
import { 
  Bell, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  FileSpreadsheet, 
  Layers, 
  ShieldCheck, 
  Mail,
  UserCheck
} from 'lucide-react';
import { User } from '../../types';
import { storageService } from '../../services/storageService';

interface HeaderProps {
  currentUser: User | null;
  currentView: string;
  onNavigate: (view: string, extra?: any) => void;
  onLogout: () => void;
  onSwitchUser: (userId: number) => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
  onSwitchUser,
  onOpenProfile,
  onOpenNotifications,
  unreadNotificationsCount
}) => {
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const allUsers = storageService.getUsers();

  if (!currentUser) {
    return null;
  }

  const isAdmin = currentUser.role === 'admin';
  const roleDisplay = isAdmin ? 'Admin Biiroo Eegumsa Fayyaa' : 'Healthcare Staff';

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-[#005a9e] text-white shadow-md border-b border-blue-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center gap-6">
          <div 
            className="cursor-pointer flex items-center gap-2.5 select-none" 
            onClick={() => onNavigate(isAdmin ? 'admin-dashboard' : 'user-dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-cyan-200 font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Biiroo Eegumsa Fayyaa
              </span>
              <span className="text-[10px] text-cyan-100/80 font-medium block -mt-0.5">
                Health Operational Hub
              </span>
            </div>
          </div>

          {/* Navigation Links based on role */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {isAdmin ? (
              <>
                <button
                  id="nav-admin-dashboard"
                  onClick={() => onNavigate('admin-dashboard')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'admin-dashboard' 
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </button>

                <button
                  id="nav-admin-master-excel"
                  onClick={() => onNavigate('admin-master-excel')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                    currentView === 'admin-master-excel'
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-200" />
                  Master Excel
                </button>

                <button
                  id="nav-admin-tables"
                  onClick={() => onNavigate('admin-tables')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'admin-tables' || currentView === 'admin-table-create'
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Spreadsheet Tables
                </button>

                <button
                  id="nav-admin-forms"
                  onClick={() => onNavigate('admin-forms')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'admin-forms' || currentView === 'admin-form-create'
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Forms
                </button>

                <button
                  id="nav-admin-users"
                  onClick={() => onNavigate('admin-users')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'admin-users' 
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  User Accounts
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-user-dashboard"
                  onClick={() => onNavigate('user-dashboard')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'user-dashboard' 
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  My Workspace
                </button>

                <button
                  id="nav-user-submissions"
                  onClick={() => onNavigate('my-submissions')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
                    currentView === 'my-submissions' 
                      ? 'bg-white/20 text-white shadow-xs' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  My Submissions
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Actions Section */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Notification Bell with Badge */}
          <button
            id="header-notification-btn"
            onClick={onOpenNotifications}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors relative cursor-pointer"
            title="Alert Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm animate-pulse">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* User Profile Button */}
          <button
            id="header-user-profile-btn"
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left cursor-pointer group"
          >
            <div 
              className="w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: currentUser.avatar_color || '#0b7285' }}
            >
              {currentUser.username.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-bold text-white group-hover:text-cyan-100 transition-colors truncate max-w-[130px]">
                {currentUser.full_name || currentUser.username}
              </div>
              <div className="text-[10px] text-cyan-200/80 font-semibold truncate max-w-[130px]">
                {roleDisplay}
              </div>
            </div>
          </button>

          {/* Switch Account Quick Dropdown */}
          <div className="relative hidden md:block">
            <button
              id="header-switch-user-btn"
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors cursor-pointer"
              title="Switch user account"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden lg:inline text-xs text-cyan-100">Switch:</span>
              <span className="font-bold text-xs">@{currentUser.username}</span>
              <ChevronDown className="w-3 h-3 text-white/70" />
            </button>

            {showSwitchMenu && (
              <div 
                id="switch-user-dropdown"
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-slate-900"
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Account
                </div>
                <div className="max-h-60 overflow-y-auto py-1 divide-y divide-slate-50">
                  {allUsers.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSwitchUser(user.id);
                        setShowSwitchMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        user.id === currentUser.id ? 'bg-blue-50 font-bold text-[#005a9e]' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div 
                          className="w-6 h-6 rounded-md text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                          style={{ backgroundColor: user.avatar_color || '#005a9e' }}
                        >
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="truncate font-semibold">{user.full_name || user.username}</div>
                          <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        </div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        user.role === 'admin' ? 'bg-blue-100 text-[#005a9e]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {user.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            id="header-logout-btn"
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/30 bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
