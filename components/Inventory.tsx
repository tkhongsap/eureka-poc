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
                    <h2 className="font-serif text-3xl text-stone-900">Inventory Management</h2>
                    <p className="text-stone-500 mt-1">Track spare parts, stock levels, and reorder points.</p>
                </div>
                <button
                    onClick={runInventoryAI}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <TrendingUp size={18} />}
                    <span className="font-semibold">AI Stock Analysis</span>
                </button>
            </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendations.map((rec, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-teal-50 to-emerald-50 p-4 rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center gap-2 text-teal-700 font-bold mb-1">
                                <AlertCircle size={16} />
                                <span className="text-sm">{rec.partName}</span>
                            </div>
                            <p className="text-xs text-stone-700">{rec.recommendation}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-stone-200 flex gap-4 bg-stone-50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
                        <input type="text" placeholder="Search by SKU or Name..." className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-stone-50 sticky top-0 z-[1] text-xs font-semibold text-stone-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5 border-b border-stone-200">Part Info</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">Category</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">Location</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">Stock Level</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 text-right">Value</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {MOCK_INVENTORY.map((item) => {
                                const isLowStock = item.quantity <= item.minLevel;
                                return (
                                    <tr key={item.id} className="hover:bg-teal-50/50 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-stone-900">{item.name}</div>
                                                    <div className="text-xs text-stone-500">{item.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600">{item.category}</td>
                                        <td className="px-6 py-4 text-stone-600 font-mono text-xs">{item.location}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-800">{item.quantity}</span>
                                                <span className="text-xs text-stone-400">{item.unit}</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-stone-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-teal-500'}`}
                                                    style={{ width: `${Math.min((item.quantity / (item.minLevel * 2)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-stone-400 mt-0.5">ROP: {item.minLevel}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-stone-700">
                                            ${(item.cost * item.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    <ArrowDown size={12} /> Low Stock
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
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