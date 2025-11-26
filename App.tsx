import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import WorkOrders from './components/WorkOrders';
import WorkRequestPortal from './components/WorkRequestPortal';
import AssetHierarchy from './components/AssetHierarchy';
import Inventory from './components/Inventory';
import TeamSchedule from './components/TeamSchedule';
import { WorkOrder, Status, Priority, User, UserRole } from './types';
import { UserCircle2, ShieldCheck, HardHat, ClipboardList } from 'lucide-react';
import { generateTitleFromDescription } from './services/geminiService';
import { listWorkOrders, createWorkOrder, WorkOrderItem } from './services/apiService';

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WOS);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check for logged in user from LoginPage on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem('loggedInUser');
    if (storedUser) {
      try {
        const { role } = JSON.parse(storedUser);
        if (role && USERS[role as UserRole]) {
          setCurrentUser(USERS[role as UserRole]);
          setIsLoggedIn(true);
          // เมื่อล็อกอินสำเร็จ ให้เข้า dashboard เสมอ
          setCurrentView('dashboard');
        }
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('loggedInUser');
    setIsLoggedIn(false);
    setCurrentView('dashboard');
    // Navigate to landing page
    window.location.href = '/';
  };

  // Load work orders from backend on mount
  useEffect(() => {
    const loadWorkOrders = async () => {
      try {
        const apiWorkOrders = await listWorkOrders();
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

  // Handler to add new work order from request
  const handleNewRequest = async (request: {
    id: string;
    location: string;
    priority: string;
    description: string;
    imageIds: string[];
    assignedTo?: string;
  }) => {
    try {
      // Generate AI title from description
      const aiTitle = await generateTitleFromDescription(request.description);

      // Create work order via API
      const createdWO = await createWorkOrder({
        title: aiTitle,
        description: request.description,
        assetName: request.location,
        location: request.location,
        priority: request.priority,
        status: 'Open',
        assignedTo: request.assignedTo,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        imageIds: request.imageIds,
        requestId: request.id,
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
    return null;
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'work-orders':
        return <WorkOrders workOrders={workOrders} currentUser={currentUser} />;
      case 'requests':
        return <WorkRequestPortal 
          onSubmitRequest={handleNewRequest} 
          currentUser={currentUser}
          technicians={TECHNICIANS}
        />;
      case 'assets':
        return <AssetHierarchy />;
      case 'inventory':
        return <Inventory />;
      case 'team':
        return <TeamSchedule />;
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

  // Kiosk Mode for Requesters (No sidebar/header navigation)
  if (currentUser.userRole === 'Requester') {
    return (
      <div className="h-screen bg-slate-50 font-sans flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">E</div>
             <span className="font-bold text-slate-800">Eureka Request Portal</span>
           </div>
           <PersonaSwitcher currentUser={currentUser} onSwitch={setCurrentUser} dropdownPosition="bottom" />
        </header>
        <main className="flex-1 overflow-y-auto">
           <WorkRequestPortal 
             onSubmitRequest={handleNewRequest} 
             currentUser={currentUser}
             technicians={TECHNICIANS}
           />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        userRole={currentUser.userRole}
        currentUser={currentUser}
        onSwitchUser={setCurrentUser}
        allUsers={Object.values(USERS)}
      />
      
      <div className="flex-1 ml-64 flex flex-col h-screen">
        <Header user={currentUser} />
        
        <main className="flex-1 pt-16 overflow-y-auto scroll-smooth relative">
           {renderContent()}
        </main>
      </div>
    </div>
  );
};

const PersonaSwitcher: React.FC<{ currentUser: User, onSwitch: (u: User) => void, dropdownPosition?: 'top' | 'bottom' }> = ({ currentUser, onSwitch, dropdownPosition = 'top' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {isOpen && (
         <div className={`absolute ${dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in-up z-50`}>
            <div className="p-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
              Switch Role
            </div>
            <div className="p-1 max-h-80 overflow-y-auto">
              {ALL_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { onSwitch(u); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${currentUser.id === u.id ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50 text-slate-700'}`}
                >
                  <div className={`p-2 rounded-full ${u.userRole === 'Admin' ? 'bg-purple-100 text-purple-600' : u.userRole === 'Technician' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    {u.userRole === 'Admin' ? <ShieldCheck size={16} /> : u.userRole === 'Technician' ? <HardHat size={16} /> : <ClipboardList size={16} />}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{u.name}</div>
                    <div className="text-xs opacity-70">{u.userRole} {u.role !== u.userRole ? `• ${u.role}` : ''}</div>
                  </div>
                  {currentUser.id === u.id && <div className="ml-auto w-2 h-2 rounded-full bg-brand-600"></div>}
                </button>
              ))}
            </div>
         </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105"
      >
        <UserCircle2 size={20} />
        <span className="text-sm font-medium pr-1">{currentUser.name} ({currentUser.userRole})</span>
      </button>
    </div>
  );
}

export default App;