import React, { useState, useEffect } from 'react';
import { storageService, OutboxEmail } from './services/storageService';
import { User } from './types';
import { Header } from './components/common/Header';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { OutboxModal } from './components/common/OutboxModal';
import { LoginView } from './components/auth/LoginView';
import { ForgotPasswordView } from './components/auth/ForgotPasswordView';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { UserDashboard } from './components/user/UserDashboard';
import { ReportFormView } from './components/user/ReportFormView';
import { MySubmissionsView } from './components/user/MySubmissionsView';
import { UserTableFillView } from './components/user/UserTableFillView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UsersManagement } from './components/admin/UsersManagement';
import { FormsManagement } from './components/admin/FormsManagement';
import { FormBuilderView } from './components/admin/FormBuilderView';
import { SubmissionsManagement } from './components/admin/SubmissionsManagement';
import { AdminTablesManagement } from './components/admin/AdminTablesManagement';
import { TableBuilderView } from './components/admin/TableBuilderView';
import { AdminUserTableVault } from './components/admin/AdminUserTableVault';
import { AdminMasterExcelView } from './components/admin/AdminMasterExcelView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [currentView, setCurrentView] = useState<string>(() => {
    const user = storageService.getCurrentUser();
    if (!user) return 'login';
    return user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard';
  });

  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [editFormId, setEditFormId] = useState<number | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [editTableId, setEditTableId] = useState<number | null>(null);
  const [openUsersWithModal, setOpenUsersWithModal] = useState<boolean>(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isOutboxOpen, setIsOutboxOpen] = useState(false);
  const [prefillResetCode, setPrefillResetCode] = useState<string>('');
  const [prefillResetEmail, setPrefillResetEmail] = useState<string>('');
  const [prefillLoginUsername, setPrefillLoginUsername] = useState<string>('');
  const [prefillLoginPassword, setPrefillLoginPassword] = useState<string>('');
  const [directLinkNotice, setDirectLinkNotice] = useState<string>('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [outbox, setOutbox] = useState<OutboxEmail[]>(() => storageService.getOutbox());
  const [notifications, setNotifications] = useState(() => {
    const user = storageService.getCurrentUser();
    return storageService.getNotifications(user ? user.id : 1, user ? user.role : 'admin');
  });

  const refreshNotifications = () => {
    if (currentUser) {
      setNotifications(storageService.getNotifications(currentUser.id, currentUser.role));
    }
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Detect and handle Web Login Links and Direct Table Links from URL parameters or hash on initial mount
  useEffect(() => {
    const parseAndHandleLink = async () => {
      try {
        let searchString = window.location.search;
        let hashString = window.location.hash;

        let queryParams = new URLSearchParams(searchString);
        if (hashString.includes('?')) {
          const hashQuery = hashString.substring(hashString.indexOf('?') + 1);
          queryParams = new URLSearchParams(hashQuery);
        }

        const usernameParam = queryParams.get('u') || queryParams.get('username');
        const passwordParam = queryParams.get('p') || queryParams.get('password');
        const tableParam = queryParams.get('table') || queryParams.get('tableId');

        if (usernameParam) {
          if (passwordParam) {
            // Attempt instant login with provided credentials
            const result = await storageService.login(usernameParam, passwordParam);
            if (result.success && result.user) {
              setCurrentUser(result.user);
              if (tableParam) {
                const tableIdNum = parseInt(tableParam, 10);
                setSelectedTableId(tableIdNum);
                setCurrentView('user-table-fill');
                showToast(
                  'Connected to Table',
                  `Welcome ${result.user.username}! Opened assigned table #${tableIdNum}.`,
                  'success'
                );
              } else {
                setCurrentView(result.user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
                showToast(
                  'Signed In via Web Link',
                  `Welcome back, ${result.user.username}! Accessing your ${result.user.role === 'admin' ? 'Administrator' : 'Staff'} portal profile.`,
                  'success'
                );
              }
              if (window.history && window.history.replaceState) {
                window.history.replaceState(null, '', window.location.pathname);
              }
              return;
            } else {
              setPrefillLoginUsername(usernameParam);
              setPrefillLoginPassword(passwordParam);
              setDirectLinkNotice(`Link received for '${usernameParam}'. Please confirm your credentials.`);
              setCurrentView('login');
              showToast('Login Link Received', 'Please verify your login password provided by your administrator.', 'error');
            }
          } else {
            // Only username provided, prefill login
            setPrefillLoginUsername(usernameParam);
            setDirectLinkNotice(`Admin Link Connected for '${usernameParam}'. Please enter the password provided by your portal administrator.`);
            setCurrentView('login');
            showToast('Portal Link Connected', `Username '${usernameParam}' pre-filled. Enter your password to access your profile.`, 'info');
          }
        }
      } catch (err) {
        console.warn('URL link parsing failed:', err);
      }
    };

    parseAndHandleLink();
  }, []);

  // Toast notifier
  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const refreshOutbox = () => {
    setOutbox(storageService.getOutbox());
  };

  // Sync state on user change
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'admin') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('user-dashboard');
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
    setCurrentView('login');
    showToast('Signed Out', 'You have been safely signed out of the portal.', 'info');
  };

  const handleSwitchUser = (userId: number) => {
    storageService.setCurrentUser(userId);
    const user = storageService.getUserById(userId) || null;
    setCurrentUser(user);
    if (user) {
      if (user.role === 'admin') {
        setCurrentView('admin-dashboard');
      } else {
        setCurrentView('user-dashboard');
      }
      showToast('Switched User', `Now operating as ${user.username} (${user.role})`, 'success');
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('Reset all portal data back to original default seed records? (All changes will be reverted)')) {
      storageService.resetToDefaults();
      const user = storageService.getCurrentUser();
      setCurrentUser(user);
      refreshOutbox();
      setCurrentView(user?.role === 'admin' ? 'admin-dashboard' : 'user-dashboard');
      showToast('Database Reset', 'Default users, editable tables, report forms, and submissions restored.', 'success');
    }
  };

  const handleNavigate = (view: string, extra?: any) => {
    if (view === 'admin-users' && extra?.openAddModal) {
      setOpenUsersWithModal(true);
    } else {
      setOpenUsersWithModal(false);
    }

    if (view === 'admin-form-create') {
      setEditFormId(extra?.formId || null);
    }

    if (view === 'admin-table-create') {
      setEditTableId(extra?.tableId || null);
    }

    if (view === 'report-form') {
      setSelectedFormId(extra?.formId || null);
    }

    if (view === 'user-table-fill') {
      setSelectedTableId(extra?.tableId || null);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAutofillResetCode = (code: string, email: string) => {
    setPrefillResetCode(code);
    setPrefillResetEmail(email);
    setCurrentView('forgot');
    showToast('Code Applied', `Autofilled verification code ${code} for password reset.`, 'info');
  };

  // If user is not logged in or on login/forgot password flow, show ONLY the full-screen portal authentication interface
  if (!currentUser || currentView === 'login' || currentView === 'forgot') {
    return (
      <div className="min-h-screen w-full bg-[#0b1319] text-white">
        {currentView === 'forgot' ? (
          <ForgotPasswordView
            onBackToLogin={() => setCurrentView('login')}
            onShowToast={(t, m, type) => {
              refreshOutbox();
              showToast(t, m, type);
            }}
            prefillCode={prefillResetCode}
            prefillEmail={prefillResetEmail}
          />
        ) : (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onNavigateToForgot={() => {
              refreshOutbox();
              setCurrentView('forgot');
            }}
            onShowToast={(t, m, type) => {
              refreshOutbox();
              showToast(t, m, type);
            }}
            initialUsername={prefillLoginUsername}
            initialPassword={prefillLoginPassword}
          />
        )}

        <ToastContainer
          toasts={toasts}
          onDismiss={handleDismissToast}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 font-sans text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {/* Universal Top Header */}
      <Header
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onSwitchUser={handleSwitchUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenNotifications={() => {
          refreshNotifications();
          setIsNotificationsOpen(true);
        }}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentView === 'user-dashboard' && currentUser && (
          <UserDashboard
            currentUser={currentUser}
            onSelectForm={(formId) => {
              setSelectedFormId(formId);
              setCurrentView('report-form');
            }}
            onSelectTable={(tableId) => {
              setSelectedTableId(tableId);
              setCurrentView('user-table-fill');
            }}
            onNavigateToSubmissions={() => setCurrentView('my-submissions')}
          />
        )}

        {currentView === 'user-table-fill' && currentUser && selectedTableId && (
          <UserTableFillView
            tableId={selectedTableId}
            currentUser={currentUser}
            onBack={() => {
              if (currentUser.role === 'admin') {
                setCurrentView('admin-tables');
              } else {
                setCurrentView('user-dashboard');
              }
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'report-form' && currentUser && selectedFormId && (
          <ReportFormView
            formId={selectedFormId}
            currentUser={currentUser}
            onBack={() => {
              if (currentUser.role === 'admin') {
                setCurrentView('admin-forms');
              } else {
                setCurrentView('user-dashboard');
              }
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'my-submissions' && currentUser && (
          <MySubmissionsView
            currentUser={currentUser}
            onOpenForm={(formId) => {
              setSelectedFormId(formId);
              setCurrentView('report-form');
            }}
            onNavigateToDashboard={() => setCurrentView('user-dashboard')}
          />
        )}

        {/* Admin Views */}
        {currentView === 'admin-dashboard' && currentUser && currentUser.role === 'admin' && (
          <AdminDashboard
            onNavigate={handleNavigate}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-tables' && currentUser && currentUser.role === 'admin' && (
          <AdminTablesManagement
            onCreateTable={() => {
              setEditTableId(null);
              setCurrentView('admin-table-create');
            }}
            onEditTable={(tableId) => {
              setEditTableId(tableId);
              setCurrentView('admin-table-create');
            }}
            onViewUserSubmissions={(tableId) => {
              if (tableId) setSelectedTableId(tableId);
              setCurrentView('admin-user-vault');
            }}
            onNavigateToBuilder={(tableId) => {
              setEditTableId(tableId || null);
              setCurrentView('admin-table-create');
            }}
            onPreviewTable={(tableId) => {
              setSelectedTableId(tableId);
              setCurrentView('user-table-fill');
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-table-create' && currentUser && currentUser.role === 'admin' && (
          <TableBuilderView
            editTableId={editTableId}
            onBack={() => setCurrentView('admin-tables')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-master-excel' && currentUser && currentUser.role === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdminMasterExcelView
              onNavigateToUserVault={() => setCurrentView('admin-user-vault')}
              onNavigateToTables={() => setCurrentView('admin-tables')}
              onShowToast={showToast}
            />
          </div>
        )}

        {currentView === 'admin-user-vault' && currentUser && currentUser.role === 'admin' && (
          <AdminUserTableVault
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-users' && currentUser && currentUser.role === 'admin' && (
          <UsersManagement
            initialOpenModal={openUsersWithModal}
            onShowToast={showToast}
            onSwitchUser={handleSwitchUser}
          />
        )}

        {currentView === 'admin-forms' && currentUser && currentUser.role === 'admin' && (
          <FormsManagement
            onNavigateToBuilder={(formId) => {
              setEditFormId(formId || null);
              setCurrentView('admin-form-create');
            }}
            onPreviewForm={(formId) => {
              setSelectedFormId(formId);
              setCurrentView('report-form');
            }}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-form-create' && currentUser && currentUser.role === 'admin' && (
          <FormBuilderView
            editFormId={editFormId}
            onBack={() => setCurrentView('admin-forms')}
            onShowToast={showToast}
          />
        )}

        {currentView === 'admin-submissions' && currentUser && currentUser.role === 'admin' && (
          <SubmissionsManagement
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Report Portal</span>
            <span>—</span>
            <span>Enterprise Multi-User Operations & Submissions Hub</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Role: <strong className="text-slate-700">{currentUser?.role || 'Guest'}</strong></span>
            <span>•</span>
            <button
              onClick={() => {
                refreshOutbox();
                setIsOutboxOpen(true);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Email Delivery Logs ({outbox.length})
            </button>
            <span>•</span>
            <button
              onClick={handleResetDemoData}
              className="hover:text-slate-700"
            >
              Reset Seed Data
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Toast Overlays */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onShowToast={showToast}
        onUserUpdated={(updated) => {
          setCurrentUser(updated);
        }}
        onOpenChangePassword={() => setIsChangePasswordOpen(true)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        currentUser={currentUser}
        notifications={notifications}
        onRefreshNotifications={refreshNotifications}
        onNavigateToView={(view, id) => {
          if (view === 'report-form' && id) setSelectedFormId(id);
          if (view === 'user-table-fill' && id) setSelectedTableId(id);
          setCurrentView(view);
        }}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        currentUser={currentUser}
        onShowToast={showToast}
      />

      <OutboxModal
        isOpen={isOutboxOpen}
        onClose={() => setIsOutboxOpen(false)}
        outbox={outbox}
        onUseCode={handleAutofillResetCode}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />
    </div>
  );
}

