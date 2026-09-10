import React from 'react';
import { 
  Bell, 
  CheckCheck, 
  X, 
  FileSpreadsheet, 
  FileText, 
  Info, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';
import { NotificationItem, User } from '../../types';
import { storageService } from '../../services/storageService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
  onNavigateToView?: (view: string, id?: number) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  notifications,
  onRefreshNotifications,
  onNavigateToView
}) => {
  if (!isOpen || !currentUser) return null;

  const handleMarkAllAsRead = () => {
    storageService.markAllNotificationsAsRead(currentUser.id, currentUser.role);
    onRefreshNotifications();
  };

  const handleNotificationClick = (n: NotificationItem) => {
    storageService.markNotificationAsRead(n.id);
    onRefreshNotifications();
    if (n.link_view && onNavigateToView) {
      onNavigateToView(n.link_view, n.link_id);
      onClose();
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'submission':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-cyan-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] mt-12 sm:mt-14 mr-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#005a9e] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Alert Notifications
              </h3>
              <p className="text-[11px] text-slate-500">
                Live updates for Biiroo Eegumsa Fayyaa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.some(n => !n.read) && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 text-xs text-[#005a9e] hover:bg-blue-50 rounded-lg font-semibold flex items-center gap-1 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs font-semibold">No notifications yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Incoming submissions and assignments will alert here in real time.
              </p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`pt-2.5 pb-2.5 px-3 rounded-2xl transition-all cursor-pointer flex items-start gap-3 ${
                  !n.read 
                    ? 'bg-blue-50/70 border border-blue-100/80 shadow-xs' 
                    : 'hover:bg-slate-50 opacity-80'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs truncate ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {n.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  {n.link_view && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[#005a9e]">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
