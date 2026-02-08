import React, { useState, useRef } from 'react';
import { Box, ChevronLeft, ChevronRight, Star, Filter, ChevronDown, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../../../context/CartContext';
import { getResponsiveValue } from '../Shared';
import { calculateBestPrice } from '../../../../utils/discountUtils';

// Helper: Convert name to slug (hyphens, lowercase)
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export function ProductGridRenderer({ settings, products, viewMode, store, isEditor, categories, categorySlug, categoryPath, storeDiscounts }) {
    const [currentPage, setCurrentPage] = useState(1);
    const [viewerSort, setViewerSort] = useState(null);
    const [viewerCategory, setViewerCategory] = useState('all');

    // Slider Logic
    const sliderRef = useRef(null);
    const scrollSlider = (direction) => {
        if (!sliderRef.current) return;
        const container = sliderRef.current;
        const scrollAmount = container.clientWidth * 0.75; // Scroll 75% of view width

        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    // Filter products logic
    let displayProducts = products || [];

    const [searchParams] = useSearchParams();
    const categoryIdParam = searchParams.get('category');

    // 1. Defs
    let manualProductIds = settings.manualProductIds || [];
    let sourceType = settings.sourceType || 'all';

    // 1. Context Resolution (Always try to resolve category from URL)
    let contextCategoryId = null;
    if (categoryPath && categories) {
        // Recursive Hierarchical Match (from URL path)
        const slugs = categoryPath.split('/').map(s => decodeURIComponent(s).toLowerCase());
        let currentParentId = null;
        let matchedCat = null;
        let matchFailed = false;

        for (const slug of slugs) {
            const found = categories.find(c => {
                const nameSlug = slugify(c.name);
                const parentMatch = currentParentId === null ? (c.parent_id === null || !c.parent_id) : c.parent_id === currentParentId;
                return nameSlug === slug && parentMatch;
            });

            if (found) {
                currentParentId = found.id;
                matchedCat = found;
            } else {
                matchFailed = true;
                break;
            }
        }
        if (matchedCat && !matchFailed) contextCategoryId = matchedCat.id;
        else contextCategoryId = 'not-found';

    } else if (categorySlug && categories) {
        const matchedCat = categories.find(c => c.name.toLowerCase() === decodeURIComponent(categorySlug).toLowerCase());
        if (matchedCat) contextCategoryId = matchedCat.id;
    } else if (categoryIdParam) {
        contextCategoryId = categoryIdParam;
    }

    // 2. Filter by Source
    if (sourceType === 'products') {
        // Filter by manual products
        displayProducts = displayProducts.filter(p => manualProductIds.includes(p.id));
    } else if (sourceType === 'category') {
        // Specific Category Mode
        // Priority: Context -> Settings -> None
        const targetCatId = contextCategoryId || settings.categoryId;
        if (targetCatId && targetCatId !== 'not-found') {
            displayProducts = displayProducts.filter(p => p.category_id === targetCatId);
        } else if (targetCatId === 'not-found') {
            displayProducts = []; // Path didn't match
        }
    } else {
        // All Products (Default)
        // FIX: Contextual Override
        // If we are on a specific category page, filter by it.
        if (contextCategoryId && contextCategoryId !== 'not-found') {
            displayProducts = displayProducts.filter(p => p.category_id === contextCategoryId);
        } else if (contextCategoryId === 'not-found') {
            displayProducts = [];
        }
    }

    // B. Exclusion Logic
    if (settings.enableExclusions && sourceType !== 'products') {
        const exclusionType = settings.exclusionType || 'products';
        if (exclusionType === 'products') {
            const excludedIds = settings.excludedProductIds || [];
            displayProducts = displayProducts.filter(p => !excludedIds.includes(p.id));
        } else if (exclusionType === 'categories') {
            const excludedCatIds = settings.excludedCategoryIds || [];
            displayProducts = displayProducts.filter(p => !excludedCatIds.includes(p.category_id));
        }
    }

    // 2. Sort Logic
    // Create a copy to avoid mutating the prop
    displayProducts = [...displayProducts].sort((a, b) => {
        const sortBy = settings.sortBy || 'newest';
        switch (sortBy) {
            case 'price_asc':
                return parseFloat(a.price) - parseFloat(b.price);
            case 'price_desc':
                return parseFloat(b.price) - parseFloat(a.price);
            case 'name_asc':
                return a.name.localeCompare(b.name);
            case 'newest':
            default:
                // Fallback to ID or created_at if available
                return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        }
    });



    // --- VIEWER INTERACTION LOGIC (FILTERS) ---
    // 1. Available Categories (Based on Merchant Rules)
    // We derive these from 'displayProducts' BEFORE viewer filters are applied,
    // so the filter options reflect what is actually in the merchant's grid.
    const merchantFilteredProducts = [...displayProducts]; // Snapshot of merchant-approved products

    const availableCategories = React.useMemo(() => {
        if (!categories) return [];
        const catIds = new Set(merchantFilteredProducts.map(p => p.category_id).filter(Boolean));
        return categories.filter(c => catIds.has(c.id));
    }, [merchantFilteredProducts, categories]);

    // 2. Apply Viewer Category Filter
    if (viewerCategory !== 'all') {
        displayProducts = displayProducts.filter(p => p.category_id === viewerCategory);
    }

    // 3. Apply Viewer Sort (Overrides Merchant Sort if set)
    if (viewerSort) {
        displayProducts.sort((a, b) => {
            switch (viewerSort) {
                case 'price_asc':
                    return parseFloat(a.price) - parseFloat(b.price);
                case 'price_desc':
                    return parseFloat(b.price) - parseFloat(a.price);
                case 'name_asc':
                    return a.name.localeCompare(b.name);
                case 'newest':
                default:
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            }
        });
    }


    // 3. Pagination vs Limit
    const enablePagination = settings.enablePagination || false;
    const itemsPerPage = settings.itemsPerPage || 12;
    const totalPages = Math.ceil(displayProducts.length / itemsPerPage);

    let finalProducts = displayProducts;

    if (enablePagination) {
        // Validation: Reset page if out of bounds (e.g. if category changed)
        if (currentPage > totalPages && totalPages > 0) {
            // We need to reset page if filters change results count
            // Since we can't set state easily in render, we just clamp for display
            // and rely on useEffect to sync state if we wanted to be strict,
            // but just clamping startIndex is enough for visual consistency.
        } else if (currentPage > totalPages && totalPages === 0) {
            // No pages
        }

        // Strict Clamp for Slice
        const effectivePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

        // If effective page !== current page, we should probably conceptually be on page 1
        // but for render purity we just calculate slice.
        // If the user was on Page 5 and filters reduce to 1 page, they see Page 1.

        const startIndex = (effectivePage - 1) * itemsPerPage;
        finalProducts = displayProducts.slice(startIndex, startIndex + itemsPerPage);
    } else {
        // Classic Limit
        if (settings.limit) {
            finalProducts = displayProducts.slice(0, parseInt(settings.limit));
        }
    }


    // Layout (Columns) - Responsive default fallback
    const colsDesktop = settings.columns?.desktop || 4;
    const colsTablet = settings.columns?.tablet || 3;
    const colsMobile = settings.columns?.mobile || 2;

    const colsMap = {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
        6: 'grid-cols-6'
    };

    const getColsClass = () => {
        let columns = 4;
        if (viewMode === 'mobile') columns = colsMobile;
        else if (viewMode === 'tablet') columns = colsTablet;
        else columns = colsDesktop;

        return colsMap[columns] || 'grid-cols-4';
    };

    // Helper to optimize Supabase images
    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('supabase.co')) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=80&format=webp`;
    };

    // -- Extended Properties --
    // Helper to resolve responsive value
    const getVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);
    const { addToCart } = useCart();

    // Layout
    const rowGap = getVal('rowGap', 36);
    const colGap = getVal('columnGap', 11);
    const equalHeight = settings.equalHeight || false;

    // Content Toggles
    const showImage = settings.showImage !== false;
    const showTitle = settings.showTitle !== false;
    const showPrice = settings.showPrice !== false; // Usually implies showing price block
    const showComparePrice = settings.showComparePrice !== false;
    const showRating = settings.showRating || false;
    const showAddToCart = settings.showAddToCart !== false;
    const addToCartBehavior = settings.addToCartBehavior || 'always'; // 'always' | 'hover'

    // Image Settings
    const aspectRatio = settings.aspectRatio || 'portrait';
    const imageFit = settings.imageFit || 'cover';
    const imageRadius = getVal('imageBorderRadius', 0);

    // Styling
    const cardContentPadding = getVal('cardContentPadding', 14);
    const sectionPadding = getVal('sectionPadding', 12);
    const cardWrapperPadding = getVal('cardWrapperPadding', 0);

    // Construct styles using responsive values
    const cardStyle = {
        backgroundColor: getVal('cardBackgroundColor', 'transparent'),
        borderWidth: `${getVal('cardBorderWidth', 0)}px`,
        borderColor: getVal('cardBorderColor', '#e2e8f0'),
        borderRadius: `${getVal('cardBorderRadius', 0)}px`,
        boxShadow: settings.cardShadow && settings.cardShadow !== 'none'
            ? getShadowStyle(settings.cardShadow)
            : 'none',
        display: equalHeight ? 'flex' : 'block',
        flexDirection: equalHeight ? 'column' : 'initial',
        overflow: 'hidden', // Ensure content/image doesn't overflow radius
        padding: `${cardWrapperPadding}px`
    };

    // Helper for Fonts
    const getFontFamily = (key) => {
        if (!key || key.startsWith('font-')) return {};
        return { fontFamily: `'${key}', sans-serif` };
    };

    const getFontClass = (key) => {
        if (key && key.startsWith('font-')) return key;
        return '';
    };

    const titleFontClass = getFontClass(getVal('titleFontFamily', 'font-sans'));
    const titleFontStyle = getFontFamily(getVal('titleFontFamily', 'font-sans'));

    const titleStyle = {
        fontSize: `${getVal('titleFontSize', 14)}px`,
        fontWeight: getFontWeight(settings.titleFontWeight),
        color: getVal('titleColor', '#1e293b'),
        ...titleFontStyle
    };

    const buttonWidth = getVal('buttonWidth', 'full'); // 'full' | 'auto'
    const buttonPadding = getVal('buttonPadding', '8px 16px');

    const buttonFontKey = getVal('buttonFontFamily', 'font-sans');
    const buttonFontClass = getFontClass(buttonFontKey);
    const buttonFontStyle = getFontFamily(buttonFontKey);

    // Price Styling
    const priceStyle = {
        fontSize: `${getVal('priceFontSize', 14)}px`,
        fontWeight: getFontWeight(settings.priceFontWeight || 'font-bold'),
        color: getVal('priceColor', '#0f172a')
    };

    const comparePriceStyle = {
        fontSize: `${getVal('comparePriceFontSize', 12)}px`,
        fontWeight: getFontWeight(settings.comparePriceFontWeight || 'font-normal'),
        color: getVal('comparePriceColor', '#94a3b8')
    };

    const addToCartStyle = {
        backgroundColor: getVal('buttonBgColor', '#4f46e5'),
        color: getVal('buttonTextColor', '#ffffff'),
        borderRadius: `${getVal('buttonBorderRadius', 4)}px`,
        width: buttonWidth === 'full' ? '100%' : 'auto',
        padding: buttonPadding,
        ...buttonFontStyle
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        if (isEditor) return;

        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            images: product.images || product.image_urls || [],
            image: product.images?.[0] || product.image_urls?.[0],
            store_id: store?.id,
            maxStock: product.quantity // Pass available stock limit
        }, 1);
    };

    const renderCard = (product, styleOverrides = {}, classNameOverrides = "") => {
        const linkPath = `/s/${store?.sub_url || 'preview'}/p/${product.id}`;
        const Wrapper = isEditor ? 'div' : Link;
        const wrapperProps = isEditor ? {} : { to: linkPath };
        const productImages = product.image_urls || product.images || [];

        return (
            <Wrapper
                key={product.id}
                className={`group cursor-pointer transition-all ${classNameOverrides}`}
                style={{ ...cardStyle, ...styleOverrides }}
                {...wrapperProps}
            >
                {showImage && (
                    <div
                        className={`bg-slate-100 overflow-hidden relative ${getAspectClass(aspectRatio)}`}
                        style={{
                            width: '100%',
                            borderRadius: `${imageRadius}px`
                        }}
                    >
                        {productImages[0] ? (
                            <img
                                src={getOptimizedUrl(productImages[0], 600)}
                                alt={product.name}
                                className={`w-full h-full object-${imageFit} transition-transform duration-700 group-hover:scale-105`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Box className="w-12 h-12 opacity-50" />
                            </div>
                        )}

                        {product.compare_at_price > product.price && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                SALE
                            </div>
                        )}

                        {showAddToCart && addToCartBehavior === 'hover' && (
                            <div className="absolute inset-x-4 bottom-4 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button
                                    onClick={(e) => handleAddToCart(e, product)}
                                    className="flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all active:scale-95"
                                    style={addToCartStyle}
                                >
                                    Add to Cart
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div style={{ padding: `${cardContentPadding}px` }} className="flex flex-col flex-1">
                    {showTitle && (
                        <h3 className={`mb-1 transition-colors group-hover:text-indigo-600 ${titleFontClass}`} style={titleStyle}>
                            {product.name}
                        </h3>
                    )}

                    {showRating && (
                        <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                            ))}
                            <span className="text-xs text-slate-400 ml-1">(4.8)</span>
                        </div>
                    )}

                    <div className="mt-auto pt-2 flex items-end justify-between gap-4">
                        <div className="flex items-baseline gap-2 flex-wrap">
                            {showPrice && (
                                <span style={priceStyle}>
                                    {store?.currency || '$'}{product.price}
                                </span>
                            )}
                            {showComparePrice && product.compare_at_price > product.price && (
                                <span style={comparePriceStyle} className="line-through">
                                    {store?.currency || '$'}{product.compare_at_price}
                                </span>
                            )}
                        </div>

                        {showAddToCart && addToCartBehavior === 'always' && (
                            <button
                                onClick={(e) => handleAddToCart(e, product)}
                                className="flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
                                style={{
                                    ...addToCartStyle,
                                    width: 'auto'
                                }}
                            >
                                Add
                            </button>
                        )}
                    </div>
                </div>
            </Wrapper>
        );
    };

    return (
        <div className="space-y-8 bg-white" style={{ padding: `${sectionPadding}px` }}>
            {/* ... Header ... */}
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{settings.title || 'Featured Products'}</h3>
                {!enablePagination && <span className="text-sm font-bold text-indigo-600 cursor-pointer hover:underline">View All</span>}
            </div>

            {/* --- VIEWER FILTERS UI --- */}
            {(settings.showSortingFilter || settings.showCategoryFilter) && (
                <div className="flex flex-wrap items-center gap-4 py-4 border-t border-b border-slate-100 mb-6">

                    {/* Filter Icon / Label */}
                    <div className="flex items-center text-slate-500 text-sm font-medium mr-2">
                        <Filter className="w-4 h-4 mr-2" />
                        Filters:
                    </div>

                    {/* Category Filter */}
                    {settings.showCategoryFilter && (
                        <div className="relative group">
                            <select
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 block w-full outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                value={viewerCategory}
                                onChange={(e) => {
                                    setViewerCategory(e.target.value);
                                    setCurrentPage(1); // Reset page on filter change
                                }}
                            >
                                <option value="all">All Styles</option>
                                {availableCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    )}

                    {/* Sorting Filter */}
                    {settings.showSortingFilter && (
                        <div className="relative group">
                            <select
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-8 focus:ring-indigo-500 focus:border-indigo-500 block w-full outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                value={viewerSort || ''}
                                onChange={(e) => setViewerSort(e.target.value || null)}
                            >
                                <option value="">Default Sorting</option>
                                <option value="newest">Newest First</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="name_asc">Name: A-Z</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </div>
                    )}

                    {/* Clear Filters Button */}
                    {(viewerCategory !== 'all' || viewerSort !== null) && (
                        <button
                            onClick={() => {
                                setViewerCategory('all');
                                setViewerSort(null);
                                setCurrentPage(1);
                            }}
                            className="ml-auto flex items-center text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                        >
                            <X className="w-3 h-3 mr-1" />
                            Clear
                        </button>
                    )}
                </div>
            )}


            {finalProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No products found in this collection.</p>
                </div>
            ) : (
                <>
                    {settings.layoutMode === 'slider' ? (
                        <div className="relative group">
                            {/* Navigation Buttons (Desktop) */}
                            {finalProducts.length > (viewMode === 'mobile' ? colsMobile : (viewMode === 'tablet' ? colsTablet : colsDesktop)) && (
                                <>
                                    <button
                                        onClick={(e) => { e.preventDefault(); scrollSlider('left'); }}
                                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md text-slate-700 opacity-0 group-hover:opacity-100 transition-all -ml-2 hover:bg-slate-50 disabled:opacity-0"
                                        aria-label="Scroll left"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); scrollSlider('right'); }}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md text-slate-700 opacity-0 group-hover:opacity-100 transition-all -mr-2 hover:bg-slate-50"
                                        aria-label="Scroll right"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}

                            <div
                                ref={sliderRef}
                                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 -mx-4 px-4 pt-2"
                                style={{
                                    gap: `${colGap}px`,
                                }}
                            >
                                {finalProducts.map(product => {
                                    // Calculate responsive width for slider items
                                    let columns = 4;
                                    if (viewMode === 'mobile') columns = colsMobile;
                                    else if (viewMode === 'tablet') columns = colsTablet;
                                    else columns = colsDesktop;

                                    const totalGap = (columns - 1) * colGap;
                                    const itemWidth = `calc((100% - ${totalGap}px) / ${columns})`;

                                    return renderCard(product, {
                                        width: itemWidth,
                                        flexShrink: 0,
                                        display: equalHeight ? 'flex' : 'block',
                                        flexDirection: equalHeight ? 'column' : 'initial'
                                    }, "snap-start");
                                })}
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`grid ${getColsClass()}`}
                            style={{ gap: `${rowGap}px ${colGap}px` }}
                        >
                            {finalProducts.map(product => renderCard(product))}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {enablePagination && totalPages > 1 && (
                        <div className="flex items-center justify-center space-x-4 pt-8">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <span className="text-sm font-bold text-slate-600">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Helpers
function getShadowStyle(size) {
    switch (size) {
        case 'sm': return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        case 'md': return '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
        case 'lg': return '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
        case 'xl': return '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
        default: return 'none';
    }
}

function getFontWeight(weight) {
    switch (weight) {
        case 'font-normal': return 400;
        case 'font-medium': return 500;
        case 'font-semibold': return 600;
        case 'font-bold': return 700;
        default: return 500;
    }
}

function getAspectClass(ratio) {
    switch (ratio) {
        case 'square': return 'aspect-square';
        case 'portrait': return 'aspect-[4/5]';
        case 'standard': return 'aspect-[3/4]';
        case 'landscape': return 'aspect-video';
        case 'auto':
        default: return '';
    }
}
