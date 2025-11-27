export enum Priority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum Status {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  CLOSED = 'Closed',
  CANCELED = 'Canceled'
}

export type UserRole = 'Admin' | 'Technician' | 'Requester';

export interface User {
  id: string;
  name: string;
  role: string; // Display title
  userRole: UserRole; // System role for permissions
  avatarUrl: string;
}

export interface PartUsage {
  partId: string;
  name: string;
  quantity: number;
  cost: number;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  assetName: string;
  location: string;
  priority: Priority;
  status: Status;
  assignedTo?: string;
  dueDate: string;
  createdAt: string;
  partsUsed?: PartUsage[];
  imageIds?: string[];  // Reference to attached images
  requestId?: string;   // Original request ID if created from request
  technicianNotes?: string;  // Notes added by technician
  technicianImages?: string[];  // Images added by technician
  adminReview?: string; // Review/approval notes by admin
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  status: 'Operational' | 'Downtime' | 'Maintenance';
  healthScore: number;
  location: string;
  parentId?: string;
  children?: Asset[];
  criticality: 'Critical' | 'High' | 'Medium' | 'Low';
  model?: string;
  installDate?: string;
}

export interface KpiData {
  name: string;
  value: number;
  change?: number; // percentage
  trend?: 'up' | 'down' | 'neutral';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minLevel: number; // Reorder Point (ROP)
  unit: string;
  location: string;
  category: string;
  lastUpdated: string;
  cost: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  status: 'Available' | 'Busy' | 'Off-Shift' | 'On-Leave';
  currentTask?: string; // WO ID
  skills: string[];
  avatarUrl: string;
}

// Work Order Workflow Types
export interface WorkOrderStatusTransition {
  from: Status;
  to: Status;
  allowedRoles: UserRole[];
}

export interface WorkOrderPermissions {
  canEdit: boolean;
  canChangeStatus: boolean;
  canAssign: boolean;
  canDelete: boolean;
  canView: boolean;
}

export enum NotificationType {
  WO_CREATED = 'wo_created',
  WO_ASSIGNED = 'wo_assigned',
  WO_COMPLETED = 'wo_completed',
  WO_APPROVED = 'wo_approved',
  WO_REJECTED = 'wo_rejected',
  WO_CLOSED = 'wo_closed'
}

export interface Notification {
  id: string;
  type: NotificationType;
  workOrderId: string;
  workOrderTitle: string;
  message: string;
  recipientRole: UserRole;
  recipientName?: string; // Specific user if applicable
  isRead: boolean;
  createdAt: string;
  triggeredBy: string; // User who triggered the notification
}