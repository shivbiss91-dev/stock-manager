import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ArrowRight,
  Package,
  CreditCard,
  X,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { NotificationType } from '../../types/notification';
import { formatDateTime } from '../../utils/dateUtils';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loadNotifications } =
    useNotificationStore();

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'low_stock':
        return <Package className="w-4 h-4 text-amber-500" />;
      case 'payment_overdue':
        return <CreditCard className="w-4 h-4 text-rose-500" />;
      case 'approval_required':
        return <AlertTriangle className="w-4 h-4 text-brand-orange" />;
      case 'backup_status':
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-teal" />;
    }
  };

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    onClose();
    if (link) {
      navigate(link);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-[20px] template-card border border-slate-200 dark:border-white/[0.08] shadow-2xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent-orange" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#F2F4F8]">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-accent-orange text-white font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 text-[11px] font-medium text-accent-orange hover:underline px-2 py-1 rounded"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.06]">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item.id, item.link)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] ${
                    !item.isRead
                      ? 'bg-accent-orange/[0.05]'
                      : ''
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.06] flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs truncate ${
                          !item.isRead
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-accent-orange flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11.5px] text-slate-500 dark:text-[#9AA0AE] line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatDateTime(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-slate-50/60 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] text-center">
            <button
              onClick={() => {
                onClose();
                navigate('/dashboard');
              }}
              className="text-xs font-semibold text-accent-orange hover:underline flex items-center justify-center gap-1 mx-auto"
            >
              <span>View all system activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
