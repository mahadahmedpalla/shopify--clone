
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Edit3, Save } from 'lucide-react';

export function EditProductModal({ isOpen, product, categories, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        category_id: '',
        price: '',
        quantity: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                category_id: product.category_id || '',
                price: product.price ? product.price.toString() : '0',
                quantity: product.quantity ? product.quantity.toString() : '0'
            });
        }
    }, [product]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    category_id: formData.category_id || null,
                    price: parseFloat(formData.price),
                    quantity: parseInt(formData.quantity) || 0,
                    updated_at: new Date()
                })
                .eq('id', product.id);

            if (updateError) throw updateError;

            // 2. Automatically sync price with variants that are using base price
            const newPrice = parseFloat(formData.price);
            if (newPrice !== product.price) {
                await supabase
                    .from('product_variants')
                    .update({ price: newPrice })
                    .eq('product_id', product.id)
                    .eq('use_base_price', true);
            }

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper to render flattened categories with indentation
    const getFlattenedOptions = (items, parentId = null, depth = 0) => {
        let options = [];
        items
            .filter(item => item.parent_id === parentId)
            .forEach(item => {
                options.push({ ...item, depth });
                options = [...options, ...getFlattenedOptions(items, item.id, depth + 1)];
            });
        return options;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="text-center sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <Edit3 className="h-5 w-5 mr-2 text-indigo-600" />
                            Edit Product Details
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Update the category, price, or quantity for <b>{product.name}</b>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">No Category</option>
                                {getFlattenedOptions(categories).map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                        {'\u00A0'.repeat(cat.depth * 4)} {cat.depth > 0 ? '↳ ' : ''} {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <Input
                            label="Price ($)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />

                        <Input
                            label="Quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                        />

                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="mt-5 sm:ml-3 sm:flex sm:flex-row-reverse space-x-3 space-x-reverse">
                            <Button type="submit" className="w-full sm:w-auto" isLoading={loading}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                            <Button type="button" variant="secondary" className="mt-3 sm:mt-0 w-full sm:w-auto" onClick={onClose}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
