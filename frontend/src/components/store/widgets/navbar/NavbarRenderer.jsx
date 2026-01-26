import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, ChevronRight } from 'lucide-react';
import { getResponsiveValue } from '../Shared';

export function NavbarRenderer({ settings, viewMode, store }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const rVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            setScrolled(currentScroll > 50);

            if (settings.stickyMode === 'hide') {
                setVisible(currentScroll < lastScroll || currentScroll < 100);
            } else {
                setVisible(true);
            }
            setLastScroll(currentScroll);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScroll, settings.stickyMode]);

    const isSticky = settings.stickyMode === 'always' || (settings.stickyMode === 'scroll' && scrolled) || (settings.stickyMode === 'hide' && scrolled);
    const isHidden = settings.stickyMode === 'hide' && scrolled && !visible;

    return (
        <>
            <div
                className={`flex items-center justify-center transition-all duration-500 w-full z-40 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
                style={{
                    backgroundColor: settings.bgColor,
                    color: settings.textColor,
                    height: rVal('height', settings.height),
                    borderRadius: rVal('borderRadius', settings.borderRadius),
                    borderBottom: `${rVal('borderWidth', settings.borderWidth)} solid ${settings.borderColor}`,
                    boxShadow: settings.shadow === 'soft' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : settings.shadow === 'strong' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
                    opacity: settings.opacity,
                    backdropFilter: settings.blur ? `blur(${settings.blur})` : 'none',
                    position: isSticky ? 'sticky' : 'relative',
                    top: 0
                }}
            >
                <div
                    className="flex items-center w-full px-6"
                    style={{
                        maxWidth: settings.maxWidth,
                        justifyContent: rVal('alignment', settings.alignment),
                        gap: rVal('gap', settings.gap)
                    }}
                >
                    {/* Logo & Store Name */}
                    <div className="flex items-center" style={{ gap: rVal('logoGap', settings.logoGap || '12px') }}>
                        <div className="flex items-center">
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} style={{ width: rVal('logoWidth', settings.logoWidth) }} alt="Logo" />
                            ) : (
                                <div className="h-8 w-12 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                            )}
                        </div>
                        {settings.showStoreName && (
                            <span
                                className="font-bold text-sm tracking-tight truncate max-w-[150px]"
                                style={{ fontSize: rVal('fontSize', settings.fontSize) }}
                            >
                                {store?.name || 'My Store'}
                            </span>
                        )}
                    </div>

                    {/* Desktop Menu - Conditional based on viewMode & settings */}
                    <div className="items-center" style={{
                        display: (
                            (viewMode === 'desktop' && !settings.hamburgerPC) ||
                            (viewMode === 'tablet' && !settings.hamburgerTablet) ||
                            (viewMode === 'mobile' && !settings.hamburgerMobile)
                        ) ? 'flex' : 'none',
                        gap: settings.gap
                    }}>
                        {(settings.menuItems || []).map(item => (
                            <span
                                key={item.id}
                                className="cursor-pointer hover:opacity-75 transition-opacity flex items-center uppercase tracking-tight"
                                style={{
                                    color: settings.textColor,
                                    fontFamily: settings.fontFamily || 'Inter, sans-serif',
                                    fontSize: settings.fontSize || '14px',
                                    fontWeight: settings.fontWeight || '600'
                                }}
                            >
                                {item.label}
                                {item.type === 'category' && <ChevronRight className="h-3 w-3 ml-1 rotate-90" />}
                            </span>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        <ShoppingCart className="h-5 w-5 cursor-pointer hover:opacity-75" />

                        {/* Hamburger Logic - Conditional based on viewMode & settings */}
                        <div style={{
                            display: (
                                (viewMode === 'desktop' && settings.hamburgerPC) ||
                                (viewMode === 'tablet' && settings.hamburgerTablet) ||
                                (viewMode === 'mobile' && settings.hamburgerMobile)
                            ) ? 'flex' : 'none'
                        }}>
                            <Menu className="h-6 w-6 cursor-pointer" onClick={() => setMobileMenuOpen(true)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Preview Overlay */}
            {mobileMenuOpen && (
                <div className="absolute inset-0 bg-white z-[100] p-6 flex flex-col animate-in slide-in-from-right overflow-y-auto cursor-default" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end mb-8">
                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="flex flex-col space-y-6">
                        {(settings.menuItems || []).map(item => (
                            <div key={item.id} className="text-2xl border-b border-slate-100 pb-4 flex items-center justify-between group">
                                <span style={{
                                    fontFamily: settings.fontFamily || 'Inter, sans-serif',
                                    fontWeight: settings.fontWeight || '700',
                                    color: settings.textColor
                                }}>
                                    {item.label}
                                </span>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
