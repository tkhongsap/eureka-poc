import React from 'react';
import { WorkOrder, Status, Priority } from '../types';
import { Clock, CheckCircle, AlertCircle, XCircle, Package, Calendar } from 'lucide-react';

interface RequestorWorkOrdersProps {
  workOrders: WorkOrder[];
  requestorName: string;
}

const statusConfig = {
  [Status.OPEN]: {
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: AlertCircle,
    iconColor: 'text-teal-500'
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
  }
};

const priorityColors = {
  [Priority.CRITICAL]: 'text-red-700 bg-red-50 border-red-100',
  [Priority.HIGH]: 'text-orange-700 bg-orange-50 border-orange-100',
  [Priority.MEDIUM]: 'text-teal-700 bg-teal-50 border-teal-100',
  [Priority.LOW]: 'text-stone-700 bg-stone-50 border-stone-100',
};

const RequestorWorkOrders: React.FC<RequestorWorkOrdersProps> = ({ workOrders, requestorName }) => {
  // Filter work orders that have a requestId (created from requests)
  // In a real app, we'd also match by the createdBy field from the request
  const myWorkOrders = workOrders.filter(wo => wo.requestId);

  if (myWorkOrders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-8 text-center">
        <Package className="mx-auto text-stone-300 mb-3" size={48} />
        <h3 className="font-semibold text-stone-700 mb-1">No Work Orders Yet</h3>
        <p className="text-sm text-stone-500">
          Work orders created from your requests will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-stone-800 flex items-center gap-2">
          <Package size={20} className="text-stone-400" /> 
          My Work Orders
          <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full ml-1">
            {myWorkOrders.length}
          </span>
        </h3>
      </div>

      <div className="space-y-3">
        {myWorkOrders.map(wo => {
          const statusInfo = statusConfig[wo.status];
          const StatusIcon = statusInfo.icon;
          
          return (
            <div
              key={wo.id}
              className="bg-white p-4 rounded-2xl border border-stone-200/60 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
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
                  <span>Due {new Date(wo.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              {/* Request Reference */}
              {wo.requestId && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                  <span className="text-[10px] text-stone-400">
                    Created from request: <span className="font-mono">{wo.requestId}</span>
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RequestorWorkOrders;
