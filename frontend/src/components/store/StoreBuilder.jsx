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
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    Save, Eye, Smartphone, Monitor, Tablet, Minimize, Maximize, ChevronLeft, Layout
} from 'lucide-react';

// Context & Helper Imports
import { CartProvider } from '../../context/CartContext';
import { CartDrawer } from './widgets/cart/CartDrawer';
import { Loader, ViewModeBtn, genId } from './widgets/Shared';

// Modular Builder Components
import { WidgetSidebar } from './builder/WidgetSidebar';
import { PropertiesPanel } from './builder/PropertiesPanel';
import { SortableBlock } from './builder/SortableBlock';
import { getWidgetDefaults } from './builder/widgetConstants';

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
    const [previewMode, setPreviewMode] = useState(false); // Controls sidebar visibility
    const [fitToWidth, setFitToWidth] = useState(true);
    const [canvasContent, setCanvasContent] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [draggedWidget, setDraggedWidget] = useState(null); // Kept for potential overlay use
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [storePages, setStorePages] = useState([]);
    const [store, setStore] = useState(null);
    const [customWidgets, setCustomWidgets] = useState([]);
    const [cartSettings, setCartSettings] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchPage();
        fetchStoreData();
    }, [pageId]);

    // Fetch Cart Global Settings (from 'cart' page widget)
    useEffect(() => {
        const fetchCartSettings = async () => {
            // 1. If we are editing the cart page, use live canvas content for instant feedback
            if (page?.slug === 'cart') {
                const widget = canvasContent.find(w => w.type === 'cart_list');
                if (widget) setCartSettings(widget.settings);
            } else {
                // 2. Else fetch from DB if the user has a published cart page
                const { data } = await supabase.from('store_pages')
                    .select('content')
                    .eq('store_id', storeId)
                    .eq('slug', 'cart')
                    .single();

                if (data?.content) {
                    const widget = data.content.find(w => w.type === 'cart_list');
                    if (widget) setCartSettings(widget.settings);
                }
            }
        };
        if (storeId) fetchCartSettings();
    }, [storeId, page?.slug, canvasContent]);

    const fetchStoreData = async () => {
        const { data: storeData } = await supabase.from('stores').select('*').eq('id', storeId).single();
        if (storeData) setStore(storeData);

        const { data: cats } = await supabase.from('product_categories').select('*').eq('store_id', storeId);
        setCategories(cats || []);

        const { data: prods } = await supabase.from('products').select('*').eq('store_id', storeId);
        setProducts(prods || []);

        const { data: pagesData } = await supabase.from('store_pages').select('*').eq('store_id', storeId);
        setStorePages(pagesData || []);

        // Fetch Custom Widgets
        const { data: customs } = await supabase.from('custom_widgets').select('*').eq('store_id', storeId);
        if (customs) setCustomWidgets(customs);
    };

    const fetchPage = async () => {
        setLoading(true);
        try {
            let query = supabase.from('store_pages').select('*').eq('store_id', storeId);
            if (pageId) {
                query = query.eq('id', pageId);
            } else {
                query = query.eq('slug', 'home');
            }

            const { data: pageData } = await query.single();

            if (pageData) {
                setPage(pageData);
                if (pageData.content && Array.isArray(pageData.content)) {
                    setCanvasContent(pageData.content);
                }
            } else {
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
                    is_published: true
                }, { onConflict: 'store_id, slug' });

            if (error) throw error;
            alert('Layout Saved & Published! 🚀');
        } catch (e) {
            alert('Save failed: ' + e.message);
        }
    };

    const handleSaveCustomWidget = async (name, type, settings) => {
        try {
            const { data, error } = await supabase.from('custom_widgets').insert({
                store_id: storeId,
                name,
                type,
                settings
            }).select().single();

            if (error) throw error;
            setCustomWidgets([...customWidgets, data]);
            alert('Widget Saved as Preset!');
        } catch (e) {
            console.error(e);
            alert('Failed to save preset: ' + e.message);
        }
    };

    const handleDeleteCustomWidget = async (widgetId) => {
        try {
            const { error } = await supabase.from('custom_widgets').delete().eq('id', widgetId);
            if (error) throw error;
            setCustomWidgets(customWidgets.filter(w => w.id !== widgetId));
        } catch (e) {
            console.error(e);
            alert('Failed to delete preset: ' + e.message);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const block = canvasContent.find(c => c.id === active.id);
        if (block) setDraggedWidget(block);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        if (active.id !== over.id && canvasContent.find(c => c.id === active.id)) {
            setCanvasContent((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setDraggedWidget(null);
    };

    const addWidget = (type, customSettings = null) => {
        const newWidgets = [];
        newWidgets.push({
            id: `${type}-${genId()}`,
            type,
            settings: customSettings || getWidgetDefaults(type)
        });

        // Triple Drop Magic
        if (type === 'product_detail') {
            newWidgets.push({
                id: `product_reviews-${genId()}`,
                type: 'product_reviews',
                settings: getWidgetDefaults('product_reviews')
            });
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

    const handleUpdateSettings = (newSettings) => {
        if (!selectedElement) return;
        const newContent = canvasContent.map(c =>
            c.id === selectedElement.id ? { ...c, settings: newSettings } : c
        );
        setCanvasContent(newContent);
        setSelectedElement({ ...selectedElement, settings: newSettings });
    };

    // Derived Settings: Prefer live canvas content if on Cart page, otherwise use fetched DB settings
    const activeCartSettings = (page?.slug === 'cart'
        ? canvasContent.find(w => w.type === 'cart_list')?.settings
        : cartSettings) || cartSettings;

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
                                        setPreviewMode(!nextFit); // Toggle sidebars
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
                    <WidgetSidebar
                        previewMode={previewMode}
                        onAddWidget={addWidget}
                        customWidgets={customWidgets}
                        onDeleteCustom={handleDeleteCustomWidget}
                    />

                    <main className="flex-1 bg-slate-100 p-8 overflow-y-auto overflow-x-auto relative flex justify-center scroll-smooth">
                        <CartProvider storeKey={storeId}>
                            <CartDrawer settings={activeCartSettings} />
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                                <div
                                    className={`bg-white shadow-2xl transition-all duration-500 border border-slate-200 min-h-full shrink-0
                                    ${viewMode === 'desktop' ? (fitToWidth ? 'w-full' : 'w-[1280px]') : ''}
                                    ${viewMode === 'tablet' ? 'w-[768px]' : ''}
                                    ${viewMode === 'mobile' ? 'w-[375px]' : ''}
                                `}
                                    onClick={(e) => {
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

                    <PropertiesPanel
                        previewMode={previewMode}
                        selectedElement={selectedElement}
                        onClose={() => setSelectedElement(null)}
                        onUpdate={handleUpdateSettings}
                        products={products}
                        categories={categories}
                        viewMode={viewMode}
                        storePages={storePages}
                        onSaveCustom={handleSaveCustomWidget}
                    />
                </div>
            </div>
        </ErrorBoundary>
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
