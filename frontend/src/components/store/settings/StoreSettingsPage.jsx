import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Store, Globe, Server, Activity, Copy, Check } from 'lucide-react';

export function StoreSettingsPage() {
    const { store } = useOutletContext();
    const [activeTab, setActiveTab] = useState('store');
    const [copiedId, setCopiedId] = useState(false);

    const copyStoreId = () => {
        if (store?.id) {
            navigator.clipboard.writeText(store.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    if (!store) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Store Settings</h1>
                <p className="text-slate-500">View and manage your store configuration.</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                            ${activeTab === 'store'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        Store Details
                    </button>
                    {/* Add more tabs here later */}
                </nav>
            </div>

            {/* Store Details Tab */}
            {activeTab === 'store' && (
                <div className="max-w-3xl space-y-6">
                    <Card className="p-6 space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Store className="h-5 w-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-900">General Information</h3>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Store Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store Name</label>
                                <div className="relative rounded-md shadow-sm">
                                    <input
                                        type="text"
                                        value={store.name}
                                        readOnly
                                        className="block w-full rounded-md border-slate-300 bg-slate-50 text-slate-500 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm cursor-not-allowed"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-xs italic">Read-only</span>
                                    </div>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">The name displayed on your dashboard and storefront.</p>
                            </div>

                            {/* Store URL */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store URL</label>
                                <div className="flex rounded-md shadow-sm">
                                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">
                                        https://storeplatform.com/
                                    </span>
                                    <input
                                        type="text"
                                        value={store.sub_url}
                                        readOnly
                                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-slate-300 bg-slate-50 text-slate-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm cursor-not-allowed"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-slate-500">
                                    Your unique store address. <a href={`https://storeplatform.com/${store.sub_url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-1">Visit Store <Globe className="h-3 w-3" /></a>
                                </p>
                            </div>

                            {/* Store ID */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store ID</label>
                                <div className="flex rounded-md shadow-sm">
                                    <div className="relative flex-grow focus-within:z-10">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Server className="h-4 w-4 text-slate-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={store.id}
                                            readOnly
                                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-slate-300 bg-slate-50 text-slate-500 font-mono"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={copyStoreId}
                                        className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-slate-300 text-sm font-medium rounded-r-md text-slate-700 bg-slate-50 hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        {copiedId ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-400" />}
                                        <span>{copiedId ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Unique identifier for API integrations and support.</p>
                            </div>

                            {/* Store Status */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Store Status</label>
                                <div className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-md">
                                    <Activity className={`h-5 w-5 mr-3 ${store.is_active ? 'text-green-500' : 'text-red-500'}`} />
                                    <div>
                                        <p className={`text-sm font-bold ${store.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                            {store.is_active ? 'Active' : 'Inactive'}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {store.is_active
                                                ? 'Your store is currently live and visible to customers.'
                                                : 'Your store is currently inactive and not accessible.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
