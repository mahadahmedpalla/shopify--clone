import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { supabase } from '../../../lib/supabase';
import {
    X,
    Save,
    Calendar,
    DollarSign,
    Percent,
    Box,
    LayoutGrid,
    AlertCircle,
    CheckCircle2,
    Users
} from 'lucide-react';

export function DiscountForm({ storeId, discount = null, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discount_type: 'percentage', // percentage | fixed_amount
        value: '',
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: null,
        min_order_value: 0,
        applies_to: 'all', // all | specific_products | specific_categories
        included_product_ids: [],
        included_category_ids: [],
        is_active: true
    });

    // ... inside function
    const [hasMinOrder, setHasMinOrder] = useState(false);

    useEffect(() => {
        if (discount) {
            setFormData({
                ...discount,
                ends_at: discount.ends_at ? discount.ends_at.slice(0, 16) : '',
                starts_at: discount.starts_at ? discount.starts_at.slice(0, 16) : ''
            });
            // Initialize checkbox state
            if (discount.min_order_value && discount.min_order_value > 0) {
                setHasMinOrder(true);
            }
        }
        fetchStoreData();
    }, [storeId, discount]);

    const fetchStoreData = async () => {
        // Fetch products and categories (including parent_id for hierarchy)
        const { data: pData } = await supabase.from('products').select('id, name, image_urls').eq('store_id', storeId);
        const { data: cData } = await supabase.from('categories').select('id, name, parent_id').eq('store_id', storeId);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                store_id: storeId,
                value: parseFloat(formData.value),
                min_order_value: hasMinOrder ? parseFloat(formData.min_order_value || 0) : null, // Set to null if unchecked
                ends_at: formData.ends_at || null,
                included_product_ids: formData.applies_to === 'specific_products' ? formData.included_product_ids : [],
                included_category_ids: formData.applies_to === 'specific_categories' ? formData.included_category_ids : []
            };

            // ... (rest of submit logic remains same)

            let error;
            if (discount?.id) {
                const { error: err } = await supabase.from('discounts').update(payload).eq('id', discount.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('discounts').insert([payload]);
                error = err;
            }

            if (error) throw error;
            onSuccess();
        } catch (err) {
            alert('Error saving discount: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // ... toggleSelection ... No change


    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white p-0 shadow-2xl rounded-2xl">
                <form onSubmit={handleSubmit}>
                    {/* Header... (No Change) */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                {discount ? 'Edit Discount' : 'Create New Discount'}
                            </h2>
                            <p className="text-sm text-slate-500">Define your promotion rules</p>
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
                        {/* 1. Basic Info (No Change) */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Discount Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Summer Sale, BFCM2024"
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

                        {/* 2. Value & Type (No Change) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Discount Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-slate-200 transition-all font-bold text-sm ${formData.discount_type === 'percentage'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                            : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        <Percent className="w-4 h-4" />
                                        <span>Percentage</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, discount_type: 'fixed_amount' })}
                                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border border-slate-200 transition-all font-bold text-sm ${formData.discount_type === 'fixed_amount'
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                            : 'hover:bg-slate-50 text-slate-600'
                                            }`}
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        <span>Fixed Amount</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Value</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        className="w-full pl-10 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    />
                                    <div className="absolute left-3 top-3 text-slate-400">
                                        {formData.discount_type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                                    </div>
                                </div>
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

                            {/* Selection Areas */}
                            {formData.applies_to === 'specific_products' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Select Products</p>
                                    <div className="space-y-2">
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
                                                <span className="text-sm text-slate-700 font-medium">{product.name}</span>
                                            </label>
                                        ))}
                                        {products.length === 0 && <p className="text-sm text-slate-400">No products found.</p>}
                                    </div>
                                </div>
                            )}

                            {formData.applies_to === 'specific_categories' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3">Select Categories</p>
                                    <div className="space-y-2">
                                        {sortedCats.map(cat => (
                                            <label key={cat.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors">
                                                {/* INDENTATION */}
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
                                        {sortedCats.length === 0 && <p className="text-sm text-slate-400">No categories found.</p>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 4. Limits & Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="flex items-center space-x-2 text-sm font-bold text-slate-700 mb-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={hasMinOrder}
                                        onChange={(e) => setHasMinOrder(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <span>Minimum Order Value</span>
                                </label>
                                <div className={`relative transition-opacity ${!hasMinOrder ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <input
                                        type="number"
                                        min="0"
                                        disabled={!hasMinOrder}
                                        className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                        value={formData.min_order_value}
                                        onChange={e => setFormData({ ...formData, min_order_value: e.target.value })}
                                        placeholder={!hasMinOrder ? 'No minimum' : '0.00'}
                                    />
                                    <div className="absolute left-3 top-2.5 text-slate-400">
                                        <DollarSign className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Starts At</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                        value={formData.starts_at}
                                        onChange={e => setFormData({ ...formData, starts_at: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Ends At</label>
                                    <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                        value={formData.ends_at || ''}
                                        onChange={e => setFormData({ ...formData, ends_at: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4 rounded-b-2xl">
                        <Button variant="ghost" type="button" onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Discount'}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
