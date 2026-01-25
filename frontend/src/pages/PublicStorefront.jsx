
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
                    storeSubUrl={storeSubUrl}
                />
            ))}
        </div>
    );
}

function BlockRenderer({ type, settings, storeSubUrl }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                            height: settings.height,
                            borderRadius: settings.borderRadius,
                            borderBottomColor: settings.borderColor,
                            opacity: settings.opacity,
                            backdropFilter: settings.blur ? `blur(${settings.blur})` : 'none',
                        }}
                    >
                        <div className="flex items-center w-full px-6" style={{ maxWidth: settings.maxWidth, justifyContent: settings.alignment, gap: settings.gap }}>
                            <Link to={`/s/${storeSubUrl}`} className="flex items-center">
                                {settings.logoUrl ? (
                                    <img src={settings.logoUrl} style={{ width: settings.logoWidth }} alt="Logo" />
                                ) : (
                                    <span
                                        className="font-black italic tracking-tighter"
                                        style={{
                                            fontFamily: settings.fontFamily || 'Inter, sans-serif',
                                        }}
                                    >
                                        STORE
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
                                        className="text-2xl font-bold border-b border-slate-100 pb-4"
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
            return (
                <div className="relative h-[80vh] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
                    <div className="relative z-10 text-center space-y-8 px-6 max-w-4xl mx-auto">
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] animate-in slide-in-from-bottom duration-700">{settings.title || 'PREMIUM GOODS'}</h1>
                        <p className="text-xl text-slate-300 font-medium max-w-xl mx-auto">{settings.subtitle}</p>
                        <Button className="rounded-full px-12 py-8 text-xl font-bold bg-white text-black hover:bg-slate-100 transition-all scale-110">
                            {settings.buttonText || 'Shop Now'}
                        </Button>
                    </div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20" />
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/30 blur-[150px] rounded-full" />
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
