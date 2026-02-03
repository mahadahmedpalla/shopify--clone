import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { getResponsiveValue } from '../Shared';

export function HeroSlideshowRenderer({ settings, viewMode }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = useRef(null);

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
        // Check for mode-specific override first (prop_mobile, prop_tablet)
        // If not found, fall back to desktop (prop)
        // Mode hierarchy: Mobile -> Tablet -> Desktop
        // But for simply rendering, if viewMode is Mobile, we look for prop_mobile, if not check prop.

        let val;

        if (mode === 'mobile') {
            val = slide[`${key}_mobile`];
            if (val !== undefined && val !== '') return val;
            // Maybe fallback to tablet? Usually we just fallback to desktop.
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

                // Styles (Per Slide with Defaults fallback + Responsive)
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

                // Image Override
                const slideImage = sVal('image', slide.image);

                // Text Override (User requested "slide image can be changed or deleted... all the other properties can be altered")
                const slideTitle = sVal('title', slide.title);
                const slideSubtitle = sVal('subtitle', slide.subtitle);

                // Button Defaults (Legacy Support + Per Slide + Responsive)
                let buttons = slide.buttons || [];
                if (buttons.length === 0 && slide.btnText) {
                    buttons = [{ id: 'legacy', text: slide.btnText, link: slide.btnLink, variant: 'primary' }];
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
                                {/* LQIP (Blur-up) */}
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
                                    decoding="async"
                                />
                            </>
                        )}

                        {/* Overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: settings.overlayColor || '#000000',
                                opacity: settings.overlayOpacity || 0.4
                            }}
                        />

                        {/* Content */}
                        <div
                            className={`absolute inset-0 flex p-12 z-20 transition-all duration-700 ${isActive ? 'translate-y-0 opacity-100 delay-300' : 'translate-y-10 opacity-0'}`}
                            style={{
                                justifyContent: hAlign,
                                alignItems: vAlign,
                                // Responsive padding maybe? Fixed at p-12 for now.
                            }}
                        >
                            <div className={`max-w-4xl space-y-6 ${hAlign === 'center' ? 'text-center' : hAlign === 'flex-end' ? 'text-right' : 'text-left'}`}>
                                {slideTitle && (
                                    <h2
                                        style={{
                                            fontFamily: headingFont,
                                            color: headingColor,
                                            fontSize: headingSize,
                                            lineHeight: 1.1
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
                                            fontSize: subheadingSize
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

                                            return (
                                                <Button
                                                    key={btn.id || btnIdx}
                                                    style={{
                                                        backgroundColor: bgColor,
                                                        color: textColor,
                                                        border: border,
                                                        padding: `${btnPaddingY} ${btnPaddingX}`,
                                                        borderRadius: btnBorderRadius,
                                                        fontSize: btnFontSize,
                                                        marginTop: btnMarginTop
                                                    }}
                                                    className="shadow-xl transition-transform hover:scale-105 font-bold"
                                                >
                                                    {btn.text}
                                                </Button>
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100"
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
