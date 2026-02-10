import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { getResponsiveValue } from '../Shared';

export function ButtonRenderer({ settings, viewMode, isEditor }) {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // 1. Content
    const text = settings.text || 'Button';
    const linkUrl = settings.linkUrl || '';
    const openInNewTab = settings.openInNewTab || false;
    const iconName = settings.iconName || '';
    const iconPosition = settings.iconPosition || 'left'; // left, right, only
    // const customIconUrl = settings.customIconUrl; // Future: Support uploaded icons

    // 2. Responsive Values helper
    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

    // 3. Layout & Dimenstions
    const alignment = getVal('alignment', 'center'); // left, center, right
    const widthMode = getVal('widthMode', 'auto'); // auto, fixed, full
    const customWidth = getVal('customWidth', 150);

    // Spacing
    const marginTop = getVal('marginTop', 0);
    const marginBottom = getVal('marginBottom', 0);
    const marginLeft = getVal('marginLeft', 0);
    const marginRight = getVal('marginRight', 0);
    const paddingY = getVal('paddingY', 12);
    const paddingX = getVal('paddingX', 24);
    const iconGap = getVal('iconGap', 8);

    // Typography
    const fontSize = getVal('fontSize', 16);
    const fontWeight = getVal('fontWeight', '600');
    const fontFamily = settings.fontFamily || 'Inter, sans-serif';
    const letterSpacing = getVal('letterSpacing', 0);

    // Style - Normal
    const bgColor = settings.backgroundColor || '#4f46e5';
    const textColor = settings.textColor || '#ffffff';
    const borderColor = settings.borderColor || 'transparent';
    const borderWidth = settings.borderWidth || 0;
    const borderStyle = settings.borderStyle || 'solid';
    const borderRadius = settings.borderRadius || 8;
    const shadow = settings.shadow || 'none';
    const useGradient = settings.useGradient || false;
    const gradient = settings.gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

    // Style - Hover
    const hoverBgColor = settings.hoverBackgroundColor || '#4338ca';
    const hoverTextColor = settings.hoverTextColor || '#ffffff';
    const hoverScale = settings.hoverScale || 1; // 1.05 etc
    const hoverShadow = settings.hoverShadow || 'md';

    // Icon Rendering
    const IconComponent = iconName && Icons[iconName] ? Icons[iconName] : null;
    const iconSize = fontSize * 1.2;

    // Click Handler
    const handleClick = () => {
        if (isEditor) return;
        if (!linkUrl) return;

        if (openInNewTab) {
            window.open(linkUrl, '_blank');
        } else {
            if (linkUrl.startsWith('http')) {
                window.location.href = linkUrl;
            } else {
                navigate(linkUrl);
            }
        }
    };

    // Dynamic Styles
    const containerStyle = {
        display: 'flex',
        justifyContent: alignment === 'center' ? 'center' : (alignment === 'right' ? 'flex-end' : 'flex-start'),
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        paddingLeft: `${marginLeft}px`,
        paddingRight: `${marginRight}px`, // Using padding for margins to specific sides for container
        width: '100%',
    };

    const currentBg = isHovered ? (useGradient ? gradient : hoverBgColor) : (useGradient ? gradient : bgColor);
    const currentText = isHovered ? hoverTextColor : textColor;
    const currentShadowClass = isHovered ? `shadow-${hoverShadow}` : (shadow !== 'none' ? `shadow-${shadow}` : '');
    const currentTransform = isHovered && hoverScale !== 1 ? `scale(${hoverScale})` : 'scale(1)';

    const buttonStyle = {
        backgroundColor: !useGradient ? currentBg : undefined,
        backgroundImage: useGradient ? currentBg : undefined,
        color: currentText,
        borderColor: borderColor,
        borderWidth: `${borderWidth}px`,
        borderStyle: borderStyle,
        borderRadius: `${borderRadius}px`,

        paddingTop: `${paddingY}px`,
        paddingBottom: `${paddingY}px`,
        paddingLeft: widthMode === 'fixed' ? 0 : `${paddingX}px`, // Fixed width overrides horizontal padding for sizing usually, but we keep it for text safety? standardized to width
        paddingRight: widthMode === 'fixed' ? 0 : `${paddingX}px`,

        width: widthMode === 'full' ? '100%' : (widthMode === 'fixed' ? `${customWidth}px` : 'auto'),
        maxWidth: '100%',

        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${iconGap}px`,

        fontSize: `${fontSize}px`,
        fontWeight: fontWeight,
        fontFamily: fontFamily,
        letterSpacing: `${letterSpacing}px`,

        cursor: isEditor ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        transform: currentTransform,
        textDecoration: 'none',
        lineHeight: 1.2,
    };

    // Shadow classes in Tailwind are specific, we might need mapped inline styles if fully custom.
    // Since we use Tailwind classes for standard shadows, we might need a mapping or just standard style box-shadow if we wanted full control.
    // For now, let's use standard style for full control if easy, or rely on classes.
    // Implementation uses classes for standard shadows mixed with inline?
    // Let's stick to inline boxShadow if provided or create a mapping.
    // Simple Shadow Mapping:
    const getShadowStyle = (sh) => {
        switch (sh) {
            case 'sm': return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
            case 'md': return '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
            case 'lg': return '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
            case 'xl': return '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)';
            case 'soft': return '0 4px 20px -2px rgba(0,0,0,0.1)';
            case 'glow': return `0 0 15px ${bgColor}`;
            case 'none': return 'none';
            default: return 'none';
        }
    };

    buttonStyle.boxShadow = getShadowStyle(isHovered ? hoverShadow : shadow);


    return (
        <div style={containerStyle} className="button-widget-container">
            <button
                style={buttonStyle}
                onClick={handleClick}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {iconPosition === 'left' && IconComponent && <IconComponent size={iconSize} />}

                {iconPosition !== 'only' && (
                    <span>{text}</span>
                )}

                {iconPosition === 'right' && IconComponent && <IconComponent size={iconSize} />}
            </button>
        </div>
    );
}
