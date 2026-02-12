import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BlockRenderer } from '../components/store/widgets/BlockRenderer';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from '../components/store/widgets/cart/CartDrawer';
import { Skeleton } from '../components/ui/Skeleton';

export function PublicProductPage({ customDomainStore }) {
    const { storeSubUrl, productId } = useParams();
    const [store, setStore] = useState(customDomainStore || null);
    const [product, setProduct] = useState(null);
    const [pageContent, setPageContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop');

    const [cartSettings, setCartSettings] = useState(null);
    const [discounts, setDiscounts] = useState([]);

    // Responsive Detection
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
        window.scrollTo(0, 0);
        fetchData();
    }, [storeSubUrl, productId, customDomainStore]);

    const fetchData = async () => {
        setLoading(true);
        try {

            let currentStore = customDomainStore || store;

            const promises = [
                supabase.from('products').select(`*, product_variants (*)`).eq('id', productId).single()
            ];

            if (!currentStore) {
                if (!storeSubUrl) throw new Error('Store identifier missing');
                promises.push(supabase.from('stores').select('*').eq('sub_url', storeSubUrl).single());
            }

            // 1. Parallel Fetch: Store (if needed) & Product
            const results = await Promise.all(promises);
            const productResult = results[0];
            const storeResult = results[1]; // Undefined if we had currentStore

            if (storeResult) {
                if (storeResult.error || !storeResult.data) throw new Error('Store not found');
                currentStore = storeResult.data;
                setStore(currentStore);
            }

            if (productResult.error || !productResult.data) throw new Error('Product not found');
            const prodData = productResult.data;

            setProduct(prodData);

            // 2. Parallel Fetch: Dependencies (Cart, Discounts, Page Content)
            const now = new Date().toISOString();

            const [cartPageResult, discountResult, pdpPageResult, homePageResult] = await Promise.all([
                // Cart Settings
                supabase.from('store_pages').select('content').eq('store_id', storeData.id).eq('slug', 'cart').single(),

                // Active Discounts
                supabase.from('discounts').select('*').eq('store_id', storeData.id).eq('is_active', true).lte('starts_at', now),

                // PDP Content
                supabase.from('store_pages').select('content, is_published').eq('store_id', storeData.id).eq('slug', 'pdp').single(),

                // Home Page (Fallback for Navbar)
                supabase.from('store_pages').select('content').eq('store_id', storeData.id).eq('slug', 'home').single()
            ]);

            // Process Cart Settings
            if (cartPageResult.data?.content) {
                const widget = cartPageResult.data.content.find(w => w.type === 'cart_list');
                if (widget?.settings) setCartSettings(widget.settings);
            }

            // Process Discounts
            if (discountResult.data) setDiscounts(discountResult.data);

            // Process Page Content
            if (pdpPageResult.data) {
                if (pdpPageResult.data.is_published === false) {
                    throw new Error('This page is not published');
                }
                if (pdpPageResult.data.content) {
                    setPageContent(pdpPageResult.data.content);
                }
            } else {
                // Fallback Layout
                const homeNavbar = homePageResult.data?.content?.find(b => b.type === 'navbar');
                setPageContent([
                    homeNavbar || {
                        type: 'navbar',
                        id: 'nav-default',
                        settings: { bgColor: '#ffffff', textColor: '#1e293b', showStoreName: true }
                    },
                    { type: 'product_detail', id: 'pd-default', settings: { showStock: true, showDescription: true } }
                ]);
            }

        } catch (e) {
            console.error("Error fetching product data:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-white">
            {/* Navbar Skeleton */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-6 md:px-12">
                <Skeleton className="h-8 w-32" />
                <div className="flex gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                </div>
            </div>

            {/* Product Details Skeleton */}
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-start">
                    {/* Image Column */}
                    <Skeleton className="w-full aspect-square rounded-2xl bg-slate-100" />

                    {/* Info Column */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-8 w-32" />
                        </div>

                        <div className="space-y-6 border-t border-slate-100 pt-8">
                            <div className="space-y-3">
                                <Skeleton className="h-4 w-16" />
                                <div className="flex gap-3">
                                    <Skeleton className="h-10 w-24 rounded-lg" />
                                    <Skeleton className="h-10 w-24 rounded-lg" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Skeleton className="h-12 w-32 rounded-lg" />
                                <Skeleton className="h-12 flex-1 rounded-lg" />
                            </div>
                        </div>

                        <div className="space-y-4 pt-8">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
    if (!product || !store) return <div className="min-h-screen flex items-center justify-center">Product Not Found</div>;

    return (
        <CartProvider storeKey={store.id}>
            <CartDrawer settings={cartSettings} />
            <div className="min-h-screen bg-white">
                {pageContent?.map((block) => (
                    <BlockRenderer
                        key={block.id}
                        type={block.type}
                        settings={block.settings}
                        viewMode={viewMode}
                        store={store}
                        product={product}
                        storeDiscounts={discounts}
                    />
                ))}
            </div>
        </CartProvider>
    );
}


