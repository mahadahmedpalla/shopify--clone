
import React from 'react';
import { Link } from 'react-router-dom';
import { getResponsiveValue } from '../Shared';

export function HeadingRenderer({ settings, viewMode, isEditor }) {
    // 1. Content
    const Tag = settings.htmlTag || 'h2';
    const text = settings.text || 'Heading';

    // 2. Responsive Values
    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

    const align = getVal('alignment', 'center');
    const fontSize = getVal('fontSize', 32);
    const marginTop = getVal('marginTop', 0);
    const marginBottom = getVal('marginBottom', 0);
    const paddingY = getVal('paddingY', 0); // Vertical Padding for section
    const paddingX = getVal('paddingX', 0); // Horizontal Padding for section

    // 3. Styles
    const style = {
        textAlign: align,
        fontSize: `${fontSize}px`,
        fontWeight: settings.fontWeight || '700',
        fontFamily: settings.fontFamily || 'Inter, sans-serif',
        lineHeight: settings.lineHeight || '1.2',
        letterSpacing: `${settings.letterSpacing || 0}px`,
        textTransform: settings.textTransform || 'none',
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        // Color & Gradient
        color: settings.useGradient ? 'transparent' : (settings.textColor || '#1e293b'),
        backgroundImage: settings.useGradient ? `linear-gradient(to right, ${settings.gradientStart || '#4f46e5'}, ${settings.gradientEnd || '#ec4899'})` : 'none',
        backgroundClip: settings.useGradient ? 'text' : 'border-box',
        WebkitBackgroundClip: settings.useGradient ? 'text' : 'border-box',
        WebkitTextFillColor: settings.useGradient ? 'transparent' : undefined,
        // Text Shadow
        textShadow: settings.textShadow ? `2px 2px 4px ${settings.textShadowColor || 'rgba(0,0,0,0.2)'}` : 'none',
    };

    // Container Style (Background & Padding)
    const containerStyle = {
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
        backgroundColor: settings.backgroundColor || 'transparent',
        opacity: (settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 100) / 100,
        borderRadius: `${settings.borderRadius || 0}px`,
    };

    // Note: Opacity affects the whole container including text if applied to container directly. 
    // Usually background-color: rgba() is better for just background. 
    // But user asked for "Opacity slider for controlling background color", essentially generic opacity or alpha?
    // Let's assume standard hex + opacity conversion for background is better, BUT simpler is opacity on container if that's what they mean.
    // Wait, "Opacity slider for controlling background color" usually implies RGBA's Alpha.
    // If I apply `opacity` CSS property, it fades text too.
    // I will use a helper to convert hex+opacity to rgba for the background color specifically.

    // Hex to RGBA Helper
    const hexToRgba = (hex, opacity) => {
        if (!hex) return 'transparent';
        if (hex === 'transparent') return 'transparent';
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + (opacity / 100) + ')';
        }
        return hex;
    };

    const finalContainerStyle = {
        ...containerStyle,
        backgroundColor: hexToRgba(settings.backgroundColor || 'transparent', settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 100),
        opacity: 1 // Reset container opacity so text resolves fully
    };

    const content = (
        <Tag style={style} className="block w-full break-words">
            {text}
        </Tag>
    );

    // 4. Link Wrapper
    if (settings.enableLink && settings.linkUrl) {
        if (isEditor) {
            return (
                <div style={finalContainerStyle} className="w-full relative">
                    {content}
                </div>
            );
        }

        const isExternal = settings.linkUrl.startsWith('http');
        if (isExternal) {
            return (
                <a href={settings.linkUrl} target="_blank" rel="noopener noreferrer" style={finalContainerStyle} className="block w-full no-underline hover:opacity-80 transition-opacity">
                    {content}
                </a>
            );
        }

        return (
            <Link to={settings.linkUrl} style={finalContainerStyle} className="block w-full no-underline hover:opacity-80 transition-opacity">
                {content}
            </Link>
        );
    }

    return (
        <div style={finalContainerStyle} className="w-full relative">
            {content}
        </div>
    );
}
