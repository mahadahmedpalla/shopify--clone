import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Modal } from '../../ui/Modal';
import { Store, Globe, Server, Activity, Copy, Check, Database, RefreshCw, Clock, AlertTriangle, Wallet } from 'lucide-react';

export function StoreSettingsPage() {
    const { store } = useOutletContext();
    const [activeTab, setActiveTab] = useState('store');
    const [copiedId, setCopiedId] = useState(false);

    // Storage State
    const [storageUsage, setStorageUsage] = useState(null); // Value in MBs
    const [storageLimit, setStorageLimit] = useState(30); // Default 30 MB
    const [credits, setCredits] = useState(0);
    const [calculating, setCalculating] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

    // Cooldown is now simple local state, no need for persistence as calculation is valid operation
    const [cooldown, setCooldown] = useState(0);

    // Domain State
    const [customDomain, setCustomDomain] = useState('');
    const [domainStatus, setDomainStatus] = useState(null); // 'pending', 'approved', 'rejected', 'in_progress'
    const [savingDomain, setSavingDomain] = useState(false);

    useEffect(() => {
        // Fetch current storage usage, limit, owner credits, and domain info
        const fetchData = async () => {
            if (!store?.id) return;
            try {
                // 1. Fetch Store Data (Usage, Limit, Domain)
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('storage_used, storage_limit, owner_id, custom_domain, domain_status')
                    .eq('id', store.id)
                    .single();

                if (storeData) {
                    setStorageUsage(Number(storeData.storage_used || 0));
                    setStorageLimit(Number(storeData.storage_limit || 30));
                    setCustomDomain(storeData.custom_domain || '');
                    setDomainStatus(storeData.domain_status);

                    // 2. Fetch Owner Credits
                    if (storeData.owner_id) {
                        const { data: ownerData } = await supabase
                            .from('store_owners')
                            .select('credits')
                            .eq('id', storeData.owner_id)
                            .single();
                        if (ownerData) setCredits(ownerData.credits || 0);
                    }
                }
            } catch (err) {
                console.error('Error fetching storage stats:', err);
            }
        };

        fetchData();
    }, [store?.id]);

    const handleSaveDomain = async () => {
        if (!store?.id) return;
        setSavingDomain(true);
        try {
            const { error } = await supabase
                .from('stores')
                .update({
                    custom_domain: customDomain,
                    domain_status: 'pending' // Reset to pending on update
                })
                .eq('id', store.id);

            if (error) throw error;

            setDomainStatus('pending');
            alert('Domain saved successfully! Status is now pending review.');
        } catch (error) {
            console.error('Error saving domain:', error);
            alert('Failed to save domain: ' + error.message);
        } finally {
            setSavingDomain(false);
        }
    };

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev > 0 ? prev - 1 : 0);
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
            // Import dynamically to avoid circular deps if any, or just ensure safe import
            const { syncStoreStorage } = await import('../../../lib/storageHelper');

            // syncStoreStorage calculates bytes, updates DB with MBs, and returns BYTES
            const totalBytes = await syncStoreStorage(store.id);

            // Convert to MB for local display state
            const totalMB = totalBytes / (1024 * 1024);
            setStorageUsage(totalMB);

            setCooldown(60);
        } catch (err) {
            console.error(err);
        } finally {
            setCalculating(false);
        }
    };

    const handlePurchaseStorage = () => {
        setIsPurchaseModalOpen(true);
    };

    const confirmPurchase = async () => {
        const PLAN_COST = 45;
        const PLAN_ADD_MB = 3000; // 3GB

        setPurchasing(true);
        try {
            const { data, error } = await supabase.rpc('purchase_storage_plan', {
                p_store_id: store.id,
                p_cost_credits: PLAN_COST,
                p_storage_add_mb: PLAN_ADD_MB
            });

            if (error) throw error;
            if (data === false) throw new Error('Purchase failed via RPC (Insufficient funds?)');

            // Success! Update local state
            setCredits(prev => prev - PLAN_COST);
            setStorageLimit(prev => prev + PLAN_ADD_MB);
            setIsPurchaseModalOpen(false);
            alert('Storage plan purchased successfully!');

        } catch (err) {
            console.error(err);
            alert('Purchase failed: ' + err.message);
        } finally {
            setPurchasing(false);
        }
    };

    // Helper to display MBs neatly
    const formatMB = (val) => {
        if (val === null || val === undefined) return '---';
        return Number(val).toFixed(2) + ' MB';
    };

    // Calculate percentage based on MBs
    const usagePercent = storageUsage !== null ? Math.min(100, (storageUsage / storageLimit) * 100) : 0;
    const isCritical = usagePercent >= 100;

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
                    <button
                        onClick={() => setActiveTab('domain')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                            ${activeTab === 'domain'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Globe className="h-4 w-4 mr-2" />
                        Domain Setup
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
                                        {formatMB(storageUsage)}
                                    </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Limit</p>
                                    <p className="text-2xl font-bold text-slate-900 mt-1">{formatMB(storageLimit)}</p>
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

                            {/* Upgrade Plan Section */}
                            <div className="mt-8 pt-8 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-base font-bold text-slate-900">Upgrade Plan</h4>
                                    <div className="flex items-center bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                        <Wallet className="h-4 w-4 text-indigo-600 mr-2" />
                                        <span className="text-sm font-semibold text-indigo-700">{credits} Credits Available</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-5 text-white relative overflow-hidden shadow-lg">
                                    <div className="relative z-10 flex justify-between items-center">
                                        <div>
                                            <p className="text-indigo-200 text-xs uppercase font-bold tracking-wider mb-1">Storage Boost</p>
                                            <h5 className="text-2xl font-bold">+3 GB Storage</h5>
                                            <p className="text-indigo-100 text-sm mt-1 opacity-90">Expand your store's capacity instantly.</p>
                                        </div>
                                        <Button
                                            onClick={handlePurchaseStorage}
                                            isLoading={purchasing}
                                            className="bg-white text-indigo-700 hover:bg-slate-50 border-none px-6"
                                        >
                                            Buy for 45 Credits
                                        </Button>
                                    </div>

                                    {/* Decorative circles */}
                                    <div className="absolute top-0 right-0 -transtale-y-1/2 translate-x-1/2 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 transtale-y-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-400 opacity-20 rounded-full blur-xl pointer-events-none"></div>
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
            {/* Connect Domain Tab */}
            {activeTab === 'domain' && (
                <div className="max-w-3xl animate-in slide-in-from-left-4 duration-300 space-y-6">
                    <Card className="p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Globe className="h-5 w-5 text-indigo-600" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Custom Domain</h3>
                                <p className="text-xs text-slate-500">Connect a custom domain to your store.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                                <h4 className="font-semibold text-indigo-900 text-sm mb-1">How it works</h4>
                                <ul className="list-disc list-inside text-xs text-indigo-800 space-y-1">
                                    <li>Enter your domain name below (e.g., mystore.com).</li>
                                    <li>We will review your request and configure the SSL certificate.</li>
                                    <li>Point your domain's A record to our server IP: <span className="font-mono bg-white px-1 rounded">123.45.67.89</span></li>
                                </ul>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Domain Name</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="yourdomain.com"
                                        value={customDomain}
                                        onChange={(e) => setCustomDomain(e.target.value)}
                                        disabled={domainStatus === 'approved' || domainStatus === 'in_progress'}
                                        className="flex-1 rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:bg-slate-50 disabled:text-slate-500"
                                    />
                                    <Button
                                        onClick={handleSaveDomain}
                                        isLoading={savingDomain}
                                        disabled={domainStatus === 'approved' || domainStatus === 'in_progress' || !customDomain}
                                    >
                                        {domainStatus === 'approved' ? 'Connected' : 'Save Domain'}
                                    </Button>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">Enter the domain without https:// or www.</p>
                            </div>

                            {/* Status Display */}
                            <div className="border-t border-slate-100 pt-6">
                                <h4 className="text-sm font-medium text-slate-700 mb-3">Connection Status</h4>
                                {domainStatus === 'pending' && (
                                    <div className="flex items-center p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <Clock className="h-5 w-5 text-amber-500 mr-3" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-700">Pending Review</p>
                                            <p className="text-xs text-amber-600">Your domain request is waiting for approval.</p>
                                        </div>
                                    </div>
                                )}
                                {domainStatus === 'in_progress' && (
                                    <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <RefreshCw className="h-5 w-5 text-blue-500 mr-3 animate-spin" />
                                        <div>
                                            <p className="text-sm font-bold text-blue-700">Configuration in Progress</p>
                                            <p className="text-xs text-blue-600">We are setting up your domain and SSL.</p>
                                        </div>
                                    </div>
                                )}
                                {domainStatus === 'approved' && (
                                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-md">
                                        <Check className="h-5 w-5 text-green-500 mr-3" />
                                        <div>
                                            <p className="text-sm font-bold text-green-700">Domain Active</p>
                                            <p className="text-xs text-green-600">Your store is successfully connected to {customDomain}.</p>
                                        </div>
                                    </div>
                                )}
                                {domainStatus === 'rejected' && (
                                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                                        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                                        <div>
                                            <p className="text-sm font-bold text-red-700">Request Rejected</p>
                                            <p className="text-xs text-red-600">Please check your domain settings and try again.</p>
                                        </div>
                                    </div>
                                )}
                                {!domainStatus && (
                                    <p className="text-sm text-slate-500 italic">No custom domain configured.</p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Purchase Modal */}
            <Modal
                isOpen={isPurchaseModalOpen}
                onClose={() => setIsPurchaseModalOpen(false)}
                title={credits >= 45 ? "Confirm Purchase" : "Insufficient Credits"}
            >
                <div className="space-y-4">
                    {credits < 45 ? (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        You have <span className="font-bold">{credits} credits</span>, but this plan requires <span className="font-bold">45 credits</span>.
                                    </p>
                                    <p className="text-sm text-red-700 mt-1">
                                        Please top up your account to continue.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <Database className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-indigo-700">
                                        You are about to purchase <strong>3GB Additional Storage</strong>.
                                    </p>
                                    <p className="text-sm text-indigo-700 mt-1">
                                        Cost: <strong>45 Credits</strong>
                                    </p>
                                    <p className="text-sm text-indigo-700">
                                        Remaining Balance: <strong>{credits - 45} Credits</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-100">
                        <Button variant="secondary" onClick={() => setIsPurchaseModalOpen(false)}>
                            Cancel
                        </Button>
                        {credits >= 45 ? (
                            <Button
                                onClick={confirmPurchase}
                                isLoading={purchasing}
                            >
                                Confirm Purchase
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setIsPurchaseModalOpen(false)}
                            >
                                Close
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
