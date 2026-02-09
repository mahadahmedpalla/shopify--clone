
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Box } from 'lucide-react';
import { getResponsiveValue } from '../Shared';

export function CategoryListRenderer({ settings, categories, viewMode, store, isEditor }) {
    if (!categories) return null;

    // --- 1. Filter & Sort Logic ---
    let displayCategories = [];

    // Source Logic
    if (settings.categorySource === 'selected' && settings.selectedCategories?.length > 0) {
        // Filter by selection
        displayCategories = categories.filter(c => settings.selectedCategories.includes(c.id));

        // Manual Sort based on selection order (if using manual sort)
        if (settings.sortBy === 'manual') {
            displayCategories.sort((a, b) => {
                return settings.selectedCategories.indexOf(a.id) - settings.selectedCategories.indexOf(b.id);
            });
        }
    } else {
        // "All" or fallback
        displayCategories = [...categories];
    }

    // Sorting Logic (unless manual)
    if (settings.sortBy !== 'manual') {
        displayCategories.sort((a, b) => {
            switch (settings.sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'random': return 0.5 - Math.random(); // Simple shuffle
                default: return 0;
            }
        });
    }

    // --- 2. Layout & Style Helpers ---
    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') {
            return settings[key] !== undefined ? settings[key] : defaultVal;
        }
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

    const layout = settings.layout || 'horizontal'; // 'horizontal' | 'grid'
    const rowGap = getVal('rowGap', 16);
    const colGap = getVal('columnGap', 16);

    // Columns
    const colsDesktop = settings.columns?.desktop || 6;
    const colsTablet = settings.columns?.tablet || 4;
    const colsMobile = settings.columns?.mobile || 2;

    const getColsClass = () => {
        let cols = colsDesktop;
        if (viewMode === 'tablet') cols = colsTablet;
        if (viewMode === 'mobile') cols = colsMobile;

        const map = {
            1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3',
            4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6',
            8: 'grid-cols-8' // Just in case
        };
        return map[cols] || 'grid-cols-4';
    };

    // Styling
    const alignment = settings.contentAlignment || 'center'; // left, center, right
    const showImage = settings.showImage !== false;
    const showTitle = settings.showTitle !== false;

    // Image
    const aspectRatio = settings.imageRatio || 'circle'; // auto, circle, 1:1, 3:4, 16:9
    const imageFit = settings.imageFit || 'cover';
    const hoverEffect = settings.hoverEffect || 'none'; // none, zoom, overlay
    const imageRadius = getVal('imageBorderRadius', aspectRatio === 'circle' ? 9999 : 8);

    // Card
    const cardBg = getVal('cardBackgroundColor', 'transparent');
    const cardRadius = getVal('cardBorderRadius', 0);
    const cardPadding = getVal('cardPadding', 0);

    // Fonts
    const titleFontSize = getVal('titleFontSize', 14);
    const titleColor = getVal('titleColor', '#1e293b');
    const titleFontWeight = settings.titleFontWeight || 'font-medium';
    const titleFontFamily = settings.titleFontFamily || 'font-sans';


    // --- 3. Interaction Helpers ---
    const scrollContainerRef = useRef(null);
    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const LinkWrapper = ({ children, to, className, style }) => {
        if (isEditor) {
            return <div className={className} style={style}>{children}</div>; // No-op for editor
        }
        return <Link to={to} className={className} style={style}>{children}</Link>;
    };

    // --- 4. Render ---
    if (displayCategories.length === 0) {
        return isEditor ? (
            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl m-4">
                <p className="text-slate-400 text-sm">No categories selected.</p>
            </div>
        ) : null;
    }

    return (
        <div className="w-full relative group/container" style={{
            paddingTop: `${getVal('sectionPaddingTop', 20)}px`,
            paddingBottom: `${getVal('sectionPaddingBottom', 20)}px`,
            paddingLeft: `${getVal('sectionPaddingX', 20)}px`,
            paddingRight: `${getVal('sectionPaddingX', 20)}px`,
            backgroundColor: getVal('sectionBackgroundColor', 'transparent')
        }}>

            {/* Section Title (Optional, added for consistency w/ other widgets) */}
            {settings.sectionTitle && (
                <h3 className="text-xl font-bold mb-6 px-1" style={{ color: titleColor }}>{settings.sectionTitle}</h3>
            )}

            {/* Horizontal Scroll Arrows */}
            {layout === 'horizontal' && (
                <>
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 shadow-lg text-slate-700 opacity-0 group-hover/container:opacity-100 transition-opacity disabled:opacity-0"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 shadow-lg text-slate-700 opacity-0 group-hover/container:opacity-100 transition-opacity disabled:opacity-0"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            <div
                ref={scrollContainerRef}
                className={layout === 'horizontal'
                    ? "flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-1 px-1"
                    : `grid ${getColsClass()}`
                }
                style={{ gap: layout === 'horizontal' ? `${colGap}px` : `${rowGap}px ${colGap}px` }}
            >
                {displayCategories.map(cat => {
                    const linkPath = `/s/${store?.sub_url || 'preview'}/shop?category=${cat.id}`;

                    // Fixed Aspect Ratio Classes
                    let aspectClass = '';
                    if (aspectRatio === '1:1' || aspectRatio === 'circle') aspectClass = 'aspect-square';
                    else if (aspectRatio === '3:4') aspectClass = 'aspect-[3/4]';
                    else if (aspectRatio === '4:5') aspectClass = 'aspect-[4/5]';
                    else if (aspectRatio === '16:9') aspectClass = 'aspect-video';

                    // Horizontal fixed width calculation
                    const itemStyle = layout === 'horizontal' ? {
                        flex: `0 0 calc(${100 / (viewMode === 'mobile' ? colsMobile : (viewMode === 'tablet' ? colsTablet : colsDesktop))}% - ${colGap}px)`,
                        scrollSnapAlign: 'start'
                    } : {};

                    return (
                        <LinkWrapper
                            key={cat.id}
                            to={linkPath}
                            className={`group relative block overflow-hidden transition-all duration-300`}
                            style={{
                                backgroundColor: cardBg,
                                borderRadius: `${cardRadius}px`,
                                padding: `${cardPadding}px`,
                                ...itemStyle
                            }}
                        >
                            {/* Image Container */}
                            {showImage && (
                                <div
                                    className={`relative overflow-hidden bg-slate-100 mb-3 ${aspectClass}`}
                                    style={{ borderRadius: `${imageRadius}px` }}
                                >
                                    {cat.image_url ? (
                                        <img
                                            src={cat.image_url}
                                            alt={cat.name}
                                            className={`w-full h-full object-${imageFit} transition-transform duration-500 ${hoverEffect === 'zoom' ? 'group-hover:scale-110' : ''}`}
                                        />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 ${!aspectClass ? 'h-32' : ''}`}>
                                            <Box className="w-8 h-8" />
                                        </div>
                                    )}

                                    {/* Overlay Hover Effect */}
                                    {hoverEffect === 'overlay' && (
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            {showTitle && (
                                                <span className="text-white font-bold px-2 text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                                    {cat.name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Title (Standard) */}
                            {showTitle && hoverEffect !== 'overlay' && (
                                <div className={`text-${alignment}`}>
                                    <h4 style={{
                                        fontSize: `${titleFontSize}px`,
                                        color: titleColor,
                                        fontFamily: titleFontFamily === 'font-sans' ? undefined : titleFontFamily, // Simplified for now
                                    }} className={`${titleFontWeight} leading-tight group-hover:opacity-80 transition-opacity`}>
                                        {cat.name}
                                    </h4>
                                </div>
                            )}
                        </LinkWrapper>
                    );
                })}
            </div>
        </div>
    );
}
