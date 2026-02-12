import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { ChevronLeft, ShoppingBag, Layout } from 'lucide-react';
import { MarketplaceStore } from './MarketplaceStore';
import { MarketplaceLibrary } from './MarketplaceLibrary';

export function ThemeMarketplace() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('store'); // 'store' | 'library'

    return (
        <div className="min-h-screen bg-white">
            <header className="border-b border-slate-200 px-8 py-4 bg-white flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/store/${storeId}/customize`)}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800">Theme Marketplace</h1>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('store')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center
                            ${activeTab === 'store' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        <ShoppingBag className="h-4 w-4 mr-2" />
                        Store
                    </button>
                    <button
                        onClick={() => setActiveTab('library')}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center
                            ${activeTab === 'library' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}
                        `}
                    >
                        <Layout className="h-4 w-4 mr-2" />
                        Library
                    </button>
                </div>

                <div className="w-24"></div> {/* Spacer for alignment */}
            </header>

            <main className="max-w-7xl mx-auto px-8 py-8">
                {activeTab === 'store' && <MarketplaceStore storeId={storeId} />}
                {activeTab === 'library' && <MarketplaceLibrary storeId={storeId} />}
            </main>
        </div>
    );
}
