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

                // Styles (Per Slide with Defaults fallback)
                const hAlign = slide.hAlignment || 'center';
                const vAlign = slide.vAlignment || 'center';

                // Typography
                const headingFont = slide.headingFontFamily || 'Inter, sans-serif';
                const subheadingFont = slide.subheadingFontFamily || 'Inter, sans-serif';
                const headingColor = slide.headingColor || '#ffffff';
                const subheadingColor = slide.subheadingColor || '#e2e8f0';
                const headingSize = slide.headingSize || '48px';
                const subheadingSize = slide.subheadingSize || '18px';

                // Button Defaults (Legacy Support + Per Slide)
                // If slide has new 'buttons' array, use it. If not, use legacy btnText/btnLink
                let buttons = slide.buttons || [];
                if (buttons.length === 0 && slide.btnText) {
                    buttons = [{ id: 'legacy', text: slide.btnText, link: slide.btnLink, variant: 'primary' }];
                }

                return (
                    <div
                        key={slide.id || index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out
                            ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'}
                        `}
                    >
                        {/* Background Image */}
                        {slide.image && (
                            <>
                                {/* LQIP (Blur-up) */}
                                <img
                                    src={getOptimizedUrl(slide.image, 20)}
                                    alt=""
                                    aria-hidden="true"
                                    className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110"
                                />

                                {/* Main Image */}
                                <img
                                    src={getOptimizedUrl(slide.image, 1920)}
                                    srcSet={`
                                        ${getOptimizedUrl(slide.image, 640)} 640w,
                                        ${getOptimizedUrl(slide.image, 1024)} 1024w,
                                        ${getOptimizedUrl(slide.image, 1500)} 1500w,
                                        ${getOptimizedUrl(slide.image, 1920)} 1920w
                                    `}
                                    alt={slide.title}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    // CRITICAL PERF: Lazy load everything EXCEPT the first slide (or current if we started elsewhere)
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
                                alignItems: vAlign
                            }}
                        >
                            <div className={`max-w-4xl space-y-6 ${hAlign === 'center' ? 'text-center' : hAlign === 'flex-end' ? 'text-right' : 'text-left'}`}>
                                {slide.title && (
                                    <h2
                                        style={{
                                            fontFamily: headingFont,
                                            color: headingColor,
                                            fontSize: headingSize,
                                            lineHeight: 1.1
                                        }}
                                        className="font-extrabold tracking-tight"
                                    >
                                        {slide.title}
                                    </h2>
                                )}
                                {slide.subtitle && (
                                    <p
                                        style={{
                                            fontFamily: subheadingFont,
                                            color: subheadingColor,
                                            fontSize: subheadingSize
                                        }}
                                        className="font-medium opacity-90"
                                    >
                                        {slide.subtitle}
                                    </p>
                                )}

                                {/* Render Buttons */}
                                {buttons.length > 0 && (
                                    <div className={`pt-4 flex flex-wrap gap-4 ${hAlign === 'center' ? 'justify-center' : hAlign === 'flex-end' ? 'justify-end' : 'justify-start'}`}>
                                        {buttons.map((btn, btnIdx) => {
                                            // Determine styles based on variant
                                            const isPrimary = !btn.variant || btn.variant === 'primary';
                                            const bgColor = isPrimary ? (slide.btnBgColor || '#ffffff') : 'transparent';
                                            const textColor = isPrimary ? (slide.btnTextColor || '#000000') : (slide.secondaryBtnTextColor || '#ffffff');
                                            const border = isPrimary ? 'none' : `2px solid ${slide.secondaryBtnTextColor || '#ffffff'}`;

                                            return (
                                                <Button
                                                    key={btn.id || btnIdx}
                                                    style={{
                                                        backgroundColor: bgColor,
                                                        color: textColor,
                                                        border: border,
                                                        padding: `${slide.btnPaddingY || '16px'} ${slide.btnPaddingX || '32px'}`,
                                                        borderRadius: slide.btnBorderRadius || '9999px',
                                                        fontSize: slide.btnFontSize || '16px',
                                                        marginTop: slide.btnMarginTop || '24px'
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
