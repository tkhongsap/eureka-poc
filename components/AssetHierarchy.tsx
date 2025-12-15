import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, ChevronUp, Activity, Zap, Plus, Edit2, Trash2, Save, X, RefreshCw, 
  AlertCircle, Clock, Gauge, Play, Square, Building2, Factory, Cog, Settings2, Settings, Search, Check
} from 'lucide-react';
import { Asset, User } from '../types';
import { analyzeAssetReliability } from '../services/geminiService';
import { useLanguage } from '../lib/i18n';
import { 
  getAssetTree, createAsset, updateAsset, deleteAsset, seedAssets,
  AssetTreeNode, AssetData,
  getDowntimes, createDowntime, updateDowntime, getDowntimeReasons, DowntimeRecord,
  getMeterReadings, createMeterReading, getMeterTypes, MeterReading, MeterType,
  getAssetStatistics, AssetStatistics
} from '../services/apiService';

// Helper function to format date
const formatDateDDMMYYYY = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('th-TH');
};

interface AssetHierarchyProps {
  currentUser: User | null;
}

// Tab type
type TabType = 'hierarchy' | 'downtime' | 'meters';

// Convert API tree node to Asset type
const treeNodeToAsset = (node: AssetTreeNode): Asset => ({
  id: node.id,
  name: node.name,
  type: node.type,
  status: node.status as 'Operational' | 'Downtime' | 'Maintenance',
  healthScore: node.healthScore,
  location: node.location,
  criticality: node.criticality as 'Critical' | 'High' | 'Medium' | 'Low',
  model: node.model,
  installDate: node.installDate,
  children: node.children?.map(treeNodeToAsset),
});

// Empty form data
const emptyAssetForm: AssetData = {
  name: '',
  type: 'Equipment',
  status: 'Operational',
  healthScore: 100,
  location: '',
  criticality: 'Medium',
  model: '',
  manufacturer: '',
  serialNumber: '',
  installDate: '',
  warrantyExpiry: '',
  description: '',
  parentId: undefined,
};

// ============ ASSET TYPE ICONS & COLORS ============
const getAssetTypeIcon = (type: string) => {
  switch (type) {
    case 'Site': return <Building2 size={16} className="text-purple-600" />;
    case 'Line': return <Factory size={16} className="text-blue-600" />;
    case 'Facility': return <Building2 size={16} className="text-teal-600" />;
    case 'Machine': return <Cog size={16} className="text-orange-600" />;
    case 'Equipment': return <Settings2 size={16} className="text-green-600" />;
    default: return <Cog size={16} className="text-slate-500" />;
  }
};

const getAssetTypeColor = (type: string) => {
  switch (type) {
    case 'Site': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'Line': return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'Facility': return 'bg-teal-100 text-teal-700 border-teal-300';
    case 'Machine': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'Equipment': return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-slate-100 text-slate-700 border-slate-300';
  }
};

// ============ ASSET TREE PICKER COMPONENT ============
interface AssetTreeOption {
  id: string;
  name: string;
  type: string;
  indent: number;
  path: string[];
  children?: AssetTreeOption[];
}

const AssetTreePicker: React.FC<{
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: AssetTreeOption[];
  excludeId?: string;
  placeholder?: string;
  t: (key: string) => string;
}> = ({ value, onChange, options, excludeId, placeholder, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Site: true, Line: true, Facility: true, Machine: true, Equipment: true });
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group options by type
  const groupedOptions: Record<string, AssetTreeOption[]> = {};
  options.forEach(opt => {
    if (opt.id === excludeId) return;
    if (!groupedOptions[opt.type]) groupedOptions[opt.type] = [];
    groupedOptions[opt.type].push(opt);
  });

  // Filter by search
  const filteredGroups: Record<string, AssetTreeOption[]> = {};
  Object.entries(groupedOptions).forEach(([type, items]) => {
    const filtered = items.filter((item: AssetTreeOption) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.path.some((p: string) => p.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    if (filtered.length > 0) filteredGroups[type] = filtered;
  });

  // Get selected option info
  const selectedOption = options.find(opt => opt.id === value);

  // Type order
  const typeOrder = ['Site', 'Line', 'Facility', 'Machine', 'Equipment'];

  return (
    <div ref={containerRef} className="relative">
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-left bg-white hover:border-slate-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors flex items-center justify-between gap-2"
      >
        {selectedOption ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {getAssetTypeIcon(selectedOption.type)}
            <span className="flex-1 truncate">{selectedOption.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${getAssetTypeColor(selectedOption.type)}`}>
              {selectedOption.type}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 flex-1">{placeholder || `-- ${t('assets.noParent')} (Root) --`}</span>
        )}
        <ChevronDown size={16} className={`text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-200 sticky top-0 bg-white">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t('assets.searchAsset')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-64">
            {/* No Parent Option */}
            <button
              type="button"
              onClick={() => { onChange(undefined); setIsOpen(false); setSearchTerm(''); }}
              className={`w-full px-3 py-2.5 text-left hover:bg-slate-50 flex items-center gap-2 border-b border-slate-100 ${!value ? 'bg-brand-50' : ''}`}
            >
              <div className="w-5 h-5 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center">
                <X size={12} className="text-slate-400" />
              </div>
              <span className="text-slate-600">-- {t('assets.noParentRoot')} --</span>
              {!value && <Check size={16} className="ml-auto text-brand-600" />}
            </button>

            {/* Grouped Options */}
            {typeOrder.map(type => {
              const items = filteredGroups[type];
              if (!items || items.length === 0) return null;
              
              const isExpanded = expandedGroups[type] !== false;
              
              return (
                <div key={type} className="border-b border-slate-100 last:border-b-0">
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }))}
                    className="w-full px-3 py-2 bg-slate-50 flex items-center gap-2 hover:bg-slate-100 sticky top-0"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {getAssetTypeIcon(type)}
                    <span className="font-medium text-sm text-slate-700">{type}</span>
                    <span className="text-xs text-slate-400 ml-auto">{items.length} {t('assets.items')}</span>
                  </button>
                  
                  {/* Group Items */}
                  {isExpanded && (
                    <div className="bg-white">
                      {items.map(item => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => { onChange(item.id); setIsOpen(false); setSearchTerm(''); }}
                          className={`w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2 ${value === item.id ? 'bg-brand-50' : ''}`}
                          style={{ paddingLeft: `${16 + item.indent * 12}px` }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate">{item.name}</span>
                            </div>
                            {item.path.length > 0 && (
                              <div className="text-xs text-slate-400 truncate mt-0.5">
                                📍 {item.path.join(' → ')}
                              </div>
                            )}
                          </div>
                          {value === item.id && <Check size={16} className="text-brand-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* No Results */}
            {Object.keys(filteredGroups).length === 0 && searchTerm && (
              <div className="px-4 py-8 text-center text-slate-500">
                <Search size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('assets.notFound')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============ ASSET NODE COMPONENT ============
const AssetNode: React.FC<{ asset: Asset; onSelect: (a: Asset) => void; selectedId?: string; level?: number }> = ({ asset, onSelect, selectedId, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = asset.children && asset.children.length > 0;
  const isSelected = asset.id === selectedId;
  const paddingLeftClass = level === 0 ? 'pl-2' : level === 1 ? 'pl-6' : level === 2 ? 'pl-10' : level === 3 ? 'pl-14' : 'pl-18';

  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-2 px-2 cursor-pointer transition-colors rounded-lg ${isSelected ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50 text-slate-700'}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={(e) => {
            e.stopPropagation();
            onSelect(asset);
        }}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`mr-2 p-1 rounded hover:bg-slate-200 text-slate-400 ${!hasChildren ? 'invisible' : ''}`}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span className={`mr-2 w-2 h-2 rounded-full ${asset.status === 'Operational' ? 'bg-green-500' : asset.status === 'Downtime' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
        <span className="text-sm truncate">{asset.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {asset.children!.map(child => (
            <AssetNode key={child.id} asset={child} onSelect={onSelect} selectedId={selectedId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

// ============ ASSET FORM COMPONENT ============
const AssetForm: React.FC<{
  asset?: Asset;
  parentOptions: AssetTreeOption[];
  onSave: (data: AssetData) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  t: (key: string) => string;
}> = ({ asset, parentOptions, onSave, onCancel, isEdit, t }) => {
  const [formData, setFormData] = useState<AssetData>(
    asset ? {
      id: asset.id, name: asset.name, type: asset.type as AssetData['type'], status: asset.status,
      healthScore: asset.healthScore, location: asset.location, criticality: asset.criticality,
      model: asset.model || '', installDate: asset.installDate || '', parentId: asset.parentId,
    } : { ...emptyAssetForm }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try { await onSave(formData); } 
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to save asset'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h3 className="text-xl font-bold text-slate-800 mb-4">{isEdit ? t('assets.editAsset') : t('assets.createAsset')}</h3>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.name')} *</label>
          <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.type')} *</label>
          <select required value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetData['type'] })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500">
            <option value="Site">Site</option><option value="Line">Line</option><option value="Facility">Facility</option>
            <option value="Machine">Machine</option><option value="Equipment">Equipment</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.status')} *</label>
          <select required value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetData['status'] })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500">
            <option value="Operational">Operational</option><option value="Maintenance">Maintenance</option><option value="Downtime">Downtime</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.parent')}</label>
          <AssetTreePicker
            value={formData.parentId}
            onChange={(val) => setFormData({ ...formData, parentId: val })}
            options={parentOptions}
            excludeId={asset?.id}
            t={t}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.criticality')}</label>
          <select value={formData.criticality} onChange={(e) => setFormData({ ...formData, criticality: e.target.value as AssetData['criticality'] })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500">
            <option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.healthScore')} (%)</label>
          <input type="number" min="0" max="100" value={formData.healthScore} onChange={(e) => setFormData({ ...formData, healthScore: parseInt(e.target.value) || 0 })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.location')}</label>
          <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.model')}</label>
          <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.installDate')}</label>
          <input type="date" value={formData.installDate} onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">{t('assets.description')}</label>
          <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 pb-2">
        <button type="button" onClick={onCancel} className="px-5 py-2.5 text-slate-600 hover:bg-slate-200 rounded-lg border border-slate-300 flex items-center gap-2">
          <X size={18} />{t('common.cancel')}
        </button>
        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 font-semibold shadow-md">
          {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
          Save
        </button>
      </div>
    </form>
  );
};

// ============ DOWNTIME FORM COMPONENT ============
const DowntimeForm: React.FC<{
  assets: AssetTreeOption[];
  onSave: (data: { asset_id: string; start_time: string; reason: string; description?: string; reported_by?: string }) => Promise<void>;
  onCancel: () => void;
  currentUser: string | null;
  t: (key: string) => string;
}> = ({ assets, onSave, onCancel, currentUser, t }) => {
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !assetId) return;
    setSaving(true);
    try {
      await onSave({
        asset_id: assetId,
        start_time: new Date().toISOString(),
        reason: reason.trim(),
        description: description || undefined,
        reported_by: currentUser || undefined,
      });
    } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 mb-6 shadow-sm">
      <h4 className="font-semibold text-lg text-red-800 mb-4 flex items-center gap-2">
        <AlertCircle size={20} className="text-red-600" />
        {t('assets.recordDowntime')}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.selectAsset')} *</label>
          <AssetTreePicker
            value={assetId}
            onChange={(val) => setAssetId(val || '')}
            options={assets}
            placeholder={t('assets.selectAssetForDowntime')}
            t={t}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.reason')} *</label>
          <input 
            type="text" 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
            placeholder={t('assets.reasonPlaceholder')}
            required
          />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.description')}</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500" 
            placeholder={t('assets.descriptionPlaceholder')}
            rows={2}
          />
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-red-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg border border-slate-300">{t('common.cancel')}</button>
        <button type="submit" disabled={saving || !reason.trim() || !assetId} className="px-5 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 font-semibold shadow-sm">
          <Play size={16} />{t('assets.startDowntime')}
        </button>
      </div>
    </form>
  );
};

// ============ METER FORM COMPONENT ============
const MeterForm: React.FC<{
  assets: AssetTreeOption[];
  meterTypes: MeterType[];
  onSave: (data: { asset_id: string; meter_type: string; value: number; unit: string; recorded_by?: string }) => Promise<void>;
  onCancel: () => void;
  currentUser: string | null;
  t: (key: string) => string;
}> = ({ assets, meterTypes, onSave, onCancel, currentUser, t }) => {
  const [assetId, setAssetId] = useState(assets[0]?.id || '');
  const [meterType, setMeterType] = useState(meterTypes[0]?.type || 'Runtime Hours');
  const [value, setValue] = useState(0);
  const [unit, setUnit] = useState(meterTypes[0]?.unit || 'hours');
  const [customUnit, setCustomUnit] = useState('');
  const [saving, setSaving] = useState(false);

  const isOtherType = meterType === 'Other';

  useEffect(() => {
    const selected = meterTypes.find(m => m.type === meterType);
    if (selected && !isOtherType) setUnit(selected.unit);
  }, [meterType, meterTypes, isOtherType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId) return;
    setSaving(true);
    try {
      await onSave({ 
        asset_id: assetId, 
        meter_type: meterType, 
        value, 
        unit: isOtherType ? customUnit : unit, 
        recorded_by: currentUser || undefined 
      });
      onCancel(); // Close form after successful save
    } finally { setSaving(false); }
  };

  // Get type description
  const getMeterTypeInfo = (type: string) => {
    const info: Record<string, { icon: string; desc: string; example: string }> = {
      'Runtime Hours': { icon: '⏱️', desc: t('assets.meterDescRuntime'), example: 'e.g. 1,250 hours' },
      'Cycle Count': { icon: '🔄', desc: t('assets.meterDescCycle'), example: 'e.g. 50,000 cycles' },
      'Power Consumption': { icon: '⚡', desc: t('assets.meterDescPower'), example: 'e.g. 150 kWh' },
      'Temperature': { icon: '🌡️', desc: t('assets.meterDescTemp'), example: 'e.g. 85°C' },
      'Pressure': { icon: '📊', desc: t('assets.meterDescPressure'), example: 'e.g. 3.5 bar' },
      'Vibration': { icon: '📳', desc: t('assets.meterDescVibration'), example: 'e.g. 2.5 mm/s' },
    };
    return info[type] || { icon: '📏', desc: t('assets.meterDescOther'), example: '' };
  };

  const selectedTypeInfo = getMeterTypeInfo(meterType);

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 mb-6 shadow-sm">
      <h4 className="font-semibold text-lg text-blue-800 mb-2 flex items-center gap-2">
        <Gauge size={20} className="text-blue-600" />
        {t('assets.recordMeterReading')}
      </h4>
      <p className="text-sm text-slate-600 mb-4">{t('assets.meterFormDesc')}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.selectAsset')} *</label>
          <AssetTreePicker
            value={assetId}
            onChange={(val) => setAssetId(val || '')}
            options={assets}
            placeholder={t('assets.selectAssetForMeter')}
            t={t}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.meterType')}</label>
          <select value={meterType} onChange={(e) => setMeterType(e.target.value)} title={t('assets.meterType')} className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            {meterTypes.map(m => <option key={m.type} value={m.type}>{m.type}</option>)}
          </select>
        </div>
        
        {/* Meter Type Info */}
        <div className="col-span-1 md:col-span-2 bg-white/70 p-3 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">{selectedTypeInfo.icon}</span>
            <span className="font-medium text-blue-800">{meterType}</span>
            <span className="text-slate-500">-</span>
            <span className="text-slate-600">{selectedTypeInfo.desc}</span>
          </div>
          {selectedTypeInfo.example && <p className="text-xs text-slate-400 mt-1 ml-8">{selectedTypeInfo.example}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('assets.currentReading')} *</label>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01" 
              value={value} 
              onChange={(e) => setValue(parseFloat(e.target.value) || 0)} 
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold" 
              placeholder="0"
            />
            {isOtherType ? (
              <input 
                type="text" 
                value={customUnit} 
                onChange={(e) => setCustomUnit(e.target.value)} 
                className="w-24 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-center focus:ring-2 focus:ring-blue-500" 
                placeholder={t('assets.unit')}
                title={t('assets.enterCustomUnit')}
              />
            ) : (
              <input 
                type="text" 
                value={unit} 
                onChange={(e) => setUnit(e.target.value)} 
                className="w-24 border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-center bg-slate-50" 
                readOnly
                title={t('assets.unit')}
              />
            )}
          </div>
        </div>
        <div className="flex items-end">
          <p className="text-xs text-slate-500 pb-2">
            💡 {t('assets.meterTip')}
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-blue-200">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:bg-white rounded-lg border border-slate-300">{t('common.cancel')}</button>
        <button type="submit" disabled={saving || !assetId} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-semibold shadow-sm">
          <Save size={16} />{t('assets.saveMeterValue')}
        </button>
      </div>
    </form>
  );
};

// ============ MAIN COMPONENT ============
const AssetHierarchy: React.FC<AssetHierarchyProps> = ({ currentUser }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('hierarchy');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Downtime state
  const [downtimes, setDowntimes] = useState<DowntimeRecord[]>([]);
  const [downtimeReasons, setDowntimeReasons] = useState<string[]>([]);
  const [showDowntimeForm, setShowDowntimeForm] = useState(false);

  // Meter state
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [meterTypes, setMeterTypes] = useState<MeterType[]>([]);
  const [showMeterForm, setShowMeterForm] = useState(false);

  // Statistics
  const [stats, setStats] = useState<AssetStatistics | null>(null);

  // Threshold settings per asset: { assetId: { meterType: { interval, nextAlert } } }
  // interval = ทุกๆ กี่ unit (เช่น ทุก 500 ชม.)
  // nextAlert = รอบถัดไปที่จะแจ้งเตือน (เช่น 500, 1000, 1500...)
  const [thresholdSettings, setThresholdSettings] = useState<Record<string, Record<string, { interval: number; nextAlert: number }>>>(() => {
    const saved = localStorage.getItem('meterThresholdsPerAsset_v2');
    return saved ? JSON.parse(saved) : {};
  });
  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [selectedThresholdAsset, setSelectedThresholdAsset] = useState<string | null>(null);
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});

  const canManageAssets = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'Head Technician');

  // Get all assets as flat list with hierarchy info for Tree Picker
  const getAllAssetsForPicker = (assetList: Asset[]): AssetTreeOption[] => {
    const result: AssetTreeOption[] = [];
    const traverse = (items: Asset[], level: number = 0, parentPath: string[] = []) => {
      items.forEach(item => {
        result.push({ 
          id: item.id, 
          name: item.name, 
          type: item.type,
          indent: level,
          path: parentPath
        });
        if (item.children && item.children.length > 0) {
          traverse(item.children, level + 1, [...parentPath, item.name]);
        }
      });
    };
    traverse(assetList);
    return result;
  };

  // Legacy function for other forms (Downtime, Meter)
  const getAllAssets = (assetList: Asset[]): { id: string; name: string; type: string; indent: number }[] => {
    const result: { id: string; name: string; type: string; indent: number }[] = [];
    const traverse = (items: Asset[], level: number = 0) => {
      items.forEach(item => {
        const prefix = level > 0 ? '│ '.repeat(level - 1) + '├─ ' : '';
        result.push({ id: item.id, name: `${prefix}${item.name} (${item.type})`, type: item.type, indent: level });
        if (item.children && item.children.length > 0) traverse(item.children, level + 1);
      });
    };
    traverse(assetList);
    return result;
  };

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const tree = await getAssetTree();
      if (tree.length === 0) {
        await seedAssets();
        const seededTree = await getAssetTree();
        setAssets(seededTree.map(treeNodeToAsset));
        if (seededTree.length > 0) setSelectedAsset(treeNodeToAsset(seededTree[0]));
      } else {
        setAssets(tree.map(treeNodeToAsset));
        if (!selectedAsset && tree.length > 0) setSelectedAsset(treeNodeToAsset(tree[0]));
      }
    } catch (err) {
      console.error('Failed to load assets:', err);
      setError(t('assets.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const loadDowntimeData = async () => {
    try {
      const [data, reasonsData] = await Promise.all([getDowntimes({ limit: 50 }), getDowntimeReasons()]);
      setDowntimes(data);
      setDowntimeReasons(reasonsData.reasons);
    } catch (err) {
      console.error('Failed to load downtime data:', err);
    }
  };

  const loadMeterData = async () => {
    try {
      const [data, typesData] = await Promise.all([getMeterReadings({ limit: 50 }), getMeterTypes()]);
      setMeterReadings(data);
      setMeterTypes(typesData.types);
    } catch (err) {
      console.error('Failed to load meter data:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getAssetStatistics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  useEffect(() => { loadAssets(); loadStats(); }, []);

  useEffect(() => {
    if (activeTab === 'downtime') loadDowntimeData();
    else if (activeTab === 'meters') loadMeterData();
  }, [activeTab]);

  const handleAnalyze = async () => {
    if (!selectedAsset) return;
    setLoadingAi(true);
    setAiInsight(null);
    try {
      const result = await analyzeAssetReliability(selectedAsset.name, `Recent WOs: 2 Breakdowns in last month. Age: 3 years. Health Score: ${selectedAsset.healthScore}`);
      setAiInsight(result);
    } catch (e) { console.error(e); }
    finally { setLoadingAi(false); }
  };

  const handleCreateAsset = async (data: AssetData) => {
    await createAsset(data);
    setShowForm(false);
    await loadAssets();
    await loadStats();
  };

  const handleUpdateAsset = async (data: AssetData) => {
    if (!editingAsset) return;
    await updateAsset(editingAsset.id, data);
    setEditingAsset(null);
    await loadAssets();
    await loadStats();
  };

  const handleDeleteAsset = async (id: string) => {
    await deleteAsset(id);
    setShowDeleteConfirm(null);
    if (selectedAsset?.id === id) setSelectedAsset(null);
    await loadAssets();
    await loadStats();
  };

  const handleCreateDowntime = async (data: { asset_id: string; start_time: string; reason: string; description?: string; reported_by?: string }) => {
    await createDowntime(data);
    setShowDowntimeForm(false);
    await loadDowntimeData();
    await loadStats();
  };

  const handleEndDowntime = async (id: number) => {
    await updateDowntime(id, { end_time: new Date().toISOString(), resolved_by: currentUser?.name || undefined });
    await loadDowntimeData();
    await loadStats();
  };

  const handleCreateMeterReading = async (data: { asset_id: string; meter_type: string; value: number; unit: string; recorded_by?: string }) => {
    await createMeterReading(data);
    setShowMeterForm(false);
    await loadMeterData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full m-8"><RefreshCw className="animate-spin text-brand-600" size={32} /></div>;
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 m-8 max-w-3xl mx-auto overflow-visible">
        <AssetForm parentOptions={getAllAssetsForPicker(assets)} onSave={handleCreateAsset} onCancel={() => setShowForm(false)} t={t} />
      </div>
    );
  }

  if (editingAsset) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 m-8 max-w-3xl mx-auto overflow-visible">
        <AssetForm asset={editingAsset} parentOptions={getAllAssetsForPicker(assets)} onSave={handleUpdateAsset} onCancel={() => setEditingAsset(null)} isEdit t={t} />
      </div>
    );
  }

  // Tab content renderers
  const renderHierarchyTab = () => (
    <div className="flex min-h-[600px]">
      {/* Left: Tree */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
          <span>{t('assets.hierarchy')}</span>
          <div className="flex items-center gap-2">
            <button onClick={loadAssets} className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded" title={t('common.refresh')}><RefreshCw size={16} /></button>
            {canManageAssets && <button onClick={() => setShowForm(true)} className="p-1 text-brand-600 hover:bg-brand-50 rounded" title={t('assets.addAsset')}><Plus size={18} /></button>}
          </div>
        </div>
        {error && <div className="p-4 bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
        <div className="p-2 flex-1">
          {assets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Activity size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('assets.noAssets')}</p>
              {canManageAssets && <button onClick={() => setShowForm(true)} className="mt-4 text-brand-600 hover:underline text-sm">{t('assets.createFirst')}</button>}
            </div>
          ) : assets.map(asset => <AssetNode key={asset.id} asset={asset} onSelect={(a) => { setSelectedAsset(a); setAiInsight(null); }} selectedId={selectedAsset?.id} />)}
        </div>
      </div>
      {/* Right: Details */}
      <div className="w-2/3 flex flex-col">
        {selectedAsset ? (
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-sm text-slate-500 mb-1">{selectedAsset.type} • {selectedAsset.id}</div>
                <h2 className="text-3xl font-bold text-slate-900">{selectedAsset.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                {canManageAssets && (
                  <>
                    <button onClick={() => setEditingAsset(selectedAsset)} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg" title={t('common.edit')}><Edit2 size={18} /></button>
                    <button onClick={() => setShowDeleteConfirm(selectedAsset.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title={t('common.delete')}><Trash2 size={18} /></button>
                  </>
                )}
                <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${selectedAsset.status === 'Operational' ? 'bg-green-100 text-green-700' : selectedAsset.status === 'Downtime' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  <div className={`w-2 h-2 rounded-full ${selectedAsset.status === 'Operational' ? 'bg-green-600' : selectedAsset.status === 'Downtime' ? 'bg-red-600' : 'bg-yellow-600'}`}></div>
                  {selectedAsset.status}
                </div>
              </div>
            </div>
            {showDeleteConfirm === selectedAsset.id && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 mb-3">{t('assets.deleteConfirm')}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleDeleteAsset(selectedAsset.id)} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700">{t('common.delete')}</button>
                  <button onClick={() => setShowDeleteConfirm(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300">{t('common.cancel')}</button>
                </div>
              </div>
            )}
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="p-4 bg-slate-50 rounded-xl border"><div className="text-slate-500 text-sm mb-1">{t('assets.healthScore')}</div><div className="text-3xl font-bold text-brand-600">{selectedAsset.healthScore}%</div></div>
              <div className="p-4 bg-slate-50 rounded-xl border"><div className="text-slate-500 text-sm mb-1">{t('assets.criticality')}</div><div className={`text-3xl font-bold ${selectedAsset.criticality === 'Critical' ? 'text-red-600' : 'text-slate-700'}`}>{selectedAsset.criticality}</div></div>
              <div className="p-4 bg-slate-50 rounded-xl border"><div className="text-slate-500 text-sm mb-1">{t('assets.location')}</div><div className="text-lg font-bold text-slate-700 mt-1">{selectedAsset.location}</div></div>
            </div>
            {/* Details */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">{t('assets.technicalDetails')}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">{t('assets.model')}</span><span className="font-medium">{selectedAsset.model || 'N/A'}</span></div>
                <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">{t('assets.installDate')}</span><span className="font-medium">{formatDateDDMMYYYY(selectedAsset.installDate)}</span></div>
              </div>
            </div>
            {/* AI */}
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-100">
              <div className="flex items-center gap-2 mb-4"><Zap className="text-violet-600" size={20} /><h3 className="text-lg font-bold text-violet-900">{t('assets.aiAnalysis')}</h3></div>
              {!aiInsight ? (
                <div className="text-center py-4">
                  <p className="text-slate-600 mb-4 text-sm">{t('assets.analyzeDesc')}</p>
                  <button onClick={handleAnalyze} disabled={loadingAi} className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-70 flex items-center gap-2 mx-auto">
                    {loadingAi ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}{t('assets.runDiagnostic')}
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="bg-white/80 p-4 rounded-lg border border-violet-100 text-slate-700 text-sm leading-relaxed">{aiInsight}</div>
                  <button onClick={handleAnalyze} className="text-xs text-violet-600 underline mt-3">{t('assets.updateAnalysis')}</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400"><Activity size={48} className="mb-4 opacity-20" /><p>{t('assets.selectToView')}</p></div>
        )}
      </div>
    </div>
  );

  const renderDowntimeTab = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800">{t('assets.downtimeTracking')}</h3>
        {canManageAssets && <button onClick={() => setShowDowntimeForm(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Clock size={16} />{t('assets.recordDowntime')}</button>}
      </div>
      {showDowntimeForm && (
        <DowntimeForm assets={getAllAssetsForPicker(assets)} onSave={handleCreateDowntime} onCancel={() => setShowDowntimeForm(false)} currentUser={currentUser?.name || null} t={t} />
      )}
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-red-50 rounded-xl border border-red-100"><div className="text-red-500 text-sm">{t('assets.activeDowntimes')}</div><div className="text-2xl font-bold text-red-700">{stats.active_downtimes}</div></div>
          <div className="p-4 bg-slate-50 rounded-xl border"><div className="text-slate-500 text-sm">{t('assets.totalDowntimeHours')}</div><div className="text-2xl font-bold text-slate-700">{stats.total_downtime_hours}h</div></div>
          <div className="p-4 bg-slate-50 rounded-xl border"><div className="text-slate-500 text-sm">{t('assets.avgHealthScore')}</div><div className="text-2xl font-bold text-brand-600">{stats.avg_health_score}%</div></div>
        </div>
      )}
      {/* List */}
      <div className="space-y-3">
        {downtimes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">{t('assets.noDowntimes')}</p>
            <p className="text-sm mt-1">{t('assets.downtimeHint')}</p>
          </div>
        ) : downtimes.map(dt => (
          <div key={dt.id} className={`p-5 rounded-xl border-2 transition-all ${dt.is_active ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${dt.is_active ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                  <span className="font-semibold text-lg text-slate-800">{dt.asset_name || dt.asset_id}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-sm font-medium">{dt.reason}</span>
                  {dt.description && <span className="text-sm text-slate-500">{dt.description}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${dt.is_active ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {dt.is_active ? `⏱ ${t('assets.downtimeOngoing')}` : `✓ ${t('assets.downtimeResolved')}`}
                </div>
                <div className="text-sm text-slate-500 mt-2">{t('assets.startTime')}: {formatDateTime(dt.start_time)}</div>
                {dt.duration_minutes != null && dt.duration_minutes > 0 && (
                  <div className="text-sm font-medium text-orange-600 mt-1">
                    ⏰ {t('assets.durationFormat').replace('{hours}', String(Math.floor(dt.duration_minutes / 60))).replace('{minutes}', String(dt.duration_minutes % 60))}
                  </div>
                )}
              </div>
            </div>
            {dt.is_active && canManageAssets && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <button 
                  onClick={() => handleEndDowntime(dt.id)} 
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold shadow-sm transition-all hover:shadow-md"
                >
                  <Square size={16} fill="white" />{t('assets.endDowntime')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Get only Equipment assets for threshold settings
  const getEquipmentAssets = (): AssetTreeOption[] => {
    return getAllAssetsForPicker(assets).filter(a => a.type === 'Equipment');
  };

  const saveThreshold = (assetId: string, meterType: string, interval: number, currentValue: number = 0) => {
    const newSettings = { ...thresholdSettings };
    if (!newSettings[assetId]) newSettings[assetId] = {};
    if (interval > 0) {
      // Calculate next alert based on interval and current value
      // e.g., if interval=500 and current=0, next=500
      // if interval=500 and current=594, next=1000 (next multiple above current)
      const nextAlert = Math.ceil((currentValue + 1) / interval) * interval;
      newSettings[assetId][meterType] = { interval, nextAlert };
    } else {
      delete newSettings[assetId][meterType];
    }
    setThresholdSettings(newSettings);
    localStorage.setItem('meterThresholdsPerAsset_v2', JSON.stringify(newSettings));
  };

  const getAssetThreshold = (assetId: string, meterType: string): { interval: number; nextAlert: number } | null => {
    return thresholdSettings[assetId]?.[meterType] || null;
  };

  // Advance to next cycle when acknowledged - e.g., 500→1000→1500
  const advanceToNextCycle = (assetId: string, meterType: string, currentValue: number) => {
    const threshold = getAssetThreshold(assetId, meterType);
    if (!threshold) return;
    
    // Calculate next alert milestone
    // e.g., current=594, interval=500 → next=1000
    const nextAlert = Math.ceil((currentValue + 1) / threshold.interval) * threshold.interval;
    
    const newSettings = { ...thresholdSettings };
    newSettings[assetId][meterType] = { ...threshold, nextAlert };
    setThresholdSettings(newSettings);
    localStorage.setItem('meterThresholdsPerAsset_v2', JSON.stringify(newSettings));
  };

  // Set custom next alert value
  const setCustomNextAlert = (assetId: string, meterType: string, nextAlert: number) => {
    const threshold = getAssetThreshold(assetId, meterType);
    if (!threshold) return;
    
    const newSettings = { ...thresholdSettings };
    newSettings[assetId][meterType] = { ...threshold, nextAlert };
    setThresholdSettings(newSettings);
    localStorage.setItem('meterThresholdsPerAsset_v2', JSON.stringify(newSettings));
  };

  const renderMetersTab = () => {
    // Group readings by asset and calculate CUMULATIVE totals from deltas
    const assetSummaries: Record<string, { 
      name: string; 
      readings: MeterReading[]; 
      cumulativeByType: Record<string, { total: number; unit: string; count: number }>;
      alertTypes: string[];
    }> = {};
    
    meterReadings.forEach(mr => {
      const assetKey = mr.asset_id;
      if (!assetSummaries[assetKey]) {
        assetSummaries[assetKey] = { 
          name: mr.asset_name || mr.asset_id, 
          readings: [], 
          cumulativeByType: {},
          alertTypes: []
        };
      }
      assetSummaries[assetKey].readings.push(mr);
      
      // Calculate cumulative from deltas (or use value if no delta)
      if (!assetSummaries[assetKey].cumulativeByType[mr.meter_type]) {
        assetSummaries[assetKey].cumulativeByType[mr.meter_type] = { total: 0, unit: mr.unit, count: 0 };
      }
      // Use delta if available, otherwise use value for first reading
      const addValue = mr.delta !== null && mr.delta !== 0 ? Math.abs(mr.delta) : (assetSummaries[assetKey].cumulativeByType[mr.meter_type].count === 0 ? mr.value : 0);
      assetSummaries[assetKey].cumulativeByType[mr.meter_type].total += addValue;
      assetSummaries[assetKey].cumulativeByType[mr.meter_type].count++;
    });

    // Check thresholds for alerts (interval-based: alert when total >= nextAlert)
    Object.entries(assetSummaries).forEach(([assetId, summary]) => {
      Object.entries(summary.cumulativeByType).forEach(([type, data]) => {
        const threshold = getAssetThreshold(assetId, type);
        // Alert when cumulative total >= nextAlert milestone
        if (threshold && data.total >= threshold.nextAlert) {
          summary.alertTypes.push(type);
        }
      });
    });

    // Calculate overall stats
    const totalRuntimeHours = Object.values(assetSummaries).reduce((sum, a) => 
      sum + (a.cumulativeByType['Runtime Hours']?.total || 0), 0);
    const assetsWithAlerts = Object.values(assetSummaries).filter(a => a.alertTypes.length > 0).length;
    const assetsWithThresholds = Object.keys(thresholdSettings).length;
    const uniqueAssets = Object.keys(assetSummaries).length;

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{t('assets.meterReadings')}</h3>
            <p className="text-sm text-slate-500 mt-1">{t('assets.meterPurpose')}</p>
          </div>
          {canManageAssets && (
            <button 
              onClick={() => setShowMeterForm(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-all"
            >
              <Gauge size={18} />{t('assets.recordMeterReading')}
            </button>
          )}
        </div>

        {showMeterForm && (
          <MeterForm assets={getAllAssetsForPicker(assets)} meterTypes={meterTypes} onSave={handleCreateMeterReading} onCancel={() => setShowMeterForm(false)} currentUser={currentUser?.name || null} t={t} />
        )}

        {meterReadings.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-blue-50 rounded-2xl p-8 max-w-2xl mx-auto">
              <Gauge size={48} className="mx-auto mb-4 text-blue-400" />
              <h4 className="text-lg font-semibold text-slate-800 mb-2">{t('assets.whyMeterReadings')}</h4>
              <div className="text-sm text-slate-600 space-y-2 text-left max-w-md mx-auto">
                <p>📊 <strong>{t('assets.meterBenefit1Title')}</strong> - {t('assets.meterBenefit1Desc')}</p>
                <p>🔧 <strong>{t('assets.meterBenefit2Title')}</strong> - {t('assets.meterBenefit2Desc')}</p>
                <p>💰 <strong>{t('assets.meterBenefit3Title')}</strong> - {t('assets.meterBenefit3Desc')}</p>
              </div>
              {canManageAssets && (
                <button 
                  onClick={() => setShowMeterForm(true)} 
                  className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold inline-flex items-center gap-2"
                >
                  <Gauge size={18} />{t('assets.recordFirstReading')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                <div className="text-blue-100 text-sm">{t('assets.totalRuntimeHours')}</div>
                <div className="text-3xl font-bold mt-1">{totalRuntimeHours.toLocaleString()}h</div>
                <div className="text-blue-200 text-xs mt-1">{t('assets.allAssets')}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-slate-200">
                <div className="text-slate-500 text-sm">{t('assets.assetsTracked')}</div>
                <div className="text-3xl font-bold text-slate-800 mt-1">{uniqueAssets}</div>
                <div className="text-slate-400 text-xs mt-1">{t('assets.withReadings')}</div>
              </div>
              <div className="p-4 bg-white rounded-xl border-2 border-slate-200">
                <div className="text-slate-500 text-sm">{t('assets.totalReadings')}</div>
                <div className="text-3xl font-bold text-slate-800 mt-1">{meterReadings.length}</div>
                <div className="text-slate-400 text-xs mt-1">{t('assets.records')}</div>
              </div>
              <div className={`p-4 rounded-xl ${assetsWithAlerts > 0 ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white' : 'bg-white border-2 border-slate-200'}`}>
                <div className={`text-sm flex items-center gap-1 ${assetsWithAlerts > 0 ? 'text-orange-100' : 'text-slate-500'}`}>
                  <AlertCircle size={14} />{t('assets.thresholdAlerts')}
                </div>
                <div className={`text-3xl font-bold mt-1 ${assetsWithAlerts > 0 ? 'text-white' : 'text-slate-800'}`}>{assetsWithAlerts}</div>
                <div className={`text-xs mt-1 ${assetsWithAlerts > 0 ? 'text-orange-200' : 'text-slate-400'}`}>
                  {assetsWithAlerts > 0 ? t('assets.needsMaintenance') : `${assetsWithThresholds} ${t('assets.configured')}`}
                </div>
              </div>
            </div>

            {/* Threshold Settings Modal - Per Asset */}
            {showThresholdModal && selectedThresholdAsset && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) { setShowThresholdModal(false); setSelectedThresholdAsset(null); }}}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-slate-800">{t('assets.setAlertThresholds')}</h4>
                      {(() => {
                        const assetInfo = getAllAssetsForPicker(assets).find(a => a.id === selectedThresholdAsset);
                        const summaryInfo = Object.values(assetSummaries).find((_, idx) => Object.keys(assetSummaries)[idx] === selectedThresholdAsset);
                        return assetInfo ? (
                          <div className="text-sm text-slate-500 mt-1">
                            <span className="font-medium text-blue-600">{summaryInfo?.name || assetInfo.name}</span>
                            {assetInfo.path.length > 0 && (
                              <span className="ml-2 text-xs">📍 {assetInfo.path.join(' > ')}</span>
                            )}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <button onClick={() => { setShowThresholdModal(false); setSelectedThresholdAsset(null); }} title={t('common.close')} className="p-1 hover:bg-slate-100 rounded-full">
                      <X size={20} className="text-slate-400" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded mb-4">
                    💡 ตั้งค่า Interval = แจ้งเตือนทุกๆ X unit (เช่น 500 → 1000 → 1500...)
                  </p>
                  
                  {/* Threshold inputs for this asset */}
                  <div className="space-y-3">
                    {meterTypes.map(mt => {
                      const currentThreshold = thresholdSettings[selectedThresholdAsset]?.[mt.type];
                      return (
                        <div key={mt.type} className="p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">{mt.type}</label>
                            {currentThreshold && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                {t('assets.nextAlertAt')}: {currentThreshold.nextAlert} {mt.unit}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 whitespace-nowrap">{t('assets.everyInterval')}</span>
                            <input
                              type="number"
                              value={currentThreshold?.interval || ''}
                              onChange={(e) => saveThreshold(selectedThresholdAsset, mt.type, Number(e.target.value), 0)}
                              placeholder="500"
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-slate-400">{mt.unit}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t flex justify-end">
                    <button 
                      onClick={() => { setShowThresholdModal(false); setSelectedThresholdAsset(null); }}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                    >
                      {t('common.close')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Grouped by Asset */}
            <div className="space-y-4">
              {Object.entries(assetSummaries).map(([assetId, summary]) => {
                const isExpanded = expandedAssets[assetId];
                const displayReadings = isExpanded ? summary.readings : summary.readings.slice(0, 3);
                const hasMore = summary.readings.length > 3;
                
                return (
                  <div key={assetId} className={`bg-white rounded-xl border-2 ${summary.alertTypes.length > 0 ? 'border-orange-300 ring-2 ring-orange-100' : 'border-slate-200'} overflow-hidden`}>
                    {/* Asset Header */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${summary.alertTypes.length > 0 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          <Gauge size={20} className={summary.alertTypes.length > 0 ? 'text-orange-600' : 'text-blue-600'} />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{summary.name}</div>
                          <div className="text-xs text-slate-500">{summary.readings.length} {t('assets.readingsRecorded')}</div>
                        </div>
                        {/* Settings button for this equipment */}
                        {canManageAssets && (
                          <button
                            onClick={() => { setSelectedThresholdAsset(assetId); setShowThresholdModal(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={t('assets.setAlertThresholds')}
                          >
                            <Settings size={16} />
                          </button>
                        )}
                      </div>
                      {/* Cumulative Totals */}
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        {Object.entries(summary.cumulativeByType).map(([type, data]) => {
                          const threshold = getAssetThreshold(assetId, type);
                          const isOverThreshold = threshold && data.total >= threshold.nextAlert;
                          return (
                            <div key={type} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${isOverThreshold ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                              {type === 'Runtime Hours' && '⏱️ '}
                              {type === 'Cycle Count' && '🔄 '}
                              {type === 'Power Consumption' && '⚡ '}
                              {data.total.toLocaleString()}{data.unit}
                              {threshold && (
                                <span className="ml-1 text-xs opacity-70">/{threshold.nextAlert}</span>
                              )}
                              {isOverThreshold && <span className="ml-1">⚠️</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Alert Banner with Next Cycle */}
                    {summary.alertTypes.length > 0 && (
                      <div className="px-5 py-3 bg-orange-50 border-b border-orange-200">
                        {summary.alertTypes.map(alertType => {
                          const threshold = getAssetThreshold(assetId, alertType);
                          const currentValue = summary.cumulativeByType[alertType]?.total || 0;
                          const nextCycle = threshold ? Math.ceil((currentValue + 1) / threshold.interval) * threshold.interval : 0;
                          
                          return (
                            <div key={alertType} className="flex flex-col gap-2 mb-3 last:mb-0 p-3 bg-white rounded-lg border border-orange-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={16} className="text-orange-600" />
                                  <span className="text-sm font-medium text-orange-700">
                                    {alertType} {t('assets.thresholdExceeded')}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {currentValue.toLocaleString()} / {threshold?.nextAlert.toLocaleString()} {summary.cumulativeByType[alertType]?.unit}
                                </div>
                              </div>
                              {canManageAssets && threshold && (
                                <div className="flex items-center gap-2 pt-2 border-t border-orange-100">
                                  <button
                                    onClick={() => advanceToNextCycle(assetId, alertType, currentValue)}
                                    className="flex-1 text-xs px-3 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                                  >
                                    <Check size={14} />
                                    {t('assets.markMaintained')} → {t('assets.nextAt')} {nextCycle.toLocaleString()}
                                  </button>
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-slate-500">{t('assets.orSetCustom')}:</span>
                                    <input
                                      type="number"
                                      defaultValue={nextCycle}
                                      placeholder="1000"
                                      title="Custom next alert value"
                                      className="w-20 px-2 py-1 border rounded text-center"
                                      onBlur={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (val > currentValue) setCustomNextAlert(assetId, alertType, val);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* All Readings */}
                    <div className="divide-y divide-slate-100">
                      {displayReadings.map(mr => (
                        <div key={mr.id} className="px-5 py-3 flex justify-between items-center hover:bg-slate-50 group">
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{mr.meter_type}</span>
                            <span className="text-xs text-slate-400">{formatDateTime(mr.reading_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">{mr.value}</span>
                            <span className="text-sm text-slate-400">{mr.unit}</span>
                            {mr.delta !== null && mr.delta !== 0 && (
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${mr.delta > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {mr.delta > 0 ? '↑+' : '↓'}{Math.abs(mr.delta).toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Show More Button */}
                    {hasMore && (
                      <div className="px-5 py-2 bg-slate-50 border-t border-slate-200">
                        <button 
                          onClick={() => setExpandedAssets(prev => ({ ...prev, [assetId]: !isExpanded }))}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <><ChevronUp size={16} />{t('assets.showLess')}</>
                          ) : (
                            <><ChevronDown size={16} />{t('assets.showAllHistory')} ({summary.readings.length - 3} {t('assets.moreRecords')})</>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Why Track Info */}
            <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity size={16} className="text-blue-600" />
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-700 mb-1">{t('assets.meterTrackingHelps')}</p>
                  <p className="text-slate-500">{t('assets.meterTrackingDesc')}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 m-8">
      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 rounded-t-xl">
        <button onClick={() => setActiveTab('hierarchy')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'hierarchy' ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Activity size={16} />{t('assets.hierarchy')}
        </button>
        <button onClick={() => setActiveTab('downtime')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'downtime' ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Clock size={16} />{t('assets.downtime')}
          {stats && stats.active_downtimes > 0 && <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">{stats.active_downtimes}</span>}
        </button>
        <button onClick={() => setActiveTab('meters')} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'meters' ? 'border-brand-600 text-brand-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          <Gauge size={16} />{t('assets.meters')}
        </button>
      </div>
      {/* Tab Content */}
      <div>
        {activeTab === 'hierarchy' && renderHierarchyTab()}
        {activeTab === 'downtime' && renderDowntimeTab()}
        {activeTab === 'meters' && renderMetersTab()}
      </div>
    </div>
  );
};

export default AssetHierarchy;
