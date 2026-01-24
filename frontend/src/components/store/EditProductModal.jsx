
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Edit3 } from 'lucide-react';

export function EditProductModal({ isOpen, product, categories = [], onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        quantity: '',
        category_id: ''
    });

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || '',
                price: (product.price || 0).toString(),
                quantity: (product.quantity || 0).toString(),
                category_id: product.category_id || ''
            });
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    name: formData.name,
                    price: parseFloat(formData.price) || 0,
                    quantity: parseInt(formData.quantity) || 0,
                    category_id: formData.category_id || null,
                    updated_at: new Date()
                })
                .eq('id', product.id);

            if (updateError) throw updateError;
            onSuccess();
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
                            <Edit3 className="h-5 w-5 mr-2 text-indigo-600" />
                            Edit Product
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
                            <Button type="submit" className="flex-1" isLoading={loading}>Save Changes</Button>
                            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
