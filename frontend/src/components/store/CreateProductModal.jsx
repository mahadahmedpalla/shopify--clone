
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Package, Upload } from 'lucide-react';

export function CreateProductModal({ isOpen, onClose, onSuccess, storeId, categories = [] }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category_id: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: insertError } = await supabase
                .from('products')
                .insert([{
                    store_id: storeId,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price) || 0,
                    quantity: parseInt(formData.quantity) || 0,
                    category_id: formData.category_id || null,
                    is_active: true
                }]);

            if (insertError) throw insertError;
            onSuccess();
            setFormData({ name: '', description: '', price: '', quantity: '', category_id: '' });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                <div className="relative bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold flex items-center">
                            <Package className="h-5 w-5 mr-2 text-indigo-600" />
                            Add Product
                        </h3>
                        <button onClick={onClose}><X className="h-5 w-5 text-gray-400" /></button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Product Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="w-full border rounded-md p-2 text-sm bg-white"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">No Category</option>
                                {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                        </div>

                        {error && <p className="text-sm text-red-600 italic">{error}</p>}

                        <div className="flex space-x-3 pt-4">
                            <Button type="submit" className="flex-1" isLoading={loading}>Create Product</Button>
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
