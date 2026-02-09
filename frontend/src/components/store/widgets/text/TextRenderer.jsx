
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

    // Advanced parser for nested formatting (*bold*, _italic_, ~underline~) with escaping support
    const renderFormattedText = (content) => {
        if (!content) return null;

        // 1. Replace escaped characters with SAFE placeholders (no special chars)
        const safeContent = content
            .replace(/\\\*/g, '::AST::')
            .replace(/\\_/g, '::UND::')
            .replace(/\\~/g, '::TIL::');

        // Helper to restore escaped chars
        const restore = (str) => str
            .replace(/::AST::/g, '*')
            .replace(/::UND::/g, '_')
            .replace(/::TIL::/g, '~');

        // Recursive parser function
        const parse = (text, matchers) => {
            if (!matchers.length) return [restore(text)];

            const currentMatcher = matchers[0];
            const remainingMatchers = matchers.slice(1);

            // Regex for current marker
            const parts = text.split(currentMatcher.regex);

            return parts.map((part, index) => {
                // If it matches the full wrapper structure (e.g. *...*)
                if (currentMatcher.test(part)) {
                    // Extract inner content and recurse with remaining matchers
                    // We also allow the same matcher to be used again inside? 
                    // No, usually markdown structure is hierarchical or we just pass the full pipeline again
                    // For simplicity and preventing infinite loops, we pass the FULL pipeline again to allow *bold _italic_* and _italic *bold*_
                    // But we must be careful. Let's try passing 'matchers' again to support arbitrary nesting.
                    // To prevent infinite recursion on the SAME string, we strip markers.

                    const innerContent = part.slice(1, -1);
                    // Recurse on inner content
                    return currentMatcher.wrapper(parse(innerContent, matchers), index);
                }

                // Not a match, process with next matcher
                return parse(part, remainingMatchers);
            }).flat();
        };

        // Matchers Pipeline
        const matchers = [
            {
                regex: /(\*[\s\S]+?\*)/g, // Bold
                test: s => s.startsWith('*') && s.endsWith('*') && s.length >= 2,
                wrapper: (children, key) => <strong key={key} className="font-bold">{children}</strong>
            },
            {
                regex: /(_{1}[\s\S]+?_{1})/g, // Italic
                test: s => s.startsWith('_') && s.endsWith('_') && s.length >= 2,
                wrapper: (children, key) => <em key={key} className="italic">{children}</em>
            },
            {
                regex: /(~[\s\S]+?~)/g, // Underline
                test: s => s.startsWith('~') && s.endsWith('~') && s.length >= 2,
                wrapper: (children, key) => <u key={key} className="underline underline-offset-2">{children}</u>
            }
        ];

        return parse(safeContent, matchers);
    };

    return (
        <div style={containerStyle} className="w-full relative">
            <div style={textStyle}>
                {renderFormattedText(text)}
            </div>
        </div>
    );
}
