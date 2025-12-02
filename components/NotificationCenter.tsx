import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle, Clock } from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, deleteAllReadNotifications } from '../services/apiService';
import { getUnreadCount } from '../services/notificationService';

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationsUpdate: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onNotificationsUpdate 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const unreadCount = getUnreadCount(notifications);

  // Sort notifications: newest first (reverse chronological order)
  const sortedNotifications = [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WO_CREATED:
        return <AlertCircle size={16} className="text-teal-600" />;
      case NotificationType.WO_ASSIGNED:
        return <Check size={16} className="text-purple-600" />;
      case NotificationType.WO_COMPLETED:
        return <CheckCheck size={16} className="text-blue-600" />;
      case NotificationType.WO_APPROVED:
        return <CheckCheck size={16} className="text-emerald-600" />;
      case NotificationType.WO_REJECTED:
        return <X size={16} className="text-red-600" />;
      case NotificationType.WO_CLOSED:
        return <Check size={16} className="text-stone-600" />;
      case NotificationType.WO_REMINDER_7_DAYS:
        return <Clock size={16} className="text-amber-600" />;
      case NotificationType.WO_REMINDER_3_DAYS:
        return <Clock size={16} className="text-orange-600" />;
      default:
        return <Bell size={16} className="text-stone-600" />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.WO_CREATED:
        return 'bg-teal-50 border-teal-200';
      case NotificationType.WO_ASSIGNED:
        return 'bg-purple-50 border-purple-200';
      case NotificationType.WO_COMPLETED:
        return 'bg-blue-50 border-blue-200';
      case NotificationType.WO_APPROVED:
        return 'bg-emerald-50 border-emerald-200';
      case NotificationType.WO_REJECTED:
        return 'bg-red-50 border-red-200';
      case NotificationType.WO_CLOSED:
        return 'bg-stone-50 border-stone-200';
      case NotificationType.WO_REMINDER_7_DAYS:
        return 'bg-amber-50 border-amber-200';
      case NotificationType.WO_REMINDER_3_DAYS:
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-stone-50 border-stone-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    // Format as DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await markNotificationAsRead(notificationId);
      onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsProcessing(true);
    try {
      await markAllNotificationsAsRead();
      onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAllRead = async () => {
    setIsProcessing(true);
    try {
      await deleteAllReadNotifications();
      onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await deleteNotification(notificationId);
      onNotificationsUpdate();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-stone-100 transition-all duration-200 hover:scale-105 active:scale-95"
        title="Notifications"
      >
        <Bell size={20} className="text-stone-600" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-[999998]"
            onClick={() => setIsOpen(false)}
          />
          {/* Notification Panel */}
          <div 
            className="fixed top-20 right-12 w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-[999999] max-h-[calc(100vh-7rem)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-gradient-to-r from-teal-50 to-blue-50">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-teal-700" />
                <h3 className="font-semibold text-stone-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={isProcessing}
                    className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50 px-2 py-1.5 hover:bg-white/50 rounded-lg"
                  >
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && notifications.some(n => n.isRead) && (
                  <button
                    onClick={handleDeleteAllRead}
                    disabled={isProcessing}
                    className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors disabled:opacity-50 px-2 py-1.5 hover:bg-red-50 rounded-lg"
                  >
                    Delete read
                  </button>
                )}
              </div>
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-12 text-center animate-fade-in">
                  <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-stone-200 border-dashed">
                    <Bell size={32} className="text-stone-300" />
                  </div>
                  <p className="text-stone-600 font-medium mb-1">All caught up!</p>
                  <p className="text-stone-400 text-sm">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {sortedNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-stone-50 transition-all duration-200 cursor-pointer relative group ${
                        !notification.isRead ? 'bg-blue-50/40' : ''
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-900 leading-relaxed font-medium">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="text-xs text-stone-500 font-medium">
                              {formatTimestamp(notification.createdAt)}
                            </p>
                            {notification.triggeredBy && (
                              <>
                                <span className="text-xs text-stone-300">•</span>
                                <p className="text-xs text-stone-500">
                                  by {notification.triggeredBy}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-start gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-600 transition-all hover:scale-110 disabled:opacity-50"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-all hover:scale-110 disabled:opacity-50"
                            title="Delete"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full shadow-sm animate-pulse-ring" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
