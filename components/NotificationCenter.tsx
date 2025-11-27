import React, { useState } from 'react';
import { Bell, Check, CheckCheck, X, AlertCircle } from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../services/apiService';
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
    return date.toLocaleDateString();
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
        className="relative p-2 rounded-xl hover:bg-stone-100 transition-colors duration-200"
        title="Notifications"
      >
        <Bell size={20} className="text-stone-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-stone-200 z-50 max-h-[32rem] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-stone-700" />
                <h3 className="font-semibold text-stone-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {notifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isProcessing}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={48} className="text-stone-300 mx-auto mb-3" />
                  <p className="text-stone-500 text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-stone-50 transition-colors cursor-pointer relative ${
                        !notification.isRead ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-stone-900 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-stone-500">
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
                        <div className="flex items-start gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              disabled={isProcessing}
                              className="p-1.5 rounded-lg hover:bg-teal-100 text-teal-600 transition-colors disabled:opacity-50"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Unread Indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full" />
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
