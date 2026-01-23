
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Package, Upload, Camera, LayoutGrid } from 'lucide-react';

export function CreateProductModal({ isOpen, onClose, onSuccess, storeId, categories }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        quantity: ''
    });

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let image_url = null;

            // 1. Upload Image to Supabase Storage if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${storeId}/${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, imageFile);

                if (uploadError) throw new Error('Product image upload failed. Please ensure "products" bucket exists and is public.');

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                image_url = publicUrl;
            }

            // 2. Insert into Database
            const { data, error: insertError } = await supabase
                .from('products')
                .insert([{
                    store_id: storeId,
                    name: formData.name,
                    description: formData.description,
                    price: parseFloat(formData.price),
                    category_id: formData.category_id || null,
                    quantity: parseInt(formData.quantity) || 0,
                    image_url: image_url,
                    is_active: true
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            onSuccess(data);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', category_id: '', quantity: '' });
        setImageFile(null);
        setImagePreview(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={handleClose} type="button" className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="text-center sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <Package className="h-5 w-5 mr-2 text-indigo-600" />
                            Add New Product
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Create a new product with inventory tracking.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Image Section */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                            <div className="flex items-start space-x-6">
                                <div className="relative h-32 w-32 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden group shadow-inner">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <Camera className="h-10 w-10 text-slate-300" />
                                    )}
                                    <label htmlFor="product-upload" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Upload className="h-6 w-6 text-white" />
                                    </label>
                                </div>
                                <div className="flex-1 space-y-2 pt-2">
                                    <input type="file" id="product-upload" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    <button type="button" onClick={() => document.getElementById('product-upload').click()} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 block">
                                        {imagePreview ? 'Change Product Image' : 'Select Product Image'}
                                    </button>
                                    <p className="text-[11px] text-slate-400">High quality square images (1:1) work best for store displays.</p>
                                    {imagePreview && (
                                        <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="text-xs font-semibold text-red-500 hover:text-red-600">
                                            Remove Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <Input
                                label="Product Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Enter product title"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border h-24"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe your product features..."
                            />
                        </div>

                        <Input
                            label="Price ($)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            placeholder="0.00"
                        />

                        <Input
                            label="Initial Quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                            placeholder="0"
                        />

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            >
                                <option value="">No Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {error && (
                            <div className="sm:col-span-2">
                                <p className="text-sm text-red-600 mt-2 p-2 bg-red-50 rounded border border-red-100">{error}</p>
                            </div>
                        )}

                        <div className="sm:col-span-2 mt-4 flex space-x-3 flex-row-reverse">
                            <Button type="submit" className="flex-1 sm:flex-initial" isLoading={loading}>
                                Create Product
                            </Button>
                            <Button type="button" variant="secondary" className="flex-1 sm:flex-initial" onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
