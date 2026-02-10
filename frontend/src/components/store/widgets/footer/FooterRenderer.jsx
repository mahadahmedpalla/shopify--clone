import React, { useState } from 'react';
import { FooterColumn } from './FooterColumn';
import { ChevronDown } from 'lucide-react';

export function FooterRenderer({ settings = {}, viewMode = 'desktop' }) {
    const columns = settings.columns || [];

    // Global Styles
    const containerStyle = {
        backgroundColor: settings.backgroundColor || '#f8fafc',
        paddingTop: settings.paddingY !== undefined ? `${settings.paddingY}px` : (settings.paddingTop || '64px'),
        paddingBottom: settings.paddingY !== undefined ? `${settings.paddingY}px` : (settings.paddingBottom || '64px'),
        borderTopWidth: settings.borderTop ? '1px' : '0',
        borderTopColor: settings.borderColor || '#e2e8f0',
        color: settings.textColor || '#64748b'
    };

    // Responsive Grid Logic
    const getGridColumns = () => {
        if (viewMode === 'mobile') return '1fr'; // Stack on mobile
        const cols = settings.columnsPerRow || 4;
        return `repeat(${cols}, 1fr)`;
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: getGridColumns(),
        gap: `${settings.columnGap || 32}px`,
        rowGap: `${settings.rowGap || 32}px`,
        maxWidth: settings.maxWidth || '1280px',
        margin: '0 auto',
        paddingLeft: settings.paddingX !== undefined ? `${settings.paddingX}px` : '24px',
        paddingRight: settings.paddingX !== undefined ? `${settings.paddingX}px` : '24px'
    };

    // Accordion State for Mobile
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <footer style={containerStyle} className="w-full">
            <div style={gridStyle}>
                {columns.map((col, index) => {
                    // Check for Full Width Override
                    const isFullWidth = col.width === 'full';
                    const colStyle = isFullWidth && viewMode === 'desktop' ? { gridColumn: '1 / -1' } : {};

                    // Mobile Accordion View
                    if (viewMode === 'mobile' && settings.mobileLayout === 'accordion') {
                        return (
                            <div key={col.id || index} className="border-b border-slate-200 last:border-0">
                                <button
                                    onClick={() => toggleAccordion(index)}
                                    className="flex items-center justify-between w-full py-4 text-left font-medium text-slate-900"
                                >
                                    <span>{col.title || 'Untitled'}</span>
                                    <ChevronDown className={`h-4 w-4 transition-transform ${openIndex === index ? 'rotate-180' : ''}`} />
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-96 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}
                                >
                                    <FooterColumn column={col} globalSettings={settings} viewMode={viewMode} />
                                </div>
                            </div>
                        );
                    }

                    // Desktop / Standard Grid View
                    return (
                        <div key={col.id || index} style={colStyle}>
                            <FooterColumn column={col} globalSettings={settings} viewMode={viewMode} />
                        </div>
                    );
                })}
            </div>

            {/* Optional Copyright Bar */}
            {settings.showCopyright && (
                <div className="mt-12 pt-8 border-t border-slate-200 text-center text-sm" style={{ borderColor: settings.borderColor }}>
                    &copy; {new Date().getFullYear()} {settings.storeName || 'Store Name'}. All rights reserved.
                </div>
            )}
        </footer>
    );
}
