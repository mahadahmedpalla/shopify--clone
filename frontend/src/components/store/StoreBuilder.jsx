
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    X, Save, Eye, Smartphone, Monitor, Tablet, Plus, Settings2, Layers,
    ChevronLeft, Type, Image as ImageIcon, Layout, Box, Play, Undo2,
    Redo2, ChevronRight, Search, ShoppingBag, ShoppingCart, Trash2, Move, GripVertical, Menu, Upload,
    AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Maximize, Minimize, Palette as PaletteIcon, MessageSquare
} from 'lucide-react';

// New Modular Imports
import { NavbarProperties } from './widgets/navbar/NavbarProperties';
import { HeroProperties } from './widgets/hero/HeroProperties';

import { ProductGridProperties } from './widgets/product_grid/ProductGridProperties';
import { ProductDetailRenderer } from './widgets/product_detail/ProductDetailRenderer';
import { ProductDetailProperties } from './widgets/product_detail/ProductDetailProperties';
import { CartListRenderer } from './widgets/cart_list/CartListRenderer';
import { CartListProperties } from './widgets/cart_list/CartListProperties';
import { ProductReviewsRenderer } from './widgets/product_reviews/ProductReviewsRenderer';
import { ProductReviewsProperties } from './widgets/product_reviews/ProductReviewsProperties';
import { RelatedProductsRenderer } from './widgets/related_products/RelatedProductsRenderer';
import { RelatedProductsProperties } from './widgets/related_products/RelatedProductsProperties';

import { CartProvider } from '../../context/CartContext';
import { CartDrawer } from './widgets/cart/CartDrawer';
import { BlockRenderer } from './widgets/BlockRenderer';
import { Loader, ViewModeBtn, genId } from './widgets/Shared';

const WIDGET_CATEGORIES = [
    {
        name: 'Basic',
        widgets: [
            { type: 'navbar', icon: <Box className="h-4 w-4" />, label: 'Navbar' },
            { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Text Block' },
            { type: 'heading', icon: <Type className="h-5 w-5" />, label: 'Heading' },
            { type: 'image', icon: <ImageIcon className="h-4 w-4" />, label: 'Image' },
            { type: 'button', icon: <Play className="h-4 w-4" />, label: 'Button' },
        ]
    },
    {
        name: 'Layout',
        widgets: [
            { type: 'hero', icon: <Layout className="h-4 w-4" />, label: 'Hero Banner' },
            { type: 'section', icon: <Layout className="h-4 w-4" />, label: 'Section' },
            { type: 'spacer', icon: <Box className="h-4 w-4" />, label: 'Spacer' },
        ]
    },
    {
        name: 'Shopify Core',
        widgets: [
            { type: 'product_grid', icon: <ShoppingBag className="h-4 w-4" />, label: 'Product Grid' },
            { type: 'cart_list', icon: <ShoppingCart className="h-4 w-4" />, label: 'Cart Items' },
            { type: 'product_detail', icon: <Search className="h-4 w-4" />, label: 'Product Info' },
            { type: 'product_reviews', icon: <MessageSquare className="h-4 w-4" />, label: 'Reviews' },
            { type: 'related_products', icon: <Box className="h-4 w-4" />, label: 'Related Products' },
        ]
    }
];

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-12 bg-red-50 text-red-900 min-h-screen flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
                    <pre className="bg-white p-4 rounded shadow text-sm overflow-auto max-w-2xl border border-red-200">
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                    <Button onClick={() => window.location.reload()} className="mt-8">Reload Page</Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export function StoreBuilder() {
    const { storeId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop');
    const [previewMode, setPreviewMode] = useState(false);
    const [fitToWidth, setFitToWidth] = useState(true);
    const [canvasContent, setCanvasContent] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [draggedWidget, setDraggedWidget] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [storePages, setStorePages] = useState([]);
    const [manualProdId, setManualProdId] = useState('');
    const [savedWidgets, setSavedWidgets] = useState([]);
    const [showSaveWidgetModal, setShowSaveWidgetModal] = useState(false);
    const [newWidgetName, setNewWidgetName] = useState('');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const [store, setStore] = useState(null);

    useEffect(() => {
        fetchPage();
        fetchStoreData();
    }, [pageId]);

    const fetchStoreData = async () => {
        // Fetch Store info
        const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', storeId)
            .single();
        if (storeData) setStore(storeData);

        // Fetch Saved Widgets
        const { data: savedData } = await supabase
            .from('saved_widgets')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });
        if (savedData) setSavedWidgets(savedData);


        // Fetch categories for this store
        // Simplified fetch - normally would be separate calls
        const { data: cats } = await supabase.from('product_categories').select('*').eq('store_id', storeId);
        setCategories(cats || []);

        const { data: prods } = await supabase.from('products').select('*').eq('store_id', storeId);
        setProducts(prods || []);

        // Fetch pages
        const { data: pagesData } = await supabase.from('store_pages').select('*').eq('store_id', storeId);
        setStorePages(pagesData || []);
    };

    const fetchPage = async () => {
        setLoading(true);
        try {
            // 1. Try fetching the specific page
            let query = supabase.from('store_pages').select('*').eq('store_id', storeId);

            // Check if pageId looks like a UUID (simple check) or just assume ID if present
            if (pageId) {
                query = query.eq('id', pageId);
            } else {
                query = query.eq('slug', 'home');
            }

            const { data: pageData, error } = await query.single();

            if (pageData) {
                setPage(pageData);
                if (pageData.content && Array.isArray(pageData.content)) {
                    setCanvasContent(pageData.content);
                }
            } else {
                // Create default if not exists
                setPage({ name: 'Home Page', slug: 'home', type: 'system' });
            }
        } catch (e) {
            console.error("Error loading page:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const { error } = await supabase
                .from('store_pages')
                .upsert({
                    store_id: storeId,
                    slug: page?.slug || 'home',
                    name: page?.name || 'Home Page',
                    type: page?.type || 'custom',
                    content: canvasContent,
                    is_published: true // auto-publish for now
                }, { onConflict: 'store_id, slug' });

            if (error) throw error;
            alert('Layout Saved & Published! 🚀');
        } catch (e) {
            alert('Save failed: ' + e.message);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        // Find the full block object to set as dragged
        const block = canvasContent.find(c => c.id === active.id);
        if (block) setDraggedWidget(block);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        // If it's a reorder
        if (active.id !== over.id && canvasContent.find(c => c.id === active.id)) {
            setCanvasContent((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setDraggedWidget(null);
    };

    const getWidgetDefaults = (type) => {
        return type === 'navbar' ? {
            bgColor: '#ffffff',
            textColor: '#1e293b',
            hoverColor: '#4f46e5',
            activeColor: '#4f46e5',
            borderColor: '#e2e8f0',
            borderRadius: '0px',
            borderWidth: '0px',
            shadow: 'soft',
            opacity: 1,
            height: '70px',
            paddingX: '20px',
            gap: '24px',
            maxWidth: '1200px',
            alignment: 'space-between',
            logoWidth: '120px',
            showStoreName: false,
            logoGap: '12px',
            sticky: 'always',
            stickyMode: 'always',
            hamburgerPC: false,
            hamburgerTablet: true,
            hamburgerMobile: true,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: '600',
            menuItems: [
                { id: 'm1', label: 'Home', type: 'page', value: 'home' },
                { id: 'm2', label: 'Shop', type: 'page', value: 'shop' }
            ]
        } : type === 'hero' ? {
            title: 'Elevate Your Style',
            subtitle: 'Discover our premium winter collection.',
            showContentAboveImage: true,
            backgroundImage: '',
            primaryBtnText: 'Shop Now',
            primaryBtnLink: '',
            secondaryBtnText: '',
            secondaryBtnLink: '',
            heightMode: 'medium',
            customHeight: '500px',
            hAlignment: 'center',
            vAlignment: 'center',
            maxContentWidth: '800px',
            overlayColor: '#000000',
            overlayOpacity: 0.4,
            useGradient: false,
            borderRadius: '0px',
            headingFontFamily: 'Inter, sans-serif',
            subheadingFontFamily: 'Inter, sans-serif',
            headingSize: '48px',
            headingColor: '#ffffff',
            subheadingSize: '18px',
            subheadingColor: '#e2e8f0',
            btnBgColor: '#ffffff',
            btnTextColor: '#000000',
            btnPaddingX: '32px',
            btnPaddingY: '16px',
            btnFontSize: '16px',
            btnBorderRadius: '9999px',
            btnMarginTop: '24px',
            secondaryBtnBgColor: 'transparent',
            secondaryBtnTextColor: '#ffffff',
            mobileHeight: '400px',
            mobileAlignment: 'center'
        } : type === 'product_grid' ? {
            title: 'Featured Collection',
            categoryId: 'all',
            limit: 8,
            columns: {
                desktop: 4,
                tablet: 3,
                mobile: 2
            }
        } : type === 'product_reviews' ? {
            layoutMode: 'chart',
            allowVerifiedOnly: false,
            allowMedia: true,
            hideIfEmpty: false,
            sortOrder: 'newest',
            starColor: '#FACC15',
            buttonColor: '#4F46E5',
            textColor: '#1F2937'
        } : type === 'related_products' ? {
            relatedTitle: 'You might also like',
            relatedLimit: 4,
            showPrice: true,
            itemGap: 'normal'
        } : {
            title: type === 'hero' ? 'New Hero Banner' : 'New Title',
            content: 'Sample content for your ' + type
        };
    };

    const addWidget = (type) => {
        const newWidgets = [];

        // 1. Create Main Widget
        newWidgets.push({
            id: `${type}-${genId()}`,
            type,
            settings: getWidgetDefaults(type)
        });

        // 2. Triple Drop Logic: If Detail -> Add Reviews -> Add Related
        if (type === 'product_detail') {
            // Add Reviews
            newWidgets.push({
                id: `product_reviews-${genId()}`,
                type: 'product_reviews',
                settings: getWidgetDefaults('product_reviews')
            });
            // Add Related
            newWidgets.push({
                id: `related_products-${genId()}`,
                type: 'related_products',
                settings: getWidgetDefaults('related_products')
            });
        }

        setCanvasContent([...canvasContent, ...newWidgets]);
    };

    const deleteWidget = (id) => {
        setCanvasContent(canvasContent.filter(c => c.id !== id));
        if (selectedElement?.id === id) setSelectedElement(null);
    };

    if (loading) return <Loader />;

    return (
        <ErrorBoundary>
            <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none">
                <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 shadow-2xl">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(`/store/${storeId}/customize`)} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-[1px] bg-slate-800" />
                        <div>
                            <h1 className="text-sm font-bold text-white leading-tight">{page?.name}</h1>
                            <p className="text-[10px] text-slate-500 font-medium tracking-tight">/{page?.slug}</p>
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-800/50 rounded-lg p-1 space-x-1 border border-slate-700">
                        <ViewModeBtn active={viewMode === 'desktop'} onClick={() => setViewMode('desktop')} icon={<Monitor className="h-4 w-4" />} />
                        <ViewModeBtn active={viewMode === 'tablet'} onClick={() => setViewMode('tablet')} icon={<Tablet className="h-4 w-4" />} />
                        <ViewModeBtn active={viewMode === 'mobile'} onClick={() => setViewMode('mobile')} icon={<Smartphone className="h-4 w-4" />} />

                        {viewMode === 'desktop' && (
                            <>
                                <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                                <button
                                    onClick={() => {
                                        const nextFit = !fitToWidth;
                                        setFitToWidth(nextFit);
                                        // If switching to 1:1 (false), collapse sidebars (true). 
                                        // If switching to Fit (true), expand sidebars (false).
                                        setPreviewMode(!nextFit);
                                    }}
                                    className={`p-1.5 rounded-md transition-all ${fitToWidth ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400 hover:text-white'}`}
                                    title={fitToWidth ? "Scale: Fit" : "Scale: 100%"}
                                >
                                    {fitToWidth ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                </button>
                            </>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {store?.sub_url && (
                            <a
                                href={`/s/${store.sub_url}/${page?.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-400 hover:text-white transition-colors flex items-center text-[10px] font-bold uppercase tracking-widest bg-slate-800 rounded-lg mr-2"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Live
                            </a>
                        )}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewMode(!previewMode)}
                            className={`bg-slate-800 border-slate-700 text-slate-300 hover:text-white ${previewMode ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10' : ''}`}
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            {previewMode ? 'Edit' : 'Preview'}
                        </Button>
                        <Button size="sm" onClick={handleSave} isLoading={loading}>
                            <Save className="h-4 w-4 mr-2" />
                            Publish
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    <aside
                        className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden
                        ${previewMode ? 'w-0 border-r-0 opacity-0' : 'w-64 opacity-100'}
                    `}
                    >
                        <div className="p-4 border-b border-slate-100">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Widgets</h2>
                            <div className="mt-4 relative">
                                <Search className="absolute left-3 top-2.5 h-3 w-3 text-slate-400" />
                                <input type="text" placeholder="Search elements..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm" />
                            </div>

                            {/* SAVED WIDGETS CATEGORY */}
                            {savedWidgets.length > 0 && (
                                <div className="mb-8 mt-6">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 mb-3">Saved Custom Widgets</h3>
                                    <div className="grid grid-cols-2 gap-3 px-2">
                                        {savedWidgets.map(w => (
                                            <SidebarDraggable
                                                key={w.id}
                                                id={`new-saved-${w.id}`} // Unique ID
                                                type={w.type}
                                                icon={<Box className="w-4 h-4" />} // Generic icon
                                                label={w.name}
                                                data={{
                                                    isSavedWidget: true,
                                                    type: w.type,
                                                    settings: w.settings,
                                                    name: w.name
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                            {WIDGET_CATEGORIES.map(cat => (
                                <div key={cat.name} className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{cat.name}</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {cat.widgets.map(w => (
                                            <button
                                                key={w.type}
                                                onClick={() => addWidget(w.type)}
                                                className="group p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10 transition-all active:scale-95"
                                            >
                                                <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    {w.icon}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{w.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <main className="flex-1 bg-slate-100 p-8 overflow-y-auto overflow-x-auto relative flex justify-center scroll-smooth">
                        <CartProvider storeKey={storeId}>
                            <CartDrawer />
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                                <div
                                    className={`bg-white shadow-2xl transition-all duration-500 border border-slate-200 min-h-full shrink-0
                                    ${viewMode === 'desktop' ? (fitToWidth ? 'w-full' : 'w-[1280px]') : ''}
                                    ${viewMode === 'tablet' ? 'w-[768px]' : ''}
                                    ${viewMode === 'mobile' ? 'w-[375px]' : ''}
                                `}
                                    onClick={(e) => {
                                        // Deselect if clicking on the canvas background (not on a block)
                                        if (e.target === e.currentTarget) setSelectedElement(null);
                                    }}
                                >
                                    <SortableContext items={canvasContent.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                        {canvasContent.length === 0 ? (
                                            <EmptyState name={page?.name} />
                                        ) : (
                                            <div className="min-h-[80vh]">
                                                {canvasContent.map((block) => (
                                                    <SortableBlock
                                                        key={block.id}
                                                        block={block}
                                                        viewMode={viewMode}
                                                        store={store}
                                                        products={products}
                                                        categories={categories}
                                                        onDelete={() => deleteWidget(block.id)}
                                                        isSelected={selectedElement?.id === block.id}
                                                        onClick={() => setSelectedElement(block)}
                                                        isEditor={true}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </SortableContext>
                                </div>
                            </DndContext>
                        </CartProvider>
                    </main>

                    <aside
                        className={`bg-white border-l border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden
                        ${previewMode ? 'w-0 border-l-0 opacity-0' : 'w-72 opacity-100'}
                    `}
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Properties</h2>
                            <div className="flex items-center space-x-2">
                                {selectedElement && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setNewWidgetName(`${selectedElement.type} Custom`);
                                                setShowSaveWidgetModal(true);
                                            }}
                                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                                            title="Save as Custom Widget"
                                        >
                                            <Save className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setSelectedElement(null)} className="text-slate-400 hover:text-slate-600">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        {selectedElement ? (
                            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">Editing</p>
                                    <p className="text-xs font-bold text-slate-800">{selectedElement.type.replace('_', ' ')}</p>
                                </div>

                                {selectedElement.type === 'navbar' ? (
                                    <NavbarProperties
                                        settings={selectedElement.settings}
                                        viewMode={viewMode}
                                        categories={categories}
                                        products={products}
                                        storePages={storePages}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : selectedElement.type === 'hero' ? (
                                    <HeroProperties
                                        settings={selectedElement.settings}
                                        viewMode={viewMode}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : selectedElement.type === 'product_grid' ? (
                                    <ProductGridProperties
                                        settings={selectedElement.settings}
                                        categories={categories}
                                        viewMode={viewMode}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : selectedElement.type === 'product_detail' ? (
                                    <ProductDetailProperties
                                        settings={selectedElement.settings}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : selectedElement.type === 'product_reviews' ? (
                                    <ProductReviewsProperties
                                        settings={selectedElement.settings}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : selectedElement.type === 'related_products' ? (
                                    <RelatedProductsProperties
                                        settings={selectedElement.settings}
                                        categories={categories}
                                        onUpdate={newSettings => {
                                            const newContent = canvasContent.map(c =>
                                                c.id === selectedElement.id ? { ...c, settings: newSettings } : c
                                            );
                                            setCanvasContent(newContent);
                                            setSelectedElement({ ...selectedElement, settings: newSettings });
                                        }}
                                    />
                                ) : (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title Text</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                                value={selectedElement.settings.title || ''}
                                                onChange={(e) => {
                                                    const newContent = canvasContent.map(c =>
                                                        c.id === selectedElement.id ? { ...c, settings: { ...c.settings, title: e.target.value } } : c
                                                    );
                                                    setCanvasContent(newContent);
                                                    setSelectedElement({ ...selectedElement, settings: { ...selectedElement.settings, title: e.target.value } });
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-50">
                                <Settings2 className="h-8 w-8 text-slate-200" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Select an element to edit</p>
                            </div>
                        )}
                    </aside>
                </div>
            </div>

            {/* SAVE WIDGET MODAL */}
            {showSaveWidgetModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-900">Save Custom Widget</h3>
                        <p className="text-sm text-slate-500">
                            Save this <strong>{selectedElement?.type}</strong> configuration to your library for reuse.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Widget Name</label>
                            <input
                                type="text"
                                value={newWidgetName}
                                onChange={(e) => setNewWidgetName(e.target.value)}
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <Button variant="secondary" onClick={() => setShowSaveWidgetModal(false)}>Cancel</Button>
                            <Button onClick={async () => {
                                if (!newWidgetName.trim()) return;

                                // Save to DB
                                const { error } = await supabase.from('saved_widgets').insert({
                                    store_id: storeId,
                                    name: newWidgetName,
                                    type: selectedElement.type,
                                    settings: selectedElement.settings
                                });

                                if (!error) {
                                    // Refresh list
                                    const { data } = await supabase.from('saved_widgets').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
                                    if (data) setSavedWidgets(data);
                                    setShowSaveWidgetModal(false);
                                    alert('Widget Saved! 🎉');
                                } else {
                                    alert('Error saving widget');
                                }
                            }}>Save Widget</Button>
                        </div>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}

// DRAGGABLE SIDEBAR ITEM WRAPPER
function SidebarDraggable({ id, type, icon, label, data }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: id,
        data: data || { type, title: label }
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        opacity: 0.5,
        zIndex: 50
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-500 hover:shadow-md cursor-grab active:cursor-grabbing group transition-all"
        >
            <div className="text-slate-400 group-hover:text-indigo-600 mb-2 transition-colors">
                {icon}
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide text-center leading-tight">
                {label}
            </span>
        </div>
    );
}

function SortableBlock({ block, onDelete, isSelected, onClick, viewMode, store, products, categories, isEditor }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.3 : 1
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`group relative border-2 transition-all cursor-default
                ${isSelected ? 'border-indigo-500 ring-4 ring-indigo-50' : 'border-transparent hover:border-indigo-200'}
            `}
        >
            <div className={`absolute -left-10 top-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                <div {...attributes} {...listeners} className="p-2 bg-white shadow-xl rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                </div>
                <button onClick={onDelete} className="p-2 bg-white shadow-xl rounded-lg border border-slate-200 text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <BlockRenderer
                type={block.type}
                settings={block.settings}
                viewMode={viewMode}
                store={store}
                products={products}
                categories={categories}
                isEditor={isEditor}
            />
        </div>
    );
}

function EmptyState({ name }) {
    return (
        <div className="h-96 flex flex-col items-center justify-center text-center space-y-6 opacity-30 border-2 border-dashed border-slate-300 rounded-3xl m-8">
            <div className="p-6 bg-slate-100 rounded-full">
                <Layout className="h-12 w-12 text-slate-400" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Start Building {name}</h3>
                <p className="text-slate-500 font-medium max-w-xs mx-auto">Drag widgets from the left sidebar to start constructing your masterpiece.</p>
            </div>
        </div>
    );
}
