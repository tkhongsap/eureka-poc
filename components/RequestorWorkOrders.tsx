import React, { useState, useEffect } from 'react';
import { WorkOrder, Status, Priority } from '../types';
import { Clock, CheckCircle, AlertCircle, XCircle, Package, Calendar, X, Image as ImageIcon, FileText, Wrench, Eye, Edit2, Save, Lock } from 'lucide-react';
import { getImageUrl, updateWorkOrder } from '../services/apiService';
import { getWorkOrderPermissions } from '../utils/workflowRules';
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

interface RequestorWorkOrdersProps {
  workOrders: WorkOrder[];
  requestorName: string;
}

const statusConfig = {
  [Status.OPEN]: {
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    icon: AlertCircle,
    iconColor: 'text-blue-500'
  },
  [Status.IN_PROGRESS]: {
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: Clock,
    iconColor: 'text-violet-500'
  },
  [Status.PENDING]: {
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
    iconColor: 'text-amber-500'
  },
  [Status.COMPLETED]: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-500'
  },
  [Status.CLOSED]: {
    color: 'bg-stone-100 text-stone-700 border-stone-200',
    icon: XCircle,
    iconColor: 'text-stone-500'
  },
  [Status.CANCELED]: {
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
    iconColor: 'text-rose-500'
  }
};

const priorityColors = {
  [Priority.CRITICAL]: 'text-red-700 bg-red-50 border-red-100',
  [Priority.HIGH]: 'text-orange-700 bg-orange-50 border-orange-100',
  [Priority.MEDIUM]: 'text-teal-700 bg-teal-50 border-teal-100',
  [Priority.LOW]: 'text-stone-700 bg-stone-50 border-stone-100',
};

const RequestorWorkOrders: React.FC<RequestorWorkOrdersProps> = ({ workOrders, requestorName }) => {
  const { t } = useLanguage();
  const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
  const [selectedWOImages, setSelectedWOImages] = useState<string[]>([]);
  const [technicianImages, setTechnicianImages] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit form fields
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>(Priority.LOW);

  // Filter work orders that have a requestId (created from requests)
  // In a real app, we'd also match by the createdBy field from the request
  const myWorkOrders = workOrders.filter(wo => wo.requestId);

  // Calculate permissions for selected work order
  const permissions = selectedWO
    ? getWorkOrderPermissions(selectedWO.status, 'Requester', selectedWO.assignedTo, requestorName)
    : null;

  // Load images when selecting a work order
  useEffect(() => {
    if (selectedWO) {
      if (selectedWO.imageIds && selectedWO.imageIds.length > 0) {
        const imageUrls = selectedWO.imageIds.map(id => getImageUrl(id));
        setSelectedWOImages(imageUrls);
      } else {
        setSelectedWOImages([]);
      }

      if (selectedWO.technicianImages && selectedWO.technicianImages.length > 0) {
        const techImgUrls = selectedWO.technicianImages.map(id => getImageUrl(id));
        setTechnicianImages(techImgUrls);
      } else {
        setTechnicianImages([]);
      }

      // Initialize edit fields
      setEditDescription(selectedWO.description);
      setEditPriority(selectedWO.priority);
      setIsEditMode(false);
    } else {
      setSelectedWOImages([]);
      setTechnicianImages([]);
      setIsEditMode(false);
    }
  }, [selectedWO]);

  const handleSave = async () => {
    if (!selectedWO || !permissions?.canEdit) return;

    setIsSaving(true);
    try {
      const updatedWO = await updateWorkOrder(selectedWO.id, {
        description: editDescription,
        priority: editPriority,
      });

      // Update local state
      const updatedWorkOrder = { ...selectedWO, description: editDescription, priority: editPriority };
      setSelectedWO(updatedWorkOrder);
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Failed to update work order:', error);
      alert(error.message || 'Failed to update work order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedWO) {
      setEditDescription(selectedWO.description);
      setEditPriority(selectedWO.priority);
    }
    setIsEditMode(false);
  };

  if (myWorkOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-8 text-center">
        <Package className="mx-auto text-stone-300 mb-3" size={48} />
        <h3 className="font-semibold text-stone-700 mb-1">{t('workOrders.noOrders')}</h3>
        <p className="text-sm text-stone-500">
          {t('requestor.noWorkOrdersHint')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <Package size={20} className="text-stone-400" /> 
          {t('requestor.myWorkOrders')}
          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full ml-1">
            {myWorkOrders.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {myWorkOrders.map(wo => {
          const statusInfo = statusConfig[wo.status] || statusConfig[Status.OPEN]; // Fallback to OPEN if status not found
          const StatusIcon = statusInfo.icon;
          
          return (
            <div
              key={wo.id}
              onClick={() => setSelectedWO(wo)}
              className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group"
            >
              {/* Header with ID and Status */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono text-stone-400">{wo.id}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg border ${statusInfo.color}`}>
                    {wo.status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h4 className="font-medium text-stone-800 text-sm mb-2 leading-snug">
                {wo.title}
              </h4>

              {/* Description */}
              <p className="text-xs text-stone-500 mb-3 line-clamp-2">
                {wo.description}
              </p>

              {/* Priority and Asset */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-lg border text-[10px] uppercase font-bold tracking-wider ${priorityColors[wo.priority]}`}>
                  {wo.priority}
                </span>
                <span className="text-xs text-stone-500">
                  📍 {wo.assetName}
                </span>
              </div>

              {/* Footer: Status icon, assignee, and due date */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                <div className="flex items-center gap-2">
                  <StatusIcon size={16} className={statusInfo.iconColor} />
                  {wo.assignedTo && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg border border-stone-200 bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-600">
                        {wo.assignedTo.charAt(0)}
                      </div>
                      <span className="text-xs text-stone-600">{wo.assignedTo}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-stone-400">
                  <Calendar size={12} />
                  <span>{t('workOrders.dueDateLabel')} {formatDateShort(wo.dueDate)}</span>
                </div>
              </div>

              {/* Request Reference */}
              {wo.requestId && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400">
                    {t('requestor.createdFromRequest')}: <span className="font-mono">{wo.requestId}</span>
                  </span>
                </div>
              )}

              {/* View Details Indicator */}
              <div className="mt-2 pt-2 border-t border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-center gap-1 text-xs text-teal-600 font-medium">
                  <Eye size={14} />
                  <span>{t('requestor.clickToView')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Work Order Detail Modal */}
      {selectedWO && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedWO(null)}></div>
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col">

            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 bg-white sticky top-0 z-20 flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h2 className="font-serif text-xl text-stone-900">{selectedWO.id}: {selectedWO.title}</h2>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${statusConfig[selectedWO.status].color}`}>
                    {selectedWO.status}
                  </span>
                  {/* Permission indicator */}
                  {permissions?.canEdit ? (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <Edit2 size={12} />
                      {t('workOrders.editable')}
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold border bg-stone-100 text-stone-600 border-stone-200 flex items-center gap-1">
                      <Lock size={12} />
                      {t('workOrders.readOnly')}
                    </span>
                  )}
                </div>
                <p className="text-stone-500 text-sm">{t('workOrders.createdOn')} {formatDateDDMMYYYY(selectedWO.createdAt)} • {t('workOrders.dueDateLabel')} {formatDateDDMMYYYY(selectedWO.dueDate)}</p>
                {selectedWO.assignedTo && (
                  <p className="text-stone-600 text-sm mt-1">
                    {t('workOrders.assignee')}: <span className="font-medium">{selectedWO.assignedTo}</span>
                  </p>
                )}
                {/* Permission explanation when locked */}
                {!permissions?.canEdit && selectedWO.status !== Status.OPEN && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {t('requestor.editHint')}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedWO(null)}
                title={t('common.close')}
                aria-label={t('common.close')}
                className="p-2 hover:bg-stone-100 rounded-xl text-stone-400 hover:text-stone-600 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" /> {t('workOrders.description')}
                </h3>
                {isEditMode && permissions?.canEdit ? (
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={6}
                    className="w-full text-stone-600 leading-relaxed bg-white p-4 rounded-xl border-2 border-teal-300 focus:border-teal-500 outline-none transition-all duration-200 resize-none"
                    placeholder="Describe the issue in detail..."
                  />
                ) : (
                  <p className="text-stone-600 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
                    {selectedWO.description}
                  </p>
                )}
              </div>

              {/* Asset Information */}
              <div>
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-2">{t('workOrders.asset')} & {t('workOrders.location')}</h3>
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500">{t('workOrders.asset')}:</span>
                    <span className="text-sm font-medium text-stone-800">{selectedWO.assetName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-stone-500">{t('workOrders.location')}:</span>
                    <span className="text-sm font-medium text-stone-800">{selectedWO.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-stone-500">{t('workOrders.priority')}:</span>
                    {isEditMode && permissions?.canEdit ? (
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as Priority)}
                        title="Select priority level"
                        className="text-sm font-bold px-3 py-1.5 rounded-lg border-2 border-teal-300 focus:border-teal-500 outline-none bg-white transition-all duration-200"
                      >
                        <option value={Priority.LOW}>Low</option>
                        <option value={Priority.MEDIUM}>Medium</option>
                        <option value={Priority.HIGH}>High</option>
                        <option value={Priority.CRITICAL}>Critical</option>
                      </select>
                    ) : (
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${priorityColors[selectedWO.priority]}`}>
                        {selectedWO.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Original Request Images */}
              {selectedWOImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ImageIcon size={16} className="text-teal-600" /> {t('requestor.originalImages')} ({selectedWOImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedWOImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-stone-200 hover:border-teal-400 transition-all duration-200"
                        onClick={() => setFullscreenImage(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={`Request attachment ${idx + 1}`}
                          className="w-full h-32 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                            <Eye size={20} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Notes */}
              {selectedWO.technicianNotes && (
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-2 flex items-center gap-2">
                    <Wrench size={16} className="text-violet-600" /> {t('tech.notes')}
                  </h3>
                  <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                    <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {selectedWO.technicianNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Technician Images */}
              {technicianImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ImageIcon size={16} className="text-violet-600" /> {t('requestor.technicianImages')} ({technicianImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {technicianImages.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-violet-200 hover:border-violet-400 transition-all duration-200"
                        onClick={() => setFullscreenImage(imgUrl)}
                      >
                        <img
                          src={imgUrl}
                          alt={`Technician image ${idx + 1}`}
                          className="w-full h-32 sm:h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                          <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full p-2">
                            <Eye size={20} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parts Used */}
              {selectedWO.partsUsed && selectedWO.partsUsed.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Package size={16} className="text-teal-600" /> {t('requestor.partsUsed')}
                  </h3>
                  <div className="bg-stone-50 border border-stone-200/60 rounded-2xl overflow-hidden">
                    <div className="divide-y divide-stone-100">
                      {selectedWO.partsUsed.map((part, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white">
                          <div>
                            <div className="font-medium text-sm text-stone-800">{part.name}</div>
                            <div className="text-xs text-stone-500">Qty: {part.quantity} • ${part.cost}/unit</div>
                          </div>
                          <div className="font-bold text-stone-700">${(part.cost * part.quantity).toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center p-3 bg-stone-100 border-t border-stone-200">
                      <span className="text-sm font-medium text-stone-600">{t('requestor.totalCost')}</span>
                      <span className="text-lg font-bold text-stone-900">
                        ${selectedWO.partsUsed.reduce((acc, p) => acc + (p.cost * p.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Reference */}
              {selectedWO.requestId && (
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-teal-600 mt-0.5 flex-shrink-0" size={16} />
                    <div>
                      <h4 className="font-semibold text-teal-900 text-sm mb-1">{t('requestor.originalRequest')}</h4>
                      <p className="text-xs text-teal-700">
                        {t('requestor.originalRequestHint')}{' '}
                        <span className="font-mono font-bold">{selectedWO.requestId}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 sticky bottom-0 z-20">
              <div className="flex gap-3">
                {permissions?.canEdit && !isEditMode && (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex-1 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Edit2 size={16} />
                    {t('common.edit')}
                  </button>
                )}
                {isEditMode && permissions?.canEdit && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Save size={16} />
                      {isSaving ? t('common.loading') : t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex-1 px-5 py-2.5 bg-white border-2 border-stone-200 rounded-xl text-stone-700 text-sm font-medium hover:bg-stone-50 hover:border-stone-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('common.cancel')}
                    </button>
                  </>
                )}
                {!isEditMode && (
                  <button
                    onClick={() => setSelectedWO(null)}
                    className="flex-1 px-5 py-2.5 bg-white border-2 border-stone-200 rounded-xl text-stone-700 text-sm font-medium hover:bg-stone-50 hover:border-stone-300 transition-all duration-200"
                  >
                    {t('common.close')}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
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
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
            {t('requestor.clickOutsideToClose')}
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestorWorkOrders;
