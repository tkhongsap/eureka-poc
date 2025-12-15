import React, { useMemo, useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, TrendingUp, Package, ArrowDown, ArrowUp, Edit3, Trash2, Plus, Minus } from 'lucide-react';
import { InventoryItem } from '../types';
import { predictInventoryNeeds } from '../services/geminiService';
import { listSpareParts, createSparePart, updateSparePart, deleteSparePart, SparePartItem } from '../services/apiService';
import { useLanguage } from '../lib/i18n';

// Convert SparePartItem from API to InventoryItem format
const convertSparePartToInventory = (sparePart: SparePartItem): InventoryItem => ({
    id: `P-${sparePart.id.toString().padStart(3, '0')}`,
    name: sparePart.part_name,
    sku: `SKU-${sparePart.id}`,
    quantity: sparePart.quantity,
    minLevel: Math.max(5, Math.floor(sparePart.quantity * 0.2)), // Default minimum level
    unit: 'pcs',
    location: `WH-${sparePart.category.charAt(0)}-${sparePart.id.toString().padStart(2, '0')}`,
    category: sparePart.category,
    lastUpdated: sparePart.updated_at.split('T')[0],
    cost: sparePart.price_per_unit
});

// Extract database ID from display ID
const extractPartId = (displayId: string): number => {
    const match = displayId.match(/P-(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
};

const Inventory: React.FC = () => {
    const { t } = useLanguage();
    const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [search, setSearch] = useState('');
    const [loadingData, setLoadingData] = useState(true);

    // Add Part Modal State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newPart, setNewPart] = useState({
        part_name: '',
        category: '',
        quantity: 0,
        price_per_unit: 0,
    });

    // Edit Part Modal State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<InventoryItem | null>(null);
    const [editPart, setEditPart] = useState({
        part_name: '',
        category: '',
        quantity: 0,
        price_per_unit: 0,
    });

    // Load inventory data from database
    useEffect(() => {
        const loadInventoryData = async () => {
            try {
                setLoadingData(true);
                const spareParts = await listSpareParts();
                const inventoryItems = spareParts.map(convertSparePartToInventory);
                setInventory(inventoryItems);
            } catch (error) {
                console.error('Failed to load inventory data:', error);
                // Keep empty array if error
            } finally {
                setLoadingData(false);
            }
        };

        loadInventoryData();
    }, []);

    const filteredInventory = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return inventory;
        return inventory.filter(i =>
            i.sku.toLowerCase().includes(term) ||
            i.name.toLowerCase().includes(term)
        );
    }, [search, inventory]);

    const runInventoryAI = async () => {
        if (inventory.length === 0) return;
        
        setLoading(true);
        try {
            const results = await predictInventoryNeeds(inventory);
            setAiRecommendations(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Handle adding new spare part
    const handleAddPart = async () => {
        if (!newPart.part_name || !newPart.category || newPart.quantity <= 0 || newPart.price_per_unit <= 0) {
            alert('Please fill all required fields with valid values');
            return;
        }

        try {
            const createdPart = await createSparePart({
                part_name: newPart.part_name,
                category: newPart.category,
                quantity: newPart.quantity,
                price_per_unit: newPart.price_per_unit
            });

            // Add new part to inventory
            const newInventoryItem = convertSparePartToInventory(createdPart);
            setInventory(prev => [...prev, newInventoryItem]);

            // Reset form
            setNewPart({
                part_name: '',
                category: '',
                quantity: 0,
                price_per_unit: 0,
            });
            setIsAddOpen(false);
        } catch (error) {
            console.error('Failed to add spare part:', error);
            alert('Failed to add spare part. Please try again.');
        }
    };

    // Handle opening edit modal
    const handleEditPart = (item: InventoryItem) => {
        setEditingPart(item);
        setEditPart({
            part_name: item.name,
            category: item.category,
            quantity: item.quantity,
            price_per_unit: item.cost,
        });
        setIsEditOpen(true);
    };

    // Handle updating part
    const handleUpdatePart = async () => {
        if (!editingPart || !editPart.part_name || !editPart.category || editPart.quantity < 0 || editPart.price_per_unit <= 0) {
            alert('Please fill all required fields with valid values');
            return;
        }

        try {
            const partId = extractPartId(editingPart.id);
            const updatedPart = await updateSparePart(partId, {
                part_name: editPart.part_name,
                category: editPart.category,
                quantity: editPart.quantity,
                price_per_unit: editPart.price_per_unit
            });

            // Update part in inventory
            const updatedInventoryItem = convertSparePartToInventory(updatedPart);
            setInventory(prev => prev.map(item => 
                item.id === editingPart.id ? updatedInventoryItem : item
            ));

            setIsEditOpen(false);
            setEditingPart(null);
        } catch (error) {
            console.error('Failed to update spare part:', error);
            alert('Failed to update spare part. Please try again.');
        }
    };

    // Handle deleting part
    const handleDeletePart = async (item: InventoryItem) => {
        if (!confirm(`Are you sure you want to delete ${item.name}?`)) {
            return;
        }

        try {
            const partId = extractPartId(item.id);
            await deleteSparePart(partId);

            // Remove part from inventory
            setInventory(prev => prev.filter(i => i.id !== item.id));
        } catch (error) {
            console.error('Failed to delete spare part:', error);
            alert('Failed to delete spare part. Please try again.');
        }
    };

    // Handle quantity adjustment
    const adjustQuantity = (delta: number) => {
        setEditPart(prev => ({
            ...prev,
            quantity: Math.max(0, prev.quantity + delta)
        }));
    };

    return (
        <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="font-serif text-3xl text-stone-900">{t('inventory.management')}</h2>
                    <p className="text-stone-500 mt-1">{t('inventory.trackParts')}</p>
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
                <div className="p-4 border-b border-stone-200 flex gap-4 bg-stone-50 items-center">
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
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all duration-200">
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
                        <thead className="bg-stone-50 sticky top-0 z-[1] text-xs font-semibold text-stone-500 uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-3.5 border-b border-stone-200">{t('inventory.partInfo')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">{t('inventory.category')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">{t('inventory.location')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">{t('inventory.stockLevel')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200 text-right">{t('inventory.value')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">{t('inventory.status')}</th>
                                <th className="px-6 py-3.5 border-b border-stone-200">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 text-sm">
                            {loadingData ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-8 h-8 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin"/>
                                            <span className="text-stone-500">Loading inventory data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInventory.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Package className="w-12 h-12 text-stone-300" />
                                            <span className="text-stone-500">No inventory items found</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                            filteredInventory.map((item) => {
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
                                            <div className="text-[10px] text-stone-400 mt-0.5">{t('inventory.minLevel')}: {item.minLevel}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-stone-700">
                                            ${(item.cost * item.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    <ArrowDown size={12} /> {t('inventory.lowStock')}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <ArrowUp size={12} /> {t('inventory.inStock')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleEditPart(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                    title="Edit Part"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePart(item)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                    title="Delete Part"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Part Modal */}
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
                                    value={newPart.part_name}
                                    onChange={(e) => setNewPart(p => ({ ...p, part_name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                                <input
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    value={newPart.category}
                                    onChange={(e) => setNewPart(p => ({ ...p, category: e.target.value }))}
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
                                        value={newPart.price_per_unit}
                                        onChange={(e) => setNewPart(p => ({ ...p, price_per_unit: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
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
                                onClick={handleAddPart}
                            >
                                Add Part
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Part Modal */}
            {isEditOpen && editingPart && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-stone-200">
                        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-stone-900">Edit Part</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-stone-500 hover:text-stone-700">✕</button>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Name</label>
                                <input
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    value={editPart.part_name}
                                    onChange={(e) => setEditPart(p => ({ ...p, part_name: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-stone-700 mb-1">Category</label>
                                <input
                                    className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    value={editPart.category}
                                    onChange={(e) => setEditPart(p => ({ ...p, category: e.target.value }))}
                                />
                            </div>
                            <div className="grid grid-cols-5 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Quantity</label>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => adjustQuantity(-1)}
                                            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
                                            disabled={editPart.quantity <= 0}
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <input
                                            type="number"
                                            min={0}
                                            className="flex-1 px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-center"
                                            value={editPart.quantity}
                                            onChange={(e) => setEditPart(p => ({ ...p, quantity: Math.max(0, Number(e.target.value)) }))}
                                        />
                                        <button
                                            onClick={() => adjustQuantity(1)}
                                            className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-stone-700 mb-1">Price / Unit</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        value={editPart.price_per_unit}
                                        onChange={(e) => setEditPart(p => ({ ...p, price_per_unit: Number(e.target.value) }))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-stone-200 flex justify-end gap-2">
                            <button
                                className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                onClick={handleUpdatePart}
                            >
                                Update Part
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;