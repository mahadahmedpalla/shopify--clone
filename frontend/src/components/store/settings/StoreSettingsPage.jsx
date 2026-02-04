import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Card } from '../../ui/Card';
import { Store, Globe, Server, Activity, Copy, Check, Database, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { getStoreTotalStorage } from '../../../lib/storageHelper';
import { Button } from '../../ui/Button';

export function StoreSettingsPage() {
    const { store } = useOutletContext();
    const [activeTab, setActiveTab] = useState('store');
    const [copiedId, setCopiedId] = useState(false);

    // Storage State
    const [storageUsage, setStorageUsage] = useState(null); // Bytes
    const [calculating, setCalculating] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const MAX_STORAGE_MB = 30;
    const MAX_STORAGE_BYTES = MAX_STORAGE_MB * 1024 * 1024;

    useEffect(() => {
        // Check local storage for cooldown
        const savedCooldown = localStorage.getItem(`storage_cooldown_${store?.id}`);
        if (savedCooldown) {
            const expireTime = parseInt(savedCooldown, 10);
            const now = Date.now();
            const remaining = Math.ceil((expireTime - now) / 1000);

            if (remaining > 0) {
                setCooldown(remaining);
            } else {
                localStorage.removeItem(`storage_cooldown_${store?.id}`);
            }
        }
    }, [store?.id]);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const copyStoreId = () => {
        if (store?.id) {
            navigator.clipboard.writeText(store.id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        }
    };

    const handleRefreshStorage = async () => {
        if (cooldown > 0 || calculating) return;

        setCalculating(true);
        try {
            const bytes = await getStoreTotalStorage(store.id);
            setStorageUsage(bytes);

            // Set cooldown (60s)
            const expireTime = Date.now() + (60 * 1000);
            localStorage.setItem(`storage_cooldown_${store.id}`, expireTime.toString());
            setCooldown(60);
        } catch (err) {
            console.error(err);
        } finally {
            setCalculating(false);
        }
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (!store) return <div className="p-8 text-center">Loading settings...</div>;

    const usagePercent = storageUsage !== null ? Math.min(100, (storageUsage / MAX_STORAGE_BYTES) * 100) : 0;
    const isCritical = usagePercent >= 90;

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
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'store'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Store className="h-4 w-4 mr-2" />
                        Store Details
                    </button>
                    <button
                        onClick={() => setActiveTab('renewal')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'renewal'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Store Renewal
                    </button>
                    <button
                        onClick={() => setActiveTab('storage')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'storage'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Database className="h-4 w-4 mr-2" />
                        Storage
                    </button>
                </nav>
            </div>

            {/* Store Details Tab */}
            {activeTab === 'store' && (
                <div className="max-w-3xl space-y-6 animate-in slide-in-from-left-4 duration-300">
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

            {/* Store Renewal Tab */}
            {activeTab === 'renewal' && (
                <div className="max-w-3xl animate-in slide-in-from-left-4 duration-300">
                    <Card className="p-12 text-center">
                        <Clock className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">Renewal Settings</h3>
                        <p className="mt-1 text-sm text-slate-500">Subscription and renewal management.</p>
                        <p className="mt-4 text-xs font-mono text-slate-400 bg-slate-100 inline-block px-2 py-1 rounded">Feature Coming Soon</p>
                    </Card>
                </div>
            )}

            {/* Storage Tab */}
            {activeTab === 'storage' && (
                <div className="max-w-3xl animate-in slide-in-from-left-4 duration-300 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-indigo-600" />
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Storage Usage</h3>
                                    <p className="text-xs text-slate-500">Monitor your store's media consumption.</p>
                                </div>
                            </div>
                            <Button
                                onClick={handleRefreshStorage}
                                isLoading={calculating}
                                disabled={cooldown > 0}
                                variant={cooldown > 0 ? "secondary" : "primary"}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${calculating ? 'animate-spin' : ''}`} />
                                {cooldown > 0 ? `Wait ${cooldown}s...` : 'Calculate Usage'}
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Used Space</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">
                                        {storageUsage !== null ? formatBytes(storageUsage) : '---'}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Limit</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{MAX_STORAGE_MB} MB</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-medium">
                                    <span className={isCritical ? 'text-red-600' : 'text-slate-700'}>
                                        {storageUsage !== null ? `${usagePercent.toFixed(1)}% Used` : 'Click Calculate to view usage'}
                                    </span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out ${isCritical ? 'bg-red-500' : 'bg-indigo-600'}`}
                                        style={{ width: `${usagePercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Warning */}
                            {isCritical && (
                                <div className="flex items-start p-4 bg-red-50 border border-red-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-sm font-bold text-red-800">Storage Limit Reached</h4>
                                        <p className="text-xs text-red-700 mt-1">
                                            You are running low on storage. You cannot upload new products or media until you free up space.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="text-xs text-slate-400 italic">
                                * Usage includes product images, variant images, store assets, and category thumbnails.
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
