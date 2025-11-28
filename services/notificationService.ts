import { Notification, NotificationType, UserRole } from '../types';

/**
 * Notification Service
 * Handles creation and management of workflow notifications
 */

// Generate unique notification ID
const generateNotificationId = (): string => {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create notification when WO is created
 * Notifies: Admin
 */
export const createWOCreatedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  createdBy: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_CREATED,
    workOrderId,
    workOrderTitle,
    message: `New work order created: "${workOrderTitle}"`,
    recipientRole: 'Admin',
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: createdBy
  };
};

/**
 * Create notification when Admin assigns technician
 * Notifies: Technician
 */
export const createWOAssignedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  assignedTo: string,
  assignedBy: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_ASSIGNED,
    workOrderId,
    workOrderTitle,
    message: `You have been assigned to work order: "${workOrderTitle}"`,
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: assignedBy
  };
};

/**
 * Create notification when Technician marks work as done
 * Notifies: Head Technician (for review)
 */
export const createWOCompletedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  completedBy: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_COMPLETED,
    workOrderId,
    workOrderTitle,
    message: `Work order "${workOrderTitle}" has been completed and is pending review`,
    recipientRole: 'Head Technician',
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: completedBy
  };
};

/**
 * Create notifications when Admin approves work
 * Notifies: Requestor + Technician
 */
export const createWOApprovedNotifications = (
  workOrderId: string,
  workOrderTitle: string,
  approvedBy: string,
  requestorName?: string,
  technicianName?: string
): Notification[] => {
  const notifications: Notification[] = [];

  // Notification for Requestor
  notifications.push({
    id: generateNotificationId(),
    type: NotificationType.WO_APPROVED,
    workOrderId,
    workOrderTitle,
    message: `Your work order "${workOrderTitle}" has been approved and completed`,
    recipientRole: 'Requester',
    recipientName: requestorName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: approvedBy
  });

  // Notification for Technician
  notifications.push({
    id: generateNotificationId(),
    type: NotificationType.WO_APPROVED,
    workOrderId,
    workOrderTitle,
    message: `Work order "${workOrderTitle}" has been approved`,
    recipientRole: 'Technician',
    recipientName: technicianName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: approvedBy
  });

  return notifications;
};

/**
 * Create notification when Admin rejects work
 * Notifies: Technician
 */
export const createWORejectedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  rejectedBy: string,
  technicianName?: string,
  rejectionReason?: string
): Notification => {
  const message = rejectionReason
    ? `Work order "${workOrderTitle}" needs revision. Reason: ${rejectionReason}`
    : `Work order "${workOrderTitle}" needs revision`;

  return {
    id: generateNotificationId(),
    type: NotificationType.WO_REJECTED,
    workOrderId,
    workOrderTitle,
    message,
    recipientRole: 'Technician',
    recipientName: technicianName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: rejectedBy
  };
};

/**
 * Create notification when Admin closes work order
 * Notifies: Requestor
 */
export const createWOClosedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  closedBy: string,
  requestorName?: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_CLOSED,
    workOrderId,
    workOrderTitle,
    message: `Work order "${workOrderTitle}" has been closed`,
    recipientRole: 'Requester',
    recipientName: requestorName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: closedBy
  };
};

/**
 * Filter notifications for specific user
 */
export const filterNotificationsForUser = (
  notifications: Notification[],
  userRole: UserRole,
  userName?: string
): Notification[] => {
  return notifications.filter(notif => {
    // Match role
    if (notif.recipientRole !== userRole) return false;
    
    // If notification is for specific user, check name
    if (notif.recipientName && userName) {
      return notif.recipientName === userName;
    }
    
    // Otherwise include all notifications for this role
    return true;
  });
};

/**
 * Get unread notification count
 */
export const getUnreadCount = (notifications: Notification[]): number => {
  return notifications.filter(n => !n.isRead).length;
};

/**
 * Mark notification as read
 */
export const markAsRead = (notification: Notification): Notification => {
  return { ...notification, isRead: true };
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = (notifications: Notification[]): Notification[] => {
  return notifications.map(n => ({ ...n, isRead: true }));
};
