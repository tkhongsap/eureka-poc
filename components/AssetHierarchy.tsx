import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Activity, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { Asset } from '../types';
import { analyzeAssetReliability } from '../services/geminiService';

// Helper function to format date as DD/MM/YYYY
const formatDateDDMMYYYY = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

// Mock Tree Data
const INITIAL_ASSETS: Asset[] = [
  {
    id: 'PLANT-A',
    name: 'Plant A - Main Assembly',
    type: 'Site',
    status: 'Operational',
    healthScore: 92,
    location: 'Bangkok',
    criticality: 'High',
    children: [
      {
        id: 'LINE-1',
        name: 'Production Line 1',
        type: 'Line',
        status: 'Operational',
        healthScore: 88,
        location: 'Hall A',
        criticality: 'High',
        children: [
            {
                id: 'CV-101',
                name: 'Main Conveyor Belt',
                type: 'Machine',
                status: 'Maintenance',
                healthScore: 65,
                location: 'Line 1 Start',
                criticality: 'Medium',
                model: 'Siemens CV-2000',
                installDate: '2021-05-15'
            },
            {
                id: 'RB-202',
                name: 'Assembly Robot Arm',
                type: 'Machine',
                status: 'Operational',
                healthScore: 98,
                location: 'Line 1 Station 2',
                criticality: 'Critical',
                model: 'Kuka KR-16',
                installDate: '2022-01-10'
            }
        ]
      },
      {
        id: 'FAC-HVAC',
        name: 'HVAC System',
        type: 'Facility',
        status: 'Downtime',
        healthScore: 45,
        location: 'Roof',
        criticality: 'Medium',
        children: [
            {
                id: 'CH-01',
                name: 'Chiller Unit 1',
                type: 'Equipment',
                status: 'Downtime',
                healthScore: 20,
                location: 'Roof West',
                criticality: 'High',
                model: 'Trane CVHE',
                installDate: '2019-11-20'
            }
        ]
      }
    ]
  }
];

const AssetNode: React.FC<{ asset: Asset; onSelect: (a: Asset) => void; selectedId?: string; level?: number }> = ({ asset, onSelect, selectedId, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = asset.children && asset.children.length > 0;
  const isSelected = asset.id === selectedId;

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
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
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

const AssetHierarchy: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<Asset>(INITIAL_ASSETS[0]);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAnalyze = async () => {
    setLoadingAi(true);
    setAiInsight(null);
    try {
        const result = await analyzeAssetReliability(selectedAsset.name, `Recent WOs: 2 Breakdowns in last month. Age: 3 years. Health Score: ${selectedAsset.healthScore}`);
        setAiInsight(result);
    } catch (e) {
        console.error(e);
    } finally {
        setLoadingAi(false);
    }
  };

  return (
    <div className="flex h-full bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200 m-8">
      {/* Left Pane: Tree */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
            <span>Asset Hierarchy</span>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">Plant A</span>
        </div>
        <div className="overflow-y-auto p-2 flex-1">
          {INITIAL_ASSETS.map(asset => (
            <AssetNode key={asset.id} asset={asset} onSelect={(a) => { setSelectedAsset(a); setAiInsight(null); }} selectedId={selectedAsset?.id} />
          ))}
        </div>
      </div>

      {/* Right Pane: Details */}
      <div className="w-2/3 flex flex-col overflow-y-auto">
         {selectedAsset ? (
             <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-sm text-slate-500 mb-1">{selectedAsset.type} • {selectedAsset.id}</div>
                        <h2 className="text-3xl font-bold text-slate-900">{selectedAsset.name}</h2>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 ${
                        selectedAsset.status === 'Operational' ? 'bg-green-100 text-green-700' : 
                        selectedAsset.status === 'Downtime' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                             selectedAsset.status === 'Operational' ? 'bg-green-600' : 
                             selectedAsset.status === 'Downtime' ? 'bg-red-600' : 'bg-yellow-600'
                        }`}></div>
                        {selectedAsset.status}
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-slate-500 text-sm mb-1">Health Score</div>
                        <div className="text-3xl font-bold text-brand-600">{selectedAsset.healthScore}%</div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-slate-500 text-sm mb-1">Criticality</div>
                        <div className={`text-3xl font-bold ${selectedAsset.criticality === 'Critical' ? 'text-red-600' : 'text-slate-700'}`}>
                            {selectedAsset.criticality}
                        </div>
                    </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-slate-500 text-sm mb-1">Location</div>
                        <div className="text-lg font-bold text-slate-700 mt-1">{selectedAsset.location}</div>
                    </div>
                </div>

                {/* Details Tab */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Technical Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Model</span>
                            <span className="font-medium text-slate-800">{selectedAsset.model || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Install Date</span>
                            <span className="font-medium text-slate-800">{formatDateDDMMYYYY(selectedAsset.installDate)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Serial Number</span>
                            <span className="font-medium text-slate-800">SN-{selectedAsset.id}-2022</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                            <span className="text-slate-500">Manufacturer</span>
                            <span className="font-medium text-slate-800">Industrial Corp Ltd.</span>
                        </div>
                    </div>
                </div>

                {/* AI Section */}
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-100">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="text-violet-600" size={20} />
                        <h3 className="text-lg font-bold text-violet-900">AI Reliability Analysis</h3>
                    </div>
                    
                    {!aiInsight ? (
                        <div className="text-center py-4">
                            <p className="text-slate-600 mb-4 text-sm">Analyze historical data to predict failure probability and maintenance needs.</p>
                            <button 
                                onClick={handleAnalyze}
                                disabled={loadingAi}
                                className="bg-violet-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-70 flex items-center gap-2 mx-auto"
                            >
                                {loadingAi ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
                                Run Diagnostic
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="bg-white/80 p-4 rounded-lg border border-violet-100 text-slate-700 text-sm leading-relaxed">
                                {aiInsight}
                            </div>
                            <button onClick={handleAnalyze} className="text-xs text-violet-600 underline mt-3 hover:text-violet-800">Update Analysis</button>
                        </div>
                    )}
                </div>

             </div>
         ) : (
             <div className="flex flex-col items-center justify-center h-full text-slate-400">
                 <Activity size={48} className="mb-4 opacity-20" />
                 <p>Select an asset to view details</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default AssetHierarchy;