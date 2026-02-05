import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronRight, Search } from 'lucide-react';
import { getResponsiveValue } from '../Shared';
import { useCart } from '../../../../context/CartContext';

export function NavbarRenderer({ settings, viewMode, store }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Cart Context - Safe fallback if not used within provider (though we wrapped it everywhere now)
    const context = useCart();
    // But since we can't condition hooks, we assume it's valid or use optional chaining if we modify useCart?
    // My useCart throws error if missing.
    // StoreBuilder and PublicStorefront are wrapped.
    const { setIsOpen: openCart, cartCount } = context;

    const rVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);
    const navigate = useNavigate();

    const handleNavigate = (item) => {
        if (!item) return;

        // Close mobile menu if open
        setMobileMenuOpen(false);

        // Logic based on item type
        // The public store URL follows pattern: /s/:sub_url/:slug or /s/:sub_url/p/:id
        // We need the store sub_url. Ideally passed in 'store' prop.
        const subUrl = store?.sub_url || 'demo';

        if (item.type === 'external' || (item.url && item.url.startsWith('http'))) {
            window.location.href = item.url;
            return;
        }

        if (item.type === 'category') {
            navigate(`/s/${subUrl}/category/${item.value}`);
        } else if (item.type === 'product') {
            navigate(`/s/${subUrl}/p/${item.value}`);
        } else if (item.type === 'page') {
            // Basic pages like 'about', 'contact'
            navigate(`/s/${subUrl}/${item.value}`);
        } else if (item.url) {
            // Fallback: If it starts with /, assume it's relative to root? 
            // Or relative to store? Let's assume relative to store if it doesn't have /s/
            if (item.url.startsWith('/s/')) {
                navigate(item.url);
            } else {
                navigate(`/s/${subUrl}${item.url.startsWith('/') ? item.url : '/' + item.url}`);
            }
        } else {
            console.warn('Unknown menu item navigation', item);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const currentScroll = window.scrollY || document.documentElement.scrollTop;
            setScrolled(currentScroll > 50);

            // Use responsive stickyMode
            const mode = rVal('stickyMode', settings.stickyMode);

            if (mode === 'hide') {
                setVisible(currentScroll < lastScroll || currentScroll < 100);
            } else {
                setVisible(true);
            }
            setLastScroll(currentScroll);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScroll, settings.stickyMode, settings.responsive, viewMode]);

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    const stickyMode = rVal('stickyMode', settings.stickyMode);
    const isSticky = stickyMode === 'always' || (stickyMode === 'scroll' && scrolled) || (stickyMode === 'hide' && scrolled);
    const isHidden = stickyMode === 'hide' && scrolled && !visible;

    // Helper to get array of menu items safely
    const menuItems = rVal('menuItems', settings.menuItems || []);

    return (
        <>
            <div
                className={`flex items-center justify-center transition-all duration-500 w-full z-40 ${isHidden ? '-translate-y-full' : 'translate-y-0'}`}
                style={{
                    backgroundColor: rVal('bgColor', settings.bgColor),
                    color: rVal('textColor', settings.textColor),
                    height: rVal('height', settings.height),
                    borderRadius: rVal('borderRadius', settings.borderRadius),
                    borderBottom: `${rVal('borderWidth', settings.borderWidth)} solid ${rVal('borderColor', settings.borderColor)}`,
                    boxShadow: rVal('shadow', settings.shadow) === 'soft' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : rVal('shadow', settings.shadow) === 'strong' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
                    opacity: rVal('opacity', settings.opacity),
                    backdropFilter: rVal('blur', settings.blur) ? `blur(${rVal('blur', settings.blur)})` : 'none',
                    position: isSticky ? 'sticky' : 'relative',
                    top: 0
                }}
            >
                <div
                    className="flex items-center w-full px-6"
                    style={{
                        maxWidth: rVal('maxWidth', settings.maxWidth),
                        justifyContent: rVal('alignment', settings.alignment),
                        gap: rVal('gap', settings.gap)
                    }}
                >
                    {/* Logo & Store Name */}
                    <div className="flex items-center cursor-pointer" style={{ gap: rVal('logoGap', settings.logoGap || '12px') }} onClick={() => navigate(`/s/${store?.sub_url || 'demo'}`)}>
                        <div className="flex items-center">
                            {rVal('logoUrl', settings.logoUrl) ? (
                                <img src={rVal('logoUrl', settings.logoUrl)} style={{ width: rVal('logoWidth', settings.logoWidth) }} alt="Logo" />
                            ) : (
                                <div className="h-8 w-12 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                            )}
                        </div>
                        {rVal('showStoreName', settings.showStoreName) && (
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
                        gap: rVal('gap', settings.gap)
                    }}>
                        {menuItems.map(item => (
                            <span
                                key={item.id}
                                onClick={() => handleNavigate(item)}
                                className="cursor-pointer hover:opacity-75 transition-opacity flex items-center uppercase tracking-tight"
                                style={{
                                    color: rVal('textColor', settings.textColor),
                                    fontFamily: rVal('fontFamily', settings.fontFamily) || 'Inter, sans-serif',
                                    fontSize: rVal('fontSize', settings.fontSize) || '14px',
                                    fontWeight: rVal('fontWeight', settings.fontWeight) || '600'
                                }}
                            >
                                {item.label}
                                {item.type === 'category' && <ChevronRight className="h-3 w-3 ml-1 rotate-90" />}
                            </span>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                        <div className="relative cursor-pointer hover:opacity-75 transition-opacity" onClick={() => openCart(true)}>
                            <ShoppingCart className="h-5 w-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </div>

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

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-[200] transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                    onClick={() => setMobileMenuOpen(false)}
                />

                {/* Menu Panel */}
                <div
                    className={`absolute top-0 ${rVal('mobileMenuDirection', settings.mobileMenuDirection || 'left') === 'left' ? 'left-0' : 'right-0'} h-full w-[300px] shadow-2xl p-6 flex flex-col transition-transform duration-300 ease-out transform ${mobileMenuOpen ? 'translate-x-0' : (rVal('mobileMenuDirection', settings.mobileMenuDirection || 'left') === 'left' ? '-translate-x-full' : 'translate-x-full')}`}
                    style={{
                        backgroundColor: rVal('drawerBgColor', settings.drawerBgColor || '#ffffff'),
                        backdropFilter: rVal('drawerGlass', settings.drawerGlass) ? `blur(${rVal('drawerBlur', settings.drawerBlur || '10px')})` : 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-8">
                        {/* Drawer Header (Logo/Name) */}
                        <div className="flex items-center space-x-3">
                            {rVal('drawerShowLogo', settings.drawerShowLogo !== false) && (
                                <>
                                    {rVal('logoUrl', settings.logoUrl) ? (
                                        <img src={rVal('logoUrl', settings.logoUrl)} style={{ width: '40px' }} alt="Logo" className="object-contain" />
                                    ) : (
                                        <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[8px]">LOGO</div>
                                    )}
                                </>
                            )}
                            {rVal('drawerShowName', settings.drawerShowName !== false) && (
                                <span className="font-bold text-lg tracking-tight" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}>
                                    {store?.name || 'My Store'}
                                </span>
                            )}
                        </div>

                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100/50 rounded-full hover:bg-slate-200/50 transition-colors">
                            <X className="h-6 w-6" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }} />
                        </button>
                    </div>

                    {/* Search Bar Placeholder */}
                    {rVal('drawerShowSearch', settings.drawerShowSearch) && (
                        <div className="mb-6 relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-slate-100/50 border border-slate-200/50 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}
                                disabled
                            />
                            <Search className="absolute right-3 top-2.5 h-4 w-4 opacity-50" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }} />
                        </div>
                    )}

                    <div className="flex flex-col space-y-4 overflow-y-auto">
                        {menuItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => handleNavigate(item)}
                                className="border-b border-slate-100/10 pb-3 flex items-center justify-between group cursor-pointer hover:pl-2 transition-all"
                            >
                                <span style={{
                                    fontFamily: rVal('fontFamily', settings.fontFamily) || 'Inter, sans-serif',
                                    fontWeight: rVal('fontWeight', settings.fontWeight) || '600',
                                    color: rVal('drawerFontColor', settings.drawerFontColor),
                                    fontSize: rVal('drawerFontSize', settings.drawerFontSize || '16px')
                                }}>
                                    {item.label}
                                </span>
                                <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
