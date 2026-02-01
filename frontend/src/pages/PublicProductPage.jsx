import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { BlockRenderer } from '../components/store/widgets/BlockRenderer';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from '../components/store/widgets/cart/CartDrawer';
import { Skeleton } from '../components/ui/Skeleton';

export function PublicProductPage() {
    const { storeSubUrl, productId } = useParams();
    const [store, setStore] = useState(null);
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
        fetchData();
    }, [storeSubUrl, productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Store
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('sub_url', storeSubUrl)
                .single();

            if (storeError || !storeData) throw new Error('Store not found');
            setStore(storeData);

            // 1.5 Fetch Global Cart Settings (from 'cart' page)
            const { data: cartPage } = await supabase.from('store_pages')
                .select('content')
                .eq('store_id', storeData.id)
                .eq('slug', 'cart')
                .single();

            if (cartPage?.content) {
                const widget = cartPage.content.find(w => w.type === 'cart_list');
                if (widget && widget.settings) {
                    setCartSettings(widget.settings);
                }
            }

            // 2. Fetch Product
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select(`
                    *,
                    product_variants (*)
                `)
                .eq('id', productId)
                .single();

            if (prodError || !prodData) throw new Error('Product not found');
            setProduct(prodData);

            // 2.5 Fetch Active Discounts
            const now = new Date().toISOString();
            const { data: discountData } = await supabase
                .from('discounts')
                .select('*')
                .eq('store_id', storeData.id)
                .eq('is_active', true)
                .lte('starts_at', now); // Started already
            // We handle ends_at logic in JS to keep query simple or add .or(`ends_at.is.null,ends_at.gte.${now}`)

            if (discountData) setDiscounts(discountData);

            // 3. Fetch "Product Detail" Page
            const { data: pdpPage } = await supabase
                .from('store_pages')
                .select('content')
                .eq('store_id', storeData.id)
                .eq('slug', 'pdp') // Using standard system slug
                .single();

            if (pdpPage?.content) {
                setPageContent(pdpPage.content);
            } else {
                // FALLBACK: Fetch Home to get Navbar settings for a generated default layout
                const { data: homePage } = await supabase
                    .from('store_pages')
                    .select('content')
                    .eq('store_id', storeData.id)
                    .eq('slug', 'home')
                    .single();

                const homeNavbar = homePage?.content?.find(b => b.type === 'navbar');

                // Construct Default Layout
                setPageContent([
                    homeNavbar || {
                        type: 'navbar',
                        id: 'nav-default',
                        settings: {
                            bgColor: '#ffffff',
                            textColor: '#1e293b',
                            showStoreName: true
                        }
                    },
                    { type: 'product_detail', id: 'pd-default', settings: { showStock: true, showDescription: true } }
                ]);
            }

        } catch (e) {
            console.error(e);
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


