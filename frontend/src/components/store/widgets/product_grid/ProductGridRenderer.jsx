import React, { useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../../../context/CartContext';
import { getResponsiveValue } from '../Shared';

// Helper: Convert name to slug (hyphens, lowercase)
const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

export function ProductGridRenderer({ settings, products, viewMode, store, isEditor, categories, categorySlug, categoryPath }) {
    const [currentPage, setCurrentPage] = useState(1);

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

    // 3. Pagination vs Limit
    const enablePagination = settings.enablePagination || false;
    const itemsPerPage = settings.itemsPerPage || 12;
    const totalPages = Math.ceil(displayProducts.length / itemsPerPage);

    let finalProducts = displayProducts;

    if (enablePagination) {
        // Validation: Reset page if out of bounds (e.g. if category changed)
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(1); // Cannot update state during render in strict mode usually, but mostly safe here or should be in useEffect. 
            // In React, setting state during render is allowed if checks condition to avoid infinite loop.
            // Better to simply clamp strictly for display:
        }
        const safePage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));

        const startIndex = (safePage - 1) * itemsPerPage;
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
            images: product.images || [],
            image: product.images?.[0],
            store_id: store?.id
        }, 1);
    };

    return (
        <div className="space-y-8 bg-white" style={{ padding: `${sectionPadding}px` }}>
            {/* ... Header ... */}
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-900">{settings.title || 'Featured Products'}</h3>
                {!enablePagination && <span className="text-sm font-bold text-indigo-600 cursor-pointer hover:underline">View All</span>}
            </div>

            {finalProducts.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No products found in this collection.</p>
                </div>
            ) : (
                <>
                    <div
                        className={`grid ${getColsClass()}`}
                        style={{ gap: `${rowGap}px ${colGap}px` }}
                    >
                        {finalProducts.map(product => {
                            const linkPath = `/s/${store?.sub_url || 'preview'}/p/${product.id}`;
                            const Wrapper = isEditor ? 'div' : Link;
                            const wrapperProps = isEditor ? {} : { to: linkPath };

                            return (
                                <Wrapper
                                    key={product.id}
                                    className="group cursor-pointer transition-all"
                                    style={cardStyle}
                                    {...wrapperProps}
                                >
                                    {showImage && (
                                        <div
                                            className={`bg-slate-100 overflow-hidden relative ${getAspectClass(aspectRatio)}`}
                                            style={{
                                                width: '100%',
                                                // If not auto, aspect class handles it. If auto, we let img determine height or use minimal defaults.
                                                borderRadius: `${imageRadius}px`
                                                // Note: We might need margin if Image Radius + Card Padding interactions are complex, 
                                                // but usually Image is edge-to-edge if padding is 0. 
                                                // If padding > 0, the image is inside the padding? 
                                                // Current Structure: Image is sibling to Content Div. 
                                                // Usually if card has padding, the image should be inside? 
                                                // The current structure is [Image] [Content].
                                                // So 'cardContentPadding' should apply to Content Div only? 
                                                // User asked for "card content padding". 
                                                // If they want image to be edge-to-edge, content padding refers to the text area. 
                                                // If they want whole card padding, that's different.
                                                // Behaving as "Content Area Padding" is safer for "Card with Image" layouts.
                                            }}
                                        >
                                            {/* Placeholder / Loading State handled by browser with bg-slate-100 */}
                                            {product.images?.[0] ? (
                                                <img
                                                    src={getOptimizedUrl(product.images[0], 500)} // Request smaller 500px width
                                                    loading="lazy"
                                                    decoding="async"
                                                    width="500"
                                                    height={aspectRatio === 'auto' ? undefined : 667}
                                                    className={`w-full h-full group-hover:scale-105 transition-transform duration-500`}
                                                    style={{ objectFit: imageFit }}
                                                    alt={product.name}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Box className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div
                                        className={`${equalHeight ? 'flex flex-col flex-1' : ''}`}
                                        style={{ padding: `${cardContentPadding}px` }}
                                    >
                                        {showTitle && (
                                            <h4 style={titleStyle} className={`leading-tight mb-1 line-clamp-2 ${titleFontClass}`}>
                                                {product.name}
                                            </h4>
                                        )}

                                        {(showPrice || showRating) && (
                                            <div className={`mt-2 flex items-center justify-between gap-2 ${equalHeight ? 'mt-auto' : ''}`}>
                                                {showPrice && (
                                                    <div className="flex flex-wrap items-baseline gap-2">
                                                        {showComparePrice && product.compare_price && parseFloat(product.compare_price) > parseFloat(product.price) && (
                                                            <span className="text-xs text-slate-400 line-through decoration-slate-400 decoration-1">${parseFloat(product.compare_price).toFixed(2)}</span>
                                                        )}
                                                        <span className="text-sm font-bold text-slate-900">${parseFloat(product.price).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {showRating && (
                                                    <div className="flex items-center text-yellow-400 text-xs">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        <span className="ml-1 text-slate-500 font-medium">4.5</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {showAddToCart && (
                                            <div className={`
                                                mt-4 transition-all duration-300
                                                ${addToCartBehavior === 'hover' ? 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0' : ''}
                                            `}>
                                                <button
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    className={`uppercase tracking-wide flex items-center justify-center transition-colors text-xs font-bold ${buttonFontClass}`}
                                                    style={addToCartStyle}
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </Wrapper>
                            );
                        })}
                    </div>

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
