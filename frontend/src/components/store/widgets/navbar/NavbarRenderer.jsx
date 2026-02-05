import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, ChevronRight, Search } from 'lucide-react';
import { getResponsiveValue } from '../Shared';
import { useCart } from '../../../../context/CartContext';

const DesktopMenuItem = ({ item, rVal, settings, handleNavigate, depth = 0 }) => {
    const [open, setOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <span
                onClick={() => handleNavigate(item)}
                className="cursor-pointer hover:opacity-75 transition-opacity flex items-center uppercase tracking-tight whitespace-nowrap"
                style={{
                    color: rVal('textColor', settings.textColor),
                    fontFamily: rVal('fontFamily', settings.fontFamily) || 'Inter, sans-serif',
                    fontSize: rVal('fontSize', settings.fontSize) || '14px',
                    fontWeight: rVal('fontWeight', settings.fontWeight) || '600'
                }}
            >
                {item.label}
                {hasChildren && <ChevronRight className={`h-3 w-3 ml-1 ${depth === 0 ? 'rotate-90' : ''}`} />}
            </span>

            {/* Dropdown */}
            {hasChildren && open && (
                <div
                    className={`absolute z-50 ${depth === 0 ? 'top-full left-0 pt-4' : 'top-0 left-full pl-2'} animate-in fade-in zoom-in-95 duration-150`}
                >
                    <div className="bg-white shadow-xl border border-slate-100 rounded-lg py-2 min-w-[200px]">
                        {item.children.map(child => (
                            <div key={child.id} className="px-4 py-2 hover:bg-slate-50">
                                <DesktopMenuItem
                                    item={child}
                                    rVal={rVal}
                                    settings={settings}
                                    handleNavigate={handleNavigate}
                                    depth={depth + 1}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const MobileAccordionItem = ({ item, rVal, settings, handleNavigate, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = item.children && item.children.length > 0;

    return (
        <div className="flex flex-col select-none">
            <div
                className={`flex items-center justify-between border-slate-100/10 cursor-pointer group hover:bg-slate-50/5 rounded px-2 transition-colors ${depth === 0 ? 'py-3 border-b' : 'py-2'}`}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent bubbling if nested
                    hasChildren ? setIsOpen(!isOpen) : handleNavigate(item);
                }}
            >
                <span style={{
                    fontFamily: rVal('fontFamily', settings.fontFamily) || 'Inter, sans-serif',
                    fontWeight: rVal('fontWeight', settings.fontWeight) || '600',
                    color: rVal('drawerFontColor', settings.drawerFontColor),
                    fontSize: depth === 0 ? (rVal('drawerFontSize', settings.drawerFontSize) || '16px') : '14px',
                    opacity: depth === 0 ? 1 : 0.9
                }}>
                    {item.label}
                </span>
                {hasChildren && (
                    <div
                        className="p-1"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    >
                        <ChevronRight
                            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}
                            style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}
                        />
                    </div>
                )}
            </div>
            {/* Nested Accordion Children */}
            {hasChildren && isOpen && (
                <div className="pl-4 border-l border-slate-200/20 ml-2 mb-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                    {item.children.map(child => (
                        <MobileAccordionItem
                            key={child.id}
                            item={child}
                            rVal={rVal}
                            settings={settings}
                            handleNavigate={handleNavigate}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function NavbarRenderer({ settings, viewMode, store, products, categories = [] }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Mobile Navigation State (for Slide Mode)
    const [mobilePath, setMobilePath] = useState([]); // Stack of items we have drilled into

    // Cart Context
    const context = useCart();
    const { setIsOpen: openCart, cartCount } = context;

    const rVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);
    const navigate = useNavigate();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            if (e.key === 'Enter') e.preventDefault();

            if (searchQuery.trim()) {
                const subUrl = store?.sub_url || 'demo';
                const query = encodeURIComponent(searchQuery.trim());
                navigate(`/s/${subUrl}/search?q=${query}`);
                setMobileMenuOpen(false);
                setSearchQuery('');
            }
        }
    };

    // Filter products for autocomplete
    const filteredProducts = searchQuery.length > 1
        ? (products || []).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
        : [];

    const handleProductSelect = (product) => {
        const subUrl = store?.sub_url || 'demo';
        navigate(`/s/${subUrl}/p/${product.id}`);
        setMobileMenuOpen(false);
        setSearchQuery('');
    };

    // Helper to convert hex to rgba
    const hexToRgba = (hex, opacity) => {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length == 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + (opacity / 100) + ')';
        }
        return hex;
    }

    const handleNavigate = (item) => {
        if (!item) return;

        // If it looks like a parent category interaction only (optional UX choice), maybe don't navigate?
        // But user request implies navigation is fine, just adds drilldown.

        setMobileMenuOpen(false);

        const subUrl = store?.sub_url || 'demo';

        if (item.type === 'external' || (item.url && item.url.startsWith('http'))) {
            window.location.href = item.url;
            return;
        }

        if (item.type === 'category') {
            // Updated Routing: All categories go to /shop (Collection Page)
            if (item.value === 'all') {
                navigate(`/s/${subUrl}/shop`);
            } else {
                // Find category name for SEO URL
                const cat = categories.find(c => c.id === item.value);
                if (cat) {
                    if (cat.parent_id) {
                        // Hierarchical URL: /shop/Parent/Child
                        const parent = categories.find(c => c.id === cat.parent_id);
                        if (parent) {
                            navigate(`/s/${subUrl}/shop/${encodeURIComponent(parent.name)}/${encodeURIComponent(cat.name)}`);
                        } else {
                            // Fallback if parent missing
                            navigate(`/s/${subUrl}/shop/${encodeURIComponent(cat.name)}`);
                        }
                    } else {
                        // Root Category
                        navigate(`/s/${subUrl}/shop/${encodeURIComponent(cat.name)}`);
                    }
                } else {
                    // Fallback if not found locally
                    navigate(`/s/${subUrl}/shop?category=${item.value}`);
                }
            }
        } else if (item.type === 'product') {
            navigate(`/s/${subUrl}/p/${item.value}`);
        } else if (item.type === 'page') {
            navigate(`/s/${subUrl}/${item.value}`);
        } else if (item.url) {
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
            setMobilePath([]); // Reset path on open
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

    // --- Menu Construction ---

    // Recursive helper to build tree
    const buildCategoryTree = (parentId = null) => {
        return categories
            .filter(c => c.parent_id === parentId)
            .map(c => ({
                id: c.id,
                label: c.name,
                type: 'category',
                value: c.id,
                children: buildCategoryTree(c.id)
            }));
    };

    const rawMenuItems = rVal('menuItems', settings.menuItems || []);

    // Process menu items to attach children
    const menuItems = rawMenuItems.map(item => {
        if (item.type === 'category') {
            if (item.value === 'all') {
                // "All Categories" - fetch all top level
                return {
                    ...item,
                    children: buildCategoryTree(null)
                };
            } else {
                // Specific category - fetch its children
                return {
                    ...item,
                    children: buildCategoryTree(item.value)
                };
            }
        }
        return item;
    });

    // --- Mobile Drawer Logic ---
    const drawerMode = rVal('drawerMenuMode', 'slide'); // 'slide' or 'accordion'

    // For Slide Mode: Get current list of items to display
    const currentMobileItems = mobilePath.length === 0
        ? menuItems
        : mobilePath[mobilePath.length - 1].children || [];

    const handleMobileItemClick = (item) => {
        if (drawerMode === 'slide') {
            if (item.children && item.children.length > 0) {
                // Drill down
                setMobilePath([...mobilePath, item]);
            } else {
                // Navigate
                handleNavigate(item);
            }
        } else {
            // Accordion Mode handled in render
            if (!item.children || item.children.length === 0) {
                handleNavigate(item);
            }
        }
    };

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

                    {/* Desktop Menu - Recursive */}
                    <div className="items-center" style={{
                        display: (
                            (viewMode === 'desktop' && !settings.hamburgerPC) ||
                            (viewMode === 'tablet' && !settings.hamburgerTablet) ||
                            (viewMode === 'mobile' && !settings.hamburgerMobile)
                        ) ? 'flex' : 'none',
                        gap: rVal('gap', settings.gap)
                    }}>
                        {menuItems.map(item => (
                            <DesktopMenuItem
                                key={item.id}
                                item={item}
                                rVal={rVal}
                                settings={settings}
                                handleNavigate={handleNavigate}
                            />
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

                        {/* Hamburger Logic */}
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
                        backgroundColor: hexToRgba(rVal('drawerBgColor', settings.drawerBgColor || '#ffffff'), rVal('drawerBgOpacity', 100)),
                        backdropFilter: rVal('drawerGlass', settings.drawerGlass) ? `blur(${rVal('drawerBlur', settings.drawerBlur || '10px')})` : 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        {/* Drawer Header or Back Button */}
                        <div className="flex items-center space-x-3">
                            {drawerMode === 'slide' && mobilePath.length > 0 ? (
                                <button
                                    onClick={() => setMobilePath(prev => prev.slice(0, -1))}
                                    className="flex items-center text-base font-bold text-black hover:opacity-80"
                                >
                                    <ChevronRight className="h-5 w-5 rotate-180 mr-1" />
                                    Back
                                </button>
                            ) : (
                                <>
                                    {/* Normal Header */}
                                    {rVal('drawerShowLogo', settings.drawerShowLogo !== false) && (
                                        <>
                                            {rVal('logoUrl', settings.logoUrl) ? (
                                                <img src={rVal('logoUrl', settings.logoUrl)} style={{ width: '30px' }} alt="Logo" className="object-contain" />
                                            ) : (
                                                <div className="h-6 w-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[8px]">LG</div>
                                            )}
                                        </>
                                    )}
                                    {rVal('drawerShowName', settings.drawerShowName !== false) && (
                                        <span className="font-bold text-lg tracking-tight" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}>
                                            {store?.name || 'My Store'}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>

                        <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100/50 rounded-full hover:bg-slate-200/50 transition-colors">
                            <X className="h-6 w-6" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }} />
                        </button>
                    </div>

                    {/* Search Bar - Hide if deep in slide menu? No, keep it accessible usually. */}
                    {mobilePath.length === 0 && rVal('drawerShowSearch', settings.drawerShowSearch) && (
                        <div className="mb-6 relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full bg-slate-100/50 border border-slate-200/50 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                            />
                            <Search
                                className="absolute right-3 top-2.5 h-4 w-4 opacity-50 cursor-pointer hover:opacity-100 transition-opacity"
                                style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }}
                                onClick={handleSearch}
                            />
                            {/* Autocomplete... (Simplified for brevity, same logic as before) */}
                            {searchQuery.length > 1 && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl overflow-hidden z-20">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => handleProductSelect(product)}
                                            className="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                                        >
                                            <div className="h-10 w-10 bg-slate-100 rounded shrink-0 mr-3 overflow-hidden flex items-center justify-center">
                                                {product.image_urls && product.image_urls[0] ? (
                                                    <img src={product.image_urls[0]} alt={product.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-xs text-slate-300 font-bold">IMG</div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-sm font-medium text-slate-900 truncate">{product.name}</div>
                                                <div className="flex items-center space-x-2 text-xs">
                                                    {parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                                                        <span className="text-slate-400 line-through">${parseFloat(product.compare_at_price).toFixed(2)}</span>
                                                    )}
                                                    <span className={`${parseFloat(product.compare_at_price) > parseFloat(product.price) ? 'text-red-600 font-bold' : 'text-slate-500'}`}>${parseFloat(product.price).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Current Menu View Title (Slide Mode) */}
                    {drawerMode === 'slide' && mobilePath.length > 0 && (
                        <div className="mb-4 text-sm font-bold text-slate-400 uppercase tracking-widest px-2">
                            {mobilePath[mobilePath.length - 1].label}
                        </div>
                    )}

                    {/* Menu Items List */}
                    <div className="flex flex-col space-y-2 overflow-y-auto flex-1">
                        {(drawerMode === 'slide' ? currentMobileItems : menuItems).map(item => {
                            // Recursive render for Accordion would act differently, but here we flatten the list if expanded?
                            // Actually, let's keep it simple. If accordion, we map and check children.

                            // For Accordion Mode rendering
                            if (drawerMode === 'accordion') {
                                return (
                                    <MobileAccordionItem
                                        key={item.id}
                                        item={item}
                                        rVal={rVal}
                                        settings={settings}
                                        handleNavigate={handleNavigate}
                                    />
                                );
                            }

                            // Slide Mode Rendering
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleMobileItemClick(item)}
                                    className="border-b border-slate-100/10 pb-3 flex items-center justify-between group cursor-pointer hover:pl-2 transition-all py-2"
                                >
                                    <span style={{
                                        fontFamily: rVal('fontFamily', settings.fontFamily) || 'Inter, sans-serif',
                                        fontWeight: rVal('fontWeight', settings.fontWeight) || '600',
                                        color: rVal('drawerFontColor', settings.drawerFontColor),
                                        fontSize: rVal('drawerFontSize', settings.drawerFontSize || '16px')
                                    }}>
                                        {item.label}
                                    </span>
                                    {item.children && item.children.length > 0 && (
                                        <ChevronRight className="h-5 w-5 opacity-50 group-hover:opacity-100 transition-opacity" style={{ color: rVal('drawerFontColor', settings.drawerFontColor) }} />
                                    )}
                                </div>
                            );
                        })}

                        {/* Empty state for slide view if category has no children? */}
                    </div>
                </div>
            </div>
        </>
    );
}
