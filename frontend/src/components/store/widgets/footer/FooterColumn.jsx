import React from 'react';
import { ArrowRight } from 'lucide-react';

export function FooterColumn({ column, globalSettings, viewMode }) {
    // Merge local and global settings if "Apply to Global" logic was pushed down (or just execute local override)
    // For this implementation, we prefer local overrides, falling back to global where applicable.

    // Helper to get value: Local > Global > Default
    const getValue = (key, globalKey, fallback) => {
        if (column[key] !== undefined && column[key] !== '') return column[key];
        if (globalSettings[globalKey] !== undefined) return globalSettings[globalKey];
        return fallback;
    };

    // Styling
    const padding = column.padding || '0px';
    // In a real implementation, we might parse "20px 10px" or have separate fields. 
    // For simplicity, let's assume standard padding logic from parent or local string.

    const align = getValue('alignment', 'alignment', 'left');
    const headingColor = getValue('headingColor', 'headingColor', '#1e293b');
    const textColor = getValue('textColor', 'textColor', '#64748b');
    const linkColor = getValue('linkColor', 'linkColor', '#64748b');
    const linkHoverColor = getValue('linkHoverColor', 'linkHoverColor', '#4f46e5');

    const headingStyle = {
        fontSize: getValue('headingSize', 'headingSize', '16px'),
        fontWeight: getValue('headingWeight', 'headingWeight', '600'),
        color: headingColor,
        marginBottom: '16px',
        textAlign: align
    };

    const textStyle = {
        fontSize: getValue('textSize', 'textSize', '14px'),
        color: textColor,
        lineHeight: '1.6',
        textAlign: align
    };

    const linkStyle = {
        fontSize: getValue('linkSize', 'linkSize', '14px'),
        color: linkColor,
        textAlign: align,
        transition: 'color 0.2s',
        display: 'block',
        marginBottom: '8px',
        textDecoration: 'none'
    };

    return (
        <div className="footer-column" style={{
            padding: padding,
            textAlign: align,
            height: '100%'
        }}>
            {/* Column Heading */}
            {column.title && (
                <h4 style={headingStyle}>{column.title}</h4>
            )}

            {/* Content based on Type */}
            <div className="footer-content">
                {column.type === 'text' && (
                    <div style={textStyle} dangerouslySetInnerHTML={{ __html: column.content || '' }} />
                )}

                {column.type === 'links' && (
                    <div className="space-y-2">
                        {(column.links || []).map((link, index) => (
                            <a
                                key={index}
                                href={link.url}
                                style={linkStyle}
                                className="hover:opacity-80 flex items-center gap-2 group"
                                onMouseEnter={(e) => e.currentTarget.style.color = linkHoverColor}
                                onMouseLeave={(e) => e.currentTarget.style.color = linkColor}
                            >
                                {link.text}
                            </a>
                        ))}
                    </div>
                )}

                {column.type === 'newsletter' && (
                    <div className="space-y-4">
                        <p style={textStyle}>{column.content || 'Subscribe to our newsletter for updates.'}</p>
                        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
