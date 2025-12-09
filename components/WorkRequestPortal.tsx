import React, { useState, useRef, useEffect } from 'react';
import { Camera, Send, MapPin, AlertCircle, History, Clock, CheckCircle, X, Image as ImageIcon, UserCheck, Navigation, Calendar } from 'lucide-react';
import DateInput from './DateInput';
import { useLanguage } from '../lib/i18n';

// Helper function to format date as DD/MM/YYYY
const formatDateDDMMYYYY = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
import { 
  uploadImage, 
  createRequest, 
  listRequests, 
  getImageDataUrl,
  RequestItem as ApiRequestItem,
  ImageInfo,
  createNotification,
  LocationData,
  getUsersByRole
} from '../services/apiService';
import { User, UserRole, WorkOrder } from '../types';
import RequestorWorkOrders from './RequestorWorkOrders';
import { createWOCreatedNotifications } from '../services/notificationService';
import LocationPicker, { LocationDisplay, InlineLocationPicker } from './LocationPicker';

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
  locationData?: LocationData;
  preferredDate?: string; // Preferred date for maintenance visit
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
    locationData?: LocationData;
  }) => void;
  currentUser?: User;
  technicians?: { id: string; name: string }[];
  workOrders?: WorkOrder[];
}

const INITIAL_HISTORY: RequestItem[] = [
    { id: 'REQ-998', location: 'Station 4', priority: 'Medium', desc: 'Leaking pipe near station 4', status: 'In Progress', date: 'Oct 23, 2024', imageIds: [] },
    { id: 'REQ-999', location: 'Break Room', priority: 'Low', desc: 'Light flickering in break room', status: 'Completed', date: 'Oct 21, 2024', imageIds: [] },
];

const WorkRequestPortal: React.FC<WorkRequestPortalProps> = ({ 
  onSubmitRequest, 
  currentUser, 
  technicians = [], 
  workOrders = [] 
}) => {
  const { t } = useLanguage();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState('Low - Cosmetic issue');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [preferredDate, setPreferredDate] = useState<string>(''); // Preferred maintenance date
  const [tempImages, setTempImages] = useState<TempImage[]>([]); // Temporary images before submit
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [selectedRequestImages, setSelectedRequestImages] = useState<string[]>([]); // Image URLs
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Location picker state
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  // Check if current user can assign technicians
  const canAssign = currentUser?.userRole === 'Admin' || currentUser?.userRole === 'Technician' || currentUser?.userRole === 'Head Technician';
  const isRequester = currentUser?.userRole === 'Requester';
  const canSetPreferredDate = currentUser?.userRole === 'Admin' || currentUser?.userRole === 'Head Technician';

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
            date: formatDateDDMMYYYY(r.createdAt),
            imageIds: r.imageIds,
            assignedTo: r.assignedTo,
            createdBy: r.createdBy,
            locationData: r.locationData,
            preferredDate: r.preferredDate,
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
    const loadImages = async () => {
      if (selectedRequest && selectedRequest.imageIds.length > 0) {
        const imageUrls = await Promise.all(selectedRequest.imageIds.map(id => getImageDataUrl(id)));
        setSelectedRequestImages(imageUrls);
      } else {
        setSelectedRequestImages([]);
      }
    };
    loadImages();
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

  // Listen for openWorkOrder event from notification click
  useEffect(() => {
    const handleOpenWorkOrder = (event: CustomEvent<string>) => {
      const workOrderId = event.detail;
      // Find the request that matches this work order ID
      const matchingRequest = requests.find(r => r.id === workOrderId);
      if (matchingRequest) {
        setSelectedRequest(matchingRequest);
      }
    };

    // Also check sessionStorage on mount
    const storedWoId = sessionStorage.getItem('openWorkOrderId');
    if (storedWoId) {
      sessionStorage.removeItem('openWorkOrderId');
      const matchingRequest = requests.find(r => r.id === storedWoId);
      if (matchingRequest) {
        setSelectedRequest(matchingRequest);
      }
    }

    window.addEventListener('openWorkOrder', handleOpenWorkOrder as EventListener);
    return () => {
      window.removeEventListener('openWorkOrder', handleOpenWorkOrder as EventListener);
    };
  }, [requests]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const maxImages = 10;
      const maxVideoSize = 10 * 1024 * 1024; // 10 MB in bytes
      const maxImageSize = 5 * 1024 * 1024; // 5 MB for images
      
      // Check if adding these files would exceed the limit
      if (tempImages.length + files.length > maxImages) {
        alert(`You can only upload a maximum of ${maxImages} images/videos. Currently you have ${tempImages.length} files.`);
        return;
      }
      
      // Validate each file
      const fileArray = Array.from(files) as File[];
      for (const file of fileArray) {
        // Check video file size
        if (file.type.startsWith('video/') && file.size > maxVideoSize) {
          alert(`Video "${file.name}" is too large. Maximum video size is 10 MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
          continue;
        }
        
        // Check image file size
        if (file.type.startsWith('image/') && file.size > maxImageSize) {
          // Try to compress image for mobile
          compressImage(file).then(compressedFile => {
            const preview = URL.createObjectURL(compressedFile);
            setTempImages(prev => {
              if (prev.length >= maxImages) return prev;
              return [...prev, { file: compressedFile, preview, name: file.name }];
            });
          }).catch(() => {
            alert(`Image "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Please use a smaller image.`);
          });
          continue;
        }
        
        const preview = URL.createObjectURL(file);
        setTempImages(prev => {
          // Double check we don't exceed the limit
          if (prev.length >= maxImages) {
            alert(`Maximum ${maxImages} files allowed.`);
            return prev;
          }
          return [...prev, { 
            file: file,
            preview: preview, 
            name: file.name 
          }];
        });
      }
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };

  // Compress image for mobile uploads
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
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
        try {
          const uploadedImage = await uploadImage(img.file);
          savedImageIds.push(uploadedImage.id);
        } catch (uploadError) {
          console.error('Failed to upload image:', img.name, uploadError);
          // Continue with other images instead of failing completely
        }
      }

      const priorityValue = priority.split(' - ')[0];
      
      // Determine assignedTo value
      const assignedToValue = canAssign ? (assignedTo || undefined) : undefined;

      // Create request via API with location data and preferred date
      const createdRequest = await createRequest({
        location: location,
        priority: priorityValue,
        description: description,
        imageIds: savedImageIds,
        assignedTo: assignedToValue,
        locationData: selectedLocation || undefined,
        preferredDate: canSetPreferredDate ? (preferredDate || undefined) : undefined,
      });

      const now = new Date();

      // Create new request item for UI
      const newRequest: RequestItem = {
        id: createdRequest.id,
        location: createdRequest.location,
        priority: createdRequest.priority,
        desc: createdRequest.description,
        status: createdRequest.status,
        date: formatDateDDMMYYYY(now.toISOString()),
        imageIds: createdRequest.imageIds,
        assignedTo: createdRequest.assignedTo,
        locationData: createdRequest.locationData,
        preferredDate: createdRequest.preferredDate,
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
          locationData: createdRequest.locationData,
          preferredDate: createdRequest.preferredDate,
        });
      }

      // Create notifications for all Admins (WO_CREATED)
      if (currentUser) {
        try {
          // Fetch all admins from API
          const admins = await getUsersByRole('Admin');
          const adminNames = admins.map(a => a.name);
          
          if (adminNames.length > 0) {
            const notifications = createWOCreatedNotifications(
              createdRequest.id,
              createdRequest.location, // Using location as title
              currentUser.name,
              adminNames
            );
            
            // Send notifications to all admins
            for (const notification of notifications) {
              await createNotification(notification);
            }
          }
        } catch (error) {
          console.error('Failed to create notifications for admins:', error);
        }
      }

      // Update UI
      setRequests(prev => [newRequest, ...prev]);
      setLocation('');
      setPriority('Low - Cosmetic issue');
      setDescription('');
      setSelectedLocation(null); // Reset location
      setPreferredDate(''); // Reset preferred date
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
    <div className="max-w-6xl mx-auto p-8 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">

       {/* Success Toast Notification */}
       {showSuccessToast && (
         <div className="fixed bottom-8 right-8 z-50">
           <div className="bg-emerald-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
             <CheckCircle size={24} className="flex-shrink-0" />
             <div>
               <p className="font-semibold">{t('request.submitted')}</p>
               <p className="text-sm text-emerald-50">{t('request.beingProcessed')}</p>
             </div>
           </div>
         </div>
       )}

       {/* Left Column: Form */}
       <div className="md:col-span-2 space-y-8">
            <div className="mb-6">
                <h2 className="font-serif text-3xl text-stone-900">{t('request.title')}</h2>
                <p className="text-stone-500 mt-2">{t('request.subtitle')}</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-stone-200/60">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">{t('request.location')}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder={t('request.locationPlaceholder')}
                              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                            />
                        </div>
                        </div>
                        <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">{t('request.priority')}</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          title={t('request.selectPriority')}
                          aria-label={t('request.priority')}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                        >
                            <option>{t('request.priorityLow')}</option>
                            <option>{t('request.priorityMedium')}</option>
                            <option>{t('request.priorityHigh')}</option>
                            <option>{t('request.priorityCritical')}</option>
                        </select>
                        </div>
                    </div>

                    {/* Preferred Maintenance Date - Only Admin or Head Technician */}
                    {canSetPreferredDate && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          📅 {t('request.preferredDate')} <span className="text-stone-400 font-normal">({t('common.optional')})</span>
                        </label>
                        <DateInput
                          value={preferredDate}
                          onChange={(value) => setPreferredDate(value)}
                          min={new Date().toISOString().split('T')[0]}
                          title={t('request.preferredDate')}
                          className="bg-stone-50"
                          size="lg"
                        />
                        <p className="text-xs text-stone-400 mt-1">{t('request.preferredDateHint')}</p>
                      </div>
                    )}

                    {/* GPS Location Picker - Inline Map */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        📍 {t('request.gpsLocation')} <span className="text-stone-400 font-normal">({t('common.optional')} - {t('gps.clickMapToPin')})</span>
                      </label>
                      <InlineLocationPicker
                        selectedLocation={selectedLocation}
                        onLocationSelect={setSelectedLocation}
                      />
                    </div>

                    {/* Assign Technician - Only visible for Admin and Technician */}
                    {canAssign && (
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          {t('request.assignTechnician')}
                          {currentUser?.userRole === 'Technician' && (
                            <span className="text-xs text-stone-400 ml-2">({t('request.autoAssignedToYou')})</span>
                          )}
                        </label>
                        <div className="relative">
                          <UserCheck className="absolute left-3.5 top-3.5 text-stone-400" size={18} />
                          {(currentUser?.userRole === 'Admin' || currentUser?.userRole === 'Head Technician') ? (
                            <select
                              value={assignedTo}
                              onChange={(e) => setAssignedTo(e.target.value)}
                              title={t('request.assignTechnician')}
                              aria-label={t('request.assignTechnician')}
                              className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200"
                            >
                              <option value="">-- {t('request.selectTechnician')} --</option>
                              {technicians.map(tech => (
                                <option key={tech.id} value={tech.name}>{tech.name}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={assignedTo}
                              readOnly
                              title={t('request.assignedTo')}
                              aria-label={t('request.assignedTo')}
                              className="w-full pl-10 pr-4 py-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-600 cursor-not-allowed"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">{t('request.issueDescription')}</label>
                        <textarea
                          rows={4}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder={t('request.descriptionPlaceholder')}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-stone-700 mb-2">{t('request.photosVideos')}</span>
                        <input
                          type="file"
                          id="file-upload-input"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*,video/*"
                          multiple
                          title={t('request.uploadPhotos')}
                          aria-label={t('request.uploadPhotos')}
                          className="sr-only"
                        />
                        {/* Combined Dropzone + Preview Area */}
                        {tempImages.length === 0 ? (
                          <label
                            htmlFor="file-upload-input"
                            className="relative block border-2 border-dashed border-stone-300 rounded-2xl p-4 md:p-6 transition-colors duration-200 cursor-pointer hover:bg-stone-50 active:bg-stone-100 text-center group touch-manipulation"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                          >
                              <div className="w-12 h-12 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-50 group-hover:text-teal-500 transition-colors duration-200">
                                <Camera size={24} />
                              </div>
                              <p className="text-sm text-stone-600 font-medium">{t('request.uploadPrompt')}</p>
                              <p className="text-xs text-stone-400 mt-1">{t('request.uploadHint')}</p>
                          </label>
                        ) : (
                        <div
                          className="relative border-2 border-dashed border-stone-300 rounded-2xl p-4 md:p-6 transition-colors duration-200 cursor-default"
                          aria-label="Uploaded files area"
                        >
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-auto pr-2">
                                {tempImages.map((img, idx) => (
                                  <div key={idx} className="relative group">
                                    <img
                                      src={img.preview}
                                      alt={`Upload ${idx + 1}`}
                                      className="w-full h-24 object-cover rounded-xl border border-stone-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(idx)}
                                      title={t('request.removeImage')}
                                      aria-label={t('request.removeImage')}
                                      className="absolute top-1 right-1 z-10 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md ring-2 ring-white"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                        </div>
                        )}
                          {tempImages.length > 0 && (
                            <div className="flex justify-end mt-2">
                              <label
                                htmlFor="file-upload-input"
                                className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-sm font-medium rounded-lg shadow-sm cursor-pointer touch-manipulation"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                              >
                                <Camera size={16} />
                                {t('request.addMore')}
                              </label>
                            </div>
                          )}
                    </div>

                    <div className="pt-4">
                        <button
                          type="submit"
                          disabled={!location.trim() || !description.trim() || isLoading}
                          className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-teal-600/25 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <Send size={20} />
                          {isLoading ? t('request.submitting') : t('request.submitButton')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-teal-600 mt-0.5" size={20} />
                <div>
                    <h4 className="font-semibold text-teal-900 text-sm">{t('request.emergencyTitle')}</h4>
                    <p className="text-sm text-teal-700 mt-1">{t('request.emergencyHint')} <span className="font-mono font-bold">555-0199</span></p>
                </div>
            </div>

            {/* Work Orders Section - Show work orders created from requests */}
            {currentUser && workOrders.length > 0 && (
              <div>
                <h3 className="font-serif text-2xl text-stone-900 mb-4">{t('request.myWorkOrders')}</h3>
                <RequestorWorkOrders 
                  workOrders={workOrders} 
                  requestorName={currentUser.name}
                />
              </div>
            )}
       </div>

       {/* Right Column: History */}
       <div className="md:col-span-1">
            <h3 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <History size={20} className="text-stone-400" /> {t('request.myHistory')}
            </h3>
            <div className="space-y-4">
                {requests.map(req => (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-mono text-stone-400">{req.id}</span>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              req.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                              req.status === 'In Progress' ? 'bg-teal-50 text-teal-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                                {req.status}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-stone-800 mb-1">{req.desc}</p>
                        <p className="text-xs text-stone-500 mb-2">📍 {req.location} • {t('workOrders.priority')}: {req.priority}</p>
                        {req.preferredDate && canSetPreferredDate && (
                          <div className="flex items-center gap-1 text-xs text-violet-600 mb-2">
                            <Calendar size={12} />
                            <span>{t('workOrders.appointment')}: {formatDateDDMMYYYY(req.preferredDate)}</span>
                          </div>
                        )}
                        {req.assignedTo && (
                          <div className="flex items-center gap-1 text-xs text-teal-600 mb-2">
                            <UserCheck size={12} />
                            <span>{req.assignedTo}</span>
                          </div>
                        )}
                        {req.locationData && (
                          <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                            <Navigation size={12} className="text-teal-500" />
                            <a
                              href={req.locationData.googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="hover:text-teal-600 hover:underline truncate max-w-[180px]"
                              title={req.locationData.address}
                            >
                              {t('request.gpsLocation')}
                            </a>
                          </div>
                        )}
                        {req.imageIds.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-stone-400 mb-2">
                            <ImageIcon size={12} />
                            <span>{req.imageIds.length} {t('request.images')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-stone-500 pt-2 border-t border-stone-100">
                            {req.status === 'Completed' ? <CheckCircle size={14} className="text-emerald-500" /> : <Clock size={14} className="text-teal-500" />}
                            <span>{req.date}</span>
                        </div>
                    </div>
                ))}

                <button className="w-full py-2.5 text-sm text-stone-500 hover:text-teal-600 hover:bg-stone-50 rounded-xl border border-transparent hover:border-stone-200 transition-all duration-200">
                    {t('request.viewHistory')}
                </button>
            </div>
       </div>

       {/* Request Detail Modal */}
       {selectedRequest && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedRequest(null)}></div>
           <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
             <div className="p-6 border-b border-stone-100 flex justify-between items-start sticky top-0 bg-white z-10 rounded-t-2xl">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-serif text-lg text-stone-900">{selectedRequest.id}</h3>
                   <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                     selectedRequest.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                     selectedRequest.status === 'In Progress' ? 'bg-teal-50 text-teal-700' :
                     'bg-amber-50 text-amber-700'
                   }`}>
                     {selectedRequest.status}
                   </span>
                 </div>
                 <p className="text-sm text-stone-500">{selectedRequest.date}</p>
               </div>
               <button
                 onClick={() => setSelectedRequest(null)}
                 title={t('common.close')}
                 aria-label={t('common.close')}
                 className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors duration-200"
               >
                 <X size={20} />
               </button>
             </div>

             <div className="p-6 space-y-4">
               <div>
                 <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{t('workOrders.location')}</label>
                 <p className="text-stone-800">{selectedRequest.location}</p>
               </div>

               <div>
                 <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{t('workOrders.priority')}</label>
                 <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                   selectedRequest.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                   selectedRequest.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                   selectedRequest.priority === 'Medium' ? 'bg-teal-50 text-teal-700' :
                   'bg-stone-100 text-stone-700'
                 }`}>
                   {selectedRequest.priority}
                 </span>
               </div>

               {/* Preferred Maintenance Date - Only Admin or Head Technician */}
               {selectedRequest.preferredDate && canSetPreferredDate && (
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">📅 {t('request.preferredDate')}</label>
                   <div className="flex items-center gap-2 bg-violet-50 p-3 rounded-xl border border-violet-100">
                     <Calendar size={18} className="text-violet-500" />
                     <span className="text-violet-800 font-medium">
                       {formatDateDDMMYYYY(selectedRequest.preferredDate)}
                     </span>
                   </div>
                 </div>
               )}

               <div>
                 <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{t('request.description')}</label>
                 <p className="text-stone-800 bg-stone-50 p-4 rounded-xl">{selectedRequest.desc}</p>
               </div>

               {selectedRequest.assignedTo && (
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase mb-1 block">{t('request.assignedTo')}</label>
                   <div className="flex items-center gap-2">
                     <UserCheck size={16} className="text-teal-500" />
                     <span className="text-stone-800 font-medium">{selectedRequest.assignedTo}</span>
                   </div>
                 </div>
               )}

               {/* GPS Location with Navigate Button */}
               {selectedRequest.locationData && (
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">📍 {t('request.gpsLocation')}</label>
                   <div className="bg-stone-50 p-4 rounded-xl border border-stone-200">
                     <div className="flex items-start gap-3">
                       <div className="p-2 bg-teal-100 text-teal-600 rounded-lg flex-shrink-0">
                         <MapPin size={18} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm text-stone-800 mb-1">{selectedRequest.locationData.address}</p>
                         <p className="text-xs text-stone-400 font-mono">
                           {selectedRequest.locationData.latitude.toFixed(6)}, {selectedRequest.locationData.longitude.toFixed(6)}
                         </p>
                       </div>
                       <a
                         href={`https://www.google.com/maps/dir/?api=1&destination=${selectedRequest.locationData.latitude},${selectedRequest.locationData.longitude}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                         title={t('gps.navigate')}
                       >
                         <Navigation size={16} />
                         {t('gps.navigate')}
                       </a>
                     </div>
                   </div>
                 </div>
               )}

               {selectedRequestImages.length > 0 && (
                 <div>
                   <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">{t('request.attachedImages')}</label>
                   <div className="grid grid-cols-2 gap-3">
                     {selectedRequestImages.map((imgUrl, idx) => (
                       <img
                         key={idx}
                         src={imgUrl}
                         alt={`Attachment ${idx + 1}`}
                         className="w-full h-32 object-cover rounded-xl border border-stone-200"
                       />
                     ))}
                   </div>
                 </div>
               )}
             </div>

             <div className="p-4 border-t border-stone-100 bg-stone-50 rounded-b-2xl">
               <button
                 onClick={() => setSelectedRequest(null)}
                 className="w-full py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-medium rounded-xl transition-colors duration-200"
               >
                 {t('common.close')}
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  );
};

export default WorkRequestPortal;