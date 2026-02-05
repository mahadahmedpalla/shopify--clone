import React, { useState } from 'react';
import { Box, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export function ProductGridRenderer({ settings, products, viewMode, store, isEditor, categories, categorySlug, parentSlug, childSlug }) {
    const [currentPage, setCurrentPage] = useState(1);

    // Filter products logic
    let displayProducts = products || [];

    const [searchParams] = useSearchParams();
    const categoryIdParam = searchParams.get('category');

    // 1. Filter by Category
    // Resolve slug if present
    let activeCategoryId = settings.categoryId;

    if (childSlug && parentSlug && categories) {
        // Hierarchical Match via Parent -> Child
        // This ensures uniqueness if child name is duplicated across different parents
        const childName = decodeURIComponent(childSlug).toLowerCase();
        const parentName = decodeURIComponent(parentSlug).toLowerCase();

        const matchedCat = categories.find(c => {
            const isNameMatch = c.name.toLowerCase() === childName;
            if (!isNameMatch) return false;

            // Check parent
            const parent = categories.find(p => p.id === c.parent_id);
            return parent && parent.name.toLowerCase() === parentName;
        });

        if (matchedCat) activeCategoryId = matchedCat.id;

    } else if (categorySlug && categories) {
        // Single level match (fallback or root category)
        const matchedCat = categories.find(c => c.name.toLowerCase() === decodeURIComponent(categorySlug).toLowerCase());
        if (matchedCat) activeCategoryId = matchedCat.id;
    } else if (categoryIdParam) {
        activeCategoryId = categoryIdParam;
    }

    if (activeCategoryId && activeCategoryId !== 'all') {
        displayProducts = displayProducts.filter(p => p.category_id === activeCategoryId);
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

    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('supabase.co')) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=80&format=webp`;
    };

    return (
        <div className="p-12 space-y-8 bg-white">
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
                    <div className={`grid gap-6 ${getColsClass()}`}>
                        {finalProducts.map(product => {
                            const linkPath = `/s/${store?.sub_url || 'preview'}/p/${product.id}`;
                            const Wrapper = isEditor ? 'div' : Link;
                            const wrapperProps = isEditor ? {} : { to: linkPath };

                            return (
                                <Wrapper
                                    key={product.id}
                                    className="space-y-3 p-4 border border-transparent hover:border-slate-100 rounded-2xl hover:shadow-lg transition-all group cursor-pointer bg-white block"
                                    {...wrapperProps}
                                >
                                    <div className="aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden relative">
                                        {/* Placeholder / Loading State handled by browser with bg-slate-100 */}
                                        {product.images?.[0] ? (
                                            <img
                                                src={getOptimizedUrl(product.images[0], 500)} // Request smaller 500px width
                                                loading="lazy"
                                                decoding="async"
                                                width="500"
                                                height="667" // Approximate 3:4 ratio
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                alt={product.name}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <Box className="h-8 w-8" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-2">{product.name}</h4>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-slate-900">${parseFloat(product.price).toFixed(2)}</span>
                                        </div>
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
