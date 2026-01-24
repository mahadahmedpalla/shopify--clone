
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Edit3, Save } from 'lucide-react';

export function EditProductModal({ isOpen, product, categories, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [category_id, setCategoryId] = useState('');
    const [variantData, setVariantData] = useState([]);

    useEffect(() => {
        if (product) {
            setCategoryId(product.category_id || '');
            setVariantData(product.product_variants || []);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleUpdateVariant = (index, field, value) => {
        const newVariants = [...variantData];
        newVariants[index][field] = value;
        setVariantData(newVariants);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Update Category on Product
            const { error: productError } = await supabase
                .from('products')
                .update({
                    category_id: category_id || null,
                    updated_at: new Date()
                })
                .eq('id', product.id);

            if (productError) throw productError;

            // 2. Update all variants
            for (const v of variantData) {
                const { error: vError } = await supabase
                    .from('product_variants')
                    .update({
                        price: parseFloat(v.price),
                        quantity: parseInt(v.quantity) || 0,
                        updated_at: new Date()
                    })
                    .eq('id', v.id);

                if (vError) throw vError;
            }

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-8 z-50">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center">
                                <Edit3 className="h-5 w-5 mr-3 text-indigo-600" />
                                Edit Inventory Details
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">Refining <b>{product.name}</b></p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X className="h-5 w-5" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Global Category */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Global Categorization</label>
                            <select
                                className="w-full bg-white rounded-xl border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm p-2.5"
                                value={category_id}
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">No Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Variants Management */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Sellable Units (SKUs)</h4>
                            <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 italic text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-4">Variant</th>
                                            <th className="px-5 py-4 w-32">Price ($)</th>
                                            <th className="px-5 py-4 w-32 text-right">Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {variantData.map((v, i) => (
                                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-slate-700">
                                                    {v.combination && Object.keys(v.combination).length > 0
                                                        ? Object.entries(v.combination).map(([k, val]) => `${k}: ${val}`).join(' / ')
                                                        : 'Default Variation'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full bg-indigo-50/50 border-b-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold py-1 px-2 rounded-t-sm"
                                                        value={v.price}
                                                        onChange={(e) => handleUpdateVariant(i, 'price', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <input
                                                        type="number"
                                                        className="w-full text-right bg-indigo-50/50 border-b-2 border-indigo-100 focus:border-indigo-500 outline-none font-bold py-1 px-2 rounded-t-sm"
                                                        value={v.quantity}
                                                        onChange={(e) => handleUpdateVariant(i, 'quantity', e.target.value)}
                                                        required
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 p-3 bg-red-50 rounded-xl border border-red-100">{error}</p>
                        )}

                        <div className="flex space-x-4 pt-4">
                            <Button type="submit" className="flex-1 py-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold flex items-center justify-center transition-all shadow-lg shadow-indigo-100" isLoading={loading}>
                                <Save className="h-4 w-4 mr-3" />
                                Commit Changes
                            </Button>
                            <Button type="button" variant="secondary" className="px-8 rounded-xl" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
