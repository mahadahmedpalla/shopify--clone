import React, { useState, useEffect, useRef } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

export const RelatedProductsRenderer = ({ style, content, productId, product, storeId, isEditor }) => {
    const [relatedProducts, setRelatedProducts] = useState([]);
    const scrollContainerRef = useRef(null);

    // Settings
    const limit = style?.relatedLimit || 4;
    const title = style?.relatedTitle || 'You might also like';
    const showPrice = style?.showPrice !== false;
    const itemGap = style?.itemGap || 'normal'; // 'tight', 'normal', 'loose'
    const source = style?.source || 'same_category'; // 'same_category', 'all_products', 'specific_category'
    const targetCategoryId = style?.targetCategoryId;
    const layoutMode = style?.layoutMode || 'grid'; // 'grid', 'slider'

    useEffect(() => {
        if (!isEditor && storeId) {
            fetchRelated();
        }
    }, [productId, limit, source, targetCategoryId, storeId, product]);

    const fetchRelated = async () => {
        try {
            let query = supabase
                .from('products')
                .select('*')
                .eq('store_id', storeId)
                .neq('id', productId || '') // Exclude current
                .limit(limit);

            // Filter Logic
            if (source === 'same_category' && product?.category_id) {
                query = query.eq('category_id', product.category_id);
            } else if (source === 'specific_category' && targetCategoryId) {
                query = query.eq('category_id', targetCategoryId);
            }
            // 'all_products' just uses the base query (random/latest)

            const { data } = await query;
            if (data) setRelatedProducts(data);
        } catch (err) {
            console.error("Error fetching related products:", err);
        }
    };

    // Scroll Handlers
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -300 : 300;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    // Mock data for editor if empty
    const displayProducts = (isEditor && relatedProducts.length === 0)
        ? Array(limit).fill({ id: 'mock', name: 'Sample Product', price: 99.99 })
        : relatedProducts;

    if (!isEditor && relatedProducts.length === 0) return null;

    const getGapClass = () => {
        switch (itemGap) {
            case 'tight': return 'gap-4';
            case 'loose': return 'gap-8';
            default: return 'gap-6';
        }
    };

    return (
        <div className="w-full py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {title && (
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
                        {layoutMode === 'slider' && (
                            <div className="flex gap-2">
                                <button onClick={() => scroll('left')} className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button onClick={() => scroll('right')} className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {layoutMode === 'slider' ? (
                    // SLIDER LAYOUT
                    <div
                        ref={scrollContainerRef}
                        className={`flex overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 ${getGapClass()}`}
                    >
                        {displayProducts.map((p, i) => (
                            <div
                                key={p.id === 'mock' ? i : p.id}
                                className="min-w-[45%] md:min-w-[22%] snap-start group cursor-pointer"
                            >
                                <ProductCard p={p} showPrice={showPrice} />
                            </div>
                        ))}
                    </div>
                ) : (
                    // GRID LAYOUT
                    <div className={`grid grid-cols-2 md:grid-cols-4 ${getGapClass()} gap-y-10`}>
                        {displayProducts.map((p, i) => (
                            <div key={p.id === 'mock' ? i : p.id} className="group cursor-pointer">
                                <ProductCard p={p} showPrice={showPrice} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard = ({ p, showPrice }) => (
    <>
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
        </div>

        <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors">
            {p.name || 'Sample Product'}
        </h3>

        {showPrice && (
            <p className="text-slate-500 text-sm">
                ${parseFloat(p.price || 0).toFixed(2)}
            </p>
        )}
    </>
);
