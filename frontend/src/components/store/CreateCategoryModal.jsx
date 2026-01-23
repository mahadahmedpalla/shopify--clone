
import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, LayoutGrid } from 'lucide-react';

export function CreateCategoryModal({ isOpen, onClose, onSuccess, storeId, parentOptions }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        parent_id: '',
        is_sub_category: false
    });

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: insertError } = await supabase
                .from('product_categories')
                .insert([{
                    store_id: storeId,
                    name: formData.name,
                    description: formData.description,
                    parent_id: formData.is_sub_category ? (formData.parent_id || null) : null,
                    is_active: true
                }])
                .select()
                .single();

            if (insertError) throw insertError;

            onSuccess(data);
            setFormData({ name: '', description: '', parent_id: '', is_sub_category: false });
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

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="text-center sm:text-left">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                            <LayoutGrid className="h-5 w-5 mr-2 text-indigo-600" />
                            Create Category
                        </h3>
                        <p className="mt-2 text-sm text-gray-500">
                            Add a new category or sub-category to your store.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <Input
                            label="Category Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g., Electronics, Summer Sale"
                            autoFocus
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border h-24"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Brief description of the category..."
                            />
                        </div>

                        <div className="flex items-center space-x-2 py-2">
                            <input
                                type="checkbox"
                                id="is_sub"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                checked={formData.is_sub_category}
                                onChange={(e) => setFormData({ ...formData, is_sub_category: e.target.checked })}
                            />
                            <label htmlFor="is_sub" className="text-sm font-medium text-gray-700">This is a sub-category</label>
                        </div>

                        {formData.is_sub_category && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                                <select
                                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    required
                                >
                                    <option value="">Select a parent category...</option>
                                    {parentOptions.map(parent => (
                                        <option key={parent.id} value={parent.id}>{parent.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                            <Button
                                type="submit"
                                className="w-full sm:ml-3 sm:w-auto"
                                isLoading={loading}
                            >
                                Create Category
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="mt-3 w-full sm:mt-0 sm:w-auto"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
