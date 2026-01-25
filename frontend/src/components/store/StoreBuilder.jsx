
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
    Redo2, ChevronRight, Search, ShoppingBag, ShoppingCart, Trash2, Move, GripVertical
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

    useEffect(() => {
        fetchPage();
        fetchStoreData();
    }, [pageId]);

    const fetchStoreData = async () => {
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
                logoUrl: '',
                logoWidth: '120px',
                sticky: 'always',
                menuItems: [
                    { id: 'm1', label: 'Home', type: 'page', value: 'home' },
                    { id: 'm2', label: 'Shop', type: 'page', value: 'shop' }
                ]
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
                                    categories={categories}
                                    products={products}
                                    storePages={storePages}
                                    onUpdate={(newSettings) => {
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

function SortableBlock({ block, onDelete, isSelected, onClick }) {
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

            <BlockRenderer type={block.type} settings={block.settings} />
        </div>
    );
}

function BlockRenderer({ type, settings }) {
    switch (type) {
        case 'navbar':
            return (
                <div
                    className={`flex items-center justify-center transition-all duration-300 w-full z-40`}
                    style={{
                        backgroundColor: settings.bgColor,
                        color: settings.textColor,
                        height: settings.height,
                        borderRadius: settings.borderRadius,
                        borderBottom: `${settings.borderWidth} solid ${settings.borderColor}`,
                        boxShadow: settings.shadow === 'soft' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : settings.shadow === 'strong' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none',
                        opacity: settings.opacity,
                        backdropFilter: settings.blur ? `blur(${settings.blur})` : 'none',
                        position: settings.sticky === 'always' ? 'sticky' : 'relative',
                        top: 0
                    }}
                >
                    <div
                        className="flex items-center w-full px-6"
                        style={{
                            maxWidth: settings.maxWidth,
                            justifyContent: settings.alignment,
                            gap: settings.gap
                        }}
                    >
                        {/* Logo */}
                        <div className="flex items-center">
                            {settings.logoUrl ? (
                                <img src={settings.logoUrl} style={{ width: settings.logoWidth }} alt="Logo" />
                            ) : (
                                <div className="h-8 w-12 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-[10px]">LOGO</div>
                            )}
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center" style={{ gap: settings.gap }}>
                            {(settings.menuItems || []).map(item => (
                                <span
                                    key={item.id}
                                    className="text-sm font-bold cursor-pointer hover:opacity-75 transition-opacity flex items-center uppercase tracking-tight"
                                    style={{ color: settings.textColor }}
                                >
                                    {item.label}
                                    {item.type === 'category' && <ChevronRight className="h-3 w-3 ml-1 rotate-90" />}
                                </span>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-4">
                            <ShoppingCart className="h-5 w-5 cursor-pointer hover:opacity-75" />
                            <div className="md:hidden">
                                <Box className="h-6 w-6" /> {/* Hamburger placeholder */}
                            </div>
                        </div>
                    </div>
                </div>
            );
        case 'hero':
            return (
                <div className="bg-slate-900 py-24 px-12 text-center text-white relative overflow-hidden">
                    <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
                        <h2 className="text-5xl font-extrabold tracking-tight">{settings.title || 'Premium Experience'}</h2>
                        <p className="text-lg text-slate-300">{settings.subtitle || 'Discover our curated selection of fine goods.'}</p>
                        <Button className="rounded-full px-8 py-6 text-lg">{settings.buttonText || 'Shop Now'}</Button>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-1/2 bg-indigo-500/20 blur-[120px] rounded-full" />
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

function NavbarProperties({ settings, onUpdate, categories, products, storePages }) {
    const update = (key, val) => onUpdate({ ...settings, [key]: val });

    return (
        <div className="space-y-6">
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colors & Style</h3>
                <div className="grid grid-cols-2 gap-3">
                    <ColorInput label="Background" value={settings.bgColor} onChange={v => update('bgColor', v)} />
                    <ColorInput label="Text" value={settings.textColor} onChange={v => update('textColor', v)} />
                    <ColorInput label="Hover" value={settings.hoverColor} onChange={v => update('hoverColor', v)} />
                    <ColorInput label="Border" value={settings.borderColor} onChange={v => update('borderColor', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Border (px)</label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(settings.borderWidth)} onChange={e => update('borderWidth', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Radius (px)</label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(settings.borderRadius)} onChange={e => update('borderRadius', e.target.value + 'px')} />
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
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size & Spacing</h3>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Height (px)</label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(settings.height)} onChange={e => update('height', e.target.value + 'px')} />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gap (px)</label>
                        <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(settings.gap)} onChange={e => update('gap', e.target.value + 'px')} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Alignment</label>
                    <select className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={settings.alignment} onChange={e => update('alignment', e.target.value)}>
                        <option value="flex-start">Left</option>
                        <option value="center">Center</option>
                        <option value="flex-end">Right</option>
                        <option value="space-between">Space Between</option>
                    </select>
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo</h3>
                <input
                    type="text"
                    placeholder="Logo URL..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    value={settings.logoUrl}
                    onChange={e => update('logoUrl', e.target.value)}
                />
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Logo Width (px)</label>
                    <input type="number" className="w-20 px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(settings.logoWidth)} onChange={e => update('logoWidth', e.target.value + 'px')} />
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
