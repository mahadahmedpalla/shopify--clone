import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Palette } from 'lucide-react';

export function CreateThemeModal({ isOpen, onClose, onSuccess, developerId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_credits: 0,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (!developerId) throw new Error("Developer ID not found.");

            const { error: insertError } = await supabase
                .from('themes')
                .insert([{
                    developer_id: developerId,
                    name: formData.name,
                    description: formData.description,
                    price_credits: parseInt(formData.price_credits) || 0,
                    status: 'draft',
                    tags: []
                }]);

            if (insertError) throw insertError;

            onSuccess();
        } catch (err) {
            console.error("Theme creation error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Theme</h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500 mb-4">
                                    Start building a new theme for the marketplace.
                                </p>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input
                                        label="Theme Name"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g. Modern Dark"
                                    />

                                    <div>
                                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            id="description"
                                            name="description"
                                            rows={3}
                                            value={formData.description}
                                            onChange={handleChange}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                            placeholder="Describe your theme features..."
                                        />
                                    </div>

                                    <Input
                                        label="Price (Credits)"
                                        id="price_credits"
                                        name="price_credits"
                                        type="number"
                                        min="0"
                                        value={formData.price_credits}
                                        onChange={handleChange}
                                        required
                                    />

                                    {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

                                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                        <Button type="submit" className="w-full sm:ml-3 sm:w-auto" isLoading={loading}>
                                            Create Theme
                                        </Button>
                                        <Button type="button" variant="secondary" className="mt-3 w-full sm:mt-0 sm:w-auto" onClick={onClose}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
