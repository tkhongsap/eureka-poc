import { Notification, NotificationType, UserRole } from '../types';

/**
 * Notification Service
 * Handles creation and management of workflow notifications
 * 
 * Design: Each notification is sent to a specific user (recipientName).
 * For role-based notifications, caller should fetch users by role and create
 * notifications for each user.
 */

// Generate unique notification ID
const generateNotificationId = (): string => {
  return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create notifications when WO is created
 * Notifies: All Admins
 * @param adminNames - Array of admin names to notify
 */
export const createWOCreatedNotifications = (
  workOrderId: string,
  workOrderTitle: string,
  createdBy: string,
  adminNames: string[]
): Notification[] => {
  return adminNames.map(adminName => ({
    id: generateNotificationId(),
    type: NotificationType.WO_CREATED,
    workOrderId,
    workOrderTitle,
    message: `New work order created: "${workOrderTitle}"`,
    messageKey: 'notif.woCreated',
    messageParams: { title: workOrderTitle },
    recipientRole: 'Admin' as UserRole,
    recipientName: adminName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: createdBy
  }));
};

// Legacy single-recipient version for backward compatibility
export const createWOCreatedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  createdBy: string,
  adminName: string
): Notification => {
  return createWOCreatedNotifications(workOrderId, workOrderTitle, createdBy, [adminName])[0];
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
    messageKey: 'notif.woAssigned',
    messageParams: { title: workOrderTitle },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: assignedBy
  };
};

/**
 * Create notifications when Technician marks work as done
 * Notifies: Supervisor Head Technician (if specified) OR all Head Technicians (fallback)
 * @param headTechnicianNames - Array of head technician names to notify (fallback)
 * @param supervisorName - The specific head technician supervising this technician (takes priority)
 */
export const createWOCompletedNotifications = (
  workOrderId: string,
  workOrderTitle: string,
  completedBy: string,
  headTechnicianNames: string[],
  supervisorName?: string
): Notification[] => {
  // If supervisorName is specified, notify only that head technician
  // Otherwise, notify all head technicians (fallback)
  const headTechsToNotify = supervisorName ? [supervisorName] : headTechnicianNames;
  
  return headTechsToNotify.map(headTechnicianName => ({
    id: generateNotificationId(),
    type: NotificationType.WO_COMPLETED,
    workOrderId,
    workOrderTitle,
    message: `Work order "${workOrderTitle}" has been completed and is pending review`,
    messageKey: 'notif.woCompleted',
    messageParams: { title: workOrderTitle },
    recipientRole: 'Head Technician' as UserRole,
    recipientName: headTechnicianName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: completedBy
  }));
};

// Legacy single-recipient version for backward compatibility
export const createWOCompletedNotification = (
  workOrderId: string,
  workOrderTitle: string,
  completedBy: string,
  headTechnicianName: string
): Notification => {
  return createWOCompletedNotifications(workOrderId, workOrderTitle, completedBy, [headTechnicianName])[0];
};

/**
 * Create notifications when Head Technician approves work
 * Notifies: managedBy Admin (if assigned) OR all Admins (if no managedBy) + Requester + Technician
 * @param adminNames - Array of admin names to notify (used if no managedBy)
 * @param managedByAdmin - The specific admin who assigned the WO (takes priority)
 */
export const createWOApprovedNotifications = (
  workOrderId: string,
  workOrderTitle: string,
  approvedBy: string,
  adminNames: string[],
  requestorName?: string,
  technicianName?: string,
  managedByAdmin?: string
): Notification[] => {
  const notifications: Notification[] = [];

  // If managedByAdmin is specified, notify only that admin
  // Otherwise, notify all admins (fallback for legacy WOs without managedBy)
  const adminsToNotify = managedByAdmin ? [managedByAdmin] : adminNames;
  
  adminsToNotify.forEach(adminName => {
    notifications.push({
      id: generateNotificationId(),
      type: NotificationType.WO_APPROVED,
      workOrderId,
      workOrderTitle,
      message: `Work order "${workOrderTitle}" has been approved and is ready to be closed`,
      messageKey: 'notif.woApproved',
      messageParams: { title: workOrderTitle },
      recipientRole: 'Admin' as UserRole,
      recipientName: adminName,
      isRead: false,
      createdAt: new Date().toISOString(),
      triggeredBy: approvedBy
    });
  });

  // Notification for Requester (if provided)
  if (requestorName) {
    notifications.push({
      id: generateNotificationId(),
      type: NotificationType.WO_APPROVED,
      workOrderId,
      workOrderTitle,
      message: `Your work order "${workOrderTitle}" has been approved and completed`,
      messageKey: 'notif.woApprovedRequestor',
      messageParams: { title: workOrderTitle },
      recipientRole: 'Requester' as UserRole,
      recipientName: requestorName,
      isRead: false,
      createdAt: new Date().toISOString(),
      triggeredBy: approvedBy
    });
  }

  // Notification for Technician (if provided)
  if (technicianName) {
    notifications.push({
      id: generateNotificationId(),
      type: NotificationType.WO_APPROVED,
      workOrderId,
      workOrderTitle,
      message: `Work order "${workOrderTitle}" has been approved`,
      messageKey: 'notif.woApprovedTech',
      messageParams: { title: workOrderTitle },
      recipientRole: 'Technician' as UserRole,
      recipientName: technicianName,
      isRead: false,
      createdAt: new Date().toISOString(),
      triggeredBy: approvedBy
    });
  }

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
    messageKey: rejectionReason ? 'notif.woRejectedWithReason' : 'notif.woRejected',
    messageParams: rejectionReason 
      ? { title: workOrderTitle, reason: rejectionReason }
      : { title: workOrderTitle },
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
    messageKey: 'notif.woClosed',
    messageParams: { title: workOrderTitle },
    recipientRole: 'Requester',
    recipientName: requestorName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: closedBy
  };
};

/**
 * Create notification when Admin cancels work order
 * Notifies: Requestor (who created the work order)
 */
export const createWOCanceledNotification = (
  workOrderId: string,
  workOrderTitle: string,
  canceledBy: string,
  requestorName?: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_CANCELED,
    workOrderId,
    workOrderTitle,
    message: `Work order "${workOrderTitle}" has been canceled`,
    messageKey: 'notif.woCanceled',
    messageParams: { title: workOrderTitle },
    recipientRole: 'Requester',
    recipientName: requestorName,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: canceledBy
  };
};

/**
 * Filter notifications for specific user
 * Now requires recipientName to match exactly - no more broadcast notifications
 */
export const filterNotificationsForUser = (
  notifications: Notification[],
  userRole: UserRole,
  userName?: string
): Notification[] => {
  return notifications.filter(notif => {
    // Match role first
    if (notif.recipientRole !== userRole) return false;
    
    // Must match recipientName exactly (no more broadcast to entire role)
    if (userName) {
      return notif.recipientName === userName;
    }
    
    // If no userName provided, only show notifications without recipientName (legacy)
    return !notif.recipientName;
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

/**
 * Create notification for work order reminder (7 days before preferred date)
 * Notifies: Assigned Technician
 */
export const createWOReminder7DaysNotification = (
  workOrderId: string,
  workOrderTitle: string,
  preferredDate: string,
  assignedTo: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_REMINDER_7_DAYS,
    workOrderId,
    workOrderTitle,
    message: `งาน "${workOrderTitle}" มีกำหนดนัดหมายในอีก 7 วัน (${preferredDate})`,
    messageKey: 'notif.reminder7Days',
    messageParams: { title: workOrderTitle, date: preferredDate },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: 'System'
  };
};

/**
 * Create notification for work order reminder (3 days before preferred date)
 * Notifies: Assigned Technician
 */
export const createWOReminder3DaysNotification = (
  workOrderId: string,
  workOrderTitle: string,
  preferredDate: string,
  assignedTo: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_REMINDER_3_DAYS,
    workOrderId,
    workOrderTitle,
    message: `⚠️ งาน "${workOrderTitle}" มีกำหนดนัดหมายในอีก 3 วัน (${preferredDate}) กรุณาเตรียมตัวให้พร้อม`,
    messageKey: 'notif.reminder3Days',
    messageParams: { title: workOrderTitle, date: preferredDate },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: 'System'
  };
};

/**
 * Create notification for due date reminder (7 days before due date)
 * Notifies: Assigned Technician
 */
export const createWODue7DaysNotification = (
  workOrderId: string,
  workOrderTitle: string,
  dueDate: string,
  assignedTo: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_DUE_7_DAYS,
    workOrderId,
    workOrderTitle,
    message: `📅 งาน "${workOrderTitle}" จะถึงกำหนดส่งในอีก 7 วัน (${dueDate})`,
    messageKey: 'notif.due7Days',
    messageParams: { title: workOrderTitle, date: dueDate },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: 'System'
  };
};

/**
 * Create notification for due date reminder (3 days before due date)
 * Notifies: Assigned Technician
 */
export const createWODue3DaysNotification = (
  workOrderId: string,
  workOrderTitle: string,
  dueDate: string,
  assignedTo: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_DUE_3_DAYS,
    workOrderId,
    workOrderTitle,
    message: `⚠️ งาน "${workOrderTitle}" จะถึงกำหนดส่งในอีก 3 วัน (${dueDate}) กรุณาเร่งดำเนินการ`,
    messageKey: 'notif.due3Days',
    messageParams: { title: workOrderTitle, date: dueDate },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: 'System'
  };
};

/**
 * Create notification for due date reminder (1 day before due date)
 * Notifies: Assigned Technician
 */
export const createWODue1DayNotification = (
  workOrderId: string,
  workOrderTitle: string,
  dueDate: string,
  assignedTo: string
): Notification => {
  return {
    id: generateNotificationId(),
    type: NotificationType.WO_DUE_1_DAY,
    workOrderId,
    workOrderTitle,
    message: `🚨 งาน "${workOrderTitle}" จะถึงกำหนดส่งพรุ่งนี้ (${dueDate}) กรุณาดำเนินการให้เสร็จ!`,
    messageKey: 'notif.due1Day',
    messageParams: { title: workOrderTitle, date: dueDate },
    recipientRole: 'Technician',
    recipientName: assignedTo,
    isRead: false,
    createdAt: new Date().toISOString(),
    triggeredBy: 'System'
  };
};
