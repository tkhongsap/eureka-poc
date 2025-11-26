import React, { useState } from 'react';
import { Search, Filter, AlertCircle, TrendingUp, Package, ArrowDown, ArrowUp } from 'lucide-react';
import { InventoryItem } from '../types';
import { predictInventoryNeeds } from '../services/geminiService';

const MOCK_INVENTORY: InventoryItem[] = [
    { id: 'P-001', name: 'Hydraulic Filter 50 micron', sku: 'HF-50M', quantity: 12, minLevel: 10, unit: 'pcs', location: 'WH-A-01', category: 'Filters', lastUpdated: '2024-10-20', cost: 45.00 },
    { id: 'P-002', name: 'Bearing 6204-2RS', sku: 'BR-6204', quantity: 4, minLevel: 8, unit: 'pcs', location: 'WH-A-02', category: 'Bearings', lastUpdated: '2024-10-18', cost: 12.50 },
    { id: 'P-003', name: 'Synthetic Oil 5W-40', sku: 'OIL-SYN', quantity: 50, minLevel: 20, unit: 'Liters', location: 'WH-B-Oil', category: 'Lubricants', lastUpdated: '2024-10-22', cost: 8.00 },
    { id: 'P-004', name: 'V-Belt B42', sku: 'VB-B42', quantity: 2, minLevel: 5, unit: 'pcs', location: 'WH-A-03', category: 'Belts', lastUpdated: '2024-10-15', cost: 22.00 },
    { id: 'P-005', name: 'Proximity Sensor M12', sku: 'SENS-PX-12', quantity: 15, minLevel: 5, unit: 'pcs', location: 'WH-C-Elec', category: 'Sensors', lastUpdated: '2024-10-23', cost: 85.00 },
];

const Inventory: React.FC = () => {
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const runInventoryAI = async () => {
        setLoading(true);
        try {
            const results = await predictInventoryNeeds(MOCK_INVENTORY);
            setAiRecommendations(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Inventory Management</h2>
                    <p className="text-slate-500">Track spare parts, stock levels, and reorder points.</p>
                </div>
                <button 
                    onClick={runInventoryAI}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <TrendingUp size={18} />}
                    <span>AI Stock Analysis</span>
                </button>
            </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-in-top">
                    {aiRecommendations.map((rec, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200 shadow-sm">
                            <div className="flex items-center gap-2 text-orange-700 font-bold mb-1">
                                <AlertCircle size={16} />
                                <span className="text-sm">{rec.partName}</span>
                            </div>
                            <p className="text-xs text-slate-700">{rec.recommendation}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex gap-4 bg-slate-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input type="text" placeholder="Search by SKU or Name..." className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3 border-b border-slate-200">Part Info</th>
                                <th className="px-6 py-3 border-b border-slate-200">Category</th>
                                <th className="px-6 py-3 border-b border-slate-200">Location</th>
                                <th className="px-6 py-3 border-b border-slate-200">Stock Level</th>
                                <th className="px-6 py-3 border-b border-slate-200 text-right">Value</th>
                                <th className="px-6 py-3 border-b border-slate-200">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {MOCK_INVENTORY.map((item) => {
                                const isLowStock = item.quantity <= item.minLevel;
                                return (
                                    <tr key={item.id} className="hover:bg-brand-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{item.name}</div>
                                                    <div className="text-xs text-slate-500">{item.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">{item.category}</td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.location}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">{item.quantity}</span>
                                                <span className="text-xs text-slate-400">{item.unit}</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-green-500'}`} 
                                                    style={{ width: `${Math.min((item.quantity / (item.minLevel * 2)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">ROP: {item.minLevel}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700">
                                            ${(item.cost * item.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <ArrowDown size={12} /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <ArrowUp size={12} /> In Stock
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Inventory;