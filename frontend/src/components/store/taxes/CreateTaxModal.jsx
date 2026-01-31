import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { supabase } from '../../../lib/supabase';
import {
    X,
    LayoutGrid,
    Globe,
    DollarSign,
    Percent,
    Hash,
    ChevronDown,
    ChevronRight,
    Search
} from 'lucide-react';

const COUNTRIES = [
    "United States", "Canada", "United Kingdom", "Australia", "Germany", "France",
    "India", "Japan", "China", "Brazil", "Mexico", "Italy", "Spain", "Netherlands",
    "Sweden", "Norway", "Denmark", "Finland", "Singapore", "New Zealand", "Pakistan"
    // Extend as needed
].sort();

export function CreateTaxModal({ storeId, tax = null, onSuccess, onCancel }) {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        country: 'United States',
        type: 'percentage', // percentage | fixed
        value: '',
        applies_to: 'all', // all | specific_products | specific_categories
        included_product_ids: [],
        included_category_ids: [],
        excluded_product_ids: [],
        excluded_category_ids: [],
        is_active: true,
        apply_per_item: true
    });

    const [isExclusionExpanded, setIsExclusionExpanded] = useState(false);
    const [manualIncludeId, setManualIncludeId] = useState('');
    const [manualExcludeId, setManualExcludeId] = useState('');

    useEffect(() => {
        if (tax) {
            setFormData({
                ...tax,
                included_product_ids: tax.included_product_ids || [],
                included_category_ids: tax.included_category_ids || [],
                excluded_product_ids: tax.excluded_product_ids || [],
                excluded_category_ids: tax.excluded_category_ids || [],
                apply_per_item: tax.apply_per_item !== undefined ? tax.apply_per_item : true
            });
        }
        fetchStoreData();
    }, [storeId, tax]);

    const fetchStoreData = async () => {
        const { data: pData } = await supabase.from('products').select('id, name, image_urls, category_id').eq('store_id', storeId);
        const { data: cData } = await supabase.from('product_categories').select('id, name, parent_id').eq('store_id', storeId);

        if (pData) setProducts(pData);
        if (cData) setCategories(cData);
    };

    // Helper to sort categories... (simplified for brevity or copy logic if needed)
    // For now simple list
    const sortedCats = categories;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                store_id: storeId,
                code: formData.code.toUpperCase().trim(),
                value: parseFloat(formData.value),
                included_product_ids: formData.applies_to === 'specific_products' ? formData.included_product_ids : [],
                included_category_ids: formData.applies_to === 'specific_categories' ? formData.included_category_ids : [],
                excluded_product_ids: (formData.applies_to === 'all' || formData.applies_to === 'specific_categories') ? formData.excluded_product_ids : [],
                // category exclusions could be implemented similarly
                excluded_category_ids: []
            };

            // Validation
            if (!payload.code) throw new Error('Tax Code is required');
            if (payload.value < 0) throw new Error('Value cannot be negative');

            let error;
            if (tax?.id) {
                const { error: err } = await supabase.from('taxes').update(payload).eq('id', tax.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('taxes').insert([payload]);
                error = err;
            }

            if (error) {
                if (error.code === '23505') throw new Error('Tax code already exists for this store.');
                throw error;
            }
            onSuccess();
        } catch (err) {
            alert('Error saving tax: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id, type) => {
        const field = type === 'product' ? 'included_product_ids' : 'included_category_ids';
        const current = formData[field] || [];
        const updated = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
        setFormData({ ...formData, [field]: updated });
    };

    const toggleExclusion = (id) => {
        const current = formData.excluded_product_ids || [];
        const updated = current.includes(id) ? current.filter(i => i !== id) : [...current, id];
        setFormData({ ...formData, excluded_product_ids: updated });
    };

    // Filter available items based on applies_to logic
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
                                {tax ? 'Edit Tax' : 'Create New Tax'}
                            </h2>
                            <p className="text-sm text-slate-500">Configure tax rules</p>
                        </div>
                        <button type="button" onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 1. Basic Info */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tax Name</label>
                                    <input
                                        type="text" required placeholder="e.g., VAT UK"
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Tax Code</label>
                                    <div className="relative">
                                        <input
                                            type="text" required placeholder="VAT-20"
                                            className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none uppercase font-mono"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        />
                                        <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Country</label>
                                <div className="relative">
                                    <select
                                        className="w-full pl-10 px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none appearance-none bg-white"
                                        value={formData.country}
                                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    >
                                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                    rows="1"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* 2. Value & Type */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tax Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'percentage' })}
                                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all font-bold text-sm ${formData.type === 'percentage' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <Percent className="w-4 h-4" />
                                        <span>Percentage</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'fixed' })}
                                        className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border transition-all font-bold text-sm ${formData.type === 'fixed' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                    >
                                        <DollarSign className="w-4 h-4" />
                                        <span>Fixed Amount</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Value</label>
                                <input
                                    type="number" required min="0" step="0.01"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                />
                            </div>
                        </div>


                        {/* Per Item Toggle (Only for Fixed) */}
                        {formData.type === 'fixed' && (
                            <div className="flex items-center space-x-3 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                <input
                                    type="checkbox"
                                    id="apply_per_item"
                                    checked={formData.apply_per_item}
                                    onChange={e => setFormData({ ...formData, apply_per_item: e.target.checked })}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                />
                                <label htmlFor="apply_per_item" className="cursor-pointer">
                                    <span className="block text-sm font-bold text-slate-800">Apply to each item</span>
                                    <span className="block text-xs text-slate-500">
                                        If unchecked, tax is applied once per order (if any item matches).
                                    </span>
                                </label>
                            </div>
                        )}

                        {/* 3. Applicability */}
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-slate-700">Applies To</label>
                            <div className="flex flex-wrap gap-3">
                                {['all', 'specific_products', 'specific_categories'].map((type) => (
                                    <button key={type} type="button" onClick={() => setFormData({ ...formData, applies_to: type })}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${formData.applies_to === type ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                                        {type === 'all' && 'All Products'}
                                        {type === 'specific_products' && 'Specific Products'}
                                        {type === 'specific_categories' && 'Specific Categories'}
                                    </button>
                                ))}
                            </div>

                            {/* Selectors */}
                            {formData.applies_to === 'specific_products' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto space-y-2">
                                    {products.map(p => (
                                        <label key={p.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                            <input type="checkbox" checked={formData.included_product_ids.includes(p.id)} onChange={() => toggleSelection(p.id, 'product')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            {p.image_urls?.[0] && <img src={p.image_urls[0]} className="w-8 h-8 rounded bg-slate-100 object-cover" />}
                                            <span className="text-sm font-medium">{p.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {formData.applies_to === 'specific_categories' && (
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-60 overflow-y-auto space-y-2">
                                    {sortedCats.map(c => (
                                        <label key={c.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                            <input type="checkbox" checked={formData.included_category_ids.includes(c.id)} onChange={() => toggleSelection(c.id, 'category')} className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500" />
                                            <LayoutGrid className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm font-medium">{c.name}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Exclusions */}
                        {(formData.applies_to === 'all' || formData.applies_to === 'specific_categories') && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between cursor-pointer group" onClick={() => setIsExclusionExpanded(!isExclusionExpanded)}>
                                    <div className="flex items-center space-x-2">
                                        {isExclusionExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                        <label className="block text-sm font-bold text-red-600 cursor-pointer">Exclude Products</label>
                                    </div>
                                    <div className="text-xs text-slate-400">{formData.excluded_product_ids.length} excluded</div>
                                </div>

                                {isExclusionExpanded && (
                                    <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 max-h-60 overflow-y-auto space-y-2">
                                        {candidateProductsForExclusion.map(p => (
                                            <label key={p.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-slate-100 cursor-pointer">
                                                <input type="checkbox" checked={formData.excluded_product_ids.includes(p.id)} onChange={() => toggleExclusion(p.id)} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
                                                {p.image_urls?.[0] && <img src={p.image_urls[0]} className="w-8 h-8 rounded bg-slate-100 object-cover" />}
                                                <span className="text-sm font-medium">{p.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4 rounded-b-2xl">
                        <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Tax'}</Button>
                    </div>
                </form>
            </Card>
        </div >
    );
}
