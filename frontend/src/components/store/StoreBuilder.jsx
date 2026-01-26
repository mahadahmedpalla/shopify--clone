
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
    AlignCenter, AlignLeft, AlignRight, ArrowUp, ArrowDown, Maximize, Minimize, Palette as PaletteIcon
} from 'lucide-react';

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
        ]
    }
];

// Helper to generate IDs
const genId = () => Math.random().toString(36).substr(2, 9);

export function StoreBuilder() {
    const { storeId, pageId } = useParams();
    const navigate = useNavigate();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop');
    const [canvasContent, setCanvasContent] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [draggedWidget, setDraggedWidget] = useState(null);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [storePages, setStorePages] = useState([]);
    const [manualProdId, setManualProdId] = useState('');

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

        // Fetch categories for this store
        const { data: storeCats } = await supabase
            .from('product_categories')
            .select('*')
            .eq('store_id', storeId)
            .order('name');

        const { data: prodData } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .order('name');

        const { data: pageData } = await supabase
            .from('store_pages')
            .select('id, name, slug')
            .eq('store_id', storeId)
            .order('name');

        setCategories(storeCats || []);
        setProducts(prodData || []);
        setStorePages(pageData || []);
    };

    const fetchPage = async () => {
        const { data, error } = await supabase
            .from('store_pages')
            .select('*')
            .eq('id', pageId)
            .single();

        if (error) navigate(`/store/${storeId}/customize`);
        else {
            setPage(data);
            setCanvasContent(data.content || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('store_pages')
            .update({ content: canvasContent })
            .eq('id', pageId);
        setLoading(false);
        if (error) alert(error.message);
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

    const addWidget = (type) => {
        const newWidget = {
            id: `${type}-${genId()}`,
            type,
            settings: type === 'navbar' ? {
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
                stickyMode: 'always', // none, always, scroll, hide
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
                // Layout
                heightMode: 'medium', // small, medium, large, full, custom
                customHeight: '500px',
                hAlignment: 'center', // flex-start, center, flex-end
                vAlignment: 'center', // flex-start, center, flex-end
                maxContentWidth: '800px',
                // Style
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
                // Buttons
                btnBgColor: '#ffffff',
                btnTextColor: '#000000',
                btnPaddingX: '32px',
                btnPaddingY: '16px',
                btnFontSize: '16px',
                btnBorderRadius: '9999px',
                btnMarginTop: '24px',
                secondaryBtnText: '',
                secondaryBtnLink: '',
                secondaryBtnBgColor: 'transparent',
                secondaryBtnTextColor: '#ffffff',
                // Responsive
                mobileHeight: '400px',
                mobileAlignment: 'center'
            } : {
                title: type === 'hero' ? 'New Hero Banner' : 'New Title',
                content: 'Sample content for your ' + type
            }
        };
        setCanvasContent([...canvasContent, newWidget]);
    };

    const deleteWidget = (id) => {
        setCanvasContent(canvasContent.filter(c => c.id !== id));
        if (selectedElement?.id === id) setSelectedElement(null);
    };

    if (loading) return <Loader />;

    return (
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
                    <Button variant="secondary" size="sm" className="bg-slate-800 border-slate-700 text-slate-300 hover:text-white">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                    <Button size="sm" onClick={handleSave} isLoading={loading}>
                        <Save className="h-4 w-4 mr-2" />
                        Publish
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/30">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input type="text" placeholder="Search elements..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm" />
                        </div>
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

                <main className="flex-1 bg-slate-100 p-8 overflow-y-auto relative flex justify-center scroll-smooth">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <div
                            className={`bg-white shadow-2xl transition-all duration-500 border border-slate-200 min-h-full
                                ${viewMode === 'desktop' ? 'w-full' : ''}
                                ${viewMode === 'tablet' ? 'w-[768px]' : ''}
                                ${viewMode === 'mobile' ? 'w-[375px]' : ''}
                            `}
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
                                                onDelete={() => deleteWidget(block.id)}
                                                isSelected={selectedElement?.id === block.id}
                                                onClick={() => setSelectedElement(block)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </SortableContext>
                        </div>
                    </DndContext>
                </main>

                <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Properties</h2>
                        {selectedElement && <button onClick={() => setSelectedElement(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>}
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
    );
}

function SortableBlock({ block, onDelete, isSelected, onClick, viewMode, store }) {
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

            <BlockRenderer type={block.type} settings={block.settings} viewMode={viewMode} store={store} />
        </div>
    );
}

function BlockRenderer({ type, settings, viewMode, store }) {
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Responsive Helper: Resolves value based on viewMode
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

            const bgPosition = rVal('backgroundPosition', settings.backgroundPosition || 'center');

            return (
                <div
                    className={`relative overflow-hidden w-full flex flex-col ${isBanner ? 'bg-white' : ''}`}
                    style={{
                        height: heroHeight,
                        borderRadius: rVal('borderRadius', settings.borderRadius)
                    }}
                >
                    <div
                        className="relative w-full h-full overflow-hidden flex"
                        style={{
                            backgroundColor: rVal('overlayColor', settings.overlayColor || '#f1f5f9'),
                            justifyContent: hAlign,
                            alignItems: vAlign
                        }}
                    >
                        {bgImage && (
                            <img
                                src={bgImage}
                                className={`absolute inset-0 w-full h-full object-cover object-${bgPosition}`}
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
                                    className="font-extrabold tracking-tighter leading-tight animate-in slide-in-from-bottom duration-500"
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
                                            className="shadow-xl hover:scale-105 transition-all"
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
                                </div>
                            </div>
                        )}
                    </div>

                </div>

            );
        case 'product_grid':
            return (
                <div className="p-12 space-y-8 bg-white">
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-slate-900">{settings.title || 'Featured Products'}</h3>
                        <span className="text-sm font-bold text-indigo-600">View All</span>
                    </div>
                    <div className="grid grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="space-y-3">
                                <div className="aspect-square bg-slate-100 rounded-3xl animate-pulse" />
                                <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                                <div className="h-4 w-1/4 bg-slate-100 rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'heading':
            return (
                <div className="px-12 py-8 bg-white">
                    <h2 className="text-4xl font-extrabold text-slate-900 leading-tight">{settings.text || 'Heading'}</h2>
                </div>
            );
        case 'cart_list':
            return (
                <div className="p-12 max-w-4xl mx-auto bg-white border-y border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-100">Review Items</h3>
                    <div className="space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="flex items-center space-x-6 pb-6 border-b border-slate-100 last:border-0 opacity-60">
                                <div className="h-24 w-24 bg-slate-100 rounded-2xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
                                    <div className="h-3 w-1/4 bg-slate-100 rounded-full" />
                                </div>
                                <div className="text-right font-bold text-slate-900">$299.00</div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        case 'product_detail':
            return (
                <div className="grid grid-cols-2 gap-12 p-12 bg-white">
                    <div className="aspect-square bg-slate-100 rounded-3xl" />
                    <div className="space-y-8 py-4">
                        <div className="space-y-4">
                            <div className="h-8 w-3/4 bg-slate-100 rounded-full" />
                            <div className="h-6 w-1/4 bg-slate-100 rounded-full" />
                        </div>
                        <div className="space-y-3">
                            <div className="h-px bg-slate-100" />
                            <div className="flex space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 w-10 bg-slate-100 rounded-xl" />)}
                            </div>
                        </div>
                        <div className="w-full h-14 bg-indigo-600/20 rounded-2xl border-2 border-dashed border-indigo-200" />
                    </div>
                </div>
            );
        default:
            return (
                <div className="p-8 border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400 text-xs italic">
                    {type.toUpperCase()} Component Placeholder
                </div>
            );
    }
}

function Loader() {
    return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Engine...</p>
        </div>
    );
}

function ViewModeBtn({ active, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 rounded-md transition-all ${active ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
        >
            {icon}
        </button>
    );
}

function NavbarProperties({ settings, onUpdate, categories, products, storePages, viewMode }) {
    const update = (key, val) => {
        if (viewMode === 'desktop') {
            onUpdate({ ...settings, [key]: val });
        } else {
            const responsive = { ...(settings.responsive || {}) };
            responsive[viewMode] = { ...(responsive[viewMode] || {}), [key]: val };
            onUpdate({ ...settings, responsive });
        }
    };

    const getV = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        const override = settings.responsive?.[viewMode]?.[key];
        return override !== undefined ? override : (settings[key] !== undefined ? settings[key] : defaultVal);
    };

    const isO = (key) => viewMode !== 'desktop' && settings.responsive?.[viewMode]?.[key] !== undefined;

    const ResponsiveIndicator = ({ k }) => isO(k) ? (
        <span className="ml-1.5 px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase flex items-center inline-flex">
            {viewMode === 'mobile' ? <Smartphone className="h-2 w-2 mr-0.5" /> : <Tablet className="h-2 w-2 mr-0.5" />} Override
        </span>
    ) : null;

    return (
        <div className="space-y-6">
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colors & Style</h3>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Background" value={getV('bgColor')} onChange={v => update('bgColor', v)} />
                    <ColorInput label="Text" value={getV('textColor')} onChange={v => update('textColor', v)} />
                    <ColorInput label="Hover" value={getV('hoverColor')} onChange={v => update('hoverColor', v)} />
                    <ColorInput label="Border" value={getV('borderColor')} onChange={v => update('borderColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Border (px) <ResponsiveIndicator k="borderWidth" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('borderWidth', '0px'))} onChange={e => update('borderWidth', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Radius (px) <ResponsiveIndicator k="borderRadius" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('borderRadius', '0px'))} onChange={e => update('borderRadius', e.target.value + 'px')} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shadow</label>
                    <select className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={settings.shadow} onChange={e => update('shadow', e.target.value)}>
                        <option value="none">None</option>
                        <option value="soft">Soft</option>
                        <option value="strong">Strong</option>
                    </select>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Typography</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Font Family <ResponsiveIndicator k="fontFamily" /></label>
                    <select
                        className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                        value={getV('fontFamily', 'Inter, sans-serif')}
                        onChange={e => update('fontFamily', e.target.value)}
                    >
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="'Outfit', sans-serif">Outfit</option>
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="'Montserrat', sans-serif">Montserrat</option>
                        <option value="'Roboto', sans-serif">Roboto</option>
                        <option value="'Lato', sans-serif">Lato</option>
                        <option value="'Poppins', sans-serif">Poppins</option>
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Size (px) <ResponsiveIndicator k="fontSize" /></label>
                        <input
                            type="number"
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={parseInt(getV('fontSize', '14px'))}
                            onChange={e => update('fontSize', e.target.value + 'px')}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Weight <ResponsiveIndicator k="fontWeight" /></label>
                        <select
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={getV('fontWeight', '400')}
                            onChange={e => update('fontWeight', e.target.value)}
                        >
                            <option value="300">Light</option>
                            <option value="400">Regular</option>
                            <option value="500">Medium</option>
                            <option value="600">Semi Bold</option>
                            <option value="700">Bold</option>
                            <option value="800">Extra Bold</option>
                        </select>
                    </div>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size & Spacing</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Height (px) <ResponsiveIndicator k="height" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('height', '60px'))} onChange={e => update('height', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Gap (px) <ResponsiveIndicator k="gap" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('gap', '12px'))} onChange={e => update('gap', e.target.value + 'px')} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Alignment <ResponsiveIndicator k="alignment" /></label>
                    <select className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={getV('alignment', 'center')} onChange={e => update('alignment', e.target.value)}>
                        <option value="flex-start">Left</option>
                        <option value="center">Center</option>
                        <option value="flex-end">Right</option>
                        <option value="space-between">Space Between</option>
                    </select>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Behavior</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sticky Mode</label>
                    <div className="grid grid-cols-1 gap-2">
                        <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="radio" name="sticky" checked={settings.stickyMode === 'none'} onChange={() => update('stickyMode', 'none')} />
                            <span>Static (No Sticky)</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="radio" name="sticky" checked={settings.stickyMode === 'always'} onChange={() => update('stickyMode', 'always')} />
                            <span>Always Sticky</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="radio" name="sticky" checked={settings.stickyMode === 'scroll'} onChange={() => update('stickyMode', 'scroll')} />
                            <span>Sticky on Scroll</span>
                        </label>
                        <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                            <input type="radio" name="sticky" checked={settings.stickyMode === 'hide'} onChange={() => update('stickyMode', 'hide')} />
                            <span>Hide on Scroll</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Hamburger Menu</label>
                    <div className="flex flex-col space-y-2">
                        <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="flex items-center"><Monitor className="h-3 w-3 mr-2 text-slate-400" /> PC</span>
                            <input type="checkbox" checked={settings.hamburgerPC} onChange={e => update('hamburgerPC', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        </label>
                        <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="flex items-center"><Tablet className="h-3 w-3 mr-2 text-slate-400" /> Tablet</span>
                            <input type="checkbox" checked={settings.hamburgerTablet} onChange={e => update('hamburgerTablet', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        </label>
                        <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                            <span className="flex items-center"><Smartphone className="h-3 w-3 mr-2 text-slate-400" /> Mobile</span>
                            <input type="checkbox" checked={settings.hamburgerMobile} onChange={e => update('hamburgerMobile', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        </label>
                    </div>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo</h3>
                <div className="space-y-3">
                    {getV('logoUrl') ? (
                        <div className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                            <img src={getV('logoUrl')} className="max-h-full p-4 object-contain" alt="Logo" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                <button
                                    onClick={() => update('logoUrl', '')}
                                    className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl h-32 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
                            <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 mb-2 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Logo</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${Math.random()}.${fileExt}`;
                                    const filePath = `${fileName}`;

                                    const { error: uploadError } = await supabase.storage
                                        .from('store-assets')
                                        .upload(filePath, file);

                                    if (uploadError) {
                                        alert('Upload failed: ' + uploadError.message);
                                        return;
                                    }

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('store-assets')
                                        .getPublicUrl(filePath);

                                    update('logoUrl', publicUrl);
                                }}
                            />
                        </label>
                    )}
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Logo Width (px) <ResponsiveIndicator k="logoWidth" /></label>
                        <input type="number" className="w-20 px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('logoWidth', '100px'))} onChange={e => update('logoWidth', e.target.value + 'px')} />
                    </div>
                </div>

                <div className="space-y-4 pt-4">
                    <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">Show Store Name <ResponsiveIndicator k="showStoreName" /></span>
                        <input
                            type="checkbox"
                            checked={getV('showStoreName')}
                            onChange={e => update('showStoreName', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>

                    {getV('showStoreName') && (
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">Logo Gap (px) <ResponsiveIndicator k="logoGap" /></label>
                            <input
                                type="number"
                                className="w-20 px-2 py-1 bg-slate-50 border rounded text-xs"
                                value={parseInt(getV('logoGap', '12px'))}
                                onChange={e => update('logoGap', e.target.value + 'px')}
                            />
                        </div>
                    )}
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between uppercase tracking-widest">
                    <h3 className="text-[10px] font-bold text-slate-400">Menu Items</h3>
                    <button
                        onClick={() => update('menuItems', [...(settings.menuItems || []), { id: genId(), label: 'New Link', type: 'page', value: '' }])}
                        className="text-indigo-600 hover:text-indigo-800"
                    >
                        <Plus className="h-3 w-3" />
                    </button>
                </div>
                <div className="space-y-2">
                    {(settings.menuItems || []).map((item, idx) => (
                        <div key={item.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <input
                                    className="bg-transparent border-none text-[10px] font-bold text-slate-700 p-0 focus:ring-0 w-24"
                                    value={item.label}
                                    onChange={e => {
                                        const newItems = [...settings.menuItems];
                                        newItems[idx].label = e.target.value;
                                        update('menuItems', newItems);
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const newItems = settings.menuItems.filter((_, i) => i !== idx);
                                        update('menuItems', newItems);
                                    }}
                                    className="text-slate-300 hover:text-red-500"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                            <select
                                className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                value={item.type}
                                onChange={e => {
                                    const newItems = [...settings.menuItems];
                                    newItems[idx].type = e.target.value;
                                    newItems[idx].value = ''; // Reset value on type change
                                    update('menuItems', newItems);
                                }}
                            >
                                <option value="page">Page</option>
                                <option value="category">Category</option>
                                <option value="product">Product</option>
                                <option value="custom">Custom URL</option>
                            </select>

                            {/* Contextual Value Selector */}
                            {item.type === 'category' ? (
                                <select
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                    value={item.value}
                                    onChange={e => {
                                        const newItems = [...settings.menuItems];
                                        newItems[idx].value = e.target.value;
                                        // Auto-update label if blank
                                        if (!newItems[idx].label || newItems[idx].label === 'New Link') {
                                            const cat = categories.find(c => c.id === e.target.value);
                                            if (cat) newItems[idx].label = cat.name;
                                        }
                                        update('menuItems', newItems);
                                    }}
                                >
                                    <option value="">Select Category...</option>
                                    {categories.filter(c => !c.parent_id).map(parent => (
                                        <React.Fragment key={parent.id}>
                                            <option value={parent.id} className="font-bold">{parent.name}</option>
                                            {categories.filter(c => c.parent_id === parent.id).map(child => (
                                                <option key={child.id} value={child.id}>&nbsp;&nbsp;↳ {child.name}</option>
                                            ))}
                                        </React.Fragment>
                                    ))}
                                </select>
                            ) : item.type === 'product' ? (
                                <div className="space-y-1">
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                        value={products.some(p => p.id === item.value) ? item.value : 'manual'}
                                        onChange={e => {
                                            if (e.target.value === 'manual') return;
                                            const newItems = [...settings.menuItems];
                                            newItems[idx].value = e.target.value;
                                            const prod = products.find(p => p.id === e.target.value);
                                            if (prod && (!newItems[idx].label || newItems[idx].label === 'New Link')) {
                                                newItems[idx].label = prod.name;
                                            }
                                            update('menuItems', newItems);
                                        }}
                                    >
                                        <option value="">Select Product...</option>
                                        <option value="manual">-- Enter ID Manually --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                                        ))}
                                    </select>
                                    {(!products.some(p => p.id === item.value) || item.value === '') && (
                                        <input
                                            className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                            placeholder="Paste Product ID here..."
                                            value={item.value}
                                            onChange={e => {
                                                const newItems = [...settings.menuItems];
                                                newItems[idx].value = e.target.value;
                                                update('menuItems', newItems);
                                            }}
                                        />
                                    )}
                                </div>
                            ) : item.type === 'page' ? (
                                <select
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                    value={item.value}
                                    onChange={e => {
                                        const newItems = [...settings.menuItems];
                                        newItems[idx].value = e.target.value;
                                        // Auto-update label if blank
                                        if (!newItems[idx].label || newItems[idx].label === 'New Link') {
                                            const p = storePages.find(p => p.slug === e.target.value);
                                            if (p) newItems[idx].label = p.name;
                                        }
                                        update('menuItems', newItems);
                                    }}
                                >
                                    <option value="">Select Page...</option>
                                    {storePages.map(p => (
                                        <option key={p.id} value={p.slug}>{p.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    className="w-full bg-white border border-slate-200 rounded p-1 text-[9px] font-medium"
                                    placeholder="e.g. https://..."
                                    value={item.value}
                                    onChange={e => {
                                        const newItems = [...settings.menuItems];
                                        newItems[idx].value = e.target.value;
                                        update('menuItems', newItems);
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function HeroProperties({ settings, onUpdate, viewMode }) {
    const update = (key, val) => {
        if (viewMode === 'desktop') {
            onUpdate({ ...settings, [key]: val });
        } else {
            const responsive = { ...(settings.responsive || {}) };
            responsive[viewMode] = { ...(responsive[viewMode] || {}), [key]: val };
            onUpdate({ ...settings, responsive });
        }
    };

    const getV = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        const override = settings.responsive?.[viewMode]?.[key];
        return override !== undefined ? override : (settings[key] !== undefined ? settings[key] : defaultVal);
    };

    const isO = (key) => viewMode !== 'desktop' && settings.responsive?.[viewMode]?.[key] !== undefined;

    const ResponsiveIndicator = ({ k }) => isO(k) ? (
        <span className="ml-1.5 px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase flex items-center inline-flex">
            {viewMode === 'mobile' ? <Smartphone className="h-2 w-2 mr-0.5" /> : <Tablet className="h-2 w-2 mr-0.5" />} Override
        </span>
    ) : null;

    return (
        <div className="space-y-6 pb-20">
            {/* 1. Content */}
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</h3>

                <div className="pt-2">
                    <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                        <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">
                            Show Content Above Image <ResponsiveIndicator k="showContentAboveImage" />
                        </span>
                        <input
                            type="checkbox"
                            checked={getV('showContentAboveImage')}
                            onChange={e => update('showContentAboveImage', e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                    </label>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">
                        Background Image <ResponsiveIndicator k="backgroundImage" />
                    </label>
                    {getV('backgroundImage') ? (
                        <div className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video flex items-center justify-center">
                            <img src={getV('backgroundImage')} className="max-h-full w-full object-cover" alt="Hero BG" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button onClick={() => update('backgroundImage', '')} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl h-32 hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
                            <Upload className="h-8 w-8 text-slate-300 group-hover:text-indigo-400 mb-2 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Banner</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const fileExt = file.name.split('.').pop();
                                    const fileName = `${Math.random()}.${fileExt}`;
                                    const filePath = `${fileName}`;

                                    const { data, error } = await supabase.storage
                                        .from('store-assets')
                                        .upload(filePath, file);

                                    if (error) return alert('Upload failed: ' + error.message);

                                    const { data: { publicUrl } } = supabase.storage
                                        .from('store-assets')
                                        .getPublicUrl(filePath);

                                    update('backgroundImage', publicUrl);
                                }}
                            />
                        </label>
                    )}

                    {/* Background Position Control */}
                    {getV('backgroundImage') && (
                        <div className="flex items-center justify-between pt-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Image Position <ResponsiveIndicator k="backgroundPosition" /></label>
                            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                                <button onClick={() => update('backgroundPosition', 'top')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'top' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Top</button>
                                <button onClick={() => update('backgroundPosition', 'center')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Mid</button>
                                <button onClick={() => update('backgroundPosition', 'bottom')} className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase transition-all ${getV('backgroundPosition', 'center') === 'bottom' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Bot</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block flex items-center">
                        Texts <ResponsiveIndicator k="title" />
                    </label>
                    <input type="text" placeholder="Heading..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('title', '')} onChange={e => update('title', e.target.value)} />
                    <textarea rows={3} placeholder="Subheading..." className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('subtitle', '')} onChange={e => update('subtitle', e.target.value)} />
                </div>
            </section>

            {/* 2. Layout */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Hero Height <ResponsiveIndicator k="heightMode" /></label>
                    <div className="grid grid-cols-2 gap-2">
                        {['small', 'medium', 'large', 'full', 'custom'].map(m => (
                            <button
                                key={m}
                                onClick={() => update('heightMode', m)}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${getV('heightMode') === m ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                    {getV('heightMode') === 'custom' && (
                        <input type="text" className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={getV('customHeight', '')} onChange={e => update('customHeight', e.target.value)} placeholder="e.g. 500px or 70vh" />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">H-Alignment <ResponsiveIndicator k="hAlignment" /></label>
                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                            <button onClick={() => update('hAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft className="h-4 w-4" /></button>
                            <button onClick={() => update('hAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter className="h-4 w-4" /></button>
                            <button onClick={() => update('hAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('hAlignment') === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight className="h-4 w-4" /></button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">V-Alignment <ResponsiveIndicator k="vAlignment" /></label>
                        <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-100">
                            <button onClick={() => update('vAlignment', 'flex-start')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'flex-start' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ArrowUp className="h-4 w-4" /></button>
                            <button onClick={() => update('vAlignment', 'center')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><Move className="h-4 w-4" /></button>
                            <button onClick={() => update('vAlignment', 'flex-end')} className={`flex-1 p-1.5 rounded-md flex justify-center transition-colors ${getV('vAlignment') === 'flex-end' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}><ArrowDown className="h-4 w-4" /></button>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Style */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Style</h3>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Overlay Color" value={getV('overlayColor')} onChange={v => update('overlayColor', v)} />
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Opacity <ResponsiveIndicator k="overlayOpacity" /></label>
                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-600" value={getV('overlayOpacity', 0.4)} onChange={e => update('overlayOpacity', parseFloat(e.target.value))} />
                    </div>
                </div>
                <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer">
                    <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">Use Gradient Overlay <ResponsiveIndicator k="useGradient" /></span>
                    <input type="checkbox" checked={getV('useGradient')} onChange={e => update('useGradient', e.target.checked)} className="rounded border-slate-300 text-indigo-600" />
                </label>
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Border Radius (px) <ResponsiveIndicator k="borderRadius" /></label>
                    <input type="number" className="w-20 px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('borderRadius', '0px'))} onChange={e => update('borderRadius', e.target.value + 'px')} />
                </div>
            </section>

            {/* 4. Typography */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Typography</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Heading Font <ResponsiveIndicator k="headingFontFamily" /></label>
                        <select
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={getV('headingFontFamily', 'Inter, sans-serif')}
                            onChange={e => update('headingFontFamily', e.target.value)}
                        >
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Subheading Font <ResponsiveIndicator k="subheadingFontFamily" /></label>
                        <select
                            className="w-full px-2 py-1 bg-slate-50 border rounded text-xs"
                            value={getV('subheadingFontFamily', 'Inter, sans-serif')}
                            onChange={e => update('subheadingFontFamily', e.target.value)}
                        >
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Outfit', sans-serif">Outfit</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Poppins', sans-serif">Poppins</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Heading Color" value={getV('headingColor')} onChange={v => update('headingColor', v)} />
                    <ColorInput label="Text Color" value={getV('subheadingColor')} onChange={v => update('subheadingColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Heading Size (px) <ResponsiveIndicator k="headingSize" /></label>
                        <input type="number" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={parseInt(getV('headingSize', '48px'))} onChange={e => update('headingSize', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Subheading Size (px) <ResponsiveIndicator k="subheadingSize" /></label>
                        <input type="number" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={parseInt(getV('subheadingSize', '18px'))} onChange={e => update('subheadingSize', e.target.value + 'px')} />
                    </div>
                </div>
            </section>

            {/* 5. Button Configuration */}
            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Button Configuration</h3>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block flex items-center">Button Labels <ResponsiveIndicator k="primaryBtnText" /></label>
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Primary Label..." className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" value={getV('primaryBtnText', '')} onChange={e => update('primaryBtnText', e.target.value)} />
                        <input type="text" placeholder="Secondary Label..." className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px]" value={getV('secondaryBtnText', '')} onChange={e => update('secondaryBtnText', e.target.value)} />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Btn Background" value={getV('btnBgColor')} onChange={v => update('btnBgColor', v)} />
                    <ColorInput label="Btn Text" value={getV('btnTextColor')} onChange={v => update('btnTextColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Padding X (px) <ResponsiveIndicator k="btnPaddingX" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnPaddingX', '32px'))} onChange={e => update('btnPaddingX', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Padding Y (px) <ResponsiveIndicator k="btnPaddingY" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnPaddingY', '16px'))} onChange={e => update('btnPaddingY', e.target.value + 'px')} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Font Size <ResponsiveIndicator k="btnFontSize" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnFontSize', '16px'))} onChange={e => update('btnFontSize', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Radius (px) <ResponsiveIndicator k="btnBorderRadius" /></label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnBorderRadius', '9999px'))} onChange={e => update('btnBorderRadius', e.target.value + 'px')} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Margin Top (px) <ResponsiveIndicator k="btnMarginTop" /></label>
                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('btnMarginTop', '24px'))} onChange={e => update('btnMarginTop', e.target.value + 'px')} />
                </div>
            </section>
        </div>
    );
}

function ColorInput({ label, value, onChange }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
            <div className="flex items-center space-x-2 bg-slate-50 border rounded p-1">
                <input type="color" className="h-4 w-4 rounded cursor-pointer border-none bg-transparent" value={value} onChange={e => onChange(e.target.value)} />
                <span className="text-[9px] font-mono text-slate-500 uppercase">{value}</span>
            </div>
        </div>
    );
}

function EmptyState({ name }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
            <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <Layout className="h-12 w-12 text-slate-300" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Build your masterpiece</h2>
                <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">Drag and drop elements from the sidebar to start designing your **{name}**.</p>
            </div>
            <Button variant="secondary" className="border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100">Browse Templates</Button>
        </div>
    );
}
