import React from 'react';
import { Button } from '../../../ui/Button';
import { getResponsiveValue } from '../Shared';

export function HeroRenderer({ settings, viewMode }) {
    const rVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);

    const showContentAboveImage = rVal('showContentAboveImage', settings.showContentAboveImage);
    const isBanner = !showContentAboveImage;
    const heightMode = rVal('heightMode', settings.heightMode);
    const heroHeight = heightMode === 'full' ? '100vh' :
        heightMode === 'large' ? '80vh' :
            heightMode === 'medium' ? '60vh' :
                heightMode === 'small' ? '40vh' : rVal('customHeight', settings.customHeight);

    const hAlign = rVal('hAlignment', settings.hAlignment);
    const vAlign = rVal('vAlignment', settings.vAlignment);
    const bgImage = rVal('backgroundImage', settings.backgroundImage);

    const bgPosition = rVal('backgroundPosition', settings.backgroundPosition || 'center');

    // Optimization Helper
    const getOptimizedUrl = (url, width) => {
        if (!url || !url.includes('supabase.co')) return url;
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=80&format=webp`;
    };

    return (
        <div
            className={`relative overflow-hidden w-full flex flex-col ${isBanner ? 'bg-white' : ''}`}
            style={{
                height: heroHeight,
                borderRadius: rVal('borderRadius', settings.borderRadius)
            }}
        >
            <div
                className="relative w-full h-full overflow-hidden flex"
                style={{
                    backgroundColor: rVal('overlayColor', settings.overlayColor || '#f1f5f9'),
                    justifyContent: hAlign,
                    alignItems: vAlign
                }}
            >
                {/* Background Image with Optimization */}
                {bgImage && (
                    <>
                        {/* 1. Tiny Blurred Placeholder (LQIP) */}
                        <img
                            src={getOptimizedUrl(bgImage, 20)}
                            className={`absolute inset-0 w-full h-full object-cover object-${bgPosition} blur-2xl scale-110`}
                            alt=""
                            aria-hidden="true"
                        />

                        {/* 2. Main High-Res Image */}
                        <img
                            src={getOptimizedUrl(bgImage, 1920)}
                            srcSet={`
                                ${getOptimizedUrl(bgImage, 640)} 640w,
                                ${getOptimizedUrl(bgImage, 1024)} 1024w,
                                ${getOptimizedUrl(bgImage, 1500)} 1500w,
                                ${getOptimizedUrl(bgImage, 1920)} 1920w
                            `}
                            className={`absolute inset-0 w-full h-full object-cover object-${bgPosition} transition-opacity duration-500`}
                            alt="Hero Background"
                            loading="eager" // Hero is LCP, load immediately
                            fetchPriority="high" // Prioritize this resource
                        />
                    </>
                )}

                {!isBanner && (
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            backgroundColor: rVal('overlayColor', settings.overlayColor),
                            opacity: rVal('overlayOpacity', settings.overlayOpacity),
                            background: rVal('useGradient', settings.useGradient) ? `linear-gradient(to bottom, transparent, ${rVal('overlayColor', settings.overlayColor)})` : 'none'
                        }}
                    />
                )}

                {showContentAboveImage && (
                    <div
                        className="relative z-20 px-12 text-center space-y-6"
                        style={{
                            maxWidth: settings.maxContentWidth,
                            textAlign: hAlign === 'center' ? 'center' : hAlign === 'flex-end' ? 'right' : 'left'
                        }}
                    >
                        <h2
                            className="font-extrabold tracking-tighter leading-tight animate-in slide-in-from-bottom duration-500"
                            style={{
                                fontSize: rVal('headingSize', settings.headingSize),
                                color: rVal('headingColor', settings.headingColor),
                                fontFamily: settings.headingFontFamily || settings.fontFamily || 'Inter, sans-serif'
                            }}
                        >
                            {settings.title}
                        </h2>
                        <p
                            className="font-medium opacity-90"
                            style={{
                                fontSize: rVal('subheadingSize', settings.subheadingSize),
                                color: rVal('subheadingColor', settings.subheadingColor),
                                fontFamily: settings.subheadingFontFamily || settings.fontFamily || 'Inter, sans-serif'
                            }}
                        >
                            {settings.subtitle}
                        </p>
                        <div
                            className={`flex items-center gap-4 ${hAlign === 'center' ? 'justify-center' : hAlign === 'flex-end' ? 'justify-end' : 'justify-start'}`}
                            style={{ marginTop: rVal('btnMarginTop', settings.btnMarginTop || '24px') }}
                        >
                            {settings.primaryBtnText && (
                                <Button
                                    className="shadow-xl hover:scale-105 transition-all"
                                    style={{
                                        backgroundColor: rVal('btnBgColor', settings.btnBgColor),
                                        color: rVal('btnTextColor', settings.btnTextColor),
                                        paddingLeft: rVal('btnPaddingX', settings.btnPaddingX),
                                        paddingRight: rVal('btnPaddingX', settings.btnPaddingX),
                                        paddingTop: rVal('btnPaddingY', settings.btnPaddingY),
                                        paddingBottom: rVal('btnPaddingY', settings.btnPaddingY),
                                        fontSize: rVal('btnFontSize', settings.btnFontSize),
                                        borderRadius: rVal('btnBorderRadius', settings.btnBorderRadius),
                                        border: 'none'
                                    }}
                                >
                                    {settings.primaryBtnText}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>

    );
}
