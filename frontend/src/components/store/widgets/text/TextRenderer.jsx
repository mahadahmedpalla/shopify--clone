
import React from 'react';
import { getResponsiveValue } from '../Shared';

export function TextRenderer({ settings, viewMode, isEditor }) {
    // 1. Content
    const text = settings.text || 'Start typing your text here...';

    // 2. Responsive Values
    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

    const align = getVal('alignment', 'left');
    const fontSize = getVal('fontSize', 16);
    const lineHeight = getVal('lineHeight', 1.6);
    const marginTop = getVal('marginTop', 0);
    const marginBottom = getVal('marginBottom', 0);
    const paddingY = getVal('paddingY', 0);
    const paddingX = getVal('paddingX', 0);

    // 3. Layout Logic
    const maxWidthMode = settings.maxWidthMode || 'full'; // 'full' | 'custom'
    const customWidth = settings.customWidth || 600;
    const textFlow = settings.textFlow || 'wrap'; // 'wrap' | 'balance' | 'pretty'

    // 4. Styles
    // Container Style (Background, Padding, Margin)
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

    const containerStyle = {
        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        paddingLeft: `${paddingX}px`,
        paddingRight: `${paddingX}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        backgroundColor: hexToRgba(settings.backgroundColor || 'transparent', settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 100),
        borderRadius: `${settings.borderRadius || 0}px`,
        // Flex container to handle alignment of the inner text block if max-width is used
        display: 'flex',
        justifyContent: align === 'center' ? 'center' : (align === 'right' ? 'flex-end' : 'flex-start'),
        textAlign: align, // Fallback inheritance
    };

    const textStyle = {
        textAlign: align,
        fontSize: `${fontSize}px`,
        fontWeight: settings.fontWeight || '400',
        fontFamily: settings.fontFamily || 'Inter, sans-serif',
        lineHeight: lineHeight,
        letterSpacing: `${settings.letterSpacing || 0}px`,
        color: settings.textColor || '#334155',
        whiteSpace: 'pre-wrap', // Preserve line breaks
        maxWidth: maxWidthMode === 'custom' ? `${customWidth}px` : '100%',
        width: '100%', // Ensure it takes available space up to max-width
        textWrap: textFlow === 'balance' ? 'balance' : (textFlow === 'pretty' ? 'pretty' : 'wrap'),
    };

    // Simple parser for *bold*, _italic_, ~underline~ with escaping support
    const renderFormattedText = (content) => {
        if (!content) return null;

        // 1. Replace escaped characters with placeholders
        // We use specific tokens that are unlikely to appear in user text
        const safeContent = content
            .replace(/\\\*/g, '___ESC_AST___')
            .replace(/\\_/g, '___ESC_UND___')
            .replace(/\\~/g, '___ESC_TIL___');

        // 2. Split by markers
        // [\s\S] matches any character including newlines
        const parts = safeContent.split(/(\*[\s\S]+?\*|_{1}[\s\S]+?_{1}|~[\s\S]+?~)/g);

        // 3. Render and restore escaped chars
        return parts.map((part, index) => {
            const restore = (str) => str
                .replace(/___ESC_AST___/g, '*')
                .replace(/___ESC_UND___/g, '_')
                .replace(/___ESC_TIL___/g, '~');

            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <strong key={index} className="font-bold">{restore(part.slice(1, -1))}</strong>;
            }
            if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
                return <em key={index} className="italic">{restore(part.slice(1, -1))}</em>;
            }
            if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
                return <u key={index} className="underline underline-offset-2">{restore(part.slice(1, -1))}</u>;
            }
            return restore(part);
        });
    };

    return (
        <div style={containerStyle} className="w-full relative">
            <div style={textStyle}>
                {renderFormattedText(text)}
            </div>
        </div>
    );
}
