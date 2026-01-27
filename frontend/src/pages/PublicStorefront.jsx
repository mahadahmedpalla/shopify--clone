
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ShoppingCart, ChevronRight, Box, Layout, Menu, X } from 'lucide-react';

import { BlockRenderer } from '../components/store/widgets/BlockRenderer';

export function PublicStorefront() {
    const { storeSubUrl, pageSlug } = useParams();
    const activeSlug = pageSlug || 'home';
    const [store, setStore] = useState(null);
    const [page, setPage] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        fetchStoreData();
    }, [storeSubUrl, activeSlug]);

    const fetchStoreData = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch Store by Sub-URL
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('sub_url', storeSubUrl)
                .single();

            if (storeError || !storeData) throw new Error(`Store "${storeSubUrl}" not found.`);
            setStore(storeData);

            // 2. Fetch Page
            const { data: pageData, error: pageError } = await supabase
                .from('store_pages')
                .select('*')
                .eq('store_id', storeData.id)
                .eq('slug', activeSlug)
                .single();

            if (pageError) {
                // Determine if it's a legal page requested that doesn't exist yet, or just a 404
                console.warn("Page fetch error:", pageError);
            }
            setPage(pageData); // Might be null if not found

            // 3. Fetch Products (for shared renderer)
            const { data: prodData } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeData.id)
                .eq('is_active', true);
            setProducts(prodData || []);

            // 4. Fetch Categories (for shared renderer)
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('store_id', storeData.id);
            setCategories(catData || []);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <PublicLoader />;
    if (error) return <PublicError message={error} />;
    // If page is null but no error (e.g. invalid slug), show error
    if (!page) return <PublicError message="Page not found" />;

    return (
        <div className="min-h-screen bg-white">
            {(page.content || []).map((block) => (
                <BlockRenderer
                    key={block.id}
                    type={block.type}
                    settings={block.settings}
                    viewMode={viewMode}
                    store={store}
                    products={products}
                    categories={categories}
                />
            ))}
        </div>
    );
}

function PublicLoader() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center space-y-6">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold uppercase tracking-widest text-xs text-slate-400">Loading Storefront...</p>
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
            <Link to="/"><Button variant="secondary" className="border-slate-200">Back to Dashboard</Button></Link>
        </div>
    );
}
