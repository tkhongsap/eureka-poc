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

// --- Image/Video API ---
export interface ImageInfo {
  id: string;
  originalName: string;
  filename?: string;
  base64Data: string;
  mediaType?: string;  // 'image' or 'video'
  contentType?: string;  // MIME type like 'image/jpeg' or 'video/mp4'
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

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteArrays: BlobPart[] = [];
  
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const buffer = new ArrayBuffer(byteNumbers.length);
    const byteArray = new Uint8Array(buffer);
    for (let i = 0; i < byteNumbers.length; i++) {
      byteArray[i] = byteNumbers[i];
    }
    byteArrays.push(byteArray);
  }
  
  return new Blob(byteArrays, { type: mimeType });
};

export const getImageDataUrl = async (imageId: string): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/images/${imageId}`);
  if (!response.ok) {
    throw new Error('Failed to get image');
  }
  const data: ImageInfo = await response.json();
  // Use stored contentType if available, otherwise determine from filename
  let mimeType = data.contentType;
  if (!mimeType) {
    const ext = (data.filename && data.filename.split('.').pop()?.toLowerCase()) || 'jpg';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'webm': 'video/webm',
      'mkv': 'video/x-matroska',
      'm4v': 'video/x-m4v',
      '3gp': 'video/3gpp',
    };
    mimeType = mimeTypes[ext] || 'image/jpeg';
  }
  
  // For videos, use Blob URL (better performance for large files)
  if (mimeType.startsWith('video/')) {
    const blob = base64ToBlob(data.base64Data, mimeType);
    return URL.createObjectURL(blob);
  }
  
  // For images, use Data URL
  return `data:${mimeType};base64,${data.base64Data}`;
};

// Get media info including type (image/video)
export const getMediaInfo = async (mediaId: string): Promise<ImageInfo> => {
  const response = await fetch(`${API_BASE_URL}/images/${mediaId}`);
  if (!response.ok) {
    throw new Error('Failed to get media info');
  }
  return response.json();
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

// --- Spare Parts API ---
export interface SparePartInput {
  part_name: string;
  category: string;
  price_per_unit: number;
  quantity: number;
}

export interface SparePart extends SparePartInput {
  id: number;
  created_at: string;
  updated_at: string;
}

export const addSparePart = async (data: SparePartInput): Promise<SparePart> => {
  const response = await fetch(`${API_BASE_URL}/spare-parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to add spare part');
  }
  return response.json();
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

// --- User Profile API ---
export interface UserProfile {
  id: string;
  email: string | null;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  employee_id: string | null;
  job_title: string | null;
  role: string | null;
  userRole: string;
  status: string | null;
  created_at: string | null;
}

export interface ProfileUpdate {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get profile');
  }

  return response.json();
};

export const updateMyProfile = async (profile: ProfileUpdate): Promise<UserProfile> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
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

// --- Asset Management API ---
export interface AssetData {
  id?: string;
  name: string;
  type: 'Site' | 'Line' | 'Facility' | 'Machine' | 'Equipment';
  status: 'Operational' | 'Downtime' | 'Maintenance';
  healthScore?: number;
  location?: string;
  criticality?: 'Critical' | 'High' | 'Medium' | 'Low';
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  installDate?: string;
  warrantyExpiry?: string;
  description?: string;
  parentId?: string;
}

export interface AssetResponse {
  id: string;
  name: string;
  type: string;
  status: string;
  health_score: number;
  location: string;
  criticality: string;
  model: string | null;
  manufacturer: string | null;
  serial_number: string | null;
  install_date: string | null;
  warranty_expiry: string | null;
  description: string | null;
  parent_id: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  children: AssetResponse[];
}

export interface AssetTreeNode {
  id: string;
  name: string;
  type: string;
  status: string;
  healthScore: number;
  location: string;
  criticality: string;
  model?: string;
  installDate?: string;
  children: AssetTreeNode[];
}

// Get all assets with optional filters
export const getAssets = async (params?: {
  type?: string;
  status?: string;
  criticality?: string;
  parent_id?: string;
  search?: string;
}): Promise<AssetResponse[]> => {
  const searchParams = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.append(key, value);
    });
  }

  const url = searchParams.toString() 
    ? `${API_BASE_URL}/assets?${searchParams.toString()}`
    : `${API_BASE_URL}/assets`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch assets');
  }

  return response.json();
};

// Get assets as tree structure
export const getAssetTree = async (): Promise<AssetTreeNode[]> => {
  const response = await fetch(`${API_BASE_URL}/assets/tree`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch asset tree');
  }

  return response.json();
};

// Get single asset
export const getAsset = async (id: string): Promise<AssetResponse> => {
  const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch asset');
  }

  return response.json();
};

// Create new asset (Admin, Head Technician only)
export const createAsset = async (data: AssetData): Promise<AssetResponse> => {
  const payload = {
    id: data.id,
    name: data.name,
    type: data.type,
    status: data.status,
    health_score: data.healthScore ?? 100,
    location: data.location ?? '',
    criticality: data.criticality ?? 'Medium',
    model: data.model,
    manufacturer: data.manufacturer,
    serial_number: data.serialNumber,
    install_date: data.installDate,
    warranty_expiry: data.warrantyExpiry,
    description: data.description,
    parent_id: data.parentId,
  };

  const url = currentUserName 
    ? `${API_BASE_URL}/assets?created_by=${encodeURIComponent(currentUserName)}`
    : `${API_BASE_URL}/assets`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to create asset' }));
    throw new Error(error.detail || 'Failed to create asset');
  }

  return response.json();
};

// Update asset (Admin, Head Technician only)
export const updateAsset = async (id: string, data: Partial<AssetData>): Promise<AssetResponse> => {
  const payload: Record<string, unknown> = {};
  
  if (data.name !== undefined) payload.name = data.name;
  if (data.type !== undefined) payload.type = data.type;
  if (data.status !== undefined) payload.status = data.status;
  if (data.healthScore !== undefined) payload.health_score = data.healthScore;
  if (data.location !== undefined) payload.location = data.location;
  if (data.criticality !== undefined) payload.criticality = data.criticality;
  if (data.model !== undefined) payload.model = data.model;
  if (data.manufacturer !== undefined) payload.manufacturer = data.manufacturer;
  if (data.serialNumber !== undefined) payload.serial_number = data.serialNumber;
  if (data.installDate !== undefined) payload.install_date = data.installDate;
  if (data.warrantyExpiry !== undefined) payload.warranty_expiry = data.warrantyExpiry;
  if (data.description !== undefined) payload.description = data.description;
  if (data.parentId !== undefined) payload.parent_id = data.parentId;

  const url = currentUserName 
    ? `${API_BASE_URL}/assets/${id}?updated_by=${encodeURIComponent(currentUserName)}`
    : `${API_BASE_URL}/assets/${id}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update asset' }));
    throw new Error(error.detail || 'Failed to update asset');
  }

  return response.json();
};

// Delete asset (Admin only)
export const deleteAsset = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to delete asset');
  }
};

// Seed demo assets
export const seedAssets = async (): Promise<{ message: string; count: number }> => {
  const response = await fetch(`${API_BASE_URL}/assets/seed`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to seed assets');
  }

  return response.json();
};

// Seed assets with GIS coordinates
export const seedAssetsWithGIS = async (): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/assets/seed-with-gis`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to seed GIS data');
  }

  return response.json();
};

// ============ DOWNTIME API ============

export interface DowntimeRecord {
  id: number;
  asset_id: string;
  start_time: string;
  end_time: string | null;
  reason: string;
  description: string | null;
  production_loss: number | null;
  work_order_id: number | null;
  reported_by: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
  duration_minutes: number | null;
  is_active: boolean;
  asset_name: string | null;
}

export const getDowntimeReasons = async (): Promise<{ reasons: string[] }> => {
  const response = await fetch(`${API_BASE_URL}/assets/downtimes/reasons`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch downtime reasons');
  return response.json();
};

export const getDowntimes = async (params?: {
  asset_id?: string;
  active_only?: boolean;
  limit?: number;
}): Promise<DowntimeRecord[]> => {
  const searchParams = new URLSearchParams();
  if (params?.asset_id) searchParams.append('asset_id', params.asset_id);
  if (params?.active_only) searchParams.append('active_only', 'true');
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const url = searchParams.toString()
    ? `${API_BASE_URL}/assets/downtimes?${searchParams.toString()}`
    : `${API_BASE_URL}/assets/downtimes`;

  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch downtimes');
  return response.json();
};

export const createDowntime = async (data: {
  asset_id: string;
  start_time: string;
  end_time?: string;
  reason: string;
  description?: string;
  production_loss?: number;
  work_order_id?: number;
  reported_by?: string;
}): Promise<DowntimeRecord> => {
  const response = await fetch(`${API_BASE_URL}/assets/downtimes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create downtime');
  return response.json();
};

export const updateDowntime = async (id: number, data: {
  end_time?: string;
  reason?: string;
  description?: string;
  production_loss?: number;
  resolved_by?: string;
}): Promise<DowntimeRecord> => {
  const response = await fetch(`${API_BASE_URL}/assets/downtimes/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update downtime');
  return response.json();
};

export const deleteDowntime = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assets/downtimes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete downtime');
};

// ============ METER READING API ============

export interface MeterReading {
  id: number;
  asset_id: string;
  meter_type: string;
  value: number;
  unit: string;
  previous_value: number | null;
  reading_date: string;
  source: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  delta: number | null;
  asset_name: string | null;
}

export interface MeterType {
  type: string;
  unit: string;
}

export const getMeterTypes = async (): Promise<{ types: MeterType[] }> => {
  const response = await fetch(`${API_BASE_URL}/assets/meters/types`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch meter types');
  return response.json();
};

export const getMeterReadings = async (params?: {
  asset_id?: string;
  meter_type?: string;
  limit?: number;
}): Promise<MeterReading[]> => {
  const searchParams = new URLSearchParams();
  if (params?.asset_id) searchParams.append('asset_id', params.asset_id);
  if (params?.meter_type) searchParams.append('meter_type', params.meter_type);
  if (params?.limit) searchParams.append('limit', params.limit.toString());

  const url = searchParams.toString()
    ? `${API_BASE_URL}/assets/meters?${searchParams.toString()}`
    : `${API_BASE_URL}/assets/meters`;

  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch meter readings');
  return response.json();
};

export const createMeterReading = async (data: {
  asset_id: string;
  meter_type: string;
  value: number;
  unit: string;
  reading_date?: string;
  source?: string;
  notes?: string;
  recorded_by?: string;
}): Promise<MeterReading> => {
  const response = await fetch(`${API_BASE_URL}/assets/meters`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create meter reading');
  return response.json();
};

export const deleteMeterReading = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/assets/meters/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to delete meter reading');
};

// ============ ASSET MAP API ============

export interface AssetMapPoint {
  id: string;
  name: string;
  type: string;
  status: string;
  criticality: string;
  latitude: number;
  longitude: number;
  health_score: number;
}

export const getAssetsForMap = async (params?: {
  type?: string;
  status?: string;
}): Promise<AssetMapPoint[]> => {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.append('type', params.type);
  if (params?.status) searchParams.append('status', params.status);

  const url = searchParams.toString()
    ? `${API_BASE_URL}/assets/map?${searchParams.toString()}`
    : `${API_BASE_URL}/assets/map`;

  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Failed to fetch assets for map');
  return response.json();
};

export const updateAssetLocation = async (assetId: string, latitude: number, longitude: number): Promise<{ message: string }> => {
  const response = await fetch(
    `${API_BASE_URL}/assets/${assetId}/location?latitude=${latitude}&longitude=${longitude}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) throw new Error('Failed to update asset location');
  return response.json();
};

// ============ QR CODE API ============

export interface QRCodeData {
  asset_id: string;
  qr_data: string;
  asset_name: string;
  asset_type: string;
}

export const getAssetQR = async (assetId: string): Promise<QRCodeData> => {
  const response = await fetch(`${API_BASE_URL}/assets/${assetId}/qr`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to get QR code');
  return response.json();
};

export const lookupAssetByQR = async (qrData: string): Promise<AssetResponse> => {
  const response = await fetch(`${API_BASE_URL}/assets/lookup/qr/${encodeURIComponent(qrData)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Asset not found');
  return response.json();
};

// ============ ASSET STATISTICS API ============

export interface AssetStatistics {
  total_assets: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
  by_criticality: Record<string, number>;
  total_downtime_hours: number;
  active_downtimes: number;
  avg_health_score: number;
}

export const getAssetStatistics = async (): Promise<AssetStatistics> => {
  const response = await fetch(`${API_BASE_URL}/assets/statistics/summary`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch asset statistics');
  return response.json();
};

// --- Spare Parts API ---
export interface SparePartItem {
  id: number;
  part_name: string;
  category: string;
  price_per_unit: number;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSparePartData {
  part_name: string;
  category: string;
  price_per_unit: number;
  quantity: number;
}

export interface UpdateSparePartData {
  part_name?: string;
  category?: string;
  price_per_unit?: number;
  quantity?: number;
}

export const listSpareParts = async (): Promise<SparePartItem[]> => {
  const response = await fetch(`${API_BASE_URL}/spare-parts`);
  if (!response.ok) {
    throw new Error('Failed to list spare parts');
  }
  return response.json();
};

export const createSparePart = async (data: CreateSparePartData): Promise<SparePartItem> => {
  const response = await fetch(`${API_BASE_URL}/spare-parts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create spare part');
  }
  return response.json();
};

export const updateSparePart = async (id: number, data: UpdateSparePartData): Promise<SparePartItem> => {
  const response = await fetch(`${API_BASE_URL}/spare-parts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update spare part');
  }
  return response.json();
};

export const deleteSparePart = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/spare-parts/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to delete spare part');
  }
};
