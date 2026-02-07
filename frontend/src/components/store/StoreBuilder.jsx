import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import {
    DndContext,
    closestCenter,
    pointerWithin,
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

const findBlockRecursive = (blocks, id) => {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.settings?.children) {
            const found = findBlockRecursive(block.settings.children, id);
            if (found) return found;
        }
    }
    return null;
};

const updateBlockRecursive = (blocks, id, newSettings) => {
    return blocks.map(block => {
        if (block.id === id) {
            return { ...block, settings: newSettings };
        }
        if (block.settings?.children) {
            return {
                ...block,
                settings: {
                    ...block.settings,
                    children: updateBlockRecursive(block.settings.children, id, newSettings)
                }
            };
        }
        return block;
    });
};

const deleteBlockRecursive = (blocks, id) => {
    return blocks.reduce((acc, block) => {
        if (block.id === id) return acc;

        if (block.settings?.children) {
            const newChildren = deleteBlockRecursive(block.settings.children, id);
            // Optimization: Only update if children changed
            if (newChildren !== block.settings.children) {
                acc.push({
                    ...block,
                    settings: { ...block.settings, children: newChildren }
                });
                return acc;
            }
        }

        acc.push(block);
        return acc;
    }, []);
};

const findParentIdRecursive = (blocks, childId, parentId = null) => {
    for (const block of blocks) {
        if (block.id === childId) return parentId;
        if (block.settings?.children) {
            const found = findParentIdRecursive(block.settings.children, childId, block.id);
            if (found !== undefined) return found;
        }
    }
    return undefined;
};

const insertBlockRecursive = (blocks, parentId, index, blockToInsert) => {
    if (parentId === null) {
        const newBlocks = [...blocks];
        const safeIndex = (index >= 0 && index <= newBlocks.length) ? index : newBlocks.length;
        newBlocks.splice(safeIndex, 0, blockToInsert);
        return newBlocks;
    }
    return blocks.map(block => {
        if (block.id === parentId) {
            const children = block.settings.children ? [...block.settings.children] : [];
            const safeIndex = (index >= 0 && index <= children.length) ? index : children.length;
            children.splice(safeIndex, 0, blockToInsert);
            return {
                ...block,
                settings: { ...block.settings, children }
            };
        }
        if (block.settings?.children) {
            return {
                ...block,
                settings: {
                    ...block.settings,
                    children: insertBlockRecursive(block.settings.children, parentId, index, blockToInsert)
                }
            };
        }
        return block;
    });
};

const reorderChildrenRecursive = (blocks, parentId, activeId, overId) => {
    if (parentId === null) {
        const oldIndex = blocks.findIndex(x => x.id === activeId);
        const newIndex = blocks.findIndex(x => x.id === overId);
        return arrayMove(blocks, oldIndex, newIndex);
    }
    return blocks.map(block => {
        if (block.id === parentId) {
            const children = block.settings.children || [];
            const oldIndex = children.findIndex(x => x.id === activeId);
            const newIndex = children.findIndex(x => x.id === overId);
            return {
                ...block,
                settings: { ...block.settings, children: arrayMove(children, oldIndex, newIndex) }
            };
        }
        if (block.settings?.children) {
            return {
                ...block,
                settings: {
                    ...block.settings,
                    children: reorderChildrenRecursive(block.settings.children, parentId, activeId, overId)
                }
            };
        }
        return block;
    });
};

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
    const [discounts, setDiscounts] = useState([]);

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

        // Fetch Active Discounts (for preview)
        const { data: activeDiscounts } = await supabase.from('discounts').select('*').eq('store_id', storeId).eq('is_active', true).lte('starts_at', new Date().toISOString());
        setDiscounts(activeDiscounts || []);
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
        // Use recursive find since block might be nested
        const block = findBlockRecursive(canvasContent, active.id);
        if (block) setDraggedWidget(block);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        // 1. Find the moved block
        const activeBlock = findBlockRecursive(canvasContent, active.id);
        if (!activeBlock) return;

        // 2. Identify Drop Scenario
        const isContainerDrop = over.data?.current?.type === 'container';

        // Scenario A: Dropping into a Container Drop Zone
        if (isContainerDrop) {
            const targetContainerId = over.data.current.parentId;
            if (active.id === targetContainerId) return; // Self-drop check

            // Find current parent
            const sourceParentId = findParentIdRecursive(canvasContent, active.id);

            // Remove from old location
            const contentWithoutActive = deleteBlockRecursive(canvasContent, active.id);

            // Add to new container
            // If dropping on container, we append to end (undefined index)
            const finalContent = insertBlockRecursive(contentWithoutActive, targetContainerId, undefined, activeBlock);

            setCanvasContent(finalContent);
            setDraggedWidget(null);
            return;
        }

        // Scenario B: Dropping onto another Sortable Block (Reordering)
        if (active.id !== over.id) {
            const sourceParentId = findParentIdRecursive(canvasContent, active.id);
            const targetParentId = findParentIdRecursive(canvasContent, over.id);

            // Sub-case B1: Same Parent (Sorting within list)
            if (sourceParentId === targetParentId) {
                const reorderedContent = reorderChildrenRecursive(canvasContent, sourceParentId, active.id, over.id);
                setCanvasContent(reorderedContent);
            }
            // Sub-case B2: Moving to different Parent (via hovering over an item)
            else {
                // Remove from source
                const contentWithoutActive = deleteBlockRecursive(canvasContent, active.id);

                // Find index of 'over' item in target parent
                // We need to find the target parent block to get its children array to find index
                let targetIndex = 0;
                if (targetParentId === null) {
                    targetIndex = contentWithoutActive.findIndex(x => x.id === over.id);
                } else {
                    const targetContainer = findBlockRecursive(contentWithoutActive, targetParentId);
                    if (targetContainer && targetContainer.settings.children) {
                        targetIndex = targetContainer.settings.children.findIndex(x => x.id === over.id);
                    }
                }

                // Insert at new index
                const finalContent = insertBlockRecursive(contentWithoutActive, targetParentId, targetIndex, activeBlock);
                setCanvasContent(finalContent);
            }
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
        const newContent = deleteBlockRecursive(canvasContent, id);
        setCanvasContent(newContent);
        if (selectedElement?.id === id) setSelectedElement(null);
    };

    const handleUpdateSettings = (newSettings) => {
        if (!selectedElement) return;

        const newContent = updateBlockRecursive(canvasContent, selectedElement.id, newSettings);
        setCanvasContent(newContent);

        // Also update local selected element state so UI reflects changes immediately
        setSelectedElement({ ...selectedElement, settings: newSettings });
    };

    // Derived Settings: Prefer live canvas content if on Cart page, otherwise use fetched DB settings
    const activeCartSettings = (page?.slug === 'cart'
        ? canvasContent.find(w => w.type === 'cart_list')?.settings
        : cartSettings) || cartSettings;

    // console.log("Active Cart Settings:", activeCartSettings); 
    // Commented out to avoid noise, but confirmed logic seems sound. 
    // One issue: if on Cart page, and we update settings, does CartDrawer re-render? Yes, it's a prop.

    // AUTO-INJECT SYSTEM WIDGETS (Cart, Checkout)
    useEffect(() => {
        if (!loading && canvasContent.length === 0) {
            if (page?.slug === 'cart') {
                const timer = setTimeout(() => {
                    const newWidget = {
                        id: `cart_list-${genId()}`,
                        type: 'cart_list',
                        settings: getWidgetDefaults('cart_list')
                    };
                    setCanvasContent([newWidget]);
                }, 100);
                return () => clearTimeout(timer);
            }
            if (page?.slug === 'checkout') {
                const timer = setTimeout(() => {
                    const newWidget = {
                        id: `checkout_form-${genId()}`,
                        type: 'checkout_form',
                        settings: getWidgetDefaults('checkout_form') // We'll need to define this
                    };
                    setCanvasContent([newWidget]);
                }, 100);
                return () => clearTimeout(timer);
            }
        }
    }, [loading, page?.slug, canvasContent.length]);

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
                    {/* Hide Sidebar if in 'Cart Design Mode' or 'Checkout Mode' */}
                    {!['cart', 'checkout'].includes(page?.slug) && (
                        <WidgetSidebar
                            previewMode={previewMode}
                            onAddWidget={addWidget}
                            customWidgets={customWidgets}
                            onDeleteCustom={handleDeleteCustomWidget}
                        />
                    )}

                    <main className="flex-1 bg-slate-100 p-8 overflow-y-auto overflow-x-auto relative flex justify-center scroll-smooth">
                        <CartProvider storeKey={storeId}>
                            <CartDrawer settings={activeCartSettings} />
                            <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
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
                                        {/* Auto-Injector for Cart/Checkout Page */}
                                        {['cart', 'checkout'].includes(page?.slug) && canvasContent.length === 0 ? (
                                            <div className="flex items-center justify-center p-12 text-slate-400">
                                                <Loader />
                                                <span className="ml-2 text-sm">Initializing {page?.slug === 'checkout' ? 'Checkout' : 'Cart'} Designer...</span>
                                            </div>
                                        ) : canvasContent.length === 0 ? (
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
                                                        storeDiscounts={discounts}
                                                        onDelete={
                                                            /* Lock Cart, Checkout & Shop Product Grid Widgets */
                                                            ((page?.slug === 'cart' && block.type === 'cart_list') ||
                                                                (page?.slug === 'checkout' && block.type === 'checkout_form') ||
                                                                (page?.slug === 'shop' && block.type === 'product_grid'))
                                                                ? undefined
                                                                : () => deleteWidget(block.id)
                                                        }
                                                        isSelected={selectedElement?.id === block.id}
                                                        onClick={() => setSelectedElement(block)}
                                                        onSelect={setSelectedElement}
                                                        onDeleteItem={deleteWidget}
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
                        storeId={storeId}
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
