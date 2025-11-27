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
      const baseSlug = slugWithPort.replace(/-5000$/, '');
      const restOfDomain = parts.slice(1).join('.');
      return `${protocol}//${baseSlug}-8000.${restOfDomain}/api`;
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
  filename: string;
  createdAt: string;
}

export const uploadImage = async (file: File): Promise<ImageInfo> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/images/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload image');
  }

  return response.json();
};

export const getImageUrl = (imageId: string): string => {
  return `${API_BASE_URL}/images/${imageId}`;
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
}

export interface CreateRequestData {
  location: string;
  priority: string;
  description: string;
  imageIds: string[];
  assignedTo?: string;
  createdBy?: string;
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
  technicianNotes?: string;
  technicianImages?: string[];
  partsUsed?: { id: string; name: string; quantity: number }[];
  adminReview?: string;
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

export const listWorkOrders = async (): Promise<WorkOrderItem[]> => {
  const response = await fetch(`${API_BASE_URL}/workorders`);
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
  data: TechnicianUpdateData,
  userRole?: string,
  userName?: string
): Promise<WorkOrderItem> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (userRole) headers['X-User-Role'] = userRole;
  if (userName) headers['X-User-Name'] = userName;

  const response = await fetch(`${API_BASE_URL}/workorders/${woId}/technician-update`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update work order as technician');
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
