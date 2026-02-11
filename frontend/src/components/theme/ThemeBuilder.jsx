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
    Save, Eye, Smartphone, Monitor, Tablet, Minimize, Maximize, ChevronLeft, Layout, Globe, Lock, Database
} from 'lucide-react';

import { ThemeAssetsModal } from './ThemeAssetsModal';

// Context & Helper Imports
import { CartProvider } from '../../context/CartContext';
import { CartDrawer } from '../store/widgets/cart/CartDrawer';
import { Loader, ViewModeBtn, genId } from '../store/widgets/Shared';
import { ThemePageManager } from './ThemePageManager';

// Modular Builder Components
// We reuse the existing builder components as they are largely data-agnostic (props driven)
import { WidgetSidebar } from '../store/builder/WidgetSidebar';
import { PropertiesPanel } from '../store/builder/PropertiesPanel';
import { SortableBlock } from '../store/builder/SortableBlock';
import { getWidgetDefaults } from '../store/builder/widgetConstants';

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

// --- Recursive Helpers (Identical to StoreBuilder) ---
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
            if (newChildren !== block.settings.children) {
                acc.push({ ...block, settings: { ...block.settings, children: newChildren } });
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
            return { ...block, settings: { ...block.settings, children } };
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

export function ThemeBuilder() {
    const { themeId, pageId } = useParams();
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
    const [themePages, setThemePages] = useState([]);
    const [theme, setTheme] = useState(null);
    const [customWidgets, setCustomWidgets] = useState([]); // TODO: Add theme_widgets table
    const [cartSettings, setCartSettings] = useState(null);
    const [discounts, setDiscounts] = useState([]); // No theme discounts yet
    const [mockSettings, setMockSettings] = useState({ enableDiscounts: false, enableRatings: false });
    const [isAssetsModalOpen, setIsAssetsModalOpen] = useState(false);

    console.log('ThemeBuilder Render: check mockSettings', JSON.stringify(mockSettings));

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchPage();
        fetchThemeData();
    }, [pageId, themeId]);

    const fetchThemeData = async () => {
        const { data: themeData } = await supabase.from('themes').select('*').eq('id', themeId).single();
        if (themeData) setTheme(themeData);

        const { data: cats } = await supabase.from('theme_categories').select('*').eq('theme_id', themeId);
        setCategories(cats || []);

        const { data: prods } = await supabase.from('theme_products').select('*').eq('theme_id', themeId);
        setProducts(prods || []);

        const { data: pagesData } = await supabase.from('theme_pages').select('*').eq('theme_id', themeId);
        setThemePages(pagesData || []);

        // Mock discounts for now
        setDiscounts([]);
    };

    const fetchPage = async () => {
        setLoading(true);
        try {
            let query = supabase.from('theme_pages').select('*').eq('theme_id', themeId);
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
                .from('theme_pages')
                .upsert({
                    theme_id: themeId,
                    slug: page?.slug || 'home',
                    name: page?.name || 'Home Page',
                    type: page?.type || 'custom',
                    content: canvasContent,
                    is_included: true
                }, { onConflict: 'theme_id, slug' });

            if (error) throw error;
            alert('Theme Layout Saved! 🎨');
        } catch (e) {
            alert('Save failed: ' + e.message);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const block = findBlockRecursive(canvasContent, active.id);
        if (block) setDraggedWidget(block);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeBlock = findBlockRecursive(canvasContent, active.id);
        if (!activeBlock) return;

        const isContainerDrop = over.data?.current?.type === 'container';

        if (isContainerDrop) {
            const targetContainerId = over.data.current.parentId;
            if (active.id === targetContainerId) return;

            const contentWithoutActive = deleteBlockRecursive(canvasContent, active.id);
            const finalContent = insertBlockRecursive(contentWithoutActive, targetContainerId, undefined, activeBlock);

            setCanvasContent(finalContent);
            setDraggedWidget(null);
            return;
        }

        if (active.id !== over.id) {
            const sourceParentId = findParentIdRecursive(canvasContent, active.id);
            const targetParentId = findParentIdRecursive(canvasContent, over.id);

            if (sourceParentId === targetParentId) {
                const reorderedContent = reorderChildrenRecursive(canvasContent, sourceParentId, active.id, over.id);
                setCanvasContent(reorderedContent);
            } else {
                const contentWithoutActive = deleteBlockRecursive(canvasContent, active.id);
                let targetIndex = 0;
                if (targetParentId === null) {
                    targetIndex = contentWithoutActive.findIndex(x => x.id === over.id);
                } else {
                    const targetContainer = findBlockRecursive(contentWithoutActive, targetParentId);
                    if (targetContainer && targetContainer.settings.children) {
                        targetIndex = targetContainer.settings.children.findIndex(x => x.id === over.id);
                    }
                }
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
        setSelectedElement({ ...selectedElement, settings: newSettings });
    };

    // Derived Settings for Cart
    const activeCartSettings = (page?.slug === 'cart'
        ? canvasContent.find(w => w.type === 'cart_list')?.settings
        : cartSettings) || cartSettings;

    const toggleInclude = async (slug, isIncluded) => {
        // Find existing or create placeholder
        const existingPage = themePages.find(p => p.slug === slug);
        let error = null;

        if (existingPage) {
            const { error: updateError } = await supabase
                .from('theme_pages')
                .update({ is_included: isIncluded })
                .eq('id', existingPage.id);
            error = updateError;
        } else {
            // Upsert with default content if new system page
            const { error: upsertError } = await supabase
                .from('theme_pages')
                .upsert({
                    theme_id: themeId,
                    slug: slug,
                    name: slug.charAt(0).toUpperCase() + slug.slice(1) + ' Page', // Simple name
                    type: 'system',
                    is_included: isIncluded,
                    content: [] // Empty default
                }, { onConflict: 'theme_id, slug' });
            error = upsertError;
        }

        if (error) {
            alert('Failed to update page status: ' + error.message);
        } else {
            fetchThemeData(); // Reload pages
        }
    };

    const handleCreatePage = async (name) => {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        if (!slug) return alert('Invalid page name');

        const { error } = await supabase
            .from('theme_pages')
            .insert({
                theme_id: themeId,
                name: name,
                slug: slug,
                type: 'custom',
                content: [],
                is_included: true
            });

        if (error) {
            alert('Failed to create page: ' + error.message);
        } else {
            fetchThemeData();
            // Automatically switch? Maybe not needed, let them select.
        }
    };

    const handleDeletePage = async (pageId) => {
        const { error } = await supabase
            .from('theme_pages')
            .delete()
            .eq('id', pageId);

        if (error) {
            alert('Failed to delete page: ' + error.message);
        } else {
            fetchThemeData();
            if (activePage?.id === pageId) {
                // Navigate to home if current deleted
                const home = themePages.find(p => p.slug === 'home');
                if (home) navigate(`/theme-builder/${themeId}/page/${home.id}`);
                else navigate(`/theme-builder/${themeId}`);
            }
        }
    };

    const handleToggleStatus = async () => {
        if (!theme) return;

        const newStatus = theme.status === 'published' ? 'draft' : 'published';
        const confirmMsg = newStatus === 'published'
            ? "Are you sure you want to PUBLISH this theme? It will be visible to everyone."
            : "Are you sure you want to UNPUBLISH this theme? It will be hidden from the public.";

        if (!window.confirm(confirmMsg)) return;

        const { error } = await supabase
            .from('themes')
            .update({ status: newStatus })
            .eq('id', themeId);

        if (error) {
            alert('Failed to update status: ' + error.message);
        } else {
            setTheme({ ...theme, status: newStatus });
            alert(`Theme is now ${newStatus.toUpperCase()}`);
        }
    };

    const [isPageManagerOpen, setIsPageManagerOpen] = useState(false);

    if (loading) return <Loader />;

    return (
        <ErrorBoundary>
            <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans select-none relative">
                <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 shadow-2xl relative">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate(`/theme-dashboard`)} className="p-2 text-slate-400 hover:text-white transition-colors">
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="h-6 w-[1px] bg-slate-800" />
                        <div
                            className="group cursor-pointer flex items-center gap-2 hover:bg-slate-800 rounded-lg px-2 py-1 transition-colors"
                            onClick={() => setIsPageManagerOpen(!isPageManagerOpen)}
                        >
                            <div>
                                <h1 className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                                    {page?.name}
                                    <span className="text-xs text-slate-500 font-normal">deployment: {page?.is_included !== false ? 'Included' : 'Excluded'}</span>
                                </h1>
                                <p className="text-[10px] text-slate-500 font-medium tracking-tight">/{page?.slug}</p>
                            </div>
                            <div className="text-slate-500 group-hover:text-white transition-colors">
                                <Layout className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    {/* Page Manager Popover */}
                    {isPageManagerOpen && (
                        <div className="absolute top-14 left-0 h-[calc(100vh-3.5rem)] z-50">
                            <ThemePageManager
                                pages={themePages}
                                activePageId={page?.id}
                                onSelectPage={(p) => {
                                    if (p.id) {
                                        navigate(`/theme-builder/${themeId}/page/${p.id}`);
                                    } else if (p.slug === 'home') {
                                        navigate(`/theme-builder/${themeId}`);
                                    } else {
                                        alert("Please enable/include this page first to edit it.");
                                    }
                                    setIsPageManagerOpen(false);
                                }}
                                onCreatePage={handleCreatePage}
                                onDeletePage={handleDeletePage}
                                onToggleInclude={toggleInclude}
                                onClose={() => setIsPageManagerOpen(false)}
                            />
                        </div>
                    )}

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
                        {/* Mock Data Button */}
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsAssetsModalOpen(true)}
                            className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
                        >
                            <Database className="h-4 w-4 mr-2" />
                            Mock Data
                        </Button>

                        {theme && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleToggleStatus}
                                className={`border-slate-700 hover:bg-slate-800 ${theme.status === 'published'
                                    ? 'text-green-400 border-green-900/50 bg-green-900/10'
                                    : 'text-amber-400 border-amber-900/50 bg-amber-900/10'
                                    }`}
                            >
                                {theme.status === 'published' ? (
                                    <>
                                        <Globe className="h-4 w-4 mr-2" />
                                        Public
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4 mr-2" />
                                        Draft
                                    </>
                                )}
                            </Button>
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
                            Save Theme
                        </Button>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden relative">
                    {!['cart', 'checkout'].includes(page?.slug) && (
                        <WidgetSidebar
                            previewMode={previewMode}
                            onAddWidget={addWidget}
                            customWidgets={customWidgets}
                            onDeleteCustom={() => { }} // Disabled for themes for now
                        />
                    )}

                    <main className="flex-1 bg-slate-100 p-8 overflow-y-auto overflow-x-auto relative flex justify-center scroll-smooth">
                        <CartProvider storeKey={themeId}>
                            {/* Pass mock cart items or handle cart drawer gracefully in theme mode */}
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
                                        {canvasContent.length === 0 ? (
                                            <div className="h-96 flex flex-col items-center justify-center text-center space-y-6 opacity-30 border-2 border-dashed border-slate-300 rounded-3xl m-8">
                                                <div className="p-6 bg-slate-100 rounded-full">
                                                    <Layout className="h-12 w-12 text-slate-400" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h3 className="text-xl font-bold text-slate-900">Start Building Theme Page</h3>
                                                    <p className="text-slate-500 font-medium max-w-xs mx-auto">Drag widgets from the left sidebar.</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="min-h-[80vh]">
                                                {canvasContent.map((block) => (
                                                    <SortableBlock
                                                        key={block.id}
                                                        block={block}
                                                        viewMode={viewMode}
                                                        store={{ ...theme, id: themeId }} // Pass theme as store
                                                        products={products}
                                                        categories={categories}
                                                        storeDiscounts={discounts}
                                                        mockSettings={mockSettings}
                                                        onDelete={() => deleteWidget(block.id)}
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
                        storePages={themePages}
                        onSaveCustom={() => { }} // Disabled
                        storeId={themeId}
                        isTheme={true}
                        developerId={theme?.developer_id}
                    />
                </div>
                {/* Assets Modal */}
                <ThemeAssetsModal
                    isOpen={isAssetsModalOpen}
                    onClose={() => setIsAssetsModalOpen(false)}
                    themeId={themeId}
                    mockSettings={mockSettings}
                    onUpdateMockSettings={(newSettings) => {
                        console.log('ThemeBuilder: receiving update', newSettings);
                        setMockSettings(newSettings);
                    }}
                />
            </div>
        </ErrorBoundary>
    );
}
