import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, MapPin, AlertCircle, History, Clock, CheckCircle, X, Image as ImageIcon, UserCheck } from 'lucide-react';
import { 
  uploadImage, 
  createRequest, 
  listRequests, 
  getImageUrl,
  RequestItem as ApiRequestItem,
  ImageInfo
} from '../services/apiService';
import { User, UserRole } from '../types';

interface RequestItem {
  id: string;
  location: string;
  priority: string;
  desc: string;
  status: string;
  date: string;
  imageIds: string[];  // Store image IDs instead of base64
  assignedTo?: string;
  createdBy?: string;
}

interface TempImage {
  file: File;
  preview: string;
  name: string;
}

interface WorkRequestPortalProps {
  onSubmitRequest?: (request: {
    id: string;
    location: string;
    priority: string;
    description: string;
    imageIds: string[];
    assignedTo?: string;
  }) => void;
  currentUser?: User;
  technicians?: { id: string; name: string }[];
}

const INITIAL_HISTORY: RequestItem[] = [
    { id: 'REQ-998', location: 'Station 4', priority: 'Medium', desc: 'Leaking pipe near station 4', status: 'In Progress', date: 'Oct 23, 2024', imageIds: [] },
    { id: 'REQ-999', location: 'Break Room', priority: 'Low', desc: 'Light flickering in break room', status: 'Completed', date: 'Oct 21, 2024', imageIds: [] },
];

const WorkRequestPortal: React.FC<WorkRequestPortalProps> = ({ onSubmitRequest, currentUser, technicians = [] }) => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Low - Cosmetic issue');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [tempImages, setTempImages] = useState<TempImage[]>([]); // Temporary images before submit
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [selectedRequestImages, setSelectedRequestImages] = useState<string[]>([]); // Image URLs
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user can assign technicians
  const canAssign = currentUser?.userRole === 'Admin' || currentUser?.userRole === 'Technician';
  const isRequester = currentUser?.userRole === 'Requester';

  // Load requests from API on mount - filter by current user
  useEffect(() => {
    const loadRequests = async () => {
      try {
        const apiRequests = await listRequests();
        const mappedRequests: RequestItem[] = apiRequests
          .filter(r => !currentUser || r.createdBy === currentUser.name)
          .map(r => ({
            id: r.id,
            location: r.location,
            priority: r.priority,
            desc: r.description,
            status: r.status,
            date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            imageIds: r.imageIds,
            assignedTo: r.assignedTo,
            createdBy: r.createdBy,
          }));
        setRequests(mappedRequests);
      } catch (error) {
        console.error('Failed to load requests from API:', error);
        setRequests([]);
      }
    };
    loadRequests();
  }, [currentUser]);

  // Auto-assign self if Technician
  useEffect(() => {
    if (currentUser?.userRole === 'Technician') {
      setAssignedTo(currentUser.name);
    }
  }, [currentUser]);

  // Load image URLs when selecting a request
  useEffect(() => {
    if (selectedRequest && selectedRequest.imageIds.length > 0) {
      const imageUrls = selectedRequest.imageIds.map(id => getImageUrl(id));
      setSelectedRequestImages(imageUrls);
    } else {
      setSelectedRequestImages([]);
    }
  }, [selectedRequest]);

  // Auto-hide success toast after 2.5 seconds
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const preview = URL.createObjectURL(file);
        setTempImages(prev => [...prev, { 
          file: file,
          preview: preview, 
          name: file.name 
        }]);
      });
    }
  };

  const removeImage = (index: number) => {
    setTempImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !description.trim()) return;

    setIsLoading(true);
    try {
      // Upload images to backend and get IDs
      const savedImageIds: string[] = [];
      for (const img of tempImages) {
        const uploadedImage = await uploadImage(img.file);
        savedImageIds.push(uploadedImage.id);
      }

      const priorityValue = priority.split(' - ')[0];
      
      // Determine assignedTo value
      const assignedToValue = canAssign ? (assignedTo || undefined) : undefined;

      // Create request via API
      const createdRequest = await createRequest({
        location: location,
        priority: priorityValue,
        description: description,
        imageIds: savedImageIds,
        assignedTo: assignedToValue,
      });

      const now = new Date();

      // Create new request item for UI
      const newRequest: RequestItem = {
        id: createdRequest.id,
        location: createdRequest.location,
        priority: createdRequest.priority,
        desc: createdRequest.description,
        status: createdRequest.status,
        date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        imageIds: createdRequest.imageIds,
        assignedTo: createdRequest.assignedTo,
      };

      // Notify parent to create Work Order
      if (onSubmitRequest) {
        onSubmitRequest({
          id: createdRequest.id,
          location: createdRequest.location,
          priority: createdRequest.priority,
          description: createdRequest.description,
          imageIds: createdRequest.imageIds,
          assignedTo: createdRequest.assignedTo,
        });
      }

      // Update UI
      setRequests(prev => [newRequest, ...prev]);
      setLocation('');
      setPriority('Low - Cosmetic issue');
      setDescription('');
      // Reset assignedTo only for Admin (Technician keeps self-assigned)
      if (currentUser?.userRole === 'Admin') {
        setAssignedTo('');
      }
      // Clean up preview URLs
      tempImages.forEach(img => URL.revokeObjectURL(img.preview));
      setTempImages([]);
      
      // Show success toast
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Failed to submit request:', error);
      alert('Failed to submit request. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-16 animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-8">
       
       {/* Success Toast Notification */}
       {showSuccessToast && (
         <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
           <div className="bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
             <CheckCircle size={24} className="flex-shrink-0" />
             <div>
               <p className="font-bold">ส่งคำขอสำเร็จ!</p>
               <p className="text-sm text-green-50">Request submitted successfully</p>
             </div>
           </div>
         </div>
       )}

       {/* Left Column: Form */}
       <div className="md:col-span-2 space-y-8">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Submit a Request</h2>
                <p className="text-slate-500 mt-2">Describe the issue and we'll assign a technician.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Location / Asset</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                            <input 
                              type="text" 
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="e.g. Line 1 Conveyor" 
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all" 
                            />
                        </div>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                        <select 
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          title="Select priority level"
                          aria-label="Priority"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                        >
                            <option>Low - Cosmetic issue</option>
                            <option>Medium - Affects performance</option>
                            <option>High - Production Stopped</option>
                            <option>Critical - Safety Hazard</option>
                        </select>
                        </div>
                    </div>

                    {/* Assign Technician - Only visible for Admin and Technician */}
                    {canAssign && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Assign Technician
                          {currentUser?.userRole === 'Technician' && (
                            <span className="text-xs text-slate-400 ml-2">(Auto-assigned to you)</span>
                          )}
                        </label>
                        <div className="relative">
                          <UserCheck className="absolute left-3 top-3 text-slate-400" size={18} />
                          {currentUser?.userRole === 'Admin' ? (
                            <select
                              value={assignedTo}
                              onChange={(e) => setAssignedTo(e.target.value)}
                              title="Assign technician"
                              aria-label="Assign technician"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                            >
                              <option value="">-- Select Technician --</option>
                              {technicians.map(tech => (
                                <option key={tech.id} value={tech.name}>{tech.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={assignedTo}
                              readOnly
                              title="Assigned technician"
                              aria-label="Assigned technician"
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 cursor-not-allowed"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Issue Description</label>
                        <textarea 
                          rows={4} 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe what happened, any strange noises, etc." 
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Photos / Videos</label>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*,video/*"
                          multiple
                          title="Upload photos or videos"
                          aria-label="Upload photos or videos"
                          className="hidden"
                        />
                        
                        {/* Image Previews */}
                        {tempImages.length > 0 && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {tempImages.map((img, idx) => (
                              <div key={idx} className="relative group">
                                <img src={img.preview} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg border border-slate-200" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  title="Remove image"
                                  aria-label="Remove image"
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                            <Camera size={24} />
                          </div>
                          <p className="text-sm text-slate-600 font-medium">Click to upload or drag & drop</p>
                          <p className="text-xs text-slate-400 mt-1">JPG, PNG, MP4 up to 50MB</p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button 
                          type="submit" 
                          disabled={!location.trim() || !description.trim() || isLoading}
                          className="w-full bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2"
                        >
                          <Send size={20} />
                          {isLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Need immediate assistance?</h4>
                    <p className="text-sm text-blue-700 mt-1">For safety emergencies, please call the EOC hotline at <span className="font-mono font-bold">555-0199</span> immediately.</p>
                </div>
            </div>
       </div>

       {/* Right Column: History */}
       <div className="md:col-span-1">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <History size={20} className="text-slate-400" /> My Recent Requests
            </h3>
            <div className="space-y-4">
                {requests.map(req => (
                    <div 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-slate-400">{req.id}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                              req.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                                {req.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-1">{req.desc}</p>
                        <p className="text-xs text-slate-500 mb-2">📍 {req.location} • Priority: {req.priority}</p>
                        {req.assignedTo && (
                          <div className="flex items-center gap-1 text-xs text-brand-600 mb-2">
                            <UserCheck size={12} />
                            <span>{req.assignedTo}</span>
                          </div>
                        )}
                        {req.imageIds.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                            <ImageIcon size={12} />
                            <span>{req.imageIds.length} image(s)</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-50">
                            {req.status === 'Completed' ? <CheckCircle size={14} className="text-green-500" /> : <Clock size={14} className="text-blue-500" />}
                            <span>{req.date}</span>
                        </div>
                    </div>
                ))}
                
                <button className="w-full py-2 text-sm text-slate-500 hover:text-brand-600 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all">
                    View All History
                </button>
            </div>
       </div>

       {/* Request Detail Modal */}
       {selectedRequest && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto animate-fade-in">
             <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-10">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-lg font-bold text-slate-800">{selectedRequest.id}</h3>
                   <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                     selectedRequest.status === 'Completed' ? 'bg-green-100 text-green-700' : 
                     selectedRequest.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 
                     'bg-yellow-100 text-yellow-700'
                   }`}>
                     {selectedRequest.status}
                   </span>
                 </div>
                 <p className="text-sm text-slate-500">{selectedRequest.date}</p>
               </div>
               <button 
                 onClick={() => setSelectedRequest(null)} 
                 title="Close dialog"
                 aria-label="Close dialog"
                 className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
             
             <div className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Location</label>
                 <p className="text-slate-800">{selectedRequest.location}</p>
               </div>
               
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Priority</label>
                 <span className={`text-xs font-bold px-2 py-1 rounded ${
                   selectedRequest.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                   selectedRequest.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                   selectedRequest.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                   'bg-slate-100 text-slate-700'
                 }`}>
                   {selectedRequest.priority}
                 </span>
               </div>
               
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                 <p className="text-slate-800 bg-slate-50 p-3 rounded-lg">{selectedRequest.desc}</p>
               </div>

               {selectedRequest.assignedTo && (
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Assigned To</label>
                   <div className="flex items-center gap-2">
                     <UserCheck size={16} className="text-brand-500" />
                     <span className="text-slate-800 font-medium">{selectedRequest.assignedTo}</span>
                   </div>
                 </div>
               )}
               
               {selectedRequestImages.length > 0 && (
                 <div>
                   <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Attached Images</label>
                   <div className="grid grid-cols-2 gap-3">
                     {selectedRequestImages.map((imgUrl, idx) => (
                       <img 
                         key={idx} 
                         src={imgUrl} 
                         alt={`Attachment ${idx + 1}`} 
                         className="w-full h-32 object-cover rounded-lg border border-slate-200"
                       />
                     ))}
                   </div>
                 </div>
               )}
             </div>

             <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
               <button 
                 onClick={() => setSelectedRequest(null)}
                 className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium rounded-lg transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default WorkRequestPortal;