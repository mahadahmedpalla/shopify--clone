
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, CreditCard } from 'lucide-react';

export function CreateStoreModal({ isOpen, onClose, onSuccess, userId }) {
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        category_id: '',
        sub_url: '',
        description: '',
        email: '',
        logo_url: '',
        access_username: '',
        access_password: '', // In real app, hash this backend side or use specific auth flow. For MVP storing hash.
    });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            // Pre-fill email if possible or clear form
            setFormData(prev => ({ ...prev, sub_url: '' }));
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('store_categories').select('*');
        setCategories(data || []);
        if (data && data.length > 0 && !formData.category_id) {
            setFormData(prev => ({ ...prev, category_id: data[0].id }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { [name]: value };
            // Auto-generate sub-url from name if sub-url hasn't been manually edited
            if (name === 'name' && !prev.sub_url_touched) {
                updates.sub_url = value.toLowerCase().replace(/[^a-z0-9]/g, '-');
            }
            return { ...prev, ...updates };
        });
    };

    const handleSubUrlChange = (e) => {
        setFormData(prev => ({
            ...prev,
            sub_url: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            sub_url_touched: true
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 0. Ensure user profile exists (Fix for missing store_owners record)
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to create a store.");

            const { data: profile } = await supabase
                .from('store_owners')
                .select('id')
                .eq('id', user.id)
                .single();

            if (!profile) {
                // Profile missing, create it now
                console.log("Profile missing, creating...", user);
                const { error: createProfileError } = await supabase
                    .from('store_owners')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        full_name: user.user_metadata?.full_name || 'Store Owner',
                        credits: 0
                    }]);

                if (createProfileError) {
                    console.error("Failed to auto-create profile:", createProfileError);
                    throw new Error("Failed to initialize your account profile. Please contact support.");
                }
            }

            // 1. Check if sub-url is unique
            const { data: existing } = await supabase
                .from('stores')
                .select('id')
                .eq('sub_url', formData.sub_url)
                .single();

            throw new Error('Store URL is already taken. Please choose another.');
        }

            // 1.5 CHECK AND DEDUCT CREDITS
            const STORE_COST = 50;
        if ((profile.credits || 0) < STORE_COST) {
            throw new Error(`Insufficient credits. You need ${STORE_COST} credits to create a store. Current balance: ${profile.credits || 0}`);
        }

        // Deduct credits optimistically
        const { error: deductionError } = await supabase
            .from('store_owners')
            .update({ credits: profile.credits - STORE_COST })
            .eq('id', user.id);

        if (deductionError) throw new Error("Failed to process credit deduction.");

        // 2. Create store
        const { error: insertError } = await supabase
            .from('stores')
            .insert([{
                owner_id: user.id,
                name: formData.name,
                category_id: formData.category_id,
                sub_url: formData.sub_url,
                description: formData.description,
                email: formData.email,
                access_username: formData.access_username,
                access_password_hash: formData.access_password, // TODO: Hash this properly in backend!
                is_active: true
            }]);

        if (insertError) {
            // ROLLBACK: Refund credits if store creation fails
            await supabase
                .from('store_owners')
                .update({ credits: profile.credits }) // Restore original amount
                .eq('id', user.id);
            throw insertError;
        }

        onSuccess();
    } catch (err) {
        console.error("Store creation error:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
};

if (!isOpen) return null;

return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={onClose}
            ></div>

            {/* Modal panel */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 z-50">
                <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                    <button
                        onClick={onClose}
                        type="button"
                        className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <span className="sr-only">Close</span>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                            Create New Store
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-4">
                                Fill in the details to launch your new store.
                            </p>

                            <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-4 rounded-r-md">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <CreditCard className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-indigo-700">
                                            Creating a store costs <span className="font-bold">50 Credits</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Store Name"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="My Awesome Store"
                                />

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category
                                    </label>
                                    <select
                                        id="category"
                                        name="category_id"
                                        value={formData.category_id}
                                        onChange={handleChange}
                                        className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name} {cat.icon}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="sub_url" className="block text-sm font-medium text-gray-700 mb-1">
                                        Store URL
                                    </label>
                                    <div className="mt-1 flex rounded-md shadow-sm">
                                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                                            storeplatform.com/
                                        </span>
                                        <input
                                            type="text"
                                            name="sub_url"
                                            id="sub_url"
                                            value={formData.sub_url}
                                            onChange={handleSubUrlChange}
                                            className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border-gray-300 border"
                                            placeholder="my-store"
                                        />
                                    </div>
                                </div>

                                <Input
                                    label="Contact Email"
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />

                                <div className="border-t pt-4 mt-4">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Store Access Credentials</h4>
                                    <p className="text-xs text-gray-500 mb-2">Used to access your store's admin panel later.</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Username"
                                            id="access_username"
                                            name="access_username"
                                            value={formData.access_username}
                                            onChange={handleChange}
                                            required
                                        />
                                        <Input
                                            label="Password"
                                            id="access_password"
                                            name="access_password"
                                            type="password"
                                            value={formData.access_password}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 mt-2">{error}</p>
                                )}

                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <Button
                                        type="submit"
                                        className="w-full sm:ml-3 sm:w-auto"
                                        isLoading={loading}
                                    >
                                        Create Store
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
            </div>
        </div>
    </div>
);
}
