
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function StoreLoginModal({ isOpen, onClose, store, onAuthenticated }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    if (!isOpen || !store) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Direct check against store credentials
            // In a production app, we would use a more secure hashing/token method
            const { data, error: fetchError } = await supabase
                .from('stores')
                .select('access_username, access_password_hash')
                .eq('id', store.id)
                .single();

            if (fetchError) throw fetchError;

            if (data.access_username === formData.username && data.access_password_hash === formData.password) {
                // Successful authentication
                // We store the session locally to allow access to sub-pages
                sessionStorage.setItem(`store_auth_${store.id}`, 'true');
                onAuthenticated(store.id);
            } else {
                throw new Error('Invalid store username or password.');
            }
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

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-500">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 mb-4">
                            <Lock className="h-6 w-6 text-indigo-600" />
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Enter Store Dashboard
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Please enter the credentials for <b>{store.name}</b>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <Input
                            label="Store Username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            autoFocus
                        />
                        <Input
                            label="Store Password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                        />

                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}

                        <div className="mt-5 sm:mt-6">
                            <Button
                                type="submit"
                                className="w-full"
                                isLoading={loading}
                            >
                                Access Dashboard
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
