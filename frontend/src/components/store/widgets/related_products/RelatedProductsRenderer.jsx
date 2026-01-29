import React, { useState, useEffect, useRef } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';

export const RelatedProductsRenderer = ({ style, content, productId, product, storeId, isEditor }) => {
    const [relatedProducts, setRelatedProducts] = useState([]);
    const scrollContainerRef = useRef(null);

    // Settings
    const limit = style?.relatedLimit || 4;
    const title = style?.relatedTitle || 'You might also like';
    const showPrice = style?.showPrice !== false;
    const showDiscount = style?.showDiscount === true; // Default false
    const showRating = style?.showRating === true; // Default false
    const showDescription = style?.showDescription === true; // Default false

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
                .select('*, product_reviews(rating)')
                .eq('store_id', storeId)
                .neq('id', productId || '') // Exclude current
                .limit(limit);

            // Filter Logic
            if (source === 'same_category' && product?.category_id) {
                query = query.eq('category_id', product.category_id);
            } else if (source === 'specific_category' && targetCategoryId) {
                query = query.eq('category_id', targetCategoryId);
            }
            // 'all_products' just uses the base query

            // If random (all_products), fetch more to shuffle
            if (source === 'all_products') {
                query = query.limit(20); // Fetch pool of 20
            } else {
                query = query.limit(limit);
            }

            const { data } = await query;

            if (data) {
                if (source === 'all_products') {
                    // Client-side shuffle for "Random" feel
                    const shuffled = [...data].sort(() => 0.5 - Math.random());
                    setRelatedProducts(shuffled.slice(0, limit));
                } else {
                    setRelatedProducts(data);
                }
            }
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
                        className={`flex overflow-x-auto pb-8 snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 ${getGapClass()}`}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {/* Hide scrollbar for Chrome/Safari/Webkit */}
                        <style>{`
                            .flex::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {displayProducts.map((p, i) => (
                            <div
                                key={p.id === 'mock' ? i : p.id}
                                className="min-w-[45%] md:min-w-[22%] snap-start group cursor-pointer"
                            >
                                <ProductCard
                                    p={p}
                                    showPrice={showPrice}
                                    showDiscount={showDiscount}
                                    showRating={showRating}
                                    showDescription={showDescription}
                                    isEditor={isEditor}
                                    storeId={storeId}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    // GRID LAYOUT
                    <div className={`grid grid-cols-2 md:grid-cols-4 ${getGapClass()} gap-y-10`}>
                        {displayProducts.map((p, i) => (
                            <div key={p.id === 'mock' ? i : p.id} className="group cursor-pointer">
                                <ProductCard
                                    p={p}
                                    showPrice={showPrice}
                                    showDiscount={showDiscount}
                                    showRating={showRating}
                                    showDescription={showDescription}
                                    isEditor={isEditor}
                                    storeId={storeId}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const ProductCard = ({ p, showPrice, showDiscount, showRating, showDescription, isEditor, storeId }) => {
    // Determine wrapper
    const isMock = p.id === 'mock';
    const Wrapper = (isEditor || isMock) ? 'div' : Link;

    // Calculate Rating
    const reviews = p.product_reviews || [];
    const ratingCount = reviews.length;
    const avgRating = ratingCount > 0
        ? reviews.reduce((acc, r) => acc + r.rating, 0) / ratingCount
        : 0;

    // Calculate Discount
    const price = parseFloat(p.price || 0);
    // Support both naming conventions
    const comparePrice = parseFloat(p.compare_price || p.comparePrice || 0);
    const hasDiscount = showDiscount && comparePrice > price;

    return (
        <Wrapper
            to={!isEditor && !isMock ? `../${p.id}` : undefined}
            relative="path"
            className="block h-full"
        >
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

                {hasDiscount && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        Sale
                    </div>
                )}
            </div>

            <h3 className="font-bold text-slate-900 text-sm mb-1 leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                {p.name || 'Sample Product'}
            </h3>

            {/* RATING */}
            {showRating && (ratingCount > 0 || isMock) && (
                <div className="flex items-center space-x-1 mb-1">
                    <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map(star => (
                            <svg key={star} className={`w-3 h-3 ${star <= (isMock ? 4.5 : avgRating) ? 'fill-current' : 'text-slate-200 fill-slate-200'}`} viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        ))}
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                        ({ratingCount})
                    </span>
                </div>
            )}

            {/* PRICE */}
            {showPrice && (
                <div className="flex items-center space-x-2">
                    <p className={`font-bold text-sm ${hasDiscount ? 'text-red-600' : 'text-slate-500'}`}>
                        ${price.toFixed(2)}
                    </p>
                    {hasDiscount && (
                        <p className="text-xs text-slate-400 line-through decoration-slate-300">
                            ${comparePrice.toFixed(2)}
                        </p>
                    )}
                </div>
            )}

            {/* DESCRIPTION */}
            {showDescription && (
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed opacity-80">
                    {p.description || 'No description available for this product.'}
                </p>
            )}
        </Wrapper>
    );
};
