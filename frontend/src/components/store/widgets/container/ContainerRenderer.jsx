import React from 'react';
import { BlockRenderer } from '../BlockRenderer';

export function ContainerRenderer({ settings = {}, children, viewMode = 'desktop', store, products, categories }) {

    // Helper to get responsive value
    // If specific mode value exists, use it. Fallback to desktop, then default.
    // Note: In a real CSS-in-JS or Tailwind generator, we would generate media queries.
    // Here, since we receive 'viewMode' prop likely from the parent editor preview, we render the current viewMode style.
    // FOR PRODUCTION SEPARATE FROM EDITOR: We should generate CSS classes like `md:flex-row`.
    // However, the BlockRenderer usually receives `viewMode` from the context (PublicStorefront/Editor).
    // If `viewMode` is passed, we can render the dynamic style for that mode.
    // If this is the LIVE storefront, `viewMode` is determined by the `PublicStorefront` resize listener.

    const getValue = (key, fallback) => {
        if (!settings[key]) return fallback;
        if (typeof settings[key] === 'object') {
            return settings[key][viewMode] || settings[key]['desktop'] || fallback;
        }
        return settings[key] || fallback;
    };

    // Layout
    const direction = getValue('direction', 'column');
    const alignItems = getValue('alignItems', 'stretch');
    const justifyContent = getValue('justifyContent', 'start');
    const gap = getValue('gap', 0);
    const wrap = settings.wrap ? 'wrap' : 'nowrap';

    // Sizing
    const widthMode = settings.widthMode || 'auto';
    const heightMode = settings.heightMode || 'auto';

    let width = settings.width || 'auto';
    if (widthMode === 'full') width = '100%';
    if (widthMode === 'screen') width = '100vw';
    if (widthMode === 'container') width = '100%'; // Max width logic handled by container class usually

    let height = settings.height || 'auto';
    if (heightMode === 'fit') height = 'fit-content';
    if (heightMode === 'screen') height = '100vh';

    // Spacing (Padding/Margin) -> Expecting object { desktop: { top: 10... } }
    const getSpacing = (type, side) => {
        const spacingObj = settings[type]; // padding or margin
        if (!spacingObj) return '0px';
        const modeObj = spacingObj[viewMode] || spacingObj['desktop'];
        if (!modeObj) return '0px';
        return (modeObj[side] || 0) + 'px';
    };

    const style = {
        // Layout
        display: 'flex',
        flexDirection: direction,
        alignItems: alignItems,
        justifyContent: justifyContent === 'between' ? 'space-between' : justifyContent === 'around' ? 'space-around' : justifyContent,
        gap: `${gap}px`,
        flexWrap: wrap,

        // Sizing
        width: width,
        height: height,
        minHeight: settings.minHeight ? `${settings.minHeight}px` : undefined,
        maxWidth: settings.maxWidth ? `${settings.maxWidth}px` : (widthMode === 'container' ? '1280px' : undefined),

        // Spacing
        paddingTop: getSpacing('padding', 'top'),
        paddingRight: getSpacing('padding', 'right'),
        paddingBottom: getSpacing('padding', 'bottom'),
        paddingLeft: getSpacing('padding', 'left'),
        marginTop: getSpacing('margin', 'top'),
        marginRight: getSpacing('margin', 'right'),
        marginBottom: getSpacing('margin', 'bottom'),
        marginLeft: getSpacing('margin', 'left'),

        // Visual
        backgroundColor: settings.backgroundColor || 'transparent',
        borderWidth: settings.borderWidth ? `${settings.borderWidth}px` : '0px',
        borderColor: settings.borderColor || 'transparent',
        borderStyle: settings.borderStyle || 'solid',
        borderRadius: settings.borderRadius ? `${settings.borderRadius}px` : '0px',
        overflow: settings.overflow || 'visible',
    };

    // Shadow Class Map
    const getShadowClass = () => {
        switch (settings.shadow) {
            case 'sm': return 'shadow-sm';
            case 'md': return 'shadow-md';
            case 'lg': return 'shadow-lg';
            case 'xl': return 'shadow-xl';
            case 'inner': return 'shadow-inner';
            default: return '';
        }
    };

    // Center container if max-width is set (mx-auto behavior)
    if (widthMode === 'container') {
        style.marginLeft = 'auto';
        style.marginRight = 'auto';
    }

    return (
        <div
            style={style}
            className={`transition-all duration-200 ${getShadowClass()}`}
        >
            {/* Render Children Blocks */}
            {settings.children && Array.isArray(settings.children) && settings.children.map(childBlock => (
                <BlockRenderer
                    key={childBlock.id}
                    {...childBlock} // type, settings, etc.
                    viewMode={viewMode}
                    store={store}
                    products={products}
                    categories={categories}
                />
            ))}

            {/* If literal children passed (rare in this architecture but good practice) */}
            {children}
        </div>
    );
}
