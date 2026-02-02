import React, { useState } from 'react';

export function ImageRenderer({ settings, viewMode = 'desktop', onClick }) {
    const getValue = (key, fallback) => {
        if (!settings[key]) return fallback;
        if (typeof settings[key] === 'object') {
            return settings[key][viewMode] || settings[key]['desktop'] || fallback;
        }
        return settings[key] || fallback;
    };

    // Sizing Logic
    const widthMode = getValue('widthMode', 'auto');
    let width = getValue('width', '100%');
    if (widthMode === 'auto') width = '100%';
    if (widthMode === 'full') width = '100%';

    // Height & Aspect Ratio Logic
    const heightMode = getValue('heightMode', 'auto');
    const aspectRatio = getValue('aspectRatio', 'auto');
    const customRatio = getValue('customRatio', 1.5);

    let height = getValue('height', 'auto');
    let ratioStyle = {};

    if (aspectRatio !== 'auto') {
        height = 'auto'; // let ratio dictate height
        let ratioVal = 1;
        if (aspectRatio === '1/1') ratioVal = 1;
        else if (aspectRatio === '4/3') ratioVal = 4 / 3;
        else if (aspectRatio === '16/9') ratioVal = 16 / 9;
        else if (aspectRatio === '3/4') ratioVal = 3 / 4;
        else if (aspectRatio === 'custom') ratioVal = customRatio || 1.5;

        ratioStyle = { aspectRatio: `${ratioVal}` };
    } else if (heightMode === 'fixed') {
        // height is already set from settings
    } else {
        // height auto - relies on natural image height
    }

    // Alignment (Flex parent wrapper)
    const alignment = getValue('alignment', 'center');
    const justifyContent = alignment === 'left' ? 'flex-start' : alignment === 'right' ? 'flex-end' : 'center';

    const containerStyle = {
        display: 'flex',
        width: '100%',
        justifyContent,
        marginTop: settings.margin?.top ? `${settings.margin.top}px` : undefined, // Simplify margin for now
        marginBottom: settings.margin?.bottom ? `${settings.margin.bottom}px` : undefined,
    };

    const imageWrapperStyle = {
        position: 'relative',
        width: width,
        height: height,
        ...ratioStyle,
        overflow: 'hidden',

        // Styles
        borderRadius: settings.borderRadius ? `${settings.borderRadius}px` : undefined,
        borderWidth: settings.borderWidth ? `${settings.borderWidth}px` : undefined,
        borderColor: settings.borderColor,
        borderStyle: settings.borderStyle,
        boxShadow: settings.shadow === 'none' ? undefined : `var(--shadow-${settings.shadow})`, // Assuming global shadow vars or we map it

        // Hover Transition Wrapper
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    };

    // Hover Effects (Inline styles don't support :hover well without state, using Group classes)
    const hoverClass = {
        'zoom': 'group-hover:scale-110',
        'lift': 'group-hover:-translate-y-2',
        'fade': 'group-hover:opacity-80',
        'blur': 'group-hover:blur-sm',
        'none': ''
    }[settings.hoverEffect || 'none'];

    const overlayStyle = {
        backgroundColor: settings.overlayColor,
        opacity: settings.overlayOpacity,
        mixBlendMode: 'normal' // could be setting
    };

    return (
        <div style={containerStyle} onClick={onClick}>
            <div
                className={`group relative ${settings.hoverEffect === 'lift' ? 'transition-transform duration-300' : ''}`}
                style={{ ...imageWrapperStyle, cursor: settings.clickAction === 'link' ? 'pointer' : 'default' }}
            >
                {/* Image */}
                <img
                    src={settings.src}
                    alt={settings.alt}
                    className={`w-full h-full block transition-all duration-500 ease-out ${hoverClass}`}
                    style={{
                        objectFit: settings.objectFit || 'cover',
                        height: '100%',
                        width: '100%'
                    }}
                />

                {/* Overlay */}
                {(settings.overlayOpacity > 0 || settings.hoverEffect === 'overlay') && (
                    <div
                        className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${settings.hoverEffect === 'overlay' ? 'opacity-0 group-hover:opacity-100' : ''}`}
                        style={settings.hoverEffect === 'overlay' ? { backgroundColor: settings.overlayColor } : overlayStyle}
                    />
                )}
            </div>
        </div>
    );
}
