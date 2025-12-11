// API Service for connecting to FastAPI backend
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    const replitDomains = ['replit.dev', 'repl.co', 'replit.app'];
    const isReplitHosted = replitDomains.some(domain => hostname.includes(domain));

    if (isReplitHosted) {
      const protocol = window.location.protocol;
      const parts = hostname.split('.');
      const slugWithPort = parts[0];

      // Check if we're on port 5000 (development) or production
      if (slugWithPort.endsWith('-5000')) {
        // Development mode - use port 8000 backend
        const baseSlug = slugWithPort.replace(/-5000$/, '');
        const restOfDomain = parts.slice(1).join('.');
        return `${protocol}//${baseSlug}-8000.${restOfDomain}/api`;
      } else {
        // Production mode - same origin, just use /api
        return '/api';
      }
    }
  }
  return 'http://localhost:8000/api';
};

const API_BASE_URL = getBackendUrl();

// User context for API calls
let currentUserRole: string | null = null;
let currentUserName: string | null = null;

export const setUserContext = (role: string, name: string) => {
  currentUserRole = role;
  currentUserName = name;
};

export const getUserContext = () => ({
  role: currentUserRole,
  name: currentUserName
});

const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (currentUserRole) {
    headers['X-User-Role'] = currentUserRole;
  }
  if (currentUserName) {
    headers['X-User-Name'] = currentUserName;
  }

  return headers;
};

// --- Image API ---
export interface ImageInfo {
  id: string;
  originalName: string;
  filename?: string;
  base64Data: string;
  createdAt: string;
}

export const uploadImage = async (file: File): Promise<ImageInfo> => {
  const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const commaIdx = result.indexOf(',');
      resolve(commaIdx > -1 ? result.substring(commaIdx + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });

  const base64 = await toBase64(file);

  const response = await fetch(`${API_BASE_URL}/images/upload-base64`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalName: file.name, base64Data: base64 }),
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
};

export const getImageDataUrl = async (imageId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/images/${imageId}`);
  if (!response.ok) {
    throw new Error('Failed to get image');
  }
  const data: ImageInfo = await response.json();
  const ext = (data.filename && data.filename.split('.').pop()) || 'jpg';
  return `data:image/${ext};base64,${data.base64Data}`;
};

export const listImages = async (): Promise<ImageInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/images`);
  if (!response.ok) {
    throw new Error('Failed to list images');
  }
  return response.json();
};

export const deleteImage = async (imageId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete image');
  }
};

// --- Request API ---
export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  googleMapsUrl: string;
}

export interface RequestItem {
  id: string;
  location: string;
  priority: string;
  description: string;
  status: string;
  createdAt: string;
  imageIds: string[];
  assignedTo?: string;
  createdBy?: string;
  locationData?: LocationData;
  preferredDate?: string; // Preferred date for maintenance visit
}

export interface CreateRequestData {
  location: string;
  priority: string;
  description: string;
  imageIds: string[];
  assignedTo?: string;
  createdBy?: string;
  locationData?: LocationData;
  preferredDate?: string; // Preferred date for maintenance visit
}

export const createRequest = async (data: CreateRequestData): Promise<RequestItem> => {
  const response = await fetch(`${API_BASE_URL}/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create request');
  }

  return response.json();
};

export const listRequests = async (): Promise<RequestItem[]> => {
  const response = await fetch(`${API_BASE_URL}/requests`);
  if (!response.ok) {
    throw new Error('Failed to list requests');
  }
  return response.json();
};

export const getRequest = async (requestId: string): Promise<RequestItem> => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}`);
  if (!response.ok) {
    throw new Error('Failed to get request');
  }
  return response.json();
};

export const deleteRequest = async (requestId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete request');
  }
};

// --- Work Order Reject History ---
export interface RejectHistoryItem {
  id: string;
  message: string;
  createdAt: string | null;
  triggeredBy: string;
  recipientRole: string;
  recipientName?: string;
}

export const getWorkOrderRejectHistory = async (workOrderId: string): Promise<RejectHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${workOrderId}/reject-history`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch reject history');
  }
  return response.json();
};

export const convertRequestToWorkOrder = async (requestId: string): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/requests/${requestId}/convert`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to convert request');
  }
  return response.json();
};

// --- Work Order API ---
export interface WorkOrderItem {
  id: string;
  title: string;
  description: string;
  assetName: string;
  location: string;
  priority: string;
  status: string;
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
  imageIds: string[];
  requestId?: string;
  createdBy?: string; // Name of the requester who created this WO
  managedBy?: string; // Name of the admin who assigned/manages this WO
  technicianNotes?: string;
  technicianImages?: string[];
  partsUsed?: { id: string; name: string; quantity: number }[];
  adminReview?: string;
  locationData?: LocationData;
  preferredDate?: string; // Preferred maintenance date from request
}

export interface CreateWorkOrderData {
  title: string;
  description: string;
  assetName: string;
  location: string;
  priority: string;
  status?: string;
  assignedTo?: string;
  dueDate: string;
  imageIds?: string[];
  requestId?: string;
  createdBy?: string; // Name of the requester who created this WO
  locationData?: LocationData;
  preferredDate?: string; // Preferred maintenance date from request
}

export const createWorkOrder = async (data: CreateWorkOrderData): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create work order');
  }

  return response.json();
};

export interface WorkOrderQuery {
  search?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  priority?: string;
}

export const listWorkOrders = async (query?: WorkOrderQuery): Promise<WorkOrderItem[]> => {
  const params = new URLSearchParams();
  if (query?.search) params.append('search', query.search);
  if (query?.startDate) params.append('startDate', query.startDate);
  if (query?.endDate) params.append('endDate', query.endDate);
  if (query?.assignedTo) params.append('assignedTo', query.assignedTo);

  const qs = params.toString();
  const url = qs ? `${API_BASE_URL}/workorders?${qs}` : `${API_BASE_URL}/workorders`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to list work orders');
  }
  return response.json();
};

export const getWorkOrder = async (woId: string): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}`);
  if (!response.ok) {
    throw new Error('Failed to get work order');
  }
  return response.json();
};

export const updateWorkOrder = async (woId: string, updates: Partial<WorkOrderItem>): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update work order');
  }

  return response.json();
};

export const deleteWorkOrder = async (woId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete work order');
  }
};

// --- Technician Update API ---
export interface TechnicianUpdateData {
  technicianNotes: string;
  technicianImages?: string[];
}

export const technicianUpdateWorkOrder = async (
  woId: string,
  data: TechnicianUpdateData
): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}/technician-update`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update work order as technician');
  }

  return response.json();
};

// --- Admin Review API ---
export const adminApproveWorkOrder = async (woId: string): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to approve work order');
  }

  return response.json();
};

export interface AdminRejectData {
  rejectionReason: string;
}

export const adminRejectWorkOrder = async (woId: string, data: AdminRejectData): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to reject work order');
  }

  return response.json();
};

export const adminCloseWorkOrder = async (woId: string): Promise<WorkOrderItem> => {
  const response = await fetch(`${API_BASE_URL}/workorders/${woId}/close`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to close work order');
  }

  return response.json();
};

// --- Users API ---
export interface UserItem {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  employeeId?: string;
  jobTitle?: string;
  role: string;
  userRole: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
  firstName?: string;
  lastName?: string;
}

// Normalize backend user payload (snake_case) to frontend UserItem
const mapUser = (u: any): UserItem => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone ?? u.phone_number,
  avatarUrl: u.avatar_url ?? u.avatarUrl,
  employeeId: u.employee_id ?? u.employeeId,
  jobTitle: u.job_title ?? u.jobTitle,
  role: u.role,
  userRole: u.userRole ?? u.user_role ?? u.role,
  status: u.status,
  createdAt: u.created_at ?? u.createdAt,
  updatedAt: u.updated_at ?? u.updatedAt,
  lastLoginAt: u.last_login_at ?? u.lastLoginAt,
  firstName: u.first_name ?? u.firstName,
  lastName: u.last_name ?? u.lastName,
});

export const listUsers = async (userRole?: string): Promise<UserItem[]> => {
  const url = userRole
    ? `${API_BASE_URL}/users/by-role/${encodeURIComponent(userRole)}`
    : `${API_BASE_URL}/users`;

  const response = await fetch(url, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }

  const users = await response.json();
  return users.map(mapUser);
};

export const getUsersByRole = async (userRole: string): Promise<UserItem[]> => {
  return listUsers(userRole);
};

export const getTeamHeadTechnician = async (teamId: string): Promise<UserItem> => {
  const response = await fetch(`${API_BASE_URL}/users/team/${teamId}/head-technician`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`No Head Technician found for team ${teamId}`);
    }
    throw new Error('Failed to fetch team head technician');
  }

  return mapUser(await response.json());
};

export const getTeamMembers = async (teamId: string): Promise<UserItem[]> => {
  const response = await fetch(`${API_BASE_URL}/users/team/${teamId}/members`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch team members');
  }

  const users = await response.json();
  return users.map(mapUser);
};

export interface CreateUserData {
  email?: string;
  passwordHash?: string;
  name: string;
  phone?: string;
  avatarUrl?: string;
  employeeId?: string;
  jobTitle?: string;
  role?: string; // Display role
  userRole: string; // System role for permissions
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  name?: string;
  phone?: string;
  avatarUrl?: string;
  employeeId?: string;
  jobTitle?: string;
  role?: string; // Display role
  status?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorId: string;
  targetUserId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  ipAddress?: string;
  createdAt?: string;
}



export const getUser = async (userId: string): Promise<UserItem> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }

  const u = await response.json();
  return mapUser(u);
};

export const createUser = async (data: CreateUserData): Promise<UserItem> => {
  // Map frontend field names to backend field names
  const payload: any = {
    name: data.name,
    userRole: data.userRole,
  };

  if (data.email) payload.email = data.email;
  if (data.passwordHash) payload.password_hash = data.passwordHash;
  if (data.phone) payload.phone = data.phone;
  if (data.avatarUrl) payload.avatar_url = data.avatarUrl;
  if (data.employeeId) payload.employee_id = data.employeeId;
  if (data.jobTitle) payload.job_title = data.jobTitle;
  if (data.role) payload.role = data.role;
  if (data.firstName) payload.first_name = data.firstName;
  if (data.lastName) payload.last_name = data.lastName;

  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create user');
  }

  const u = await response.json();
  return mapUser(u);
};

export const updateUser = async (userId: string, data: UpdateUserData): Promise<UserItem> => {
  // Map frontend field names to backend field names
  const payload: any = {};

  if (data.email !== undefined) payload.email = data.email;
  if (data.passwordHash !== undefined) payload.password_hash = data.passwordHash;
  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.avatarUrl !== undefined) payload.avatar_url = data.avatarUrl;
  if (data.employeeId !== undefined) payload.employee_id = data.employeeId;
  if (data.jobTitle !== undefined) payload.job_title = data.jobTitle;
  if (data.role !== undefined) payload.role = data.role;
  if (data.status !== undefined) payload.status = data.status;

  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update user');
  }

  const u = await response.json();
  return mapUser(u);
};

export const updateUserRole = async (
  userId: string,
  userRole: string,
  reason?: string
): Promise<UserItem> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ userRole, reason }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update user role');
  }

  const u = await response.json();
  return mapUser(u);
};

export const getAuditLogs = async (): Promise<AuditLogItem[]> => {
  const response = await fetch(`${API_BASE_URL}/audit/logs`, {
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch audit logs');
  }

  const logs = await response.json();
  return logs.map((log: any) => ({
    id: log.id,
    action: log.action,
    actorId: log.actor_id,
    targetUserId: log.target_user_id,
    oldValue: log.old_value,
    newValue: log.new_value,
    reason: log.reason,
    ipAddress: log.ip_address,
    createdAt: log.created_at,
  }));
};

export const deleteUser = async (userId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
};

// --- Notification API ---
export interface NotificationItem {
  id: string;
  type: string;
  workOrderId: string;
  workOrderTitle: string;
  message: string;
  recipientRole: string;
  recipientName?: string;
  isRead: boolean;
  createdAt: string;
  triggeredBy: string;
}

export const getNotifications = async (): Promise<NotificationItem[]> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
};

export const createNotification = async (notification: Omit<NotificationItem, 'id'>): Promise<NotificationItem> => {
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    throw new Error('Failed to create notification');
  }

  return response.json();
};

export const markNotificationAsRead = async (notificationId: string): Promise<NotificationItem> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
};

export const deleteAllReadNotifications = async (): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/notifications/read`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete read notifications');
  }
};

// Check and create reminder notifications for upcoming work orders
export const checkAndCreateReminders = async (): Promise<{ message: string; notifications: { workOrderId: string; type: string; assignedTo: string }[] }> => {
  const response = await fetch(`${API_BASE_URL}/notifications/check-reminders`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to check reminders');
  }

  return response.json();
};

// --- User Preferences API ---
export interface NotificationPreferences {
  wo_assigned: boolean;
  wo_status_changed: boolean;
  wo_overdue: boolean;
  wo_due_soon: boolean;
  email_digest: boolean;
}

export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    // Return defaults if not found
    return {
      wo_assigned: true,
      wo_status_changed: true,
      wo_overdue: true,
      wo_due_soon: true,
      email_digest: false,
    };
  }

  return response.json();
};

export const updateNotificationPreferences = async (preferences: NotificationPreferences): Promise<NotificationPreferences> => {
  const response = await fetch(`${API_BASE_URL}/users/me/preferences`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(preferences),
  });

  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }

  return response.json();
};

// --- Health Check ---
export const checkHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
