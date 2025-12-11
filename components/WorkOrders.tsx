import React, { useState, useEffect } from 'react';
import {
  Plus, Filter, Download, MoreHorizontal, BrainCircuit, X, AlertTriangle, CheckSquare, Clock, ArrowRight, Zap,
  LayoutGrid, List, GripVertical, Calendar, Package, Trash2, Image as ImageIcon, Upload, Save, PlusCircle, HardHat, UserPlus,
  Loader2, CheckCircle2, XCircle, Navigation, MapPin, UserCircle2, ChevronDown, ChevronRight, Settings, Users, Layers
} from 'lucide-react';
import { DateInputSmall } from './DateInput';
import { useLanguage } from '../lib/i18n';

// Helper function to format date as DD/MM/YYYY
const formatDateDDMMYYYY = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Helper function to format date as DD/MM (short format)
const formatDateShort = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};
import { WorkOrder, Status, Priority, User, PartUsage } from '../types';
import { analyzeMaintenanceIssue, AnalysisResult, generateSmartChecklist } from '../services/geminiService';
import { getImageDataUrl, uploadImage, technicianUpdateWorkOrder, TechnicianUpdateData, updateWorkOrder, adminApproveWorkOrder, adminRejectWorkOrder, adminCloseWorkOrder, createNotification, getUsersByRole, getTeamHeadTechnician, getWorkOrderRejectHistory, RejectHistoryItem } from '../services/apiService';
import { canDragToStatus, getWorkOrderPermissions } from '../utils/workflowRules';
import { 
  createWOAssignedNotification, 
  createWOCompletedNotifications, 
  createWOApprovedNotifications, 
  createWORejectedNotification, 
  createWOClosedNotification,
  createWOCanceledNotification
} from '../services/notificationService';

interface WorkOrdersProps {
  workOrders: WorkOrder[];
  currentUser?: User;
  technicians?: { id: string; name: string }[];
}

const statusColors = {
  [Status.OPEN]: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  [Status.IN_PROGRESS]: 'bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  [Status.PENDING]: 'bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  [Status.COMPLETED]: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  [Status.CLOSED]: 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  [Status.CANCELED]: 'bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-300 border-pink-200 dark:border-pink-800',
};

// Column header colors for Kanban board
const statusColumnColors = {
  [Status.OPEN]: {
    header: 'bg-blue-100/80 dark:bg-blue-950/60 border-blue-200/60 dark:border-blue-800',
    dot: 'bg-blue-500',
    title: 'text-blue-700 dark:text-blue-300',
    count: 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200',
  },
  [Status.IN_PROGRESS]: {
    header: 'bg-orange-100/80 dark:bg-orange-950/60 border-orange-200/60 dark:border-orange-800',
    dot: 'bg-orange-500',
    title: 'text-orange-700 dark:text-orange-300',
    count: 'bg-orange-200 dark:bg-orange-800 text-orange-700 dark:text-orange-200',
  },
  [Status.PENDING]: {
    header: 'bg-violet-100/80 dark:bg-violet-950/60 border-violet-200/60 dark:border-violet-800',
    dot: 'bg-violet-500',
    title: 'text-violet-700 dark:text-violet-300',
    count: 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-200',
  },
  [Status.COMPLETED]: {
    header: 'bg-emerald-100/80 dark:bg-emerald-950/60 border-emerald-200/60 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    title: 'text-emerald-700 dark:text-emerald-300',
    count: 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-200',
  },
  [Status.CLOSED]: {
    header: 'bg-stone-200/80 dark:bg-stone-800/60 border-stone-300/60 dark:border-stone-700',
    dot: 'bg-stone-500',
    title: 'text-stone-700 dark:text-stone-300',
    count: 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-200',
  },
  [Status.CANCELED]: {
    header: 'bg-pink-100/80 dark:bg-pink-950/60 border-pink-200/60 dark:border-pink-800',
    dot: 'bg-pink-500',
    title: 'text-pink-700 dark:text-pink-300',
    count: 'bg-pink-200 dark:bg-pink-800 text-pink-700 dark:text-pink-200',
  },
};

const priorityColors = {
  [Priority.CRITICAL]: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border-red-100 dark:border-red-800',
  [Priority.HIGH]: 'text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950/50 border-orange-100 dark:border-orange-800',
  [Priority.MEDIUM]: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border-teal-100 dark:border-teal-800',
  [Priority.LOW]: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-100 dark:border-sky-800',
};

// Mock parts for selection
const AVAILABLE_PARTS = [
  { id: 'p1', name: 'Hydraulic Seal Kit', cost: 45.00 },
  { id: 'p2', name: 'Bearing 6204', cost: 12.50 },
  { id: 'p3', name: 'Sensor Cable (5m)', cost: 25.00 },
  { id: 'p4', name: 'Industrial Grease (1kg)', cost: 15.00 },
];

const WorkOrders: React.FC<WorkOrdersProps> = ({ workOrders: initialWorkOrders, currentUser, technicians = [] }) => {
  const { t, language } = useLanguage();

  // Helper function to translate priority using i18n
  const translatePriority = (priority: Priority): string => {
    const priorityKeyMap: Record<Priority, 'priority.critical' | 'priority.high' | 'priority.medium' | 'priority.low'> = {
      [Priority.CRITICAL]: 'priority.critical',
      [Priority.HIGH]: 'priority.high',
      [Priority.MEDIUM]: 'priority.medium',
      [Priority.LOW]: 'priority.low',
    };
    return t(priorityKeyMap[priority]) || priority;
  };

  // Helper function to translate status using i18n
  const translateStatus = (status: Status): string => {
    const statusKeyMap: Record<Status, 'status.open' | 'status.inProgress' | 'status.pending' | 'status.completed' | 'status.closed' | 'status.canceled'> = {
      [Status.OPEN]: 'status.open',
      [Status.IN_PROGRESS]: 'status.inProgress',
      [Status.PENDING]: 'status.pending',
      [Status.COMPLETED]: 'status.completed',
      [Status.CLOSED]: 'status.closed',
      [Status.CANCELED]: 'status.canceled',
    };
    return t(statusKeyMap[status]) || status;
  };

  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [selectedWOImages, setSelectedWOImages] = useState<string[]>([]); // Original request images
  const [selectedTechImages, setSelectedTechImages] = useState<string[]>([]); // Technician work images for display
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [draggedWoId, setDraggedWoId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Collapsible columns state for Kanban board
  const [collapsedColumns, setCollapsedColumns] = useState<Set<Status>>(new Set());

  // Column visibility customization
  const [visibleColumns, setVisibleColumns] = useState<Set<Status>>(new Set([Status.OPEN, Status.IN_PROGRESS, Status.PENDING, Status.COMPLETED, Status.CANCELED]));
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Swimlane grouping
  type SwimlaneMode = 'none' | 'priority' | 'technician';
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>('none');

  const toggleColumnVisibility = (status: Status) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        // Don't allow hiding all columns
        if (newSet.size > 1) {
          newSet.delete(status);
        }
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const toggleColumnCollapse = (status: Status) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  // Filter for technicians
  const [showOnlyMyJobs, setShowOnlyMyJobs] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'ALL'>('ALL');
  const [selectedMonth, setSelectedMonth] = useState(''); // YYYY-MM
  const [selectedAssignedTo, setSelectedAssignedTo] = useState(''); // Filter by technician (Admin only)

  // Technician update modal states
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [technicianImages, setTechnicianImages] = useState<string[]>([]);
  const [technicianPreviewUrls, setTechnicianPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Admin assignment state
  const TECHNICIANS: string[] = [
    'John Doe',
    'Sarah M.',
    'Mike R.',
    'Tom W.',
  ];
  const [adminAssignedTo, setAdminAssignedTo] = useState<string>('');
  // Admin review state (for Pending approval)
  const [adminReview, setAdminReview] = useState<string>('');

  // Admin assignment states
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Admin review states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Admin close state
  const [isClosing, setIsClosing] = useState(false);

  // Success/Error toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Reject history state
  const [rejectHistory, setRejectHistory] = useState<RejectHistoryItem[]>([]);
  const [isLoadingRejectHistory, setIsLoadingRejectHistory] = useState(false);

  // Get permissions for selected work order
  const selectedWOPermissions = selectedWO && currentUser
    ? getWorkOrderPermissions(
      selectedWO.status,
      currentUser.userRole,
      selectedWO.assignedTo,
      currentUser.name
    )
    : null;

  // Sync props to state
  useEffect(() => {
    setWorkOrders(initialWorkOrders);
    // If technician, default to showing only their jobs
    if (currentUser?.userRole === 'Technician') {
      setShowOnlyMyJobs(true);
    }
  }, [initialWorkOrders, currentUser]);

  // Load images when selecting a work order
  useEffect(() => {
    const loadImages = async () => {
      // Load original request images
      if (selectedWO && selectedWO.imageIds && selectedWO.imageIds.length > 0) {
        const imageUrls = await Promise.all(selectedWO.imageIds.map(id => getImageDataUrl(id)));
        setSelectedWOImages(imageUrls);
      } else {
        setSelectedWOImages([]);
      }

      // Load technician work images for display (separate from upload state)
      if (selectedWO && selectedWO.technicianImages && selectedWO.technicianImages.length > 0) {
        const techImageUrls = await Promise.all(selectedWO.technicianImages.map(id => getImageDataUrl(id)));
        setSelectedTechImages(techImageUrls);
      } else {
        setSelectedTechImages([]);
      }
    };
    loadImages();

    // Initialize technician fields when selecting a work order so technician can edit inline
    if (selectedWO) {
      setTechnicianNotes(selectedWO.technicianNotes || '');
      setTechnicianImages(selectedWO.technicianImages || []);
      setAdminAssignedTo(selectedWO.assignedTo || '');
      setAdminReview((selectedWO as any).adminReview || '');
    } else {
      setTechnicianNotes('');
      setTechnicianImages([]);
      setAdminAssignedTo('');
      setAdminReview('');
    }
    // Clear admin review fields
    setRejectionReason('');
  }, [selectedWO]);

  // Build preview URLs for technicianImages (avoid async in render)
  useEffect(() => {
    const buildPreviews = async () => {
      if (technicianImages.length > 0) {
        const urls = await Promise.all(technicianImages.map(id => getImageDataUrl(id)));
        setTechnicianPreviewUrls(urls);
      } else {
        setTechnicianPreviewUrls([]);
      }
    };
    buildPreviews();
  }, [technicianImages]);

  // Fetch reject history when selecting a work order
  useEffect(() => {
    const fetchRejectHistory = async () => {
      if (!selectedWO) {
        setRejectHistory([]);
        return;
      }
      setIsLoadingRejectHistory(true);
      try {
        const history = await getWorkOrderRejectHistory(selectedWO.id);
        setRejectHistory(history);
      } catch (error) {
        console.error('Failed to fetch reject history:', error);
        setRejectHistory([]);
      } finally {
        setIsLoadingRejectHistory(false);
      }
    };
    fetchRejectHistory();
  }, [selectedWO?.id]);

  // Check if there's a work order to open from navigation (e.g., from Dashboard or Notification)
  useEffect(() => {
    const checkAndOpenWorkOrder = () => {
      const openWorkOrderId = sessionStorage.getItem('openWorkOrderId');
      if (openWorkOrderId && workOrders.length > 0) {
        sessionStorage.removeItem('openWorkOrderId');
        // Search by both id and requestId (notifications may use requestId)
        const woToOpen = workOrders.find(wo => wo.id === openWorkOrderId || wo.requestId === openWorkOrderId);
        if (woToOpen) {
          setSelectedWO(woToOpen);
          return true;
        }
      }
      return false;
    };
    
    // Check immediately
    if (!checkAndOpenWorkOrder()) {
      // If not found immediately, try again after a short delay (data might still be loading)
      const retryTimeout = setTimeout(() => {
        checkAndOpenWorkOrder();
      }, 300);
      return () => clearTimeout(retryTimeout);
    }
  }, [workOrders]);

  // Listen for custom event from notification click (separate useEffect to ensure listener is always active)
  useEffect(() => {
    const handleOpenWorkOrder = (event: CustomEvent<string>) => {
      const workOrderId = event.detail;
      // Use initialWorkOrders as fallback since workOrders state might not be updated yet
      const allWOs = workOrders.length > 0 ? workOrders : initialWorkOrders;
      // Search by both id and requestId (notifications may use requestId)
      const woToOpen = allWOs.find(wo => wo.id === workOrderId || wo.requestId === workOrderId);
      if (woToOpen) {
        setSelectedWO(woToOpen);
      }
    };
    
    window.addEventListener('openWorkOrder', handleOpenWorkOrder as EventListener);
    return () => {
      window.removeEventListener('openWorkOrder', handleOpenWorkOrder as EventListener);
    };
  }, [workOrders, initialWorkOrders]);

  // Base technician scoping: technicians only ever see their own jobs
  const scopedWorkOrders = currentUser?.userRole === 'Technician'
    ? workOrders.filter(wo => wo.assignedTo === currentUser.name)
    : workOrders;

  const filteredWorkOrders = scopedWorkOrders.filter(wo => {
    const matchesSearch = searchText
      ? (wo.title.toLowerCase().includes(searchText.toLowerCase()) ||
        wo.description.toLowerCase().includes(searchText.toLowerCase()))
      : true;

    // Use preferredDate for filtering if available, otherwise fall back to createdAt
    const dateToFilter = wo.preferredDate || wo.createdAt || '';
    const matchesStart = startDate ? dateToFilter >= startDate : true;
    const matchesEnd = endDate ? dateToFilter <= endDate : true;

    // Month filter: compare YYYY-MM prefix of preferredDate (or createdAt)
    const matchesMonth = selectedMonth ? dateToFilter.startsWith(selectedMonth) : true;

    const matchesPriority = selectedPriority === 'ALL' ? true : wo.priority === selectedPriority;

    // AssignedTo filter (Admin only, Technician already scoped above)
    const matchesAssignedTo = selectedAssignedTo ? wo.assignedTo === selectedAssignedTo : true;

    return matchesSearch && matchesStart && matchesEnd && matchesMonth && matchesPriority && matchesAssignedTo;
  });

  const handleAnalyze = async () => {
    if (!selectedWO) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const [aiAnalysis, aiChecklist] = await Promise.all([
        analyzeMaintenanceIssue(selectedWO.description, selectedWO.assetName),
        generateSmartChecklist(selectedWO.assetName)
      ]);
      setAnalysis(aiAnalysis);
      setChecklist(aiChecklist);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Admin assign technician (does NOT auto-change status - Admin must drag card manually)
  const handleAdminAssign = async () => {
    if (!selectedWO || (currentUser?.userRole !== 'Admin' && currentUser?.userRole !== 'Head Technician')) return;
    // Require technician selection
    if (!adminAssignedTo) return;
    try {
      // Only update assignedTo field, keep status unchanged
      const payload: any = {
        assignedTo: adminAssignedTo,
      };

      const updated = await updateWorkOrder(selectedWO.id, payload);

      // Create notification for assigned technician
      if (adminAssignedTo) {
        const notification = createWOAssignedNotification(
          selectedWO.id,
          selectedWO.title,
          adminAssignedTo,
          currentUser.name
        );
        await createNotification(notification);
      }

      // Reflect locally - status remains unchanged, only assignedTo is updated
      const updatedWO: WorkOrder = {
        ...selectedWO,
        assignedTo: updated.assignedTo,
        // status remains selectedWO.status (no auto-change)
      };
      setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
      setSelectedWO(updatedWO); // keep panel open showing new state
    } catch (e) {
      console.error('Failed to assign technician:', e);
      // No alert to keep UI clean; could add toast later
    }
  };

  // Admin approve Pending -> Completed with review
  const handleAdminApprove = async () => {
    if (!selectedWO || currentUser?.userRole !== 'Admin') return;
    if (selectedWO.status !== Status.PENDING) return;
    try {
      const updated = await updateWorkOrder(selectedWO.id, {
        status: Status.COMPLETED as any,
        adminReview: adminReview?.trim() || undefined,
      } as any);
      const updatedWO: WorkOrder = {
        ...selectedWO,
        status: Status.COMPLETED,
        // @ts-ignore
        adminReview: (updated as any).adminReview || adminReview?.trim() || '',
      };
      setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
      setSelectedWO(updatedWO);
    } catch (e: any) {
      console.error('Failed to approve work order:', e);
      alert(e?.message || 'Failed to approve work order');
    }
  };

  // Admin cancel (Open -> Canceled)
  const handleAdminCancel = async () => {
    console.log('[handleAdminCancel] Starting...', { selectedWO, currentUser });
    if (!selectedWO || currentUser?.userRole !== 'Admin') {
      console.log('[handleAdminCancel] Early return - no selectedWO or not Admin');
      return;
    }
    if (selectedWO.status !== Status.OPEN) {
      console.log('[handleAdminCancel] Early return - status is not OPEN:', selectedWO.status);
      return;
    }
    try {
      console.log('[handleAdminCancel] Updating WO status to CANCELED...');
      await updateWorkOrder(selectedWO.id, { status: Status.CANCELED });
      
      // Create notification for Requestor (createdBy)
      console.log('[handleAdminCancel] createdBy:', selectedWO.createdBy);
      if (selectedWO.createdBy) {
        const notification = createWOCanceledNotification(
          selectedWO.id,
          selectedWO.title,
          currentUser.name,
          selectedWO.createdBy
        );
        console.log('[handleAdminCancel] Creating notification:', notification);
        await createNotification(notification);
        console.log('[handleAdminCancel] Notification created successfully');
      } else {
        console.log('[handleAdminCancel] No createdBy - skipping notification');
      }
      
      setWorkOrders(prev => prev.map(wo => wo.id === selectedWO.id ? { ...wo, status: Status.CANCELED } : wo));
      setSelectedWO(null); // close panel after cancel
    } catch (e: any) {
      console.error('Failed to cancel work order:', e);
      alert(e?.message || 'Failed to cancel work order');
    }
  };

  const addPartToWo = (partId: string) => {
    if (!selectedWO) return;
    const part = AVAILABLE_PARTS.find(p => p.id === partId);
    if (!part) return;

    const newPartUsage: PartUsage = {
      partId: part.id,
      name: part.name,
      quantity: 1,
      cost: part.cost
    };

    const updatedWo = {
      ...selectedWO,
      partsUsed: [...(selectedWO.partsUsed || []), newPartUsage]
    };

    setSelectedWO(updatedWo);
    setWorkOrders(prev => prev.map(wo => wo.id === updatedWo.id ? updatedWo : wo));
  };

  const removePartFromWo = (index: number) => {
    if (!selectedWO || !selectedWO.partsUsed) return;
    const updatedParts = [...selectedWO.partsUsed];
    updatedParts.splice(index, 1);

    const updatedWo = { ...selectedWO, partsUsed: updatedParts };
    setSelectedWO(updatedWo);
    setWorkOrders(prev => prev.map(wo => wo.id === updatedWo.id ? updatedWo : wo));
  };

  // Technician Update Functions
  const handleTechnicianUpdate = () => {
    if (!selectedWO || currentUser?.userRole !== 'Technician') return;
    setTechnicianNotes(selectedWO.technicianNotes || '');
    setTechnicianImages(selectedWO.technicianImages || []);
    setShowTechnicianModal(true);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const maxImages = 10;
    const maxVideoSize = 10 * 1024 * 1024; // 10 MB in bytes

    // Check if adding these files would exceed the limit
    if (technicianImages.length + files.length > maxImages) {
      alert(`You can only upload a maximum of ${maxImages} images/videos. Currently you have ${technicianImages.length} files.`);
      event.target.value = '';
      return;
    }

    // Validate each file before uploading
    const validFiles: File[] = [];
    const fileArray = Array.from(files) as File[];
    for (const file of fileArray) {
      // Check video file size
      if (file.type.startsWith('video/') && file.size > maxVideoSize) {
        alert(`Video "${file.name}" is too large. Maximum video size is 10 MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
        continue;
      }
      validFiles.push(file);
    }

    // Double check we don't exceed the limit after filtering
    const allowedCount = maxImages - technicianImages.length;
    const filesToUpload = validFiles.slice(0, allowedCount);

    if (filesToUpload.length === 0) {
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = filesToUpload.map((file: File) => uploadImage(file));
      const uploadResults = await Promise.all(uploadPromises);
      const newImageIds = uploadResults.map(result => result.id);
      setTechnicianImages(prev => [...prev, ...newImageIds]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeTechnicianImage = (index: number) => {
    setTechnicianImages(prev => prev.filter((_, i) => i !== index));
  };

  const submitTechnicianUpdate = async () => {
    if (!selectedWO || !currentUser) return;
    // allow empty notes but at least something to submit (images or notes)
    if (!technicianNotes.trim() && technicianImages.length === 0) return;

    setIsSubmitting(true);
    try {
      const updateData: TechnicianUpdateData = {
        technicianNotes: technicianNotes.trim(),
        technicianImages
      };

      const updatedWO = await technicianUpdateWorkOrder(selectedWO.id, updateData);
      
      // Create notification for the Head Technician of technician's team
      // If technician has a teamId, notify only their team's Head Technician
      // Otherwise fallback to all Head Technicians
      try {
        let supervisorName: string | undefined;
        
        // Try to get the Head Technician of technician's team
        if (currentUser.teamId) {
          try {
            const headTech = await getTeamHeadTechnician(currentUser.teamId);
            supervisorName = headTech.name;
          } catch (e) {
            console.warn('Could not find team head technician, falling back to all:', e);
          }
        }
        
        // Fallback: get all Head Technicians
        const headTechs = await getUsersByRole('Head Technician');
        const headTechNames = headTechs.map(ht => ht.name);
        
        if (headTechNames.length > 0 || supervisorName) {
          const notifications = createWOCompletedNotifications(
            selectedWO.id,
            selectedWO.title,
            currentUser.name,
            headTechNames,
            supervisorName // If set, only this Head Tech gets notified
          );
          
          for (const notification of notifications) {
            await createNotification(notification);
          }
        }
      } catch (notifError) {
        console.error('Failed to create notifications for head technicians:', notifError);
      }
      
      setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
      // Keep the details panel open but reflect new status (typically Pending),
      // which will hide the inline technician section automatically
      setShowTechnicianModal(false);
      setTechnicianNotes('');
      setTechnicianImages([]);
      setSelectedWO(updatedWO);
    } catch (error) {
      console.error('Error submitting technician update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin Assignment Handler
  const handleAssign = async () => {
    if (!selectedWO || !selectedTechnician || !currentUser) return;
    if (currentUser.userRole !== 'Admin') return;

    setIsAssigning(true);
    try {
      // Assign technician and change status to In Progress
      const updatedWO = await updateWorkOrder(selectedWO.id, {
        assignedTo: selectedTechnician,
        status: Status.IN_PROGRESS,
      });

      // Create notification for assigned technician
      const notification = createWOAssignedNotification(
        selectedWO.id,
        selectedWO.title,
        selectedTechnician,
        currentUser.name
      );
      await createNotification(notification);

      // Update local state
      setWorkOrders(prev => prev.map(wo =>
        wo.id === selectedWO.id
          ? { ...wo, assignedTo: selectedTechnician, status: Status.IN_PROGRESS }
          : wo
      ));
      setSelectedWO({ ...selectedWO, assignedTo: selectedTechnician, status: Status.IN_PROGRESS });
      setSelectedTechnician('');
    } catch (error: any) {
      console.error('Failed to assign technician:', error);
      alert(error.message || 'Failed to assign technician');
    } finally {
      setIsAssigning(false);
    }
  };

  // Head Technician Approve Handler (Admin should not approve, only close)
  const handleApprove = async () => {
    if (!selectedWO || !currentUser) return;
    if (currentUser.userRole !== 'Head Technician') return;
    if (selectedWO.status !== Status.PENDING) return;

    setIsApproving(true);
    try {
      // Approve work order, changes status to Completed
      const updatedWO = await adminApproveWorkOrder(selectedWO.id);

      // Create notifications - send to managedBy admin if assigned, otherwise all admins
      try {
        const admins = await getUsersByRole('Admin');
        const adminNames = admins.map(a => a.name);
        
        const notifications = createWOApprovedNotifications(
          selectedWO.id,
          selectedWO.title,
          currentUser.name,
          adminNames,
          selectedWO.createdBy, // requestorName
          selectedWO.assignedTo,
          selectedWO.managedBy // managedBy admin - if set, only this admin gets notified
        );
        
        // Send all notifications
        for (const notification of notifications) {
          await createNotification(notification);
        }
      } catch (notifError) {
        console.error('Failed to create notifications:', notifError);
      }

      // Update local state
      setWorkOrders(prev => prev.map(wo =>
        wo.id === selectedWO.id
          ? { ...wo, status: Status.COMPLETED }
          : wo
      ));
      setSelectedWO({ ...selectedWO, status: Status.COMPLETED });

      // Show success toast
      setToast({ message: 'Work order approved successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Failed to approve work order:', error);
      setToast({ message: error.message || 'Failed to approve work order', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsApproving(false);
    }
  };

  // Head Technician Reject Handler (Admin should not reject)
  const handleReject = async () => {
    if (!selectedWO || !currentUser) return;
    if (currentUser.userRole !== 'Head Technician') return;
    if (selectedWO.status !== Status.PENDING) return;

    // Validate rejection reason
    if (!rejectionReason.trim()) {
      setToast({ message: 'Please provide a reason for rejection', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsRejecting(true);
    try {
      // Reject work order with reason, changes status back to In Progress
      const updatedWO = await adminRejectWorkOrder(selectedWO.id, {
        rejectionReason: rejectionReason.trim()
      });

      // Create notification for Technician with rejection reason
      const notification = createWORejectedNotification(
        selectedWO.id,
        selectedWO.title,
        currentUser.name,
        selectedWO.assignedTo,
        rejectionReason.trim()
      );
      await createNotification(notification);

      // Update local state
      setWorkOrders(prev => prev.map(wo =>
        wo.id === selectedWO.id
          ? { ...wo, status: Status.IN_PROGRESS, rejectionReason: rejectionReason.trim() }
          : wo
      ));
      setSelectedWO({ ...selectedWO, status: Status.IN_PROGRESS, rejectionReason: rejectionReason.trim() });
      setRejectionReason('');

      // Show success toast
      setToast({ message: 'Work order rejected and sent back', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Failed to reject work order:', error);
      setToast({ message: error.message || 'Failed to reject work order', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsRejecting(false);
    }
  };

  // Admin Close Handler
  const handleClose = async () => {
    if (!selectedWO || !currentUser) return;
    if (currentUser.userRole !== 'Admin') return;
    if (selectedWO.status !== Status.COMPLETED) return;

    setIsClosing(true);
    try {
      // Close work order, changes status to Closed
      const updatedWO = await adminCloseWorkOrder(selectedWO.id);

      // Note: No notification sent here because Requester already received 
      // notification when Head Tech approved (WO_APPROVED)

      // Update local state
      setWorkOrders(prev => prev.map(wo =>
        wo.id === selectedWO.id
          ? { ...wo, status: Status.CLOSED }
          : wo
      ));
      setSelectedWO({ ...selectedWO, status: Status.CLOSED });

      // Show success toast
      setToast({ message: 'Work order closed successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Failed to close work order:', error);
      setToast({ message: error.message || 'Failed to close work order', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsClosing(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!currentUser) {
      e.preventDefault();
      return;
    }

    const wo = workOrders.find(w => w.id === id);
    if (!wo) {
      e.preventDefault();
      return;
    }

    // Check if user has permission to change status for this work order
    const permissions = getWorkOrderPermissions(
      wo.status,
      currentUser.userRole,
      wo.assignedTo,
      currentUser.name
    );

    if (!permissions.canChangeStatus) {
      e.preventDefault();
      return;
    }

    setDraggedWoId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');

    if (id && currentUser) {
      const wo = workOrders.find(w => w.id === id);
      if (!wo) return;

      // If same status, do nothing
      if (wo.status === newStatus) {
        setDraggedWoId(null);
        return;
      }

      // Check if transition is allowed
      if (!canDragToStatus(wo.status, newStatus, currentUser.userRole)) {
        alert(`${t('workOrders.cannotMoveFrom')} "${translateStatus(wo.status)}" ${t('workOrders.to')} "${translateStatus(newStatus)}"`);
        setDraggedWoId(null);
        return;
      }

      // Special check: Moving to In Progress requires assignedTo
      if (newStatus === Status.IN_PROGRESS && !wo.assignedTo) {
        alert(t('workOrders.mustAssignTechnicianFirst') || 'Please assign a technician before moving to In Progress');
        setDraggedWoId(null);
        return;
      }

      // Update via API
      try {
        await updateWorkOrder(id, { status: newStatus });
        // Update only the status, keep card position (no reordering)
        setWorkOrders(prev => prev.map(w =>
          w.id === id ? { ...w, status: newStatus } : w
        ));
      } catch (error: any) {
        console.error('Failed to update work order:', error);
        alert(error.message || 'Failed to update work order status');
      }
    }
    setDraggedWoId(null);
  };

  const columns = [Status.OPEN, Status.IN_PROGRESS, Status.PENDING, Status.COMPLETED, Status.CANCELED];

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col bg-stone-50/50 dark:bg-stone-900 overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 dark:text-stone-100">{t('workOrders.title')}</h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm lg:text-base">
            {currentUser?.userRole === 'Technician' ? t('workOrders.myAssignedTasks') : t('workOrders.manageMaintenanceTasks')}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-3 bg-white dark:bg-stone-800 p-3 rounded-xl border border-stone-200/60 dark:border-stone-700 shadow-sm">
        {/* Row 1: View toggle + Search + Order count */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggles */}
            <div className="bg-stone-100 dark:bg-stone-700 p-0.5 rounded-lg flex border border-stone-200 dark:border-stone-600">
              <button
                onClick={() => setViewMode('list')}
                title={t('workOrders.listView')}
                className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'list' ? 'bg-white dark:bg-stone-600 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('board')}
                title={t('workOrders.boardView')}
                className={`p-1.5 rounded transition-all duration-200 ${viewMode === 'board' ? 'bg-white dark:bg-stone-600 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-stone-400 hover:text-stone-600 dark:hover:text-stone-300'}`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            {/* Board Settings - Only show in board view */}
            {viewMode === 'board' && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  title={t('workOrders.boardSettings')}
                  className={`p-1.5 rounded-lg border transition-all duration-200 ${showColumnSettings ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-700' : 'bg-stone-50 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600 hover:bg-stone-100 dark:hover:bg-stone-600'}`}
                >
                  <Settings size={16} />
                </button>

                {/* Settings Dropdown */}
                {showColumnSettings && (
                  <div className="absolute top-full left-0 mt-1 bg-white dark:bg-stone-800 rounded-xl shadow-lg border border-stone-200 dark:border-stone-700 p-3 z-20 min-w-[220px]">
                    {/* Visible Columns */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-stone-600">
                        <Layers size={12} />
                        {t('workOrders.visibleColumns')}
                      </div>
                      <div className="space-y-1">
                        {[Status.OPEN, Status.IN_PROGRESS, Status.PENDING, Status.COMPLETED, Status.CANCELED].map(status => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 px-2 py-1 rounded">
                            <input
                              type="checkbox"
                              checked={visibleColumns.has(status)}
                              onChange={() => toggleColumnVisibility(status)}
                              className="w-3.5 h-3.5 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                            />
                            <div className={`w-2 h-2 rounded-full ${statusColors[status].split(' ')[0]}`}></div>
                            <span className="text-xs text-stone-700">{translateStatus(status)}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Swimlane Grouping */}
                    <div className="pt-3 border-t border-stone-100">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-stone-600">
                        <Users size={12} />
                        {t('workOrders.swimlaneGroup')}
                      </div>
                      <select
                        value={swimlaneMode}
                        onChange={(e) => setSwimlaneMode(e.target.value as SwimlaneMode)}
                        title={t('workOrders.swimlaneGroup')}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="none">{t('workOrders.swimlaneNone')}</option>
                        <option value="priority">{t('workOrders.swimlanePriority')}</option>
                        <option value="technician">{t('workOrders.swimlaneTechnician')}</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Text search */}
            <div className="relative">
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t('common.search')}
                className="text-sm pl-8 pr-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-40 lg:w-52 transition-all"
              />
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Order count badge */}
          <div className="flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-400 px-2.5 py-1 bg-teal-50 dark:bg-teal-900/50 rounded-lg border border-teal-100 dark:border-teal-800">
            <span className="text-base">{filteredWorkOrders.length}</span>
            <span className="text-teal-600 font-medium">{t('workOrders.orders')}</span>
          </div>
        </div>

        {/* Row 2: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Date range filter */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded-lg border border-stone-100 dark:border-stone-600 text-sm">
            <DateInputSmall
              value={startDate}
              onChange={(newStartDate) => {
                setStartDate(newStartDate);
                // Reset endDate if it's before the new startDate
                if (endDate && newStartDate && endDate < newStartDate) {
                  setEndDate('');
                }
              }}
              title={t('workOrders.startDateFilter')}
            />
            <span className="text-stone-300">→</span>
            <DateInputSmall
              value={endDate}
              onChange={(value) => setEndDate(value)}
              min={startDate || undefined}
              title={t('workOrders.endDateFilter')}
            />
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded-lg border border-stone-100 dark:border-stone-600">
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">{t('workOrders.priority')}</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as Priority | 'ALL')}
              title={t('workOrders.filterByPriority')}
              className="text-sm px-1 py-0.5 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 dark:text-stone-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('common.all')}</option>
              <option value={Priority.CRITICAL}>{t('priority.critical')}</option>
              <option value={Priority.HIGH}>{t('priority.high')}</option>
              <option value={Priority.MEDIUM}>{t('priority.medium')}</option>
              <option value={Priority.LOW}>{t('priority.low')}</option>
            </select>
          </div>

          {/* AssignedTo filter - Admin only */}
          {currentUser?.userRole === 'Admin' && (
            <div className="flex items-center gap-1 bg-stone-50 dark:bg-stone-700 px-2 py-1 rounded-lg border border-stone-100 dark:border-stone-600">
              <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase">{t('workOrders.techLabel')}</span>
              <select
                value={selectedAssignedTo}
                onChange={(e) => setSelectedAssignedTo(e.target.value)}
                title={t('workOrders.filterByTechnician')}
                className="text-sm px-1 py-0.5 rounded border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 dark:text-stone-100 focus:outline-none min-w-[80px] cursor-pointer"
              >
                <option value="">{t('common.all')}</option>
                {technicians.map(tech => (
                  <option key={tech.id} value={tech.name}>{tech.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear filters button */}
          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); setSelectedMonth(''); setSelectedPriority('ALL'); setSearchText(''); setSelectedAssignedTo(''); }}
            title={t('workOrders.clearAllFilters')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-stone-200 dark:border-stone-600 hover:border-red-200 dark:hover:border-red-800 transition-all ml-auto"
          >
            <X size={14} />
            {t('workOrders.clearFilters')}
          </button>
        </div>
      </div >

      {/* CONTENT AREA */}
      < div className="flex-1 overflow-hidden" >

        {/* LIST VIEW */}
        {
          viewMode === 'list' && (
            <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200/60 dark:border-stone-700 h-full flex flex-col overflow-hidden">
              <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-stone-50 dark:bg-stone-900 sticky top-0 z-[1]">
                    <tr>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.id')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.titleField')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.asset')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.priority')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.appointment')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.status')}</th>
                      <th className="px-6 py-3.5 text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider border-b border-stone-200 dark:border-stone-700">{t('workOrders.assignee')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-700">
                    {filteredWorkOrders.map((wo) => (
                      <tr
                        key={wo.id}
                        onClick={() => setSelectedWO(wo)}
                        className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20 cursor-pointer transition-colors duration-200 group"
                      >
                        <td className="px-6 py-4 text-base font-medium text-stone-900 dark:text-stone-100">{wo.id}</td>
                        <td className="px-6 py-4 text-base text-stone-700 dark:text-stone-200 font-medium max-w-[300px]">
                          <div className="line-clamp-1" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.title}</div>
                          <div className="text-sm text-stone-400 dark:text-stone-500 line-clamp-1 max-w-[250px]" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.description}</div>
                        </td>
                        <td className="px-6 py-4 text-base text-stone-600 dark:text-stone-300">{wo.assetName}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg border text-sm font-semibold ${priorityColors[wo.priority]}`}>
                            {translatePriority(wo.priority)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {wo.preferredDate ? (
                            <div className="flex items-center gap-1.5 text-violet-700">
                              <Calendar size={14} className="text-violet-500" />
                              <span className="text-sm font-medium">
                                {formatDateDDMMYYYY(wo.preferredDate)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-stone-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg border text-sm font-semibold ${statusColors[wo.status]}`}>
                            {translateStatus(wo.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-base text-stone-600 dark:text-stone-300">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-700 flex items-center justify-center text-xs font-bold text-stone-600 dark:text-stone-300">
                              {wo.assignedTo?.charAt(0) || '?'}
                            </div>
                            <span>{wo.assignedTo}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        }

        {/* BOARD VIEW */}
        {
          viewMode === 'board' && (
            <div className="h-full overflow-x-auto pb-2">
              {/* Swimlane Mode: None - Standard Kanban */}
              {swimlaneMode === 'none' && (
                <div className="flex gap-3 h-full min-w-[900px]">
                  {columns.filter(status => visibleColumns.has(status)).map(status => {
                    const columnWos = filteredWorkOrders.filter(wo => wo.status === status);
                    const isCollapsed = collapsedColumns.has(status);

                    // Collapsed column view
                    if (isCollapsed) {
                      return (
                        <div
                          key={status}
                          className={`rounded-xl flex flex-col min-h-0 border w-12 flex-shrink-0 cursor-pointer hover:opacity-80 transition-all ${statusColumnColors[status].header}`}
                          onClick={() => toggleColumnCollapse(status)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, status)}
                        >
                          <div className="p-2 flex flex-col items-center gap-2">
                            <ChevronRight size={14} className="text-stone-500 dark:text-stone-400" />
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColumnColors[status].dot}`}></div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColumnColors[status].count}`}>{columnWos.length}</span>
                            <span className={`writing-vertical text-[10px] font-semibold whitespace-nowrap ${statusColumnColors[status].title}`}>
                              {translateStatus(status)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // Expanded column view
                    return (
                      <div
                        key={status}
                        className="bg-stone-100/70 dark:bg-stone-800/70 rounded-xl flex flex-col min-h-0 border border-stone-200/60 dark:border-stone-700 flex-1 min-w-[200px]"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status)}
                      >
                        {/* Column Header */}
                        <div className={`p-3 flex items-center justify-between rounded-t-xl border-b ${statusColumnColors[status].header}`}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleColumnCollapse(status)}
                              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                              title={t('workOrders.collapseColumn')}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <div className={`w-2 h-2 rounded-full ${statusColumnColors[status].dot}`}></div>
                            <h3 className={`font-semibold text-sm ${statusColumnColors[status].title}`}>{translateStatus(status)}</h3>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColumnColors[status].count}`}>{columnWos.length}</span>
                          </div >
                        </div >

                        {/* Cards Area */}
                        < div className="flex-1 overflow-y-auto p-2 space-y-2" >
                          {
                            columnWos.map(wo => {
                              const woPermissions = currentUser ? getWorkOrderPermissions(
                                wo.status,
                                currentUser.userRole,
                                wo.assignedTo,
                                currentUser.name
                              ) : null;
                              const isDraggable = woPermissions?.canChangeStatus ?? false;

                              return (
                                <div
                                  key={wo.id}
                                  draggable={isDraggable}
                                  onDragStart={(e) => handleDragStart(e, wo.id)}
                                  onClick={() => setSelectedWO(wo)}
                                  className={`bg-white dark:bg-stone-900 p-3 rounded-lg shadow-sm border border-stone-200/60 dark:border-stone-700 overflow-hidden ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative
                                                ${draggedWoId === wo.id ? 'opacity-50 border-dashed border-stone-400' : ''}
                                                ${currentUser?.name === wo.assignedTo ? 'border-l-3 border-l-teal-500' : ''}
                                                ${!isDraggable ? 'opacity-75' : ''}
                                            `}
                                >
                                  <div className="flex justify-between items-start mb-1.5">
                                    <span className="text-xs font-mono text-stone-400 dark:text-stone-500 truncate max-w-[120px]">{wo.id}</span>
                                    {isDraggable && (
                                      <button
                                        title={t('workOrders.dragToChange')}
                                        aria-label={t('workOrders.dragToChange')}
                                        className="text-stone-300 dark:text-stone-600 hover:text-stone-500 dark:hover:text-stone-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                      >
                                        <GripVertical size={12} />
                                      </button>
                                    )}
                                  </div>

                                  <h4 className="font-medium text-stone-800 dark:text-stone-100 text-sm mb-2 leading-snug line-clamp-2 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.title}</h4>

                                  <div className="flex items-center justify-between mb-2">
                                    <span className={`px-1.5 py-0.5 rounded border text-xs uppercase font-bold ${priorityColors[wo.priority]}`}>
                                      {translatePriority(wo.priority)}
                                    </span>
                                  </div>

                                  {/* Preferred Date - Show prominently if set */}
                                  {
                                    wo.preferredDate && (
                                      <div className="mb-2 px-2 py-1.5 bg-violet-50 dark:bg-violet-950/50 border border-violet-200 dark:border-violet-800 rounded-lg text-xs text-violet-700 dark:text-violet-300 flex items-center gap-1.5 overflow-hidden">
                                        <Calendar size={12} className="text-violet-500 dark:text-violet-400" />
                                        <span className="font-medium">{t('workOrders.appointment')}: {formatDateDDMMYYYY(wo.preferredDate)}</span>
                                      </div>
                                    )
                                  }

                                  {/* Location Info */}
                                  <div className="mb-2 text-sm text-stone-600 dark:text-stone-400 overflow-hidden">
                                    <div className="flex items-start gap-1.5">
                                      <MapPin size={12} className="text-stone-400 dark:text-stone-500 mt-0.5 flex-shrink-0" />
                                      <span className="line-clamp-1 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.location}</span>
                                    </div>
                                  </div>

                                  {/* GPS Navigation Link */}
                                  {
                                    wo.locationData && (
                                      <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${wo.locationData.latitude},${wo.locationData.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1.5 mb-3 px-2 py-1.5 bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 rounded-lg text-teal-700 dark:text-teal-300 text-sm transition-colors overflow-hidden"
                                      >
                                        <Navigation size={12} className="flex-shrink-0" />
                                        <span className="truncate flex-1 text-left min-w-0">{wo.locationData.address.split(',')[0]}</span>
                                        <span className="text-teal-500 dark:text-teal-400 font-medium flex-shrink-0">{t('workOrders.navigateBtn')}</span>
                                      </a>
                                    )
                                  }

                                  <div className="flex items-center justify-between pt-3 border-t border-stone-100 dark:border-stone-700 mt-3">
                                    <div className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 min-w-0">
                                      <div className={`w-5 h-5 rounded-lg border border-stone-200 dark:border-stone-600 flex items-center justify-center text-xs font-bold flex-shrink-0 ${wo.assignedTo === currentUser?.name ? 'bg-teal-50 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-700' : 'bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300'}`}>
                                        {wo.assignedTo?.charAt(0) || '?'}
                                      </div>
                                      <span className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">{formatDateShort(wo.dueDate)}</span>
                                    </div>
                                  </div>
                                </div >
                              )
                            })}
                          {
                            columnWos.length === 0 && (
                              <div className="h-20 border-2 border-dashed border-stone-200 dark:border-stone-700 rounded-lg flex items-center justify-center text-stone-400 dark:text-stone-500 text-xs italic">
                                {t('workOrders.noOrders')}
                              </div>
                            )
                          }
                        </div >
                      </div >
                    );
                  })}
                </div >
              )}

              {/* Swimlane Mode: Priority */}
              {
                swimlaneMode === 'priority' && (
                  <div className="space-y-4 h-full overflow-y-auto">
                    {[Priority.CRITICAL, Priority.HIGH, Priority.MEDIUM, Priority.LOW].map(priority => {
                      const priorityWos = filteredWorkOrders.filter(wo => wo.priority === priority);
                      if (priorityWos.length === 0) return null;

                      return (
                        <div key={priority} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-700 shadow-sm">
                          {/* Swimlane Header */}
                          <div className={`px-4 py-2 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2 ${priorityColors[priority].split(' ').slice(1).join(' ')}`}>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${priorityColors[priority]}`}>
                              {translatePriority(priority)}
                            </span>
                            <span className="text-xs text-stone-500 dark:text-stone-400">({priorityWos.length})</span>
                          </div>

                          {/* Horizontal scroll cards */}
                          <div className="p-3 overflow-x-auto">
                            <div className="flex gap-3 min-w-max">
                              {columns.filter(status => visibleColumns.has(status)).map(status => {
                                const statusWos = priorityWos.filter(wo => wo.status === status);
                                return (
                                  <div key={status} className="w-[220px] flex-shrink-0">
                                    <div className="flex items-center gap-1.5 mb-2 px-1">
                                      <div className={`w-2 h-2 rounded-full ${statusColors[status].split(' ')[0]}`}></div>
                                      <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-300">{translateStatus(status)}</span>
                                      <span className="text-[10px] text-stone-400 dark:text-stone-500">({statusWos.length})</span>
                                    </div>
                                    <div
                                      className="space-y-2 min-h-[60px] bg-stone-50/50 dark:bg-stone-800/50 rounded-lg p-2"
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, status)}
                                    >
                                      {statusWos.map(wo => (
                                        <div
                                          key={wo.id}
                                          draggable
                                          onDragStart={(e) => handleDragStart(e, wo.id)}
                                          onClick={() => setSelectedWO(wo)}
                                          className="bg-white dark:bg-stone-800 p-2 rounded-lg shadow-sm border border-stone-200/60 dark:border-stone-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all text-xs overflow-hidden"
                                        >
                                          <div className="font-medium text-stone-800 dark:text-stone-100 line-clamp-1 mb-1 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.title}</div>
                                          <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400">
                                            <span className="truncate max-w-[80px] dark:text-stone-400">{wo.assignedTo || t('workOrders.unassigned')}</span>
                                            <span className="flex-shrink-0 dark:text-stone-500">{formatDateShort(wo.dueDate)}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              }

              {/* Swimlane Mode: Technician */}
              {
                swimlaneMode === 'technician' && (
                  <div className="space-y-4 h-full overflow-y-auto">
                    {/* Get unique technicians */}
                    {(() => {
                      const unassignedLabel = t('workOrders.unassigned');
                      const techNames: string[] = Array.from(new Set(filteredWorkOrders.map(wo => wo.assignedTo || unassignedLabel)));
                      return techNames.map(techName => {
                        const techWos = filteredWorkOrders.filter(wo => (wo.assignedTo || unassignedLabel) === techName);

                        return (
                          <div key={techName} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200/60 dark:border-stone-700 shadow-sm">
                            {/* Swimlane Header */}
                            <div className="px-4 py-2 border-b border-stone-100 dark:border-stone-700 flex items-center gap-2 bg-stone-50/50 dark:bg-stone-800/50">
                              <div className="w-6 h-6 rounded-lg bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-xs font-bold text-teal-700 dark:text-teal-300">
                                {techName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{techName}</span>
                              <span className="text-xs text-stone-500 dark:text-stone-400">({techWos.length})</span>
                            </div>

                            {/* Horizontal scroll cards */}
                            <div className="p-3 overflow-x-auto">
                              <div className="flex gap-3 min-w-max">
                                {columns.filter(status => visibleColumns.has(status)).map(status => {
                                  const statusWos = techWos.filter(wo => wo.status === status);
                                  return (
                                    <div key={status} className="w-[220px] flex-shrink-0">
                                      <div className="flex items-center gap-1.5 mb-2 px-1">
                                        <div className={`w-2 h-2 rounded-full ${statusColors[status].split(' ')[0]}`}></div>
                                        <span className="text-[10px] font-semibold text-stone-600 dark:text-stone-300">{translateStatus(status)}</span>
                                        <span className="text-[10px] text-stone-400 dark:text-stone-500">({statusWos.length})</span>
                                      </div>
                                      <div
                                        className="space-y-2 min-h-[60px] bg-stone-50/50 dark:bg-stone-800/50 rounded-lg p-2"
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, status)}
                                      >
                                        {statusWos.map(wo => (
                                          <div
                                            key={wo.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, wo.id)}
                                            onClick={() => setSelectedWO(wo)}
                                            className="bg-white dark:bg-stone-800 p-2 rounded-lg shadow-sm border border-stone-200/60 dark:border-stone-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all text-xs overflow-hidden"
                                          >
                                            <div className="font-medium text-stone-800 dark:text-stone-100 line-clamp-1 mb-1 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{wo.title}</div>
                                            <div className="flex items-center justify-between text-[10px]">
                                              <span className={`px-1.5 py-0.5 rounded border flex-shrink-0 ${priorityColors[wo.priority]}`}>
                                                {translatePriority(wo.priority)}
                                              </span>
                                              <span className="text-stone-500 dark:text-stone-400 flex-shrink-0">{formatDateShort(wo.dueDate)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )
              }
            </div >
          )
        }
      </div >

      {/* Slide-over Detail Panel */}
      {
        selectedWO && (
          <div className="fixed inset-0 z-10 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedWO(null)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 shadow-2xl h-full overflow-y-auto flex flex-col">

              {/* Modal Header */}
              <div className="p-6 border-b border-stone-100 dark:border-stone-700 bg-white dark:bg-stone-900 sticky top-0 z-20 flex justify-between items-start">
                <div className="flex-1">
                  {/* Requester Info - Show at top */}
                  {selectedWO.createdBy && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <UserCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">{t('workOrders.requestedBy')}:</span> {selectedWO.createdBy}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-2 flex-wrap w-full">
                    <h2 className="font-serif text-2xl text-stone-900 dark:text-stone-100 max-w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{selectedWO.id}: {selectedWO.title}</h2>
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold border ${statusColors[selectedWO.status]}`}>{translateStatus(selectedWO.status)}</span>
                    {
                      selectedWOPermissions && (
                        <span className={`px-2.5 py-1 rounded-lg text-sm font-semibold border ${selectedWOPermissions.canEdit
                          ? 'bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                          }`}>
                          {selectedWOPermissions.canEdit ? `✓ ${t('workOrders.editable')}` : `🔒 ${t('workOrders.readOnly')}`}
                        </span>
                      )
                    }
                  </div >
                  <p className="text-stone-500 dark:text-stone-400 text-base">{t('workOrders.createdOnDate')} {formatDateDDMMYYYY(selectedWO.createdAt)} • {t('workOrders.dueDateDisplay')} {formatDateDDMMYYYY(selectedWO.dueDate)}</p>
                  {
                    selectedWO.preferredDate && (
                      <p className="text-violet-600 text-base mt-1 flex items-center gap-1.5">
                        <Calendar size={14} />
                        <span>{t('workOrders.appointmentDate')}: <span className="font-medium">{formatDateDDMMYYYY(selectedWO.preferredDate)}</span></span>
                      </p>
                    )
                  }
                  {
                    selectedWO.assignedTo && (
                      <p className="text-stone-600 dark:text-stone-400 text-base mt-1">
                        {t('workOrders.assignedTo')}: <span className="font-medium">{selectedWO.assignedTo}</span>
                        {selectedWO.assignedTo === currentUser?.name && (
                          <span className="ml-2 text-teal-600 font-medium">{t('workOrders.you')}</span>
                        )}
                      </p>
                    )
                  }
                </div >
                <button
                  onClick={() => setSelectedWO(null)}
                  title={t('workOrders.closePanel')}
                  aria-label={t('workOrders.closePanel')}
                  className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div >

              <div className="p-6 space-y-8 flex-1">

                {/* Description */}
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-2">{t('workOrders.description')}</h3>
                  <p className="text-base text-stone-600 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                    {selectedWO.description}
                  </p>
                  {/* Reject History Section (visible to all roles, fetched from backend) */}
                  <div className="mt-3">
                    <h4 className="text-sm font-bold text-red-700 uppercase tracking-wide mb-1 flex items-center gap-2">
                      <X size={14} className="text-red-500" /> {t('workOrders.rejectHistory')}
                    </h4>
                    {isLoadingRejectHistory ? (
                      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-3 text-base text-red-700 dark:text-red-300">{t('workOrders.loadingHistory')}</div>
                    ) : rejectHistory && rejectHistory.length > 0 ? (
                      <ul className="space-y-2">
                        {rejectHistory.map(item => (
                          <li key={item.id} className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-base text-red-800 dark:text-red-300 font-medium">{item.message}</span>
                              <span className="text-sm text-red-600 dark:text-red-400">{item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}</span>
                            </div>
                            <div className="text-sm text-red-700 dark:text-red-300 mt-1">By: {item.triggeredBy}{item.recipientName ? ` → ${item.recipientName}` : ''} ({item.recipientRole})</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-sm text-stone-600 dark:text-stone-400">{t('workOrders.noRejectionHistory')}</div>
                    )}
                  </div>
                  {currentUser?.userRole === 'Admin' && selectedWO?.status === Status.PENDING && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">{t('workOrders.review')}</label>
                      <textarea
                        value={adminReview}
                        onChange={(e) => setAdminReview(e.target.value)}
                        rows={4}
                        className="w-full border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-stone-800 dark:text-stone-100"
                        placeholder={t('workOrders.reviewPlaceholder')}
                      />
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{t('workOrders.reviewNote')}</p>
                    </div>
                  )}
                </div>

                {/* GPS Location Section with Map */}
                {/* Debug: check if locationData exists */}
                {console.log('selectedWO.locationData:', selectedWO.locationData)}
                {selectedWO.locationData && (
                  <div>
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <MapPin size={16} className="text-teal-600 dark:text-teal-400" /> 📍 {t('workOrders.gpsLocation')}
                    </h3>
                    <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 border border-teal-200 dark:border-teal-800 rounded-xl overflow-hidden">
                      {/* Embedded Map using OpenStreetMap */}
                      <div className="h-[200px] w-full">
                        <iframe
                          title={t('workOrders.locationMap')}
                          width="100%"
                          height="100%"
                          className="border-0"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedWO.locationData.longitude - 0.005},${selectedWO.locationData.latitude - 0.003},${selectedWO.locationData.longitude + 0.005},${selectedWO.locationData.latitude + 0.003}&layer=mapnik&marker=${selectedWO.locationData.latitude},${selectedWO.locationData.longitude}`}
                        />
                      </div>

                      {/* Location Details */}
                      <div className="p-4">
                        <p className="text-sm text-stone-700 dark:text-stone-300 mb-3 font-medium">{selectedWO.locationData.address}</p>
                        <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 mb-4">
                          <span className="font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded border border-stone-200 dark:border-stone-700">
                            Lat: {selectedWO.locationData.latitude.toFixed(6)}
                          </span>
                          <span className="font-mono bg-white dark:bg-stone-800 px-2 py-1 rounded border border-stone-200 dark:border-stone-700">
                            Lng: {selectedWO.locationData.longitude.toFixed(6)}
                          </span>
                        </div>

                        {/* Google Maps Links */}
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${selectedWO.locationData.latitude},${selectedWO.locationData.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-teal-600/20"
                          >
                            <Navigation size={18} />
                            {t('workOrders.navigateBtn')}
                          </a>
                          <a
                            href={`https://www.google.com/maps?q=${selectedWO.locationData.latitude},${selectedWO.locationData.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-teal-700 dark:text-teal-300 font-medium rounded-xl transition-colors border-2 border-teal-200 dark:border-teal-800"
                          >
                            <MapPin size={18} />
                            {t('workOrders.viewInMaps')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}


                {/* Head Technician Review Section (visible only to Head Technician when status is Pending) */}
                {currentUser?.userRole === 'Head Technician' && selectedWO?.status === Status.PENDING && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CheckSquare size={16} className="text-purple-600 dark:text-purple-400" /> {t('workOrders.reviewWorkCompletion')}
                    </h3>

                    {/* Display Technician's Work */}
                    <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-purple-200 dark:border-purple-700 mb-4">
                      <h4 className="text-sm font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wide mb-2">
                        {t('workOrders.workSummary')}
                      </h4>

                      {selectedWO.technicianNotes && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">{t('workOrders.workNotes')}:</p>
                          <p className="text-base text-stone-700 dark:text-stone-300 bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                            {selectedWO.technicianNotes}
                          </p>
                        </div>
                      )}

                      {selectedWO.technicianImages && selectedWO.technicianImages.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                            {t('workOrders.workPhotos')} ({selectedWO.technicianImages.length}):
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {selectedTechImages.map((imgUrl, idx) => (
                              <img
                                key={idx}
                                src={imgUrl}
                                alt={`Work photo ${idx + 1}`}
                                className="w-full h-20 object-cover rounded-lg border border-stone-200 dark:border-stone-700 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setFullscreenImage(imgUrl)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {!selectedWO.technicianNotes && (!selectedWO.technicianImages || selectedWO.technicianImages.length === 0) && (
                        <p className="text-base text-stone-500 dark:text-stone-400 italic">{t('workOrders.noWorkSummary')}</p>
                      )}
                    </div>

                    {/* Review Actions */}
                    <div className="space-y-4">
                      {/* Approve Button */}
                      <button
                        onClick={handleApprove}
                        disabled={isApproving || isRejecting}
                        className="w-full px-5 py-3 bg-emerald-600 text-white rounded-xl text-base font-semibold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-xl hover:shadow-emerald-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        <CheckSquare size={18} />
                        {isApproving ? t('workOrders.approving') : t('workOrders.approveBtn')}
                      </button>

                      {/* Rejection Section */}
                      <div className="border-t border-purple-200 dark:border-purple-700 pt-4">
                        <label className="block text-base font-medium text-purple-700 dark:text-purple-300 mb-2">
                          {t('workOrders.rejectWithReason')}
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder={t('workOrders.rejectPlaceholder')}
                          className="w-full px-4 py-3 bg-white dark:bg-stone-800 border-2 border-purple-200 dark:border-purple-700 rounded-xl text-base dark:text-stone-100 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                          rows={3}
                          disabled={isApproving || isRejecting}
                        />
                        <button
                          onClick={handleReject}
                          disabled={isApproving || isRejecting || !rejectionReason.trim()}
                          className="w-full mt-2 px-5 py-3 bg-red-600 text-white rounded-xl text-base font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                        >
                          <X size={18} />
                          {isRejecting ? t('workOrders.rejecting') : t('workOrders.rejectBtn')}
                        </button>
                      </div>

                      {/* Info Messages */}
                      <div className="space-y-2">
                        <div className="bg-emerald-100/50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl">
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                            <CheckSquare size={14} className="mt-0.5 flex-shrink-0" />
                            <span>
                              {t('workOrders.approveNote')}
                            </span>
                          </p>
                        </div>
                        <div className="bg-red-100/50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3 rounded-xl">
                          <p className="text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                            <X size={14} className="mt-0.5 flex-shrink-0" />
                            <span>
                              {t('workOrders.rejectNote')}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Close Section (visible to Admin when status is Completed) */}
                {currentUser?.userRole === 'Admin' && selectedWO?.status === Status.COMPLETED && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CheckSquare size={16} className="text-purple-600 dark:text-purple-400" /> {t('workOrders.closeWorkOrderTitle')}
                    </h3>

                    <div className="bg-white dark:bg-stone-800 p-4 rounded-xl border border-purple-200 dark:border-purple-700 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                          <CheckSquare size={24} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{t('workOrders.workCompletedApproved')}</p>
                          <p className="text-sm text-stone-600 dark:text-stone-400">{t('workOrders.readyToBeClosed')}</p>
                        </div>
                      </div>

                      <div className="bg-stone-50 dark:bg-stone-900 p-3 rounded-lg border border-stone-200 dark:border-stone-700">
                        <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                          {t('workOrders.closingNote')}
                        </p>
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={handleClose}
                      disabled={isClosing}
                      className="w-full px-5 py-3 bg-purple-600 text-white rounded-xl text-base font-semibold hover:bg-purple-700 shadow-lg shadow-purple-600/20 hover:shadow-xl hover:shadow-purple-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <CheckSquare size={18} />
                      {isClosing ? t('workOrders.closing') : t('workOrders.closingBtn')}
                    </button>

                    {/* Info Message */}
                    <div className="mt-4 bg-purple-100/50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 p-3 rounded-xl">
                      <p className="text-sm text-purple-700 dark:text-purple-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {t('workOrders.closeNote')}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Technician Inline Update (visible to assigned Technician with edit permission) */}
                {selectedWOPermissions?.canEdit && currentUser?.userRole === 'Technician' && selectedWO?.status === Status.IN_PROGRESS && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ImageIcon size={16} className="text-blue-600 dark:text-blue-400" /> {t('workOrders.completeAndSubmit')}
                    </h3>

                    <div className="mb-4">
                      <label className="block text-base font-medium text-blue-700 dark:text-blue-300 mb-1.5">{t('workOrders.workNotesLabel')}</label>
                      <textarea
                        value={technicianNotes}
                        onChange={(e) => setTechnicianNotes(e.target.value)}
                        rows={5}
                        className="w-full border-2 border-blue-200 dark:border-blue-700 rounded-xl p-3 text-base outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-stone-800 dark:text-stone-100"
                        placeholder={t('workOrders.workNotesPlaceholder')}
                        disabled={!selectedWOPermissions?.canEdit}
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-base font-medium text-blue-700 dark:text-blue-300 mb-2">{t('workOrders.workPhotosOptional')}</label>
                      <div className="flex items-center gap-3 mb-3">
                        <label className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-base dark:text-stone-100 transition-colors duration-200 ${selectedWOPermissions?.canEdit ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'opacity-50 cursor-not-allowed'}`}>
                          <Upload size={16} className="text-blue-600 dark:text-blue-400" />
                          <span>{isUploading ? t('workOrders.uploading') : t('workOrders.addPhotos')}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={!selectedWOPermissions?.canEdit || isUploading}
                          />
                        </label>
                        {isUploading && <span className="text-base text-blue-600 dark:text-blue-400">{t('workOrders.uploading')}</span>}
                        {technicianImages.length > 0 && (
                          <button
                            onClick={() => { setTechnicianImages([]); }}
                            className="text-base text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedWOPermissions?.canEdit}
                          >
                            {t('workOrders.clearAll')}
                          </button>
                        )}
                      </div>

                      {technicianPreviewUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {technicianPreviewUrls.map((imgUrl, idx) => (
                            <div key={idx} className="relative rounded-xl overflow-hidden border-2 border-blue-200 dark:border-blue-700">
                              <img src={imgUrl} alt={`work-photo-${idx}`} className="w-full h-28 object-cover" />
                              <button
                                onClick={() => removeTechnicianImage(idx)}
                                title={t('workOrders.removeImage')}
                                aria-label={t('workOrders.removeImage')}
                                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-md"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={submitTechnicianUpdate}
                      disabled={isSubmitting || (!technicianNotes.trim() && technicianImages.length === 0)}
                      className="w-full px-5 py-3 bg-blue-600 text-white rounded-xl text-base font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <CheckSquare size={18} />
                      {isSubmitting ? t('workOrders.submitting') : t('workOrders.markDoneBtn')}
                    </button>

                    {/* Info Message */}
                    <div className="mt-4 bg-blue-100/50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-3 rounded-xl">
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                        <span>
                          {t('workOrders.submitNote')}
                          {!technicianNotes.trim() && technicianImages.length === 0 && (
                            <strong className="block mt-1 text-amber-700 dark:text-amber-400">{t('workOrders.addNotesOrPhotos')}</strong>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin Assignment Block (appears before AI Assistant) */}
                {currentUser?.userRole === 'Admin' && (
                  <div className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 border border-purple-200 dark:border-purple-800 rounded-2xl p-5">
                    <h3 className="text-base font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <UserPlus size={16} className="text-purple-600 dark:text-purple-400" /> {t('workOrders.assign')}
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={adminAssignedTo}
                        onChange={(e) => setAdminAssignedTo(e.target.value)}
                        className="flex-1 text-base border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-stone-50 dark:bg-stone-800 dark:text-stone-100"
                        title={t('workOrders.selectTechnicianToAssign')}
                        aria-label={t('workOrders.selectTechnicianToAssign')}
                      >
                        <option value="">{t('workOrders.selectTechnicianPlaceholder')}</option>
                        {TECHNICIANS.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    {selectedWO.status === Status.OPEN && (
                      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t('workOrders.savingWillMove')}</p>
                    )}
                    {selectedWO.status === Status.IN_PROGRESS && (
                      <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">{t('workOrders.savingWillKeep')}</p>
                    )}
                  </div>
                )}

                {/* Original Request Images */}
                {selectedWOImages.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ImageIcon size={16} className="text-teal-600 dark:text-teal-400" /> {t('workOrders.originalRequestImages')} ({selectedWOImages.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedWOImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-teal-200 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-500 transition-all duration-200"
                          onClick={() => setFullscreenImage(imgUrl)}
                        >
                          <img
                            src={imgUrl}
                            alt={`Request image ${idx + 1}`}
                            className="w-full h-32 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technician Work Images */}
                {selectedTechImages.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <ImageIcon size={16} className="text-violet-600 dark:text-violet-400" /> {t('workOrders.technicianWorkImages')} ({selectedTechImages.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedTechImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-violet-200 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500 transition-all duration-200"
                          onClick={() => setFullscreenImage(imgUrl)}
                        >
                          <img
                            src={imgUrl}
                            alt={`Technician image ${idx + 1}`}
                            className="w-full h-32 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Assistant Section */}
                <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 rounded-2xl p-6 border border-teal-100 dark:border-teal-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <BrainCircuit size={120} className="text-teal-600 dark:text-teal-400" />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <BrainCircuit className="text-teal-600 dark:text-teal-400" size={24} />
                      <h3 className="font-serif text-xl text-teal-900 dark:text-teal-200">{t('workOrders.aiAssistant')}</h3>
                    </div>

                    {!analysis ? (
                      <div>
                        <p className="text-teal-700 dark:text-teal-300 mb-4 text-base">
                          {t('workOrders.aiDescription')}
                        </p>
                        <button
                          onClick={handleAnalyze}
                          disabled={isAnalyzing}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl font-medium text-base transition-all duration-200 shadow-lg shadow-teal-600/20 flex items-center gap-2 disabled:opacity-70 hover:-translate-y-0.5"
                        >
                          {isAnalyzing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>{t('workOrders.analyzing')}</span>
                            </>
                          ) : (
                            <>
                              <Zap size={18} />
                              <span>{t('workOrders.analyzeIssue')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Analysis Results */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white/80 dark:bg-stone-800/80 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
                            <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase mb-2 flex items-center gap-1">
                              <AlertTriangle size={14} /> {t('workOrders.potentialRootCauses')}
                            </h4>
                            <ul className="list-disc list-inside text-base text-stone-700 dark:text-stone-300 space-y-1">
                              {analysis.rootCauses.map((cause, idx) => <li key={idx}>{cause}</li>)}
                            </ul>
                          </div>
                          <div className="bg-white/80 dark:bg-stone-800/80 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
                            <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase mb-2 flex items-center gap-1">
                              <Clock size={14} /> {t('workOrders.estRepairTime')}
                            </h4>
                            <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{analysis.estimatedTimeHours} {t('workOrders.hours')}</div>
                            <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{t('workOrders.basedOnHistorical')} {selectedWO.assetName}</p>
                          </div>
                        </div>

                        <div className="bg-white/80 dark:bg-stone-800/80 p-4 rounded-xl border border-teal-100 dark:border-teal-800">
                          <h4 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase mb-2 flex items-center gap-1">
                            <CheckSquare size={14} /> {t('workOrders.recommendedActions')}
                          </h4>
                          <div className="space-y-2">
                            {analysis.recommendedActions.map((action, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-2 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors duration-200">
                                <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-teal-200 dark:border-teal-700 flex items-center justify-center text-xs text-teal-600 dark:text-teal-400 font-bold">{idx + 1}</div>
                                <span className="text-base text-stone-700 dark:text-stone-300">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button onClick={handleAnalyze} className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 underline">
                          {t('workOrders.reAnalyze')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Spare Parts Usage Section */}
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Package size={16} className="text-teal-600 dark:text-teal-400" /> {t('workOrders.spareParts')}
                  </h3>
                  <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 rounded-2xl p-4">
                    {/* List Used Parts */}
                    {(selectedWO.partsUsed && selectedWO.partsUsed.length > 0) ? (
                      <div className="space-y-2 mb-4">
                        {selectedWO.partsUsed.map((part, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-700">
                            <div>
                              <div className="font-medium text-base text-stone-800 dark:text-stone-100">{part.name}</div>
                              <div className="text-sm text-stone-500 dark:text-stone-400">Qty: {part.quantity} • ${part.cost}/unit</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-stone-700 dark:text-stone-200">${part.cost * part.quantity}</span>
                              <button
                                onClick={() => removePartFromWo(idx)}
                                title={t('workOrders.removePart')}
                                aria-label={t('workOrders.removePart')}
                                className="text-red-400 hover:text-red-600 p-1 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-2 border-t border-stone-200 dark:border-stone-700 px-2">
                          <span className="text-base font-medium text-stone-600 dark:text-stone-400">{t('workOrders.totalCostLabel')}</span>
                          <span className="text-lg font-bold text-stone-900 dark:text-stone-100">
                            ${selectedWO.partsUsed.reduce((acc, p) => acc + (p.cost * p.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-stone-400 dark:text-stone-500 text-base mb-4">{t('workOrders.noPartsConsumed')}</div>
                    )}

                    {/* Add Part Dropdown - hide for Admin when status is Completed */}
                    {!(currentUser?.userRole === 'Admin' && selectedWO?.status === Status.COMPLETED) && (
                      <div className="flex gap-2">
                        <select
                          title={t('workOrders.addPartFromInventory')}
                          aria-label={t('workOrders.addPartFromInventory')}
                          className="flex-1 text-base border border-stone-200 dark:border-stone-700 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white dark:bg-stone-900 dark:text-stone-100 transition-all duration-200"
                          onChange={(e) => {
                            addPartToWo(e.target.value);
                            e.target.value = ''; // Reset
                          }}
                        >
                          <option value="">{t('workOrders.addPartPlaceholder')}</option>
                          {AVAILABLE_PARTS.map(p => (
                            <option key={p.id} value={p.id}>{p.name} (${p.cost})</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checklist Section */}
                {checklist.length > 0 && (
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CheckSquare size={16} className="text-teal-600 dark:text-teal-400" /> {t('workOrders.maintenanceChecklist')}
                    </h3>
                    <div className="bg-white dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 rounded-2xl divide-y divide-stone-100 dark:divide-stone-700 overflow-hidden">
                      {checklist.map((item, idx) => (
                        <label key={idx} className="flex items-center gap-3 p-3.5 hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer transition-colors duration-200">
                          <input type="checkbox" className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 text-teal-600 focus:ring-teal-500 dark:bg-stone-700" />
                          <span className="text-base text-stone-700 dark:text-stone-300">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 flex justify-end gap-3 sticky bottom-0 z-20">
                {currentUser?.userRole === 'Admin' && selectedWO?.status === Status.OPEN ? (
                  <button
                    onClick={handleAdminCancel}
                    className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-base font-semibold hover:bg-rose-700 shadow-lg shadow-rose-600/20 hover:shadow-xl hover:shadow-rose-600/25 hover:-translate-y-0.5 transition-all duration-200"
                    title={t('workOrders.cancelWO')}
                    aria-label={t('workOrders.cancelWO')}
                  >
                    {t('workOrders.cancelBtn')}
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedWO(null)}
                    className="px-5 py-2.5 bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 rounded-xl text-stone-700 dark:text-stone-200 text-base font-medium hover:bg-stone-50 dark:hover:bg-stone-600 hover:border-stone-300 dark:hover:border-stone-500 transition-all duration-200"
                  >
                    {t('workOrders.closeBtn')}
                  </button>
                )}
                {(() => {
                  // Technician inline submit button is now in the update section
                  // Only show footer buttons for Admin/Requester with edit permissions
                  if (!selectedWOPermissions?.canEdit) {
                    return null;
                  }
                  // Technicians: no footer button needed (submit is in inline section)
                  if (currentUser?.userRole === 'Technician') {
                    return null;
                  }
                  // Admin actions
                  if (currentUser?.userRole === 'Admin' || currentUser?.userRole === 'Head Technician') {
                    if (selectedWO?.status === Status.OPEN) {
                      return (
                        <button
                          onClick={handleAdminAssign}
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-base font-semibold hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                          <span>{t('workOrders.saveAndUpdate')}</span>
                          <ArrowRight size={16} />
                        </button>
                      );
                    }
                    if (selectedWO?.status === Status.IN_PROGRESS) {
                      return (
                        <button
                          onClick={handleAdminAssign}
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-base font-semibold hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                        >
                          <span>{t('workOrders.saveAndUpdate')}</span>
                          <ArrowRight size={16} />
                        </button>
                      );
                    }
                    // Removed Save & Update button for Pending status
                  }
                  return null;
                })()}
              </div>

            </div >
          </div >
        )
      }
      {/* Technician Update Modal */}
      {
        showTechnicianModal && (
          <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTechnicianModal(false)}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-auto p-6 z-20">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-serif text-xl text-stone-900 dark:text-stone-100">{t('workOrders.updateTechnicianModal')}</h3>
                <button onClick={() => setShowTechnicianModal(false)} title={t('workOrders.closeModal')} aria-label={t('workOrders.closeModal')} className="p-2 rounded-xl text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="block text-base font-medium text-stone-700 dark:text-stone-300">{t('workOrders.notesLabel')}</label>
                <textarea value={technicianNotes} onChange={(e) => setTechnicianNotes(e.target.value)} rows={5} placeholder={t('workOrders.notesPlaceholder')} className="w-full border border-stone-200 dark:border-stone-700 rounded-xl p-3 text-base outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-stone-50 dark:bg-stone-800 dark:text-stone-100 transition-all duration-200" />

                <div>
                  <label className="block text-base font-medium text-stone-700 dark:text-stone-300 mb-2">{t('workOrders.addImages')}</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-base dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors duration-200">
                      <Upload size={16} />
                      <span>{isUploading ? t('workOrders.uploading') : t('workOrders.selectImages')}</span>
                      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                    {isUploading && <span className="text-sm text-stone-500 dark:text-stone-400">{t('workOrders.uploading')}</span>}
                  </div>
                  {technicianPreviewUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {technicianPreviewUrls.map((imgUrl, idx) => (
                        <div key={idx} className="relative rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700">
                          <img src={imgUrl} alt={`img-${idx}`} className="w-full h-28 object-cover" />
                          <button onClick={() => removeTechnicianImage(idx)} title={t('workOrders.removeImage')} aria-label={t('workOrders.removeImage')} className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setShowTechnicianModal(false)} className="px-5 py-2.5 bg-white dark:bg-stone-700 border-2 border-stone-200 dark:border-stone-600 rounded-xl text-sm font-medium dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-600 hover:border-stone-300 dark:hover:border-stone-500 transition-all duration-200">{t('common.cancel')}</button>
                <button onClick={submitTechnicianUpdate} disabled={isSubmitting} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-teal-700 shadow-lg shadow-teal-600/20 hover:-translate-y-0.5 transition-all duration-200">
                  {isSubmitting ? t('workOrders.saving') : t('workOrders.saveAndUpdate')}
                  <Save size={14} />
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Fullscreen Image Modal */}
      {
        fullscreenImage && (
          <div
            className="fixed inset-0 z-20 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 text-white hover:text-stone-300 bg-black/50 hover:bg-black/70 rounded-xl p-3 transition-all duration-200 z-10"
              title={t('common.close')}
              aria-label={t('common.close')}
            >
              <X size={28} />
            </button>
            <img
              src={fullscreenImage}
              alt={t('workOrders.fullSize')}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
              {t('workOrders.clickOutsideToClose')}
            </div>
          </div>
        )
      }
    </div >
  );
};

export default WorkOrders;  