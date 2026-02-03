import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { getResponsiveValue } from '../Shared';
import { useLocation } from 'react-router-dom';

export function HeroSlideshowRenderer({ settings, viewMode, isEditor }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef(null);
    const location = useLocation();

    const slides = settings.slides || [];
    const count = slides.length;

    // Performance: Optimization Helpers
    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('supabase.co')) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=80&format=webp`;
    };

    // Autoplay Logic
    useEffect(() => {
        if (settings.autoplay && !isHovered && count > 1) {
            const duration = settings.autoplayDuration || 5000;
            timeoutRef.current = setTimeout(() => {
                nextSlide();
            }, duration);
        }
        return () => clearTimeout(timeoutRef.current);
    }, [currentSlide, isHovered, settings.autoplay, settings.autoplayDuration, count]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === count - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? count - 1 : prev - 1));
    };

    // Responsive Helper for Slide Objects
    const getSlideRespValue = (slide, key, mode, defaultVal) => {
        let val;

        if (mode === 'mobile') {
            val = slide[`${key}_mobile`];
            if (val !== undefined && val !== '') return val;
        } else if (mode === 'tablet') {
            val = slide[`${key}_tablet`];
            if (val !== undefined && val !== '') return val;
        }

        // Desktop / Default fallback
        return slide[key] !== undefined && slide[key] !== '' ? slide[key] : defaultVal;
    };

    // Layout
    const rVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);
    const heightMode = rVal('heightMode', settings.heightMode || 'full');
    const heroHeight = heightMode === 'full' ? '100vh' :
        heightMode === 'large' ? '80vh' :
            heightMode === 'medium' ? '60vh' :
                heightMode === 'small' ? '40vh' : '60vh';

    if (count === 0) {
        return <div className="h-64 bg-slate-100 flex items-center justify-center text-slate-400">Add slides to view slideshow</div>;
    }

    return (
        <div
            className="relative w-full overflow-hidden group"
            style={{ height: heroHeight }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Slides */}
            {slides.map((slide, index) => {
                const isActive = index === currentSlide;

                // Styles 
                const sVal = (key, def) => getSlideRespValue(slide, key, viewMode, def);

                const hAlign = sVal('hAlignment', 'center');
                const vAlign = sVal('vAlignment', 'center');

                // Typography
                const headingFont = sVal('headingFontFamily', 'Inter, sans-serif');
                const subheadingFont = sVal('subheadingFontFamily', 'Inter, sans-serif');
                const headingColor = sVal('headingColor', '#ffffff');
                const subheadingColor = sVal('subheadingColor', '#e2e8f0');
                const headingSize = sVal('headingSize', '48px');
                const subheadingSize = sVal('subheadingSize', '18px');

                // Content Overrides
                const slideImage = sVal('image', slide.image);
                const slideTitle = sVal('title', slide.title);
                const slideSubtitle = sVal('subtitle', slide.subtitle);

                // Overlay Overrides
                const overlayColor = sVal('overlayColor', settings.overlayColor || '#000000');
                const rawOpacity = sVal('overlayOpacity', undefined); // Check slide specific first
                let finalOpacity;

                if (rawOpacity !== undefined) {
                    finalOpacity = parseInt(rawOpacity) / 100;
                } else {
                    const globalOpacity = settings.overlayOpacity !== undefined ? settings.overlayOpacity : 0.4;
                    finalOpacity = globalOpacity > 1 ? globalOpacity / 100 : globalOpacity;
                }

                // Button Defaults 
                let buttons = slide.buttons || [];
                if (buttons.length === 0 && slide.btnText) {
                    buttons = [{ id: 'legacy', text: slide.btnText, link: slide.btnLink, variant: 'primary', linkType: 'url' }];
                }

                // Button Styles
                const btnPaddingX = sVal('btnPaddingX', '32px');
                const btnPaddingY = sVal('btnPaddingY', '16px');
                const btnBorderRadius = sVal('btnBorderRadius', '9999px');
                const btnFontSize = sVal('btnFontSize', '16px');
                const btnMarginTop = sVal('btnMarginTop', '24px');
                const btnBgColor = sVal('btnBgColor', '#ffffff');
                const btnTextColor = sVal('btnTextColor', '#000000');
                const secondaryBtnTextColor = sVal('secondaryBtnTextColor', '#ffffff');

                return (
                    <div
                        key={slide.id || index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out
                            ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                        `}
                    >
                        {/* Background Image */}
                        {slideImage && (
                            <>
                                {/* LQIP */}
                                <img
                                    src={getOptimizedUrl(slideImage, 20)}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                                />
                                {/* Main Image */}
                                <img
                                    src={getOptimizedUrl(slideImage, 1920)}
                                    srcSet={`
                                        ${getOptimizedUrl(slideImage, 640)} 640w,
                                        ${getOptimizedUrl(slideImage, 1024)} 1024w,
                                        ${getOptimizedUrl(slideImage, 1500)} 1500w,
                                        ${getOptimizedUrl(slideImage, 1920)} 1920w
                                    `}
                                    alt={slideTitle}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    loading={index === 0 ? "eager" : "lazy"}
                                    fetchPriority={index === 0 ? "high" : "auto"}
                                />
                            </>
                        )}

                        {/* Overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: overlayColor,
                                opacity: finalOpacity
                            }}
                        />

                        {/* Content */}
                        <div
                            className={`absolute inset-0 flex p-12 z-20 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'}`}
                            style={{
                                justifyContent: hAlign,
                                alignItems: vAlign,
                                whiteSpace: 'pre-wrap'
                            }}
                        >
                            <div className={`max-w-4xl space-y-6 ${hAlign === 'center' ? 'text-center' : hAlign === 'flex-end' ? 'text-right' : 'text-left'}`}>
                                {slideTitle && (
                                    <h2
                                        style={{
                                            fontFamily: headingFont,
                                            color: headingColor,
                                            fontSize: headingSize,
                                            lineHeight: 1.1,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        className="font-extrabold tracking-tight"
                                    >
                                        {slideTitle}
                                    </h2>
                                )}
                                {slideSubtitle && (
                                    <p
                                        style={{
                                            fontFamily: subheadingFont,
                                            color: subheadingColor,
                                            fontSize: subheadingSize,
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        className="font-medium opacity-90"
                                    >
                                        {slideSubtitle}
                                    </p>
                                )}

                                {/* Render Buttons */}
                                {buttons.length > 0 && (
                                    <div className={`pt-4 flex flex-wrap gap-4 ${hAlign === 'center' ? 'justify-center' : hAlign === 'flex-end' ? 'justify-end' : 'justify-start'}`}>
                                        {buttons.map((btn, btnIdx) => {
                                            const isPrimary = !btn.variant || btn.variant === 'primary';
                                            const bgColor = isPrimary ? btnBgColor : 'transparent';
                                            const textColor = isPrimary ? btnTextColor : secondaryBtnTextColor;
                                            const border = isPrimary ? 'none' : `2px solid ${secondaryBtnTextColor}`;

                                            // Determine HREF
                                            // Construct safe internal link: /store/:storeId/:pageSlug
                                            // We assume location is like /store/123/home or /store/123/customize
                                            // If in editor (customize), we don't want to actually navigate usually, but href should be valid.

                                            let href = btn.link || '#';
                                            let target = '_blank';

                                            if (btn.linkType === 'page' && btn.targetPage) {
                                                const pathParts = location.pathname.split('/');
                                                // ['','store','123','customize'] or ['','store','123','home']
                                                // The store root is usually parts[0,1,2] -> /store/123

                                                const storeRoot = pathParts.slice(0, 3).join('/');
                                                href = `${storeRoot}/${btn.targetPage}`;
                                                target = '_self';
                                            } else {
                                                // External URL
                                                target = '_blank';
                                                href = btn.link;
                                            }

                                            return (
                                                <a
                                                    key={btn.id || btnIdx}
                                                    href={href}
                                                    onClick={(e) => {
                                                        if (isEditor) e.preventDefault();
                                                    }}
                                                    target={target}
                                                    rel="noopener noreferrer"
                                                    className="no-underline block"
                                                >
                                                    <Button
                                                        as="span" // Render as span inside anchor to be valid HTML
                                                        style={{
                                                            backgroundColor: bgColor,
                                                            color: textColor,
                                                            border: border,
                                                            padding: `${btnPaddingY} ${btnPaddingX}`,
                                                            borderRadius: btnBorderRadius,
                                                            fontSize: btnFontSize,
                                                            marginTop: btnMarginTop,
                                                        }}
                                                        className="shadow-xl transition-transform hover:scale-105 font-bold cursor-pointer inline-block"
                                                    >
                                                        {btn.text}
                                                    </Button>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Controls: Arrows */}
            {settings.showArrows && count > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all 
                            ${(viewMode === 'mobile' || viewMode === 'tablet') ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}
                        `}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all 
                            ${(viewMode === 'mobile' || viewMode === 'tablet') ? 'opacity-100' : 'opacity-100 lg:opacity-0 lg:group-hover:opacity-100'}
                        `}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Controls: Dots */}
            {settings.showDots && count > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/60'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
