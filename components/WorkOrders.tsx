import React, { useState, useEffect } from 'react';
import { 
  Plus, Filter, Download, MoreHorizontal, BrainCircuit, X, AlertTriangle, CheckSquare, Clock, ArrowRight, Zap,
  LayoutGrid, List, GripVertical, Calendar, Package, Trash2, Image as ImageIcon, Upload, Save, PlusCircle
} from 'lucide-react';
import { WorkOrder, Status, Priority, User, PartUsage } from '../types';
import { analyzeMaintenanceIssue, AnalysisResult, generateSmartChecklist } from '../services/geminiService';
import { getImageUrl, uploadImage, technicianUpdateWorkOrder, TechnicianUpdateData } from '../services/apiService';

interface WorkOrdersProps {
  workOrders: WorkOrder[];
  currentUser?: User;
}

const statusColors = {
  [Status.OPEN]: 'bg-blue-100 text-blue-700 border-blue-200',
  [Status.IN_PROGRESS]: 'bg-purple-100 text-purple-700 border-purple-200',
  [Status.PENDING]: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  [Status.COMPLETED]: 'bg-green-100 text-green-700 border-green-200',
  [Status.CLOSED]: 'bg-slate-100 text-slate-700 border-slate-200',
};

const priorityColors = {
  [Priority.CRITICAL]: 'text-red-700 bg-red-50 border-red-100',
  [Priority.HIGH]: 'text-orange-700 bg-orange-50 border-orange-100',
  [Priority.MEDIUM]: 'text-blue-700 bg-blue-50 border-blue-100',
  [Priority.LOW]: 'text-slate-700 bg-slate-50 border-slate-100',
};

// Mock parts for selection
const AVAILABLE_PARTS = [
    { id: 'p1', name: 'Hydraulic Seal Kit', cost: 45.00 },
    { id: 'p2', name: 'Bearing 6204', cost: 12.50 },
    { id: 'p3', name: 'Sensor Cable (5m)', cost: 25.00 },
    { id: 'p4', name: 'Industrial Grease (1kg)', cost: 15.00 },
];

const WorkOrders: React.FC<WorkOrdersProps> = ({ workOrders: initialWorkOrders, currentUser }) => {
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [selectedWOImages, setSelectedWOImages] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [draggedWoId, setDraggedWoId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  
  // Filter for technicians
  const [showOnlyMyJobs, setShowOnlyMyJobs] = useState(false);
  
  // Technician update modal states
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [technicianImages, setTechnicianImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (selectedWO && selectedWO.imageIds && selectedWO.imageIds.length > 0) {
      const imageUrls = selectedWO.imageIds.map(id => getImageUrl(id));
      setSelectedWOImages(imageUrls);
    } else {
      setSelectedWOImages([]);
    }
    // Initialize technician fields when selecting a work order so technician can edit inline
    if (selectedWO) {
      setTechnicianNotes(selectedWO.technicianNotes || '');
      setTechnicianImages(selectedWO.technicianImages || []);
    } else {
      setTechnicianNotes('');
      setTechnicianImages([]);
    }
  }, [selectedWO]);

  const filteredWorkOrders = showOnlyMyJobs && currentUser
    ? workOrders.filter(wo => wo.assignedTo === currentUser.name)
    : workOrders;

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

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files as FileList).map((file: File) => uploadImage(file));
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
    if (!selectedWO) return;
    // allow empty notes but at least something to submit (images or notes)
    if (!technicianNotes.trim() && technicianImages.length === 0) return;

    setIsSubmitting(true);
    try {
      const updateData: TechnicianUpdateData = {
        technicianNotes: technicianNotes.trim(),
        technicianImages
      };

      const updatedWO = await technicianUpdateWorkOrder(selectedWO.id, updateData);
      setWorkOrders(prev => prev.map(wo => wo.id === updatedWO.id ? updatedWO : wo));
      // Close the slide-over (exit the details view) and show the updated card in Pending
      setShowTechnicianModal(false);
      setTechnicianNotes('');
      setTechnicianImages([]);
      setSelectedWO(null);
    } catch (error) {
      console.error('Error submitting technician update:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWoId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    
    if (id) {
        setWorkOrders(prev => prev.map(wo => 
            wo.id === id ? { ...wo, status: newStatus } : wo
        ));
    }
    setDraggedWoId(null);
  };

  const columns = [Status.OPEN, Status.IN_PROGRESS, Status.PENDING, Status.COMPLETED];

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50/50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Work Orders</h2>
          <p className="text-slate-500">
             {currentUser?.userRole === 'Technician' ? 'My Assigned Tasks' : 'Manage Maintenance Tasks'}
          </p>
        </div>
        <div className="flex items-center gap-3">
             {currentUser?.userRole !== 'Technician' && (
                <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all">
                    <Plus size={18} />
                    <span>Create Order</span>
                </button>
             )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
         <div className="flex items-center space-x-4">
             {/* View Toggles */}
             <div className="bg-slate-100 p-1 rounded-lg flex border border-slate-200">
                <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <List size={18} />
                </button>
                <button 
                    onClick={() => setViewMode('board')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <LayoutGrid size={18} />
                </button>
             </div>
             
             {/* Role Filter */}
             {currentUser?.userRole === 'Technician' && (
                 <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input 
                            type="checkbox" 
                            checked={showOnlyMyJobs} 
                            onChange={(e) => setShowOnlyMyJobs(e.target.checked)}
                            className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-gray-300" 
                        />
                        <span className="text-sm text-slate-700 font-medium">Assigned to Me</span>
                    </label>
                 </div>
             )}

                
             
             {currentUser?.userRole === 'Admin' && (
                 <button className="flex items-center space-x-2 px-3 py-1.5 hover:bg-slate-50 rounded-md text-sm text-slate-600 transition-colors">
                    <Filter size={16} />
                    <span>Filter All</span>
                </button>
             )}
          </div>
          <div className="text-sm text-slate-500 font-medium px-2">
            {filteredWorkOrders.length} Orders
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-hidden">
        
        {/* LIST VIEW */}
        {viewMode === 'list' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full flex flex-col overflow-hidden animate-fade-in">
                <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">ID</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Title</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Asset</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Priority</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Assignee</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {filteredWorkOrders.map((wo) => (
                        <tr 
                        key={wo.id} 
                        onClick={() => setSelectedWO(wo)}
                        className="hover:bg-brand-50 cursor-pointer transition-colors group"
                        >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">{wo.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-700 font-medium">
                            {wo.title}
                            <div className="text-xs text-slate-400 truncate max-w-[200px]">{wo.description}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{wo.assetName}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded border text-xs font-semibold ${priorityColors[wo.priority]}`}>
                            {wo.priority}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded border text-xs font-semibold ${statusColors[wo.status]}`}>
                            {wo.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
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
        )}

        {/* BOARD VIEW */}
        {viewMode === 'board' && (
            <div className="h-full overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {columns.map(status => {
                        const columnWos = filteredWorkOrders.filter(wo => wo.status === status);
                        return (
                            <div 
                                key={status}
                                className="flex-1 min-w-[280px] bg-slate-100/70 rounded-xl flex flex-col max-h-full border border-slate-200/60"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, status)}
                            >
                                {/* Column Header */}
                                <div className="p-4 flex items-center justify-between sticky top-0 bg-slate-100/70 backdrop-blur-sm z-10 rounded-t-xl">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${statusColors[status].split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                        <h3 className="font-semibold text-slate-700 text-sm">{status}</h3>
                                        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{columnWos.length}</span>
                                    </div>
                                </div>

                                {/* Cards Area */}
                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {columnWos.map(wo => (
                                        <div
                                            key={wo.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, wo.id)}
                                            onClick={() => setSelectedWO(wo)}
                                            className={`bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group relative animate-fade-in
                                                ${draggedWoId === wo.id ? 'opacity-50 border-dashed border-slate-400' : ''}
                                                ${currentUser?.name === wo.assignedTo ? 'border-l-4 border-l-brand-500' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-mono text-slate-400">{wo.id}</span>
                                                <button 
                                                    title="Drag to reorder"
                                                    aria-label="Drag to reorder"
                                                    className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <GripVertical size={14} />
                                                </button>
                                            </div>
                                            
                                            <h4 className="font-medium text-slate-800 text-sm mb-3 leading-snug">{wo.title}</h4>
                                            
                                            <div className="flex items-center gap-2 mb-3">
                                                 <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold tracking-wider ${priorityColors[wo.priority]}`}>
                                                    {wo.priority}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-3">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                     <div className={`w-5 h-5 rounded-full border border-slate-200 flex items-center justify-center text-[10px] font-bold ${wo.assignedTo === currentUser?.name ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-slate-100 text-slate-600'}`}>
                                                        {wo.assignedTo?.charAt(0) || '?'}
                                                     </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                                    <Calendar size={12} />
                                                    <span>{new Date(wo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {columnWos.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-xs italic">
                                            No orders
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {/* Slide-over Detail Panel */}
      {selectedWO && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedWO(null)}></div>
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col animate-slide-in-right">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <h2 className="text-xl font-bold text-slate-800">{selectedWO.id}: {selectedWO.title}</h2>
                   <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusColors[selectedWO.status]}`}>{selectedWO.status}</span>
                </div>
                <p className="text-slate-500 text-sm">Created on {selectedWO.createdAt} • Due {selectedWO.dueDate}</p>
              </div>
              <button 
                onClick={() => setSelectedWO(null)} 
                title="Close panel"
                aria-label="Close panel"
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Description</h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {selectedWO.description}
                </p>
              </div>

              {/* Technician Inline Update (visible to assigned Technician) */}
              {currentUser?.userRole === 'Technician' && selectedWO?.assignedTo === currentUser.name && selectedWO?.status !== Status.PENDING && selectedWO?.status !== Status.COMPLETED && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ImageIcon size={16} /> Technician Update
                  </h3>

                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                    <textarea value={technicianNotes} onChange={(e) => setTechnicianNotes(e.target.value)} rows={4} className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Add Images</label>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                        <Upload size={16} />
                        <span>{isUploading ? 'Uploading...' : 'Select images'}</span>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                      </label>
                      {isUploading && <span className="text-sm text-slate-500">Uploading...</span>}
                      <button onClick={() => { setTechnicianImages([]); }} className="text-sm text-slate-500 hover:text-slate-700">Clear</button>
                    </div>

                    {technicianImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-3">
                        {technicianImages.map((id, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200">
                            <img src={getImageUrl(id)} alt={`tech-img-${idx}`} className="w-full h-28 object-cover" />
                            <button onClick={() => removeTechnicianImage(idx)} className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attached Images */}
              {selectedWOImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ImageIcon size={16} /> Attached Images ({selectedWOImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedWOImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-slate-200 hover:border-brand-400 transition-all duration-200"
                        onClick={() => setFullscreenImage(imgUrl)}
                      >
                        <img 
                          src={imgUrl} 
                          alt={`Attachment ${idx + 1}`} 
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
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <BrainCircuit size={120} className="text-indigo-600" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <BrainCircuit className="text-indigo-600" size={24} />
                    <h3 className="text-lg font-bold text-indigo-900">Eureka AI Assistant</h3>
                  </div>
                  
                  {!analysis ? (
                    <div>
                      <p className="text-indigo-700 mb-4 text-sm">
                        Use Gemini 2.5 AI to analyze the failure description, predict root causes, and generate a safety checklist.
                      </p>
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-md shadow-indigo-200 flex items-center gap-2 disabled:opacity-70"
                      >
                        {isAnalyzing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={18} />
                            <span>Analyze Issue</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fade-in">
                      {/* Analysis Results */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/80 p-4 rounded-lg border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-1">
                               <AlertTriangle size={14} /> Potential Root Causes
                            </h4>
                            <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                              {analysis.rootCauses.map((cause, idx) => <li key={idx}>{cause}</li>)}
                            </ul>
                         </div>
                         <div className="bg-white/80 p-4 rounded-lg border border-indigo-100">
                            <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-1">
                               <Clock size={14} /> Est. Repair Time
                            </h4>
                            <div className="text-2xl font-bold text-slate-800">{analysis.estimatedTimeHours} Hours</div>
                            <p className="text-xs text-slate-500 mt-1">Based on historical data for {selectedWO.assetName}</p>
                         </div>
                      </div>

                      <div className="bg-white/80 p-4 rounded-lg border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2 flex items-center gap-1">
                            <CheckSquare size={14} /> Recommended Actions
                        </h4>
                        <div className="space-y-2">
                           {analysis.recommendedActions.map((action, idx) => (
                             <div key={idx} className="flex items-start gap-3 p-2 hover:bg-indigo-50 rounded transition-colors">
                               <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-xs text-indigo-600 font-bold">{idx + 1}</div>
                               <span className="text-sm text-slate-700">{action}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                      
                      <button onClick={handleAnalyze} className="text-xs text-indigo-600 hover:text-indigo-800 underline">
                        Re-analyze
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Spare Parts Usage Section */}
              <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Package size={16} /> Spare Parts & Materials
                  </h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      {/* List Used Parts */}
                      {(selectedWO.partsUsed && selectedWO.partsUsed.length > 0) ? (
                          <div className="space-y-2 mb-4">
                              {selectedWO.partsUsed.map((part, idx) => (
                                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                                      <div>
                                          <div className="font-medium text-sm text-slate-800">{part.name}</div>
                                          <div className="text-xs text-slate-500">Qty: {part.quantity} • ${part.cost}/unit</div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <span className="font-bold text-slate-700">${part.cost * part.quantity}</span>
                                          <button 
                                            onClick={() => removePartFromWo(idx)}
                                            title="Remove part"
                                            aria-label="Remove part"
                                            className="text-red-400 hover:text-red-600 p-1"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              <div className="flex justify-between items-center pt-2 border-t border-slate-200 px-2">
                                  <span className="text-sm font-medium text-slate-600">Total Cost</span>
                                  <span className="text-lg font-bold text-slate-900">
                                      ${selectedWO.partsUsed.reduce((acc, p) => acc + (p.cost * p.quantity), 0).toFixed(2)}
                                  </span>
                              </div>
                          </div>
                      ) : (
                          <div className="text-center py-4 text-slate-400 text-sm mb-4">No parts consumed yet</div>
                      )}

                      {/* Add Part Dropdown */}
                      <div className="flex gap-2">
                          <select 
                            title="Add part from inventory"
                            aria-label="Add part from inventory"
                            className="flex-1 text-sm border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                            onChange={(e) => {
                                addPartToWo(e.target.value);
                                e.target.value = ''; // Reset
                            }}
                          >
                              <option value="">+ Add Part from Inventory...</option>
                              {AVAILABLE_PARTS.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} (${p.cost})</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* Checklist Section */}
              {checklist.length > 0 && (
                 <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <CheckSquare size={16} /> Maintenance Checklist
                    </h3>
                    <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {checklist.map((item, idx) => (
                          <label key={idx} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                            <span className="text-sm text-slate-700">{item}</span>
                          </label>
                        ))}
                    </div>
                 </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-20">
               <button 
                 onClick={() => setSelectedWO(null)}
                 className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50"
               >
                 Close
               </button>
               {(() => {
                 // Technicians should not see Save & Update when the WO is Pending or Completed
                 if (currentUser?.userRole === 'Technician') {
                   if (selectedWO?.assignedTo === currentUser.name && selectedWO?.status !== Status.PENDING && selectedWO?.status !== Status.COMPLETED) {
                     return (
                       <button onClick={submitTechnicianUpdate} disabled={isSubmitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2">
                         <span>{isSubmitting ? 'Saving...' : 'Save & Update'}</span>
                         <ArrowRight size={16} />
                       </button>
                     );
                   }
                   // otherwise show nothing for technicians
                   return null;
                 }

                 // Non-technician users still see the Save & Update button
                 return (
                   <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 shadow-sm flex items-center gap-2">
                     <span>Save & Update</span>
                     <ArrowRight size={16} />
                   </button>
                 );
               })()}
            </div>

          </div>
        </div>
      )}
      {/* Technician Update Modal */}
      {showTechnicianModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowTechnicianModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg overflow-auto p-6 z-20">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Update Work Order — Technician</h3>
              <button onClick={() => setShowTechnicianModal(false)} className="p-2 rounded-full text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea value={technicianNotes} onChange={(e) => setTechnicianNotes(e.target.value)} rows={5} className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-brand-500" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Add Images</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                    <Upload size={16} />
                    <span>{isUploading ? 'Uploading...' : 'Select images'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                  {isUploading && <span className="text-sm text-slate-500">Uploading...</span>}
                </div>

                {technicianImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    {technicianImages.map((id, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-200">
                        <img src={getImageUrl(id)} alt={`img-${idx}`} className="w-full h-28 object-cover" />
                        <button onClick={() => removeTechnicianImage(idx)} className="absolute top-2 right-2 bg-black/40 text-white rounded-full p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowTechnicianModal(false)} className="px-4 py-2 bg-white border rounded-lg text-sm">Cancel</button>
              <button onClick={submitTechnicianUpdate} disabled={isSubmitting} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm flex items-center gap-2">
                {isSubmitting ? 'Saving...' : 'Save & Update'}
                <Save size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all z-10"
            title="Close"
            aria-label="Close image"
          >
            <X size={28} />
          </button>
          <img
            src={fullscreenImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
            Click outside to close
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrders;