import React, { useEffect, useMemo, useState } from 'react';
import { Search, Filter, AlertCircle, TrendingUp, Package, ArrowDown, ArrowUp } from 'lucide-react';
import { InventoryItem } from '../types';
import { predictInventoryNeeds } from '../services/geminiService';
import { useLanguage } from '../lib/i18n';
import { listSpareParts, createSparePart, SparePartItem } from '../services/apiService';

const MOCK_INVENTORY: InventoryItem[] = [
    { id: 'P-001', name: 'Hydraulic Filter 50 micron', sku: 'HF-50M', quantity: 12, minLevel: 10, unit: 'pcs', location: 'WH-A-01', category: 'Filters', lastUpdated: '2024-10-20', cost: 45.00 },
    { id: 'P-002', name: 'Bearing 6204-2RS', sku: 'BR-6204', quantity: 4, minLevel: 8, unit: 'pcs', location: 'WH-A-02', category: 'Bearings', lastUpdated: '2024-10-18', cost: 12.50 },
    { id: 'P-003', name: 'Synthetic Oil 5W-40', sku: 'OIL-SYN', quantity: 50, minLevel: 20, unit: 'Liters', location: 'WH-B-Oil', category: 'Lubricants', lastUpdated: '2024-10-22', cost: 8.00 },
    { id: 'P-004', name: 'V-Belt B42', sku: 'VB-B42', quantity: 2, minLevel: 5, unit: 'pcs', location: 'WH-A-03', category: 'Belts', lastUpdated: '2024-10-15', cost: 22.00 },
    { id: 'P-005', name: 'Proximity Sensor M12', sku: 'SENS-PX-12', quantity: 15, minLevel: 5, unit: 'pcs', location: 'WH-C-Elec', category: 'Sensors', lastUpdated: '2024-10-23', cost: 85.00 },
];

const Inventory: React.FC = () => {
    const { t } = useLanguage();
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
        // Load spare parts from backend
        useEffect(() => {
            const load = async () => {
                try {
                    const items = await listSpareParts();
                    const mapped: InventoryItem[] = items.map((sp: SparePartItem) => ({
                        id: `SP-${sp.id}`,
                        name: sp.part_name,
                        sku: sp.category.slice(0,3).toUpperCase() + '-' + sp.id,
                        quantity: sp.quantity,
                        minLevel: Math.max(1, Math.floor(sp.quantity / 2)),
                        unit: 'pcs',
                        location: '',
                        category: sp.category,
                        lastUpdated: sp.updated_at?.slice(0,10) || sp.created_at.slice(0,10),
                        cost: sp.price_per_unit,
                    }));
                    setInventory(mapped);
                } catch (e) {
                    console.error('Failed to load spare parts', e);
                }
            };
            load();
        }, []);
    const [search, setSearch] = useState('');

    // Add Part Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newPart, setNewPart] = useState({
        name: '',
        type: '',
        quantity: 0,
        pricePerUnit: 0,
        site: '',
    });

    // Site selection temporarily removed per request
    // const siteOptions = useMemo(() => ['Site A', 'Site B', 'Site C'], []);

    const filteredInventory = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return inventory;
        return inventory.filter(i =>
            i.sku.toLowerCase().includes(term) ||
            i.name.toLowerCase().includes(term)
        );
    }, [search, inventory]);

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
        <div className="p-8 h-full flex flex-col bg-stone-50/50 dark:bg-stone-900">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-serif text-3xl text-stone-900 dark:text-stone-100">{t('inventory.management')}</h2>
                    <p className="text-stone-500 dark:text-stone-400 mt-1">{t('inventory.trackParts')}</p>
                </div>
                <button
                    onClick={runInventoryAI}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 hover:-translate-y-0.5 transition-all duration-200"
                >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <TrendingUp size={18} />}
                    <span className="font-semibold">{t('inventory.aiStockAnalysis')}</span>
                </button>
            </div>

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendations.map((rec, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 p-4 rounded-2xl border border-teal-100 dark:border-teal-800 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300 font-bold mb-1">
                                <AlertCircle size={16} />
                                <span className="text-sm">{rec.partName}</span>
                            </div>
                            <p className="text-xs text-stone-700 dark:text-stone-300">{rec.recommendation}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200/60 dark:border-stone-700 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-stone-200 dark:border-stone-700 flex gap-4 bg-stone-50 dark:bg-stone-900">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-3 text-stone-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={t('inventory.searchBySku')}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 hover:border-stone-300 dark:hover:border-stone-600 transition-all duration-200">
                        <Filter size={16} />
                        {t('common.filter')}
                    </button>
                    <div className="flex-1"/>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="ml-auto px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-teal-600/20 hover:shadow-xl hover:shadow-teal-600/25 transition-all"
                        title="Add Parts"
                    >
                        + Add Parts
                    </button>
                </div>

                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-stone-50 dark:bg-stone-900 sticky top-0 z-[1] text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700">{t('inventory.partInfo')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700">{t('inventory.category')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700">{t('inventory.location')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700">{t('inventory.stockLevel')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700 text-right">{t('inventory.value')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 dark:border-stone-700">{t('inventory.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {MOCK_INVENTORY.map((item) => {
                                const isLowStock = item.quantity <= item.minLevel;
                                return (
                                    <tr key={item.id} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-stone-100 dark:bg-stone-700 rounded-xl flex items-center justify-center text-stone-400 dark:text-stone-500">
                                                    <Package size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-stone-900 dark:text-stone-100">{item.name}</div>
                                                    <div className="text-xs text-stone-500 dark:text-stone-400">{item.sku}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-300">{item.category}</td>
                                        <td className="px-6 py-4 text-stone-600 dark:text-stone-400 font-mono text-xs">{item.location}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-800 dark:text-stone-100">{item.quantity}</span>
                                                <span className="text-xs text-stone-400 dark:text-stone-500">{item.unit}</span>
                                            </div>
                                            <div className="w-24 h-1.5 bg-stone-100 dark:bg-stone-700 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${isLowStock ? 'bg-red-500' : 'bg-teal-500'}`}
                                                    style={{ width: `${Math.min((item.quantity / (item.minLevel * 2)) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{t('inventory.minLevel')}: {item.minLevel}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-stone-700 dark:text-stone-200">
                                            ${(item.cost * item.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                                                    <ArrowDown size={12} /> {t('inventory.lowStock')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    <ArrowUp size={12} /> {t('inventory.inStock')}
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

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-stone-900">Add Part</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-stone-500 hover:text-stone-700">✕</button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                                <input
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    value={newPart.name}
                                    onChange={(e) => setNewPart(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Type</label>
                                <input
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    value={newPart.type}
                                    onChange={(e) => setNewPart(p => ({ ...p, type: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        min={0}
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        value={newPart.quantity}
                                        onChange={(e) => setNewPart(p => ({ ...p, quantity: Number(e.target.value) }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Price / Unit</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        value={newPart.pricePerUnit}
                                        onChange={(e) => setNewPart(p => ({ ...p, pricePerUnit: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                            {/* Site selection removed temporarily */}
                        </div>
                        <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                                onClick={() => setIsAddOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                                onClick={() => {
                                    const submit = async () => {
                                        if (!newPart.name || !newPart.type) return;
                                        try {
                                            const created = await createSparePart({
                                                part_name: newPart.name,
                                                category: newPart.type,
                                                price_per_unit: newPart.pricePerUnit || 0,
                                                quantity: newPart.quantity || 0,
                                            });
                                            // Refresh list
                                            const items = await listSpareParts();
                                            const mapped: InventoryItem[] = items.map((sp: SparePartItem) => ({
                                                id: `SP-${sp.id}`,
                                                name: sp.part_name,
                                                sku: sp.category.slice(0,3).toUpperCase() + '-' + sp.id,
                                                quantity: sp.quantity,
                                                minLevel: Math.max(1, Math.floor(sp.quantity / 2)),
                                                unit: 'pcs',
                                                location: '',
                                                category: sp.category,
                                                lastUpdated: sp.updated_at?.slice(0,10) || sp.created_at.slice(0,10),
                                                cost: sp.price_per_unit,
                                            }));
                                            setInventory(mapped);
                                            setIsAddOpen(false);
                                            setNewPart({ name: '', type: '', quantity: 0, pricePerUnit: 0, site: '' });
                                        } catch (err) {
                                            console.error('Failed to create spare part', err);
                                            alert('Failed to create spare part. Please ensure backend is running.');
                                        }
                                    };
                                    submit();
                                }}
                            >
                                Add Part
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;