import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Breadcrumb from './components/Breadcrumb';
import Dashboard from './components/Dashboard';
import WorkOrders from './components/WorkOrders';
import WorkRequestPortal from './components/WorkRequestPortal';
import RequestorWorkOrders from './components/RequestorWorkOrders';
import AssetHierarchy from './components/AssetHierarchy';
import Inventory from './components/Inventory';
import TeamSchedule from './components/TeamSchedule';
import NotificationCenter from './components/NotificationCenter';
import Settings from './components/Settings';
import Help from './components/Help';
import Reports from './components/Reports';
import UserRoleManagement from './components/UserRoleManagement';
import PreventiveMaintenance from './components/PreventiveMaintenance';
import EOC from './components/EOC';
import SparePartCenter from './components/SparePartCenter';
import SafetyCompliance from './components/SafetyCompliance';
import { WorkOrder, Status, Priority, User, UserRole, Notification } from './types';
import { UserCircle2 } from 'lucide-react';
import { generateTitleFromDescription } from './services/geminiService';
import { listWorkOrders, createWorkOrder, WorkOrderItem, setUserContext, getNotifications, checkAndCreateReminders } from './services/apiService';
import { filterNotificationsForUser } from './services/notificationService';
import { useLanguage } from './lib/i18n';

// --- MOCK DATA ---

// All available users in the system
const ALL_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alex Sterling',
    role: 'Admin',
    userRole: 'Admin',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
  },
  {
    id: 'u9',
    name: 'Robert Chen',
    role: 'Head Technician',
    userRole: 'Head Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert'
  },
  {
    id: 'u2',
    name: 'John Doe',
    role: 'Senior Tech',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
  },
  {
    id: 'u4',
    name: 'Sarah M.',
    role: 'Technician',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SarahM'
  },
  {
    id: 'u5',
    name: 'Mike R.',
    role: 'Technician',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MikeR'
  },
  {
    id: 'u6',
    name: 'Tom W.',
    role: 'Technician',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TomW'
  },
  {
    id: 'u7',
    name: 'David K.',
    role: 'Technician',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DavidK'
  },
  {
    id: 'u8',
    name: 'James L.',
    role: 'Technician',
    userRole: 'Technician',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JamesL'
  },
  {
    id: 'u3',
    name: 'Sarah Line',
    role: 'Requester',
    userRole: 'Requester',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  }
];

// List of technicians for assignment dropdown
const TECHNICIANS = ALL_USERS
  .filter(u => u.userRole === 'Technician')
  .map(u => ({ id: u.id, name: u.name }));

// USERS object for role-based lookup (used by login flow)
const USERS: Record<UserRole, User> = {
  Admin: ALL_USERS.find(u => u.userRole === 'Admin')!,
  'Head Technician': ALL_USERS.find(u => u.userRole === 'Head Technician')!,
  Technician: ALL_USERS.find(u => u.userRole === 'Technician')!,
  Requester: ALL_USERS.find(u => u.userRole === 'Requester')!,
};

// Fallback mock work orders when API is unavailable
const MOCK_WOS: WorkOrder[] = [
  {
    id: 'WO-2024-001',
    title: 'Hydraulic Pump Failure',
    description: 'Main hydraulic pump on Line 3 is overheating and making grinding noises. Production halted.',
    assetName: 'Hydraulic Unit L3-A',
    location: 'Building A, Line 3',
    priority: Priority.CRITICAL,
    status: Status.OPEN,
    assignedTo: 'John Doe',
    dueDate: '2024-10-25',
    createdAt: '2024-10-24',
    partsUsed: []
  },
  {
    id: 'WO-2024-002',
    title: 'Quarterly Conveyor Inspection',
    description: 'Routine inspection of belt tension and rollers for Section B.',
    assetName: 'Conveyor Belt B2',
    location: 'Building B',
    priority: Priority.MEDIUM,
    status: Status.IN_PROGRESS,
    assignedTo: 'Sarah M.',
    dueDate: '2024-10-28',
    createdAt: '2024-10-20',
    partsUsed: []
  },
  {
    id: 'WO-2024-003',
    title: 'Sensor Calibration',
    description: 'Temperature sensor giving erratic readings > 20% deviation.',
    assetName: 'Temp Sensor T-101',
    location: 'Boiler Room',
    priority: Priority.HIGH,
    status: Status.PENDING,
    assignedTo: 'Mike R.',
    dueDate: '2024-10-26',
    createdAt: '2024-10-22',
    partsUsed: []
  },
];

const App: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WOS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check for logged in user from server session on mount
  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('Server session verified:', userData);

          const user: User = {
            id: userData.id,
            name: userData.name || userData.email || 'User',
            role: userData.role || userData.user_role || 'Requester',
            userRole: (userData.user_role || 'Requester') as UserRole,
            avatarUrl: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.id}`,
          };

          sessionStorage.setItem('authUser', JSON.stringify(userData));
          setCurrentUser(user);
          setIsLoggedIn(true);
          setUserContext(user.userRole, user.name);
          return;
        }
      } catch (e) {
        console.log('No active server session');
      }

      const storedUser = sessionStorage.getItem('loggedInUser');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const role = parsed.role;
          const userName = parsed.name;
          console.log('Loading user from sessionStorage:', role, userName);

          if (role && USERS[role as UserRole]) {
            const baseUser = USERS[role as UserRole];
            
            // Try to fetch latest profile from API to get updated avatar
            try {
              const response = await fetch('/api/users/me', {
                headers: { 'X-User-Name': userName || baseUser.name },
              });
              if (response.ok) {
                const profileData = await response.json();
                const user: User = {
                  ...baseUser,
                  name: profileData.name || baseUser.name,
                  avatarUrl: profileData.avatar_url || baseUser.avatarUrl,
                };
                console.log('User loaded with API profile:', user);
                setCurrentUser(user);
                setIsLoggedIn(true);
                setUserContext(user.userRole, user.name);
                return;
              }
            } catch (apiError) {
              console.log('Could not fetch profile from API, using cached data');
            }
            
            // Fallback to hardcoded user
            console.log('User loaded (fallback):', baseUser);
            setCurrentUser(baseUser);
            setIsLoggedIn(true);
            setUserContext(baseUser.userRole, baseUser.name);
          }
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    };

    verifySession();
  }, []);

  // Listen for profile updates from Settings
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      const updated = event.detail;
      if (updated && currentUser) {
        setCurrentUser(prev => prev ? {
          ...prev,
          name: updated.name || prev.name,
          avatarUrl: updated.avatar_url || prev.avatarUrl,
        } : prev);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
    };
  }, [currentUser]);

  // Handle logout
  const handleLogout = async () => {
    const authUser = sessionStorage.getItem('authUser');

    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('authUser');
    setIsLoggedIn(false);
    setCurrentView('dashboard');

    if (authUser) {
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        const data = await response.json();
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
      } catch (e) {
        console.error('Logout error:', e);
      }
    }

    window.location.href = '/';
  };

  // Load work orders from backend on mount and when user changes
  useEffect(() => {
    const loadWorkOrders = async () => {
      try {
        const apiWorkOrders = await listWorkOrders({
          assignedTo: currentUser?.userRole === 'Technician' ? currentUser.name : undefined,
        });
        const mappedWorkOrders: WorkOrder[] = apiWorkOrders.map((wo: WorkOrderItem) => ({
          id: wo.id,
          title: wo.title,
          description: wo.description,
          assetName: wo.assetName,
          location: wo.location,
          priority: wo.priority as Priority,
          status: wo.status as Status,
          assignedTo: wo.assignedTo,
          dueDate: wo.dueDate,
          createdAt: wo.createdAt,
          partsUsed: [],
          imageIds: wo.imageIds || [],
          requestId: wo.requestId,
          createdBy: wo.createdBy,
          managedBy: wo.managedBy,
          adminReview: wo.adminReview,
          locationData: wo.locationData,
          technicianNotes: wo.technicianNotes,
          technicianImages: wo.technicianImages || [],
          preferredDate: wo.preferredDate,
        }));
        // Merge with mock data if API returns empty
        setWorkOrders(mappedWorkOrders.length > 0 ? mappedWorkOrders : MOCK_WOS);
      } catch (error) {
        console.error('Failed to load work orders from API:', error);
        setWorkOrders(MOCK_WOS);
      }
    };
    loadWorkOrders();
  }, [currentUser]);

  // Load notifications from backend
  const loadNotifications = async () => {
    if (!currentUser) return;

    try {
      const allNotifications = await getNotifications();
      // Map NotificationItem to Notification and filter for current user
      const mappedNotifications: Notification[] = allNotifications.map(item => ({
        id: item.id,
        type: item.type as any,
        workOrderId: item.workOrderId,
        workOrderTitle: item.workOrderTitle,
        message: item.message,
        recipientRole: item.recipientRole as UserRole,
        recipientName: item.recipientName,
        isRead: item.isRead,
        createdAt: item.createdAt,
        triggeredBy: item.triggeredBy,
      }));

      const userNotifications = filterNotificationsForUser(
        mappedNotifications,
        currentUser.userRole,
        currentUser.name
      );
      setNotifications(userNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
    }
  };

  // Load notifications when user logs in or changes
  useEffect(() => {
    if (currentUser) {
      // Set default view based on role
      if (currentUser.userRole === 'Requester') {
        setCurrentView('requests');
      } else if (currentUser.userRole === 'Technician' || currentUser.userRole === 'Head Technician') {
        setCurrentView('work-orders');
      }
      // Admin stays on dashboard (default)

      // Check and create reminder notifications first, then load notifications
      const initNotifications = async () => {
        try {
          await checkAndCreateReminders();
        } catch (error) {
          console.error('Failed to check reminders:', error);
        }
        loadNotifications();
      };

      initNotifications();
      // Poll for new notifications every 10 seconds
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Keyboard shortcut: Ctrl+B / Cmd+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+B (Windows/Linux) or Cmd+B (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault(); // Prevent browser default (e.g., bold in text editor)
        setSidebarCollapsed(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler to add new work order from request
  const handleNewRequest = async (request: {
    id: string;
    location: string;
    priority: string;
    description: string;
    imageIds: string[];
    assignedTo?: string;
    locationData?: { latitude: number; longitude: number; address: string; googleMapsUrl: string };
    preferredDate?: string;
  }) => {
    try {
      // Generate AI title from description
      const aiTitle = await generateTitleFromDescription(request.description);

      // Create work order via API
      // dueDate should be 7 days after preferredDate if set, otherwise 7 days from now
      const calculateDueDate = () => {
        if (request.preferredDate) {
          const preferred = new Date(request.preferredDate);
          preferred.setDate(preferred.getDate() + 7);
          return preferred.toISOString().split('T')[0];
        }
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      };

      const createdWO = await createWorkOrder({
        title: aiTitle,
        description: request.description,
        assetName: request.location,
        location: request.location,
        priority: request.priority,
        status: 'Open',
        assignedTo: request.assignedTo,
        dueDate: calculateDueDate(),
        imageIds: request.imageIds,
        requestId: request.id,
        createdBy: currentUser?.name, // Store who created this WO
        locationData: request.locationData,
        preferredDate: request.preferredDate,
      });

      // Map to WorkOrder type for UI
      const newWO: WorkOrder = {
        id: createdWO.id,
        title: createdWO.title,
        description: createdWO.description,
        assetName: createdWO.assetName,
        location: createdWO.location,
        priority: createdWO.priority as Priority,
        status: createdWO.status as Status,
        assignedTo: createdWO.assignedTo,
        dueDate: createdWO.dueDate,
        createdAt: createdWO.createdAt,
        partsUsed: [],
        imageIds: createdWO.imageIds || [],
        requestId: createdWO.requestId,
        createdBy: createdWO.createdBy, // Include createdBy in UI state
        locationData: createdWO.locationData,
        preferredDate: createdWO.preferredDate,
      };

      setWorkOrders(prev => [newWO, ...prev]);
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Failed to create work order. Make sure the backend is running.');
    }
  };

  // Reset view when role changes
  useEffect(() => {
    if (isLoggedIn) {
      if (currentUser.userRole === 'Requester') {
        setCurrentView('requests');
      } else if (currentUser.userRole === 'Technician') {
        setCurrentView('work-orders');
      } else if (currentUser.userRole === 'Head Technician') {
        setCurrentView('work-orders'); // Head Technician reviews work orders
      } else {
        setCurrentView('dashboard');
      }
    }
  }, [currentUser, isLoggedIn]);

  // Redirect to login page if not logged in
  useEffect(() => {
    if (!isLoggedIn && currentUser === null) {
      // Check if we already tried to load from sessionStorage
      const storedUser = sessionStorage.getItem('loggedInUser');
      if (!storedUser) {
        navigate('/login');
      }
    }
  }, [isLoggedIn, currentUser, navigate]);

  // Show nothing while checking login status or redirecting
  if (!isLoggedIn || !currentUser) {
    console.log('Not logged in or no user, showing null. isLoggedIn:', isLoggedIn, 'currentUser:', currentUser); // Debug log
    return null;
  }

  console.log('Rendering main app for user:', currentUser.name, currentUser.userRole, 'currentView:', currentView); // Debug log

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard 
          onNavigateToWorkOrder={(woId) => {
            setCurrentView('work-orders');
            sessionStorage.setItem('openWorkOrderId', woId);
            // Dispatch event after delay to allow WorkOrders to mount
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openWorkOrder', { detail: woId }));
            }, 300);
          }}
          onNavigateToRequests={() => {
            setCurrentView('requests');
          }}
        />;
      case 'work-orders':
        return <WorkOrders workOrders={workOrders} currentUser={currentUser} technicians={TECHNICIANS} />;
      case 'requests':
        return <WorkRequestPortal
          onSubmitRequest={handleNewRequest}
          currentUser={currentUser}
          technicians={TECHNICIANS}
          workOrders={workOrders}
        />;
      case 'assets':
        return <AssetHierarchy />;
      case 'inventory':
        return <Inventory />;
      case 'team':
        return <TeamSchedule />;
      case 'user-management':
        return <UserRoleManagement currentUser={currentUser} />;
      case 'my-work-orders':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-stone-900 mb-6">{t('nav.myWorkOrders')}</h1>
            <RequestorWorkOrders workOrders={workOrders} requestorName={currentUser.name} />
          </div>
        );
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      case 'reports':
        return <Reports />;
      case 'preventive-maintenance':
        return <PreventiveMaintenance />;
      case 'eoc':
        return <EOC />;
      case 'spare-part-center':
        return <SparePartCenter />;
      case 'safety':
        return <SafetyCompliance />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="text-6xl mb-4">🚧</div>
            <h2 className="text-2xl font-bold text-slate-600">Module Under Construction</h2>
            <p className="mt-2">The {currentView} module is coming in the next sprint.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        userRole={currentUser.userRole}
        currentUser={currentUser}
        onLogout={handleLogout}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className={`flex-1 ${sidebarCollapsed ? 'ml-20' : 'ml-64'} flex flex-col h-screen transition-all duration-300`}>
        <Header
          user={currentUser}
          notifications={notifications}
          onNotificationsUpdate={loadNotifications}
          onNavigateToWorkOrder={(woId) => {
            // Requester goes to my-work-orders, others go to work-orders
            const targetView = currentUser.userRole === 'Requester' ? 'my-work-orders' : 'work-orders';
            setCurrentView(targetView);
            sessionStorage.setItem('openWorkOrderId', woId);
            // Dispatch event after delay to allow component to mount
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('openWorkOrder', { detail: woId }));
            }, 300);
          }}
        />

        <main className="flex-1 pt-16 overflow-y-auto scroll-smooth relative">
          <Breadcrumb
            currentView={currentView}
            onNavigate={setCurrentView}
            userRole={currentUser.userRole}
          />
          {renderContent()}
        </main>
      </div>
    </div>
  );
};


export default App;