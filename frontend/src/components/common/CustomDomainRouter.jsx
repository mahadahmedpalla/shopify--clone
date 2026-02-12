import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicStorefront } from '../../pages/PublicStorefront';
import { PublicProductPage } from '../../pages/PublicProductPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { OrderSuccessPage } from '../../pages/OrderSuccessPage';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

export function CustomDomainRouter({ domain }) {
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStore = async () => {
            try {
                // Find store by custom domain
                // We handle 'www.' stripping if needed, but for now exact match
                const { data, error } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('custom_domain', domain)
                    .single();

                if (error) throw error;
                if (!data) throw new Error('Store not found for this domain');

                setStore(data);
            } catch (err) {
                console.error('Custom Domain Error:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStore();
    }, [domain]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error || !store) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Site Not Found</h1>
                <p className="text-gray-500">The custom domain {domain} is not connected to a valid store.</p>
            </div>
        );
    }

    // Pass the storeFetchOverride or just the store object?
    // The pages (PublicStorefront, etc.) currently fetch by storeSubUrl.
    // We need to modify them to accept a 'preloadedStore' prop or 'customDomainStore' prop
    // OR we modify them to fetch by custom_domain if storeSubUrl is missing.

    // Strategy: We will render the components and they need to be smart enough to handle 
    // retrieving data if we don't pass `storeSubUrl` in the URL params.
    // However, react-router params will be empty for storeSubUrl.

    // We will clone the element or just render them with a special prop "customDomainStore={store}"
    // But they are rendered via Route element prop.
    // We can pass the prop directly.

    return (
        <Routes>
            <Route index element={<PublicStorefront customDomainStore={store} />} />
            <Route path="shop/*" element={<PublicStorefront customDomainStore={store} />} />
            <Route path=":pageSlug" element={<PublicStorefront customDomainStore={store} />} />

            <Route path="p/:productId" element={<PublicProductPage customDomainStore={store} />} />
            <Route path="category/:categoryId" element={<PublicStorefront customDomainStore={store} />} />
            <Route path="checkout" element={<CheckoutPage customDomainStore={store} />} />
            <Route path="order/:orderId" element={<OrderSuccessPage customDomainStore={store} />} />
        </Routes>
    );
}
