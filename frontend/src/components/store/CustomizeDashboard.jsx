
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
    Layout,
    Plus,
    Smartphone,
    Monitor,
    Edit3,
    Eye,
    Globe,
    Trash2,
    ChevronRight,
    Home,
    ShoppingBag,
    Search,
    ShoppingCart,
    CreditCard,
    CheckCircle,
    FileText,
    Settings,
    Palette,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { CreatePageModal } from './CreatePageModal';

const SYSTEM_PAGES = [
    { name: 'Home', slug: 'home', icon: <Home className="h-4 w-4" />, description: 'Your store front door' },
    { name: 'Collections', slug: 'shop', icon: <ShoppingBag className="h-4 w-4" />, description: 'Product listing grid' },
    { name: 'Product Detail', slug: 'pdp', icon: <Search className="h-4 w-4" />, description: 'Single product view' },
    { name: 'Cart', slug: 'cart', icon: <ShoppingCart className="h-4 w-4" />, description: 'Shopping cart summary' },
    { name: 'Checkout', slug: 'checkout', icon: <CreditCard className="h-4 w-4" />, description: 'Payment processing' },
    { name: 'Thank You', slug: 'thank-you', icon: <CheckCircle className="h-4 w-4" />, description: 'Order confirmation' },
];

const LEGAL_PAGES = [
    { name: 'Refund Policy', slug: 'refund-policy', icon: <FileText className="h-4 w-4" /> },
    { name: 'Shipping Policy', slug: 'shipping-policy', icon: <FileText className="h-4 w-4" /> },
];

const DEFAULT_NAVBAR = {
    id: 'nav-1',
    type: 'navbar',
    settings: {
        bgColor: '#ffffff',
        textColor: '#1e293b',
        hoverColor: '#4f46e5',
        activeColor: '#4f46e5',
        borderColor: '#f1f5f9',
        borderRadius: '0px',
        borderWidth: '1px',
        shadow: 'soft',
        opacity: 1,
        height: '70px',
        paddingX: '32px',
        gap: '32px',
        maxWidth: '1280px',
        alignment: 'space-between',
        sticky: 'always',
        menuItems: [
            { id: 'm1', label: 'Home', type: 'page', value: 'home' },
            { id: 'm2', label: 'Products', type: 'page', value: 'shop' },
            { id: 'm3', label: 'Cart', type: 'page', value: 'cart' }
        ]
    }
};

const PAGE_TEMPLATES = {
    home: [
        DEFAULT_NAVBAR,
        { id: 'h1', type: 'hero', settings: { title: 'Welcome to Our Store', subtitle: 'Experience premium shopping with us.', buttonText: 'Explore Collection' } },
        { id: 'h2', type: 'product_grid', settings: { title: 'Featured Products', limit: 8 } }
    ],
    shop: [
        DEFAULT_NAVBAR,
        { id: 's1', type: 'heading', settings: { text: 'Shop All Collections', size: 'h1' } },
        { id: 's2', type: 'product_grid', settings: { showFilters: true, itemsPerPage: 12 } }
    ],
    pdp: [
        DEFAULT_NAVBAR,
        {
            id: 'p1', type: 'product_detail', settings: {
                mediaLayout: 'grid', aspectRatio: 'square', thumbPosition: 'bottom', enableZoom: true,
                titleTag: 'h1', titleSize: '3xl', titleWeight: 'bold', titleColor: '#0f172a', alignment: 'left',
                showPrice: true, showDiscount: true, priceColor: '#4f46e5', compareColor: '#94a3b8',
                showDescription: true, descWidth: 'full',
                showStock: true, lowStockThreshold: 5, inStockColor: '#15803d', lowStockColor: '#b45309', outOfStockColor: '#b91c1c'
            }
        }
    ],
    cart: [
        DEFAULT_NAVBAR,
        { id: 'c1', type: 'heading', settings: { text: 'Your Cart', size: 'h2' } },
        { id: 'c2', type: 'cart_list', settings: {} }
    ],
    checkout: [
        { id: 'ch1', type: 'checkout_flow', settings: {} }
    ],
    'thank-you': [
        { id: 't1', type: 'success_msg', settings: { title: 'Order Confirmed!', message: 'Thank you for your purchase.' } }
    ]
};

export function CustomizeDashboard() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, [storeId]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch store details (for sub_url)
        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .single();

        if (storeData) setStore(storeData);

        const { data: pageData, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('store_id', storeId)
            .order('name');

        if (error) console.error('Error fetching pages:', error);
        else setPages(pageData || []);

        setLoading(false);
    };

    const handleCreateSystemPages = async () => {
        setLoading(true);
        const allSystem = [...SYSTEM_PAGES, ...LEGAL_PAGES];
        const newPages = allSystem
            .filter(sys => !pages.some(p => p.slug === sys.slug))
            .map(sys => ({
                store_id: storeId,
                name: sys.name,
                slug: sys.slug,
                type: LEGAL_PAGES.some(l => l.slug === sys.slug) ? 'legal' : 'system',
                content: PAGE_TEMPLATES[sys.slug] || [],
                is_published: true
            }));

        if (newPages.length > 0) {
            const { error } = await supabase.from('store_pages').insert(newPages);
            if (error) alert('Failed to create pages: ' + error.message);
            else fetchData();
        }
        setLoading(false);
    };

    const handleCreatePage = async (name, slug) => {
        setLoading(true);
        const newPage = {
            store_id: storeId,
            name: name,
            slug: slug,
            type: 'custom',
            content: [DEFAULT_NAVBAR, { id: 'c1', type: 'heading', settings: { text: name, size: 'h1' } }],
            is_published: true
        };

        const { error } = await supabase.from('store_pages').insert([newPage]);
        if (error) {
            alert('Failed to create page: ' + error.message);
        } else {
            setShowCreateModal(false);
            fetchData();
        }
        setLoading(false);
    };

    const handleToggleStatus = async (page) => {
        const newStatus = !page.is_published;

        // Optimistic update
        setPages(pages.map(p => p.id === page.id ? { ...p, is_published: newStatus } : p));

        const { error } = await supabase
            .from('store_pages')
            .update({ is_published: newStatus })
            .eq('id', page.id);

        if (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setPages(pages.map(p => p.id === page.id ? { ...p, is_published: !newStatus } : p));
            alert('Failed to update status');
        }
    };

    const handleDeletePage = async (pageId) => {
        if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) return;

        setLoading(true);
        const { error } = await supabase
            .from('store_pages')
            .delete()
            .eq('id', pageId);

        if (error) {
            alert('Failed to delete page: ' + error.message);
        } else {
            fetchData();
        }
        setLoading(false);
    };

    const getPageStatus = (slug) => {
        const page = pages.find(p => p.slug === slug);
        return page ? (page.is_published ? 'Published' : 'Draft') : 'Not Created';
    };

    const getPageId = (slug) => {
        return pages.find(p => p.slug === slug)?.id;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Store Customization</h1>
                    <p className="text-slate-500 text-sm">Design and manage your store pages.</p>
                </div>
                <div className="flex items-center space-x-3">
                    {store?.sub_url && (
                        <a
                            href={`/s/${store.sub_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center hover:bg-slate-50 shadow-sm transition-all"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Storefront
                        </a>
                    )}
                    <Button onClick={handleCreateSystemPages} disabled={loading}>
                        <Globe className="h-4 w-4 mr-2" />
                        Init System Pages
                    </Button>
                    <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Page
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pages List */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-0 overflow-hidden border-slate-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Store Pages</h3>
                            <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                {pages.length} Total
                            </span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {SYSTEM_PAGES.map((sys) => {
                                const page = pages.find(p => p.slug === sys.slug); // Get the actual page object
                                const pageId = page?.id;
                                const status = getPageStatus(sys.slug);
                                return (
                                    <div key={sys.slug} className="group hover:bg-slate-50/50 transition-all p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                {sys.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">{sys.name}</h4>
                                                <p className="text-xs text-slate-400">{sys.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-6">
                                            <div className="text-right flex items-center space-x-3">
                                                {pageId && (
                                                    <button
                                                        onClick={() => handleToggleStatus(page)}
                                                        className={`p-1 rounded-lg transition-colors ${page.is_published ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                                        title={page.is_published ? 'Published' : 'Draft'}
                                                    >
                                                        {page.is_published ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                                    </button>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${status === 'Published' ? 'text-green-500' : 'text-slate-400'}`}>
                                                    {status}
                                                </span>
                                            </div>
                                            {pageId ? (
                                                <div className="flex items-center space-x-2">
                                                    <a
                                                        href={`/s/${store?.sub_url}/${page.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="View Page"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </a>
                                                    <button
                                                        onClick={() => navigate(`/store/${storeId}/builder/${page.id}`)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        title="Design Page"
                                                    >
                                                        <Palette className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleCreateSystemPages}
                                                    className="p-2 text-indigo-400 hover:text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg shadow-sm transition-all"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </Card>

                    {/* Custom Pages */}
                    <Card className="p-0 overflow-hidden border-slate-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Custom Pages</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {pages.filter(p => p.type === 'custom').length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm">
                                    No custom pages yet. Click "Create Page" to add one.
                                </div>
                            )}
                            {pages.filter(p => p.type === 'custom').map((page) => (
                                <div key={page.id} className="group hover:bg-slate-50/50 transition-all p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                            <FileText className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800">{page.name}</h4>
                                            <p className="text-xs text-slate-400">/{page.slug}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <button
                                            onClick={() => handleToggleStatus(page)}
                                            className={`p-1 rounded-lg transition-colors ${page.is_published ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                            title={page.is_published ? 'Published' : 'Draft'}
                                        >
                                            {page.is_published ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                        </button>

                                        <div className="flex items-center space-x-2 border-l border-slate-100 pl-4">
                                            <a
                                                href={`/s/${store?.sub_url}/${page.slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="View Page"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </a>
                                            <button
                                                onClick={() => navigate(`/store/${storeId}/builder/${page.id}`)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Design Page"
                                            >
                                                <Palette className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePage(page.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Page"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-0 overflow-hidden border-slate-200">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Legal & Info</h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {LEGAL_PAGES.map((sys) => {
                                const page = pages.find(p => p.slug === sys.slug);
                                const pageId = page?.id;
                                const status = getPageStatus(sys.slug);
                                return (
                                    <div key={sys.slug} className="group hover:bg-slate-50/50 transition-all p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400">
                                                {sys.icon}
                                            </div>
                                            <h4 className="text-sm font-bold text-slate-800">{sys.name}</h4>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {pageId && (
                                                <button
                                                    onClick={() => handleToggleStatus(page)}
                                                    className={`p-1 rounded-lg transition-colors ${page.is_published ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                                    title={page.is_published ? 'Published' : 'Draft'}
                                                >
                                                    {page.is_published ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                                                </button>
                                            )}
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{status}</span>
                                            <button
                                                onClick={() => pageId && navigate(`/store/${storeId}/builder/${pageId}`)}
                                                disabled={!pageId}
                                                className="p-1.5 text-slate-300 hover:text-indigo-600 disabled:opacity-30"
                                            >
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Sidebar Config / Quick Settings */}
                <div className="space-y-6">
                    <Card className="p-6 bg-indigo-600 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="font-bold text-lg mb-2">Global Styles</h3>
                            <p className="text-indigo-100 text-xs mb-6">Browse and install themes from the marketplace.</p>
                            <Button
                                variant="secondary"
                                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                                onClick={() => navigate(`/store/${storeId}/theme-marketplace`)}
                            >
                                <Layout className="h-4 w-4 mr-2" />
                                Theme Marketplace
                            </Button>
                        </div>
                        <Palette className="absolute -bottom-4 -right-4 h-32 w-32 text-white/10 rotate-12" />
                    </Card>

                    <Card className="p-6 space-y-4">
                        <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Store Preview</h3>
                        <div className="aspect-[4/3] bg-slate-100 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center space-y-3">
                            <Monitor className="h-8 w-8 text-slate-300" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Live Preview Coming Soon</p>
                        </div>
                        <Button variant="secondary" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Open Storefront
                        </Button>
                    </Card>
                </div>
            </div>

            <CreatePageModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreatePage}
                loading={loading}
            />
        </div>
    );
}
