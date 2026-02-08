import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { getResponsiveValue } from '../Shared';

export function CategoryListRenderer({ settings, categories, viewMode, isEditor, onSelect }) {
    if (!categories) return null;

    // 1. Filter Categories
    let displayCategories = [];
    if (settings.categorySource === 'selected' && settings.selectedCategories?.length > 0) {
        // Map selected IDs to category objects, preserving selection order if manual sort
        if (settings.sortBy === 'manual') {
            displayCategories = settings.selectedCategories
                .map(id => categories.find(c => c.id === id))
                .filter(Boolean);
        } else {
            displayCategories = categories.filter(c => settings.selectedCategories.includes(c.id));
        }
    } else {
        // Default: Show all top-level categories if no specific source logic
        displayCategories = categories.filter(c => !c.parent_id);
    }

    // 2. Sort Categories (if not manual)
    if (settings.sortBy !== 'manual') {
        displayCategories = [...displayCategories].sort((a, b) => {
            switch (settings.sortBy) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name); // Optional
                case 'newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'random': return 0.5 - Math.random();
                default: return 0;
            }
        });
    }

    // 3. Layout Settings
    const layoutType = settings.layoutType || 'horizontal'; // 'horizontal' | 'grid'

    // columns
    const colsDesktop = settings.columns?.desktop || 6;
    const colsTablet = settings.columns?.tablet || 4;
    const colsMobile = settings.columns?.mobile || 2;

    const getColsCount = () => {
        if (viewMode === 'mobile') return colsMobile;
        if (viewMode === 'tablet') return colsTablet;
        return colsDesktop;
    };

    const getResponsiveVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);

    // Styling
    const rowGap = getResponsiveVal('rowGap', 16);
    const colGap = getResponsiveVal('columnGap', 16);
    const sectionPadding = getResponsiveVal('sectionPadding', 20);

    const showImage = settings.showImage !== false;
    const showTitle = settings.showTitle !== false;
    const textAlign = settings.textAlign || 'center';

    // Image Style
    const aspectRatio = settings.aspectRatio || 'auto';
    const imageFit = settings.imageFit || 'cover';
    const hoverEffect = settings.hoverEffect || 'none'; // 'zoom', 'overlay_fade'

    // Card Style
    const cardBg = getResponsiveVal('cardBackgroundColor', 'transparent');
    const cardRadius = getResponsiveVal('cardBorderRadius', 0);
    const cardPadding = getResponsiveVal('cardPadding', 0);

    // Typography
    const titleFontSize = getResponsiveVal('titleFontSize', 14);
    const titleFontWeight = settings.titleFontWeight || 'font-medium';
    const titleColor = getResponsiveVal('titleColor', '#1e293b');
    const titleFontFamily = settings.titleFontFamily || 'font-sans';

    // Alignment
    const alignClass = textAlign === 'left' ? 'text-left items-start' : textAlign === 'right' ? 'text-right items-end' : 'text-center items-center';

    const getAspectClass = (ratio) => {
        switch (ratio) {
            case 'circle': return 'aspect-square rounded-full';
            case '1:1': return 'aspect-square';
            case '3:4': return 'aspect-[3/4]';
            case '4:5': return 'aspect-[4/5]';
            case '16:9': return 'aspect-video';
            case 'auto':
            default: return '';
        }
    };

    const getFontFamilyStyle = (font) => {
        if (!font || font.startsWith('font-')) return {};
        return { fontFamily: `'${font}', sans-serif` };
    };

    const getFontClass = (font) => {
        if (font && font.startsWith('font-')) return font;
        return '';
    };

    if (displayCategories.length === 0) {
        return isEditor ? (
            <div className="p-8 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50 min-h-[200px]">
                <div className="text-center">
                    <p className="font-medium">Category List</p>
                    <p className="text-xs mt-1">Select categories in the sidebar to display them here.</p>
                </div>
            </div>
        ) : null;
    }

    return (
        <div className="relative w-full" style={{ padding: `${sectionPadding}px` }}>
            {settings.title && (
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">{settings.title}</h2>
                </div>
            )}

            <div
                className={`
                    ${layoutType === 'horizontal'
                        ? 'flex overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4'
                        : 'grid'
                    }
                `}
                style={{
                    gap: layoutType === 'horizontal' ? `${colGap}px` : `${rowGap}px ${colGap}px`,
                    gridTemplateColumns: layoutType === 'grid' ? `repeat(${getColsCount()}, minmax(0, 1fr))` : undefined
                }}
            >
                {displayCategories.map(cat => {
                    const Wrapper = isEditor ? 'div' : Link;
                    const wrapperProps = isEditor ? {} : { to: `/shop/${cat.slug}` };

                    const itemWidthPercentage = 100 / getColsCount();
                    // Basic horizontal sizing logic
                    const itemStyle = layoutType === 'horizontal' ? {
                        flex: `0 0 calc(${itemWidthPercentage}% - 16px)`, // approximate gap
                        minWidth: `calc(${itemWidthPercentage}% - 16px)`,
                        scrollSnapAlign: 'start'
                    } : {};

                    return (
                        <Wrapper
                            key={cat.id}
                            {...wrapperProps}
                            className={`group relative flex flex-col ${alignClass} transition-all duration-300 cursor-pointer overflow-hidden`}
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
                                    className={`relative overflow-hidden w-full ${getAspectClass(aspectRatio)} bg-slate-100 shadow-sm`}
                                    style={{
                                        borderRadius: aspectRatio === 'circle' ? '50%' : `${Math.max(0, cardRadius - cardPadding)}px`
                                    }}
                                >
                                    {cat.image_url ? (
                                        <img
                                            src={cat.image_url}
                                            alt={cat.name}
                                            className={`w-full h-full object-${imageFit} transition-transform duration-700 ${hoverEffect === 'zoom' ? 'group-hover:scale-110' : ''}`}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <ImageIcon className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}

                                    {/* Overlay Fade Title */}
                                    {hoverEffect === 'overlay_fade' && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="text-white font-bold text-lg translate-y-2 group-hover:translate-y-0 transition-transform duration-300 px-2 text-center">
                                                {cat.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Standard Title */}
                            {showTitle && hoverEffect !== 'overlay_fade' && (
                                <div className="mt-3 w-full">
                                    <h3
                                        className={`${getFontClass(titleFontFamily)} leading-tight`}
                                        style={{
                                            fontSize: `${titleFontSize}px`,
                                            fontWeight: titleFontWeight === 'font-bold' ? 700 : titleFontWeight === 'font-medium' ? 500 : 400,
                                            color: titleColor,
                                            ...getFontFamilyStyle(titleFontFamily)
                                        }}
                                    >
                                        {cat.name}
                                    </h3>
                                </div>
                            )}
                        </Wrapper>
                    );
                })}
            </div>
        </div>
    );
}
