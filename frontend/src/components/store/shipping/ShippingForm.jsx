import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { supabase } from '../../../lib/supabase';
import {
    X,
    Save,
    MapPin,
    DollarSign,
    Box,
    LayoutGrid,
    AlertCircle,
    CheckCircle2,
    Truck,
    ChevronDown,
    ChevronRight,
    Globe
} from 'lucide-react';
import { countries } from '../../../lib/countries';

export function ShippingForm({ storeId, rate = null, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        amount: '',
        country: '',
        region: '',
        min_order_value: 0,
        applies_to: 'all', // all | specific_products | specific_categories
        included_product_ids: [],
        included_category_ids: [],
        excluded_product_ids: [],
        included_category_ids: [],
        excluded_product_ids: [],
        is_active: true,
        accepts_cod: true
    });

    const [manualExcludeId, setManualExcludeId] = useState('');
    const [manualIncludeId, setManualIncludeId] = useState('');
    const [hasMinOrder, setHasMinOrder] = useState(false);
    const [isExclusionExpanded, setIsExclusionExpanded] = useState(false);

    // Country Logic
    const [selectedCountryObj, setSelectedCountryObj] = useState(null);

    useEffect(() => {
        if (rate) {
            setFormData({
                ...rate,
                included_product_ids: rate.included_product_ids || [],
                included_category_ids: rate.included_category_ids || [],
                excluded_product_ids: rate.excluded_product_ids || []
            });
            if (rate.min_order_value && rate.min_order_value > 0) {
                setHasMinOrder(true);
            }
            if (rate.country) {
                const cObj = countries.find(c => c.code === rate.country);
                setSelectedCountryObj(cObj || null);
            }
        }
        fetchStoreData();
    }, [storeId, rate]);

    const fetchStoreData = async () => {
        const { data: pData } = await supabase.from('products').select('id, name, image_urls, category_id').eq('store_id', storeId);
        const { data: cData } = await supabase.from('product_categories').select('id, name, parent_id').eq('store_id', storeId);

        if (pData) setProducts(pData);
        if (cData) setCategories(cData);
    };

    // Sort Categories by Hierarchy (Parent > Child)
    const getSortedCategories = () => {
        const buildTree = (cats) => {
            const map = {};
            const roots = [];
            cats.forEach(c => {
                map[c.id] = { ...c, children: [] };
            });
            cats.forEach(c => {
                if (c.parent_id && map[c.parent_id]) {
                    map[c.parent_id].children.push(map[c.id]);
                } else {
                    roots.push(map[c.id]);
                }
            });
            return roots;
        };

        const flatten = (nodes, level = 0, result = []) => {
            nodes.forEach(node => {
                result.push({ ...node, level });
                if (node.children?.length > 0) {
                    flatten(node.children, level + 1, result);
                }
            });
            return result;
        };

        const tree = buildTree(categories);
        return flatten(tree);
    };

    const sortedCats = getSortedCategories();

    const handleCountryChange = (e) => {
        const code = e.target.value;
        const country = countries.find(c => c.code === code);
        setSelectedCountryObj(country || null);
        setFormData(prev => ({ ...prev, country: code, region: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                store_id: storeId,
                amount: parseFloat(formData.amount),
                min_order_value: hasMinOrder ? parseFloat(formData.min_order_value || 0) : null,
                included_product_ids: formData.applies_to === 'specific_products' ? formData.included_product_ids : [],
                included_category_ids: formData.applies_to === 'specific_categories' ? formData.included_category_ids : [],
                included_category_ids: formData.applies_to === 'specific_categories' ? formData.included_category_ids : [],
                excluded_product_ids: (formData.applies_to === 'all' || formData.applies_to === 'specific_categories') ? formData.excluded_product_ids : [],
                accepts_cod: formData.accepts_cod
            };

            if (!payload.name) throw new Error('Shipping Name is required');
            if (payload.amount < 0) throw new Error('Shipping Amount cannot be negative');
            if (!payload.country) throw new Error('Country is required');

            let error;
            if (rate?.id) {
                const { error: err } = await supabase.from('shipping_rates').update(payload).eq('id', rate.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('shipping_rates').insert([payload]);
                error = err;
            }

            if (error) throw error;
            onSuccess();
        } catch (err) {
            alert('Error saving shipping rate: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id, type) => {
        const field = type === 'product' ? 'included_product_ids' : 'included_category_ids';
        const current = formData[field] || [];
        let updated;
        if (current.includes(id)) {
            updated = current.filter(item => item !== id);
        } else {
            updated = [...current, id];
        }
        setFormData({ ...formData, [field]: updated });
    };

    const toggleExclusion = (id) => {
        const current = formData.excluded_product_ids || [];
        let updated;
        if (current.includes(id)) {
            updated = current.filter(item => item !== id);
        } else {
            updated = [...current, id];
        }
        setFormData({ ...formData, excluded_product_ids: updated });
    };

    const handleManualExcludeById = () => {
        if (!manualExcludeId.trim()) return;
        const id = manualExcludeId.trim();
        const exists = products.find(p => p.id === id);
        if (exists) {
            if (!formData.excluded_product_ids.includes(id)) {
                setFormData(prev => ({ ...prev, excluded_product_ids: [...prev.excluded_product_ids, id] }));
            }
            setManualExcludeId('');
        } else {
            alert('Product ID not found in catalog.');
        }
    };

    const handleManualIncludeById = () => {
        if (!manualIncludeId.trim()) return;
        const id = manualIncludeId.trim();
        const exists = products.find(p => p.id === id);
        if (exists) {
            if (!formData.included_product_ids.includes(id)) {
                setFormData(prev => ({ ...prev, included_product_ids: [...prev.included_product_ids, id] }));
            }
            setManualIncludeId('');
        } else {
            alert('Product ID not found in catalog.');
        }
    };

    const candidateProductsForExclusion = formData.applies_to === 'all'
        ? products
        : formData.applies_to === 'specific_categories'
            ? products.filter(p => formData.included_category_ids.includes(p.category_id))
            : [];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl rounded-2xl">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {rate ? 'Edit Shipping Rate' : 'Create Shipping Rate'}
                            </h2>
                            <p className="text-sm text-slate-500">Configure delivery rules and costs</p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 1. Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Shipping Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Standard Express"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    rows="2"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 2. Location & Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                                    <div className="relative">
                                        <select
                                            className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none appearance-none bg-white"
                                            value={formData.country}
                                            onChange={handleCountryChange}
                                            required
                                        >
                                            <option value="">Select Country...</option>
                                            {countries.map(c => (
                                                <option key={c.code} value={c.code}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                                {selectedCountryObj?.regions && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Region/State/Province</label>
                                        <div className="relative">
                                            <select
                                                className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none appearance-none bg-white"
                                                value={formData.region || ''}
                                                onChange={e => setFormData({ ...formData, region: e.target.value })}
                                            >
                                                <option value="">All Regions</option>
                                                {selectedCountryObj.regions.map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                            <div className="absolute left-3 top-2.5 text-slate-400 pointer-events-none">
                                                <MapPin className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Shipping Rate</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 px-4 py-2 text-lg font-bold rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                    <div className="absolute left-3 top-3 text-slate-400">
                                        <DollarSign className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">Flat rate amount charged at checkout.</p>
                            </div>
                        </div>

                        {/* 3. Applicability */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700">Applies To</label>
                            <div className="flex flex-wrap gap-3">
                                {['all', 'specific_products', 'specific_categories'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, applies_to: type })}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.applies_to === type
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                            }`}
                                    >
                                        {type === 'all' && 'All Products'}
                                        {type === 'specific_products' && 'Specific Products'}
                                        {type === 'specific_categories' && 'Specific Categories'}
                                    </button>
                                ))}
                            </div>

                            {/* Selection Include Areas */}
                            {formData.applies_to === 'specific_products' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Select Products</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter Product ID"
                                                className="px-3 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                                value={manualIncludeId}
                                                onChange={(e) => setManualIncludeId(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualIncludeById}
                                                className="px-3 py-1 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {products.map(product => (
                                            <label key={product.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.included_product_ids.includes(product.id)}
                                                    onChange={() => toggleSelection(product.id, 'product')}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                />
                                                {product.image_urls?.[0] && (
                                                    <img src={product.image_urls[0]} alt="" className="w-8 h-8 rounded bg-slate-100 object-cover" />
                                                )}
                                                <div>
                                                    <span className="text-sm text-slate-700 font-medium block">{product.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">{product.id}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {formData.applies_to === 'specific_categories' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Select Categories</p>
                                    <div className="space-y-2">
                                        {sortedCats.map(cat => (
                                            <label key={cat.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors">
                                                <div style={{ width: `${cat.level * 20}px` }}></div>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.included_category_ids.includes(cat.id)}
                                                    onChange={() => toggleSelection(cat.id, 'category')}
                                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                                />
                                                <div className="flex items-center space-x-2">
                                                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-700 font-medium">{cat.name}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Exclusions (Collapsible) */}
                        {(formData.applies_to === 'all' || formData.applies_to === 'specific_categories') && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div
                                    className="flex items-center justify-between cursor-pointer group"
                                    onClick={() => setIsExclusionExpanded(!isExclusionExpanded)}
                                >
                                    <div className="flex items-center space-x-2">
                                        {isExclusionExpanded ? (
                                            <ChevronDown className="w-4 h-4 text-slate-500" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 text-slate-500" />
                                        )}
                                        <label className="block text-sm font-bold text-red-600 cursor-pointer select-none">Exclude Products</label>
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formData.excluded_product_ids.length} excluded
                                    </div>
                                </div>

                                {isExclusionExpanded && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Paste Product ID"
                                                className="flex-1 px-3 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-red-500"
                                                value={manualExcludeId}
                                                onChange={(e) => setManualExcludeId(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleManualExcludeById}
                                                className="px-3 py-1 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                            >
                                                Add
                                            </button>
                                        </div>

                                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 max-h-60 overflow-y-auto">
                                            <div className="space-y-2">
                                                {candidateProductsForExclusion.map(product => (
                                                    <label key={product.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 hover:border-red-200 cursor-pointer transition-colors group">
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.excluded_product_ids.includes(product.id)}
                                                            onChange={() => toggleExclusion(product.id)}
                                                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500 border-gray-300"
                                                        />
                                                        {product.image_urls?.[0] && (
                                                            <img src={product.image_urls[0]} alt="" className="w-8 h-8 rounded bg-slate-100 object-cover grayscale group-hover:grayscale-0 transition-all" />
                                                        )}
                                                        <div>
                                                            <span className="text-sm text-slate-700 font-medium group-hover:text-red-700">{product.name}</span>
                                                            <p className="text-[10px] text-slate-400 font-mono">{product.id}</p>
                                                        </div>
                                                    </label>
                                                ))}
                                                {candidateProductsForExclusion.length === 0 && (
                                                    <p className="text-sm text-slate-400 italic">No matching products found.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 5. Conditions */}
                        <div className="pt-4 border-t border-slate-100">
                            <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 mb-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasMinOrder}
                                    onChange={(e) => setHasMinOrder(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                />
                                <span>Minimum Order Value (for free shipping eligibility or rate applicability)</span>
                            </label>
                            {hasMinOrder && (
                                <div className="max-w-xs relative animate-in fade-in slide-in-from-top-1">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        value={formData.min_order_value}
                                        onChange={e => setFormData({ ...formData, min_order_value: e.target.value })}
                                    />
                                    <div className="absolute left-3 top-2.5 text-slate-400">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
                        <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.accepts_cod}
                                onChange={(e) => setFormData({ ...formData, accepts_cod: e.target.checked })}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                            />
                            <span>Accept Cash on Delivery (COD)</span>
                        </label>
                        <p className="text-xs text-slate-400 pl-6 -mt-2">Uncheck this if you want to disable COD for this shipping rate.</p>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4 rounded-b-2xl">
                        <Button variant="ghost" type="button" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Rate'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
