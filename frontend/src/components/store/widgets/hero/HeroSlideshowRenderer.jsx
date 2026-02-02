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

    // Performance: Optimization Helpers (Reused from HeroRenderer)
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

                // PERFORMANCE: Render Strategy
                // Only render if active, or next/prev (for smooth transitions), or if we want to preload.
                // Actually, for a slideshow, it's best to keep them in DOM but hide them to allow transitions.
                // We use `loading="lazy"` for non-active images to save bandwidth.

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
                        <div className="absolute inset-0 flex items-center justify-center p-12 z-20">
                            <div className="text-center max-w-4xl space-y-6 animate-in slide-in-from-bottom duration-700 fade-in fill-mode-forwards">
                                {slide.title && (
                                    <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
                                        {slide.title}
                                    </h2>
                                )}
                                {slide.subtitle && (
                                    <p className="text-lg md:text-xl text-white/90 font-medium">
                                        {slide.subtitle}
                                    </p>
                                )}
                                {slide.btnText && (
                                    <div className="pt-4">
                                        <Button className="bg-white text-slate-900 hover:bg-slate-100 border-none px-8 py-3 rounded-full text-lg font-bold shadow-xl transition-transform hover:scale-105">
                                            {slide.btnText}
                                        </Button>
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
