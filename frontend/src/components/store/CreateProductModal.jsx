
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Package, Upload, Camera, LayoutGrid } from 'lucide-react';
import { validateStorageAllowance, trackStorageUpload } from '../../lib/storageHelper';

export function CreateProductModal({ isOpen, onClose, onSuccess, storeId, categories }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [imageFiles, setImageFiles] = useState([]); // Array of files
    const [imagePreviews, setImagePreviews] = useState([]); // Array of strings
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category_id: '',
        quantity: ''
    });

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newFiles = [...imageFiles, ...files];
            setImageFiles(newFiles);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);

        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const uploadedUrls = [];

            // 0. Check Storage Allowance (Lightweight)
            const totalUploadSize = imageFiles.reduce((acc, file) => acc + file.size, 0);
            if (totalUploadSize > 0) {
                await validateStorageAllowance(storeId, totalUploadSize);
            }

            // 1. Upload All Images to Supabase Storage
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${storeId}/${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(filePath, file);

                if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);

                // Update storage usage in DB
                await trackStorageUpload(storeId, file.size);
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
                    image_urls: uploadedUrls,
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
        setImageFiles([]);
        setImagePreviews([]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Helper to render flattened categories with indentation
    const getFlattenedOptions = (items, parentId = null, depth = 0) => {
        let options = [];
        items
            .filter(item => {
                // Handle equality loosely to catch null/undefined or ID type mismatches
                const itemParentId = item.parent_id || null;
                const targetParentId = parentId || null;
                return itemParentId == targetParentId;
            })
            .forEach(item => {
                options.push({ ...item, depth });
                options = [...options, ...getFlattenedOptions(items, item.id, depth + 1)];
            });
        return options;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 z-50">
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
                            Create a new product with multiple images for the gallery.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                        {/* Image Gallery Upload */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Product Gallery (Multi-upload)</label>
                            <div className="flex flex-wrap gap-4">
                                {imagePreviews.map((preview, idx) => (
                                    <div key={idx} className="relative h-24 w-24 rounded-lg overflow-hidden border border-slate-200 group shadow-sm">
                                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => document.getElementById('product-multi-upload').click()}
                                    className="h-24 w-24 rounded-lg bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"
                                >
                                    <Upload className="h-6 w-6 mb-1" />
                                    <span className="text-[10px] font-bold">Add Photo</span>
                                </button>
                                <input
                                    type="file"
                                    id="product-multi-upload"
                                    className="hidden"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                            </div>
                            <p className="text-[11px] text-slate-400">Add multiple images for your product showcase.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                                    {getFlattenedOptions(categories).map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {'\u00A0'.repeat(cat.depth * 4)} {cat.depth > 0 ? '↳ ' : ''} {cat.name}
                                        </option>
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
