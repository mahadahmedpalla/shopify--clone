import React, { useState, useEffect } from 'react';
import { Box } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export const RelatedProductsRenderer = ({ style, content, productId, storeId, isEditor }) => {
    const [relatedProducts, setRelatedProducts] = useState([]);

    // Settings
    const limit = style?.relatedLimit || 4;
    const title = style?.relatedTitle || 'You might also like';
    const showPrice = style?.showPrice !== false;
    const itemGap = style?.itemGap || 'normal'; // 'tight', 'normal', 'loose'

    useEffect(() => {
        if (productId && !isEditor) {
            fetchRelated();
        }
    }, [productId, limit]);

    const fetchRelated = async () => {
        try {
            // Simple logic: fetch other products from same store
            // Ideally this would be smarter (same category, tags, etc.)
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .neq('id', productId)
                .limit(limit);

            if (data) setRelatedProducts(data);
        } catch (err) {
            console.error("Error fetching related products:", err);
        }
    };

    // Mock data for editor if empty
    const displayProducts = (isEditor && relatedProducts.length === 0)
        ? Array(limit).fill({ id: 'mock', name: 'Sample Product', price: 99.99 })
        : relatedProducts;

    if (!isEditor && relatedProducts.length === 0) return null;

    const getGapClass = () => {
        switch (itemGap) {
            case 'tight': return 'gap-x-4 gap-y-6';
            case 'loose': return 'gap-x-8 gap-y-12';
            default: return 'gap-x-6 gap-y-10';
        }
    };

    return (
        <div className="w-full py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {title && (
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                    </div>
                )}

                <div className={`grid grid-cols-2 md:grid-cols-4 ${getGapClass()}`}>
                    {displayProducts.map((p, i) => (
                        <div key={p.id === 'mock' ? i : p.id} className="group cursor-pointer">
                            <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                {p.image_urls?.[0] ? (
                                    <img
                                        src={p.image_urls[0]}
                                        alt={p.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <Box className="h-8 w-8 opacity-50" />
                                    </div>
                                )}

                                {/* Quick Add Button (Optional Future Feature) */}
                            </div>

                            <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
                                {p.name || 'Sample Product'}
                            </h3>

                            {showPrice && (
                                <p className="text-slate-500 text-sm">
                                    ${parseFloat(p.price || 0).toFixed(2)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
