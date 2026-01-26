
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { ShoppingCart, ChevronRight, Box, Layout, Menu, X } from 'lucide-react';

export function PublicStorefront() {
    const { storeSubUrl, pageSlug } = useParams();
    const activeSlug = pageSlug || 'home';
    const [store, setStore] = useState(null);
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Responsive Detection
    const [viewMode, setViewMode] = useState('desktop');

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setViewMode('mobile');
            else if (width < 1024) setViewMode('tablet');
            else setViewMode('desktop');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchStoreAndPage();
    }, [storeSubUrl, activeSlug]);

    const fetchStoreAndPage = async () => {
        setLoading(true);
        setError(null);

        // 1. Fetch Store by Sub-URL
        const { data: storeData, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('sub_url', storeSubUrl)
            .single();

        if (storeError || !storeData) {
            setError(`Store "${storeSubUrl}" not found or inactive.`);
            setLoading(false);
            return;
        }
        setStore(storeData);

        // 2. Fetch Page by Store ID and Slug
        const { data: pageData, error: pageError } = await supabase
            .from('store_pages')
            .select('*')
            .eq('store_id', storeData.id)
            .eq('slug', activeSlug)
            .single();

        if (pageError || !pageData) {
            setError(`Page "${activeSlug}" not found in ${storeData.name}.`);
        } else {
            setPage(pageData);
        }
        setLoading(false);
    };

    if (loading) return <PublicLoader />;
    if (error) return <PublicError message={error} />;

    return (
        <div className="min-h-screen bg-white">
            {(page?.content || []).map((block) => (
                <BlockRenderer
                    key={block.id}
                    type={block.type}
                    settings={block.settings}
                    viewMode={viewMode}
                    storeSubUrl={storeSubUrl}
                    storeName={store?.name}
                />
            ))}
        </div>
    );
}

function BlockRenderer({ type, settings, viewMode, storeSubUrl, storeName }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Responsive Helper
    const rVal = (key, defaultVal) => {
        if (!settings.responsive || !settings.responsive[viewMode]) return settings[key] || defaultVal;
        return settings.responsive[viewMode][key] !== undefined ? settings.responsive[viewMode][key] : (settings[key] || defaultVal);
    };

    useEffect(() => {
        if (type !== 'navbar') return;
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
    }, [type, lastScroll, settings.stickyMode]);

    switch (type) {
        case 'navbar':
            const isSticky = settings.stickyMode === 'always' || (settings.stickyMode === 'scroll' && scrolled) || (settings.stickyMode === 'hide' && scrolled);
            const isHidden = settings.stickyMode === 'hide' && scrolled && !visible;

            return (
                <>
                    <nav
                        className={`fixed top-0 left-0 w-full transition-all duration-500 z-[100] flex justify-center
                            ${isHidden ? '-translate-y-full' : 'translate-y-0'}
                            ${isSticky ? 'shadow-md border-b' : ''}
                        `}
                        style={{
                            backgroundColor: settings.bgColor,
                            color: settings.textColor,
                            height: rVal('height', settings.height),
                            borderRadius: rVal('borderRadius', settings.borderRadius),
                            borderBottom: `${rVal('borderWidth', settings.borderWidth)} solid ${settings.borderColor}`,
                            boxShadow: settings.shadow === 'soft' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : settings.shadow === 'strong' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
                            opacity: settings.opacity,
                            position: isSticky ? 'sticky' : 'relative',
                            top: 0
                        }}
                    >
                        <div className="flex items-center w-full px-6" style={{ maxWidth: settings.maxWidth, justifyContent: rVal('alignment', settings.alignment), gap: rVal('gap', settings.gap) }}>
                            <Link to={`/s/${storeSubUrl}`} className="flex items-center" style={{ gap: rVal('logoGap', settings.logoGap || '12px') }}>
                                <div className="flex items-center">
                                    {settings.logoUrl ? (
                                        <img src={settings.logoUrl} style={{ width: rVal('logoWidth', settings.logoWidth) }} alt="Logo" />
                                    ) : (
                                        <div className="h-8 w-12 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                                    )}
                                </div>
                                {settings.showStoreName && (
                                    <span
                                        className="font-bold text-sm tracking-tight"
                                        style={{
                                            fontSize: rVal('fontSize', settings.fontSize),
                                            fontFamily: settings.fontFamily || 'Inter, sans-serif'
                                        }}
                                    >
                                        {storeName}
                                    </span>
                                )}
                            </Link>

                            <div className="hidden md:flex items-center" style={{ gap: settings.gap }}>
                                {(settings.menuItems || []).map(item => (
                                    <Link
                                        key={item.id}
                                        to={item.type === 'page' ? `/s/${storeSubUrl}/${item.value}` : '#'}
                                        className="hover:opacity-75 transition-opacity uppercase tracking-tight"
                                        style={{
                                            fontFamily: settings.fontFamily || 'Inter, sans-serif',
                                            fontSize: settings.fontSize || '14px',
                                            fontWeight: settings.fontWeight || '600'
                                        }}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>

                            <div className="flex items-center space-x-4">
                                <ShoppingCart className="h-6 w-6 cursor-pointer" />
                                <button className="md:hidden" onClick={() => setMobileMenuOpen(true)}>
                                    <Menu className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </nav>
                    <div style={{ height: isSticky ? settings.height : 0 }} />

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 bg-white z-[200] p-6 flex flex-col transition-all animate-in slide-in-from-right overflow-y-auto">
                            <div className="flex justify-end mb-8">
                                <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full"><X className="h-6 w-6" /></button>
                            </div>
                            <div className="flex flex-col space-y-6">
                                {(settings.menuItems || []).map(item => (
                                    <Link
                                        key={item.id}
                                        to={item.type === 'page' ? `/s/${storeSubUrl}/${item.value}` : '#'}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-2xl border-b border-slate-100 pb-4"
                                        style={{
                                            fontFamily: settings.fontFamily || 'Inter, sans-serif',
                                            fontWeight: settings.fontWeight || '700'
                                        }}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        case 'hero':
            const showContentAboveImage = rVal('showContentAboveImage', settings.showContentAboveImage);
            const isBanner = !showContentAboveImage;
            const heightMode = rVal('heightMode', settings.heightMode);
            const heroHeight = heightMode === 'full' ? '100vh' :
                heightMode === 'large' ? '80vh' :
                    heightMode === 'medium' ? '60vh' :
                        heightMode === 'small' ? '40vh' : rVal('customHeight', settings.customHeight);

            const hAlign = rVal('hAlignment', settings.hAlignment);
            const vAlign = rVal('vAlignment', settings.vAlignment);
            const bgImage = rVal('backgroundImage', settings.backgroundImage);

            return (
                <div
                    className={`relative overflow-hidden w-full flex flex-col ${isBanner ? 'bg-white' : ''}`}
                    style={{ borderRadius: rVal('borderRadius', settings.borderRadius) }}
                >
                    <div
                        className="relative w-full overflow-hidden flex"
                        style={{
                            height: heroHeight,
                            backgroundColor: rVal('overlayColor', settings.overlayColor || '#f1f5f9'),
                            justifyContent: hAlign,
                            alignItems: vAlign
                        }}
                    >
                        {bgImage && (
                            <img
                                src={bgImage}
                                className="absolute inset-0 w-full h-full object-cover"
                                alt="Hero Background"
                            />
                        )}

                        {!isBanner && (
                            <div
                                className="absolute inset-0 z-10"
                                style={{
                                    backgroundColor: rVal('overlayColor', settings.overlayColor),
                                    opacity: rVal('overlayOpacity', settings.overlayOpacity),
                                    background: rVal('useGradient', settings.useGradient) ? `linear-gradient(to bottom, transparent, ${rVal('overlayColor', settings.overlayColor)})` : 'none'
                                }}
                            />
                        )}

                        {showContentAboveImage && (
                            <div
                                className="relative z-20 px-12 text-center space-y-6"
                                style={{
                                    maxWidth: settings.maxContentWidth,
                                    textAlign: hAlign === 'center' ? 'center' : hAlign === 'flex-end' ? 'right' : 'left'
                                }}
                            >
                                <h2
                                    className="font-extrabold tracking-tighter leading-tight"
                                    style={{
                                        fontSize: rVal('headingSize', settings.headingSize),
                                        color: rVal('headingColor', settings.headingColor),
                                        fontFamily: settings.headingFontFamily || settings.fontFamily || 'Inter, sans-serif'
                                    }}
                                >
                                    {settings.title}
                                </h2>
                                <p
                                    className="font-medium opacity-90"
                                    style={{
                                        fontSize: rVal('subheadingSize', settings.subheadingSize),
                                        color: rVal('subheadingColor', settings.subheadingColor),
                                        fontFamily: settings.subheadingFontFamily || settings.fontFamily || 'Inter, sans-serif'
                                    }}
                                >
                                    {settings.subtitle}
                                </p>
                                <div
                                    className={`flex items-center gap-4 ${hAlign === 'center' ? 'justify-center' : hAlign === 'flex-end' ? 'justify-end' : 'justify-start'}`}
                                    style={{ marginTop: rVal('btnMarginTop', settings.btnMarginTop || '24px') }}
                                >
                                    {settings.primaryBtnText && (
                                        <Button
                                            className="shadow-xl"
                                            style={{
                                                backgroundColor: rVal('btnBgColor', settings.btnBgColor),
                                                color: rVal('btnTextColor', settings.btnTextColor),
                                                paddingLeft: rVal('btnPaddingX', settings.btnPaddingX),
                                                paddingRight: rVal('btnPaddingX', settings.btnPaddingX),
                                                paddingTop: rVal('btnPaddingY', settings.btnPaddingY),
                                                paddingBottom: rVal('btnPaddingY', settings.btnPaddingY),
                                                fontSize: rVal('btnFontSize', settings.btnFontSize),
                                                borderRadius: rVal('btnBorderRadius', settings.btnBorderRadius),
                                                border: 'none'
                                            }}
                                        >
                                            {settings.primaryBtnText}
                                        </Button>
                                    )}
                                    {settings.secondaryBtnText && (
                                        <Button
                                            variant="secondary"
                                            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                                            style={{
                                                borderRadius: rVal('btnBorderRadius', settings.btnBorderRadius),
                                                paddingLeft: rVal('btnPaddingX', settings.btnPaddingX),
                                                paddingRight: rVal('btnPaddingX', settings.btnPaddingX),
                                                paddingTop: rVal('btnPaddingY', settings.btnPaddingY),
                                                paddingBottom: rVal('btnPaddingY', settings.btnPaddingY),
                                                fontSize: rVal('btnFontSize', settings.btnFontSize),
                                            }}
                                        >
                                            {settings.secondaryBtnText}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content is only shown if overlay is enabled */}
                </div>
            );
        case 'product_grid':
            return (
                <section className="py-24 px-6" style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="text-4xl font-black tracking-tight">{settings.title || 'FEATURED'}</h2>
                        <Link to={`/s/${storeSubUrl}/shop`} className="font-bold flex items-center group">
                            VIEW ALL <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="group cursor-pointer">
                                <div className="aspect-[3/4] bg-slate-100 rounded-3xl mb-4 overflow-hidden relative">
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                                </div>
                                <h4 className="font-bold text-lg mb-1">Modern Collection Item</h4>
                                <p className="text-slate-500 font-bold">$129.00</p>
                            </div>
                        ))}
                    </div>
                </section>
            );
        case 'heading':
            return (
                <div className="py-16 px-6 text-center" style={{ maxWidth: settings.maxWidth || '1200px', margin: '0 auto' }}>
                    <h2 className="text-5xl font-black tracking-tight uppercase">{settings.text || 'Section Heading'}</h2>
                </div>
            );
        default:
            return null;
    }
}

function PublicLoader() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center space-y-6">
            <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold uppercase tracking-widest text-xs text-slate-400">Loading Storefront...</p>
        </div>
    );
}

function PublicError({ message }) {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center space-y-6 p-6 text-center">
            <div className="p-6 bg-red-50 text-red-500 rounded-3xl mb-4">
                <Box className="h-16 w-16" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Wait, something is missing</h1>
            <p className="text-slate-500 max-w-sm">{message}</p>
            <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold">The storefront might be private or the link is incorrect.</p>
            <Link to="/"><Button variant="secondary" className="border-slate-200">Back to Dashboard</Button></Link>
        </div>
    );
}
