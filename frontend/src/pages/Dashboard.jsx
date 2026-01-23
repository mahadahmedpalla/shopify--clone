
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/common/Navbar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Store, CreditCard, ExternalLink, Trash2 } from 'lucide-react';
import { CreateStoreModal } from '../components/dashboard/CreateStoreModal';
import { DeleteStoreModal } from '../components/dashboard/DeleteStoreModal';

export function Dashboard() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [storeToDelete, setStoreToDelete] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Get User
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                // Get Profile (Credits)
                const { data: profileData } = await supabase
                    .from('store_owners')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(profileData);

                // Get Stores
                const { data: storesData } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('owner_id', user.id);
                setStores(storesData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar user={user} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                            Dashboard
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage your stores and monitor performance.
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <Card className="mr-4 px-4 py-2 flex items-center bg-indigo-50 border-indigo-100">
                            <CreditCard className="h-5 w-5 text-indigo-600 mr-2" />
                            <div>
                                <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Credits</p>
                                <p className="text-lg font-bold text-indigo-900">{profile?.credits || 0}</p>
                            </div>
                        </Card>
                        <Button onClick={() => setIsCreateModalOpen(true)}>
                            <Plus className="h-5 w-5 mr-2" />
                            Create Store
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card>
                        <div className="flex items-center">
                            <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                <Store className="h-6 w-6 text-white" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 truncate">Total Stores</dt>
                                    <dd className="flex items-baseline">
                                        <div className="text-2xl font-semibold text-gray-900">{stores.length}</div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Stores List */}
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Your Stores</h3>

                {stores.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <Store className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No stores yet</h3>
                        <p className="mt-1 text-sm text-gray-500">Get started by creating your first store.</p>
                        <div className="mt-6">
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                <Plus className="h-5 w-5 mr-2" />
                                Create Store
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {stores.map((store) => (
                            <Card key={store.id} className="hover:shadow-md transition-shadow group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                            {store.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900">{store.name}</h4>
                                            <p className="text-xs text-gray-500">/{store.sub_url}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setStoreToDelete(store)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Delete Store"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
                                    <div className="flex space-x-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${store.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {store.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-900 p-0">
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            <CreateStoreModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchData(); // Refresh list
                }}
                userId={user?.id}
            />

            {storeToDelete && (
                <DeleteStoreModal
                    isOpen={!!storeToDelete}
                    store={storeToDelete}
                    onClose={() => setStoreToDelete(null)}
                    onSuccess={() => {
                        setStoreToDelete(null);
                        fetchData(); // Refresh list
                    }}
                />
            )}
        </div>
    );
}
