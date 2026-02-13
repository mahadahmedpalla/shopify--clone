import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ShoppingCart, ChevronRight, Box, Layout, Menu, X } from 'lucide-react';

import { BlockRenderer } from '../components/store/widgets/BlockRenderer';
import { CartProvider } from '../context/CartContext';
import { CartDrawer } from '../components/store/widgets/cart/CartDrawer';

import { useStoreFavicon } from '../hooks/useStoreFavicon';

export function PublicStorefront({ customDomainStore }) {
    const params = useParams();
    const categoryPath = params['*'];
    const { storeSubUrl, pageSlug } = params;

    // If categoryPath exists (via wildcard), we are on the shop page
    const activeSlug = pageSlug || (categoryPath ? 'shop' : 'home');
    const [store, setStore] = useState(customDomainStore || null);

    // Favicon
    useStoreFavicon(store);

    const [page, setPage] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Global Cart Settings for the Drawer (fetched from 'cart' page)
    const [cartSettings, setCartSettings] = useState(null);

    // Responsive Detection
    const [viewMode, setViewMode] = useState('desktop');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setViewMode('mobile');
            else if (width < 1024) setViewMode('tablet');
            else setViewMode('desktop');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Only run fetch if we don't already have store data (via prop) OR if activeSlug changes
        // But wait, if we have prop, we still need to fetch dependent data (page, products, etc)
        // So we should always call fetchStoreData but handle the store part conditionally.
        fetchStoreData();
    }, [storeSubUrl, activeSlug, customDomainStore]);

    const fetchStoreData = async () => {
        setLoading(true);
        setError(null);

        try {
            let currentStore = customDomainStore || store;

            // 1. Fetch Store by Sub-URL (if not provided by custom domain router)
            if (!currentStore) {
                if (!storeSubUrl) throw new Error("No store identifier");
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('sub_url', storeSubUrl)
                    .single();

                if (storeError || !storeData) throw new Error(`Store "${storeSubUrl}" not found.`);
                currentStore = storeData;
                setStore(storeData);
            }

            // 2. Parallel Fetch: Dependent Data
            const [cartPageResult, pageResult, productsResult, categoriesResult, discountsResult] = await Promise.all([
                // Cart Settings
                supabase.from('store_pages').select('content').eq('store_id', currentStore.id).eq('slug', 'cart').single(),

                // Current Page Content
                supabase.from('store_pages').select('*').eq('store_id', currentStore.id).eq('slug', activeSlug).eq('is_published', true).single(),

                // Products (for shared renderer)
                supabase.from('products').select('*').eq('store_id', currentStore.id).eq('is_active', true),

                // Categories (for shared renderer)
                supabase.from('product_categories').select('*').eq('store_id', currentStore.id),

                // Active Discounts
                supabase.from('discounts').select('*').eq('store_id', currentStore.id).eq('is_active', true).lte('starts_at', new Date().toISOString())
            ]);

            // Process Cart
            if (cartPageResult.data?.content) {
                const widget = cartPageResult.data.content.find(w => w.type === 'cart_list');
                if (widget && widget.settings) setCartSettings(widget.settings);
            }

            // Process Page
            if (pageResult.error) console.warn("Page fetch error:", pageResult.error);
            setPage(pageResult.data);

            // Process Products
            setProducts(productsResult.data || []);

            // Process Categories
            setCategories(categoriesResult.data || []);

            // Process Discounts
            if (discountsResult.data) setDiscounts(discountsResult.data);

        } catch (err) {
            console.error("Storefront Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PublicLoader />;
    if (error) return <PublicError message={error} />;
    if (!page) return <PublicError message="Page not found" />;

    // Generate CSS variables from store settings
    // Default values match index.css
    const themeStyles = {
        '--color-primary-500': store?.settings?.colors?.primary || '#0ea5e9',
        '--color-secondary-500': store?.settings?.colors?.secondary || '#64748b',
        '--font-family': store?.settings?.typography?.font || 'inherit',
        // Add more mappings as needed
    };

    return (
        <div className="min-h-screen bg-white" style={themeStyles}>
            <CartProvider storeKey={store?.id}>
                <CartDrawer settings={cartSettings} currency={store?.currency || 'USD'} />
                {(page.content || []).map((block) => (
                    <BlockRenderer
                        key={block.id}
                        type={block.type}
                        settings={block.settings}
                        viewMode={viewMode}
                        store={store}
                        products={products}
                        categories={categories}
                        categoryPath={categoryPath}
                        storeDiscounts={discounts}
                        isCustomDomain={!!customDomainStore}
                    />
                ))}
            </CartProvider>
        </div>
    );
}

function PublicLoader() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar Skeleton */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-12">
                <div className="flex items-center gap-8">
                    <Skeleton className="h-8 w-32" />
                    <div className="hidden md:flex gap-8">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
            </div>

            {/* Hero Skeleton */}
            <div className="w-full h-[500px] bg-slate-50 flex items-center justify-center mb-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-100/50 to-white/50" />
                <div className="relative space-y-6 text-center z-10 p-6">
                    <Skeleton className="h-16 w-64 md:w-96 mx-auto rounded-xl" />
                    <Skeleton className="h-6 w-48 mx-auto rounded-lg" />
                    <Skeleton className="h-12 w-40 mx-auto rounded-full mt-4" />
                </div>
            </div>

            {/* Product Grid Skeleton */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="flex justify-between items-end mb-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 rounded-lg" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-4 group">
                            <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-slate-100" />
                            <div className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-5 w-12" />
                                </div>
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function PublicError({ message }) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center space-y-6 p-6 text-center">
            <div className="p-6 bg-red-50 text-red-500 rounded-3xl mb-4">
                <Box className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Wait, something is missing</h1>
            <p className="text-slate-500 max-w-sm">{message}</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">The storefront might be private or the link is incorrect.</p>
        </div>
    );
}
