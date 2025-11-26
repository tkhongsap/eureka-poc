import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import WorkRequestPortal from '../components/WorkRequestPortal';
import { User, UserRole } from '../types';
import { generateTitleFromDescription } from '../services/geminiService';
import { createWorkOrder } from '../services/apiService';
import { ArrowLeft, Wrench } from 'lucide-react';

// Default guest user for public request portal
const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest User',
  role: 'Requester',
  userRole: 'Requester',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
};

// List of technicians for assignment
const TECHNICIANS = [
  { id: 'u2', name: 'John Doe' },
  { id: 'u4', name: 'Sarah M.' },
  { id: 'u5', name: 'Mike R.' },
  { id: 'u6', name: 'Tom W.' },
];

const RequestPortalPage: React.FC = () => {
  const [currentUser] = useState<User>(GUEST_USER);

  // Handler to create work order from request
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
      await createWorkOrder({
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
    } catch (error) {
      console.error('Failed to create work order:', error);
      alert('Failed to create work order. Make sure the backend is running.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm flex-shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium hidden sm:inline">Back to Home</span>
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-1.5 rounded-lg">
              <Wrench size={20} />
            </div>
            <span className="font-bold text-slate-800">Eureka <span className="text-brand-600">Request Portal</span></span>
          </div>
        </div>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition shadow-sm"
        >
          Staff Login
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <WorkRequestPortal 
          onSubmitRequest={handleNewRequest}
          currentUser={currentUser}
          technicians={TECHNICIANS}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-sm text-slate-500">
        <p>© 2023 Eureka CMMS. Need help? Contact your facilities team.</p>
      </footer>
    </div>
  );
};

export default RequestPortalPage;
