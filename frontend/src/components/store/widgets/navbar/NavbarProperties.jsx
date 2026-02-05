import React from 'react';
import { supabase } from '../../../../lib/supabase';
import { ColorInput } from '../Shared';
import {
    Trash2, Upload, ChevronRight, Monitor, Tablet, Smartphone, GripVertical, Plus
} from 'lucide-react';
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

function SortableItem({ id, item, idx, update, menuItems, categories, products, storePages }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3 group hover:border-indigo-300 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100 text-slate-300 hover:text-indigo-500 transition-colors">
                        <GripVertical className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item {idx + 1}</span>
                </div>
                <button
                    onClick={() => {
                        const newItems = menuItems.filter((_, i) => i !== idx);
                        update('menuItems', newItems);
                    }}
                    className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>

            <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                    <input
                        type="text"
                        placeholder="Label"
                        className="col-span-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        value={item.label}
                        onChange={e => {
                            const newItems = [...menuItems];
                            newItems[idx] = { ...newItems[idx], label: e.target.value };
                            update('menuItems', newItems);
                        }}
                    />
                    <select
                        className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={item.type}
                        onChange={e => {
                            const newItems = [...menuItems];
                            newItems[idx] = {
                                ...newItems[idx],
                                type: e.target.value,
                                value: '' // Reset value
                            };
                            update('menuItems', newItems);
                        }}
                    >
                        <option value="page">Page</option>
                        <option value="category">Category</option>
                        <option value="product">Product</option>
                        <option value="custom">Custom URL</option>
                    </select>
                </div>

                {/* Contextual Value Selector */}
                {item.type === 'category' ? (
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={item.value}
                        onChange={e => {
                            const newItems = [...menuItems];
                            newItems[idx] = { ...newItems[idx], value: e.target.value };
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
                    <div className="space-y-2">
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={products.some(p => p.id === item.value) ? item.value : 'manual'}
                            onChange={e => {
                                if (e.target.value === 'manual') return;
                                const newItems = [...menuItems];
                                newItems[idx] = { ...newItems[idx], value: e.target.value };
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
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                                placeholder="Paste Product ID here..."
                                value={item.value}
                                onChange={e => {
                                    const newItems = [...menuItems];
                                    newItems[idx] = { ...newItems[idx], value: e.target.value };
                                    update('menuItems', newItems);
                                }}
                            />
                        )}
                    </div>
                ) : item.type === 'page' ? (
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={item.value}
                        onChange={e => {
                            const newItems = [...menuItems];
                            newItems[idx] = { ...newItems[idx], value: e.target.value };
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                        placeholder="e.g. https://google.com"
                        value={item.value}
                        onChange={e => {
                            const newItems = [...menuItems];
                            newItems[idx] = { ...newItems[idx], value: e.target.value };
                            update('menuItems', newItems);
                        }}
                    />
                )}
            </div>
        </div>

    );
}

export function NavbarProperties({ settings, onUpdate, categories, products, storePages, viewMode, storeId }) {
    const [activeTab, setActiveTab] = React.useState('content'); // content, style, settings, drawer

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

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

    const forceGlobalUpdate = (key, val) => {
        onUpdate({ ...settings, [key]: val });
    };

    const menuItems = getV('menuItems', []) || [];

    return (
        <div className="space-y-6">
            {/* View Mode Indicator */}
            {viewMode !== 'desktop' && (
                <div className="bg-indigo-50 p-2 rounded text-xs font-bold text-indigo-700 flex items-center gap-2 border border-indigo-100">
                    {viewMode === 'mobile' ? <Smartphone className="h-3 w-3" /> : <Tablet className="h-3 w-3" />}
                    <span>Editing for {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
                </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
                <button
                    key="content"
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${activeTab === 'content' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Content
                </button>
                <button
                    key="style"
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${activeTab === 'style' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Style
                </button>
                <button
                    key="settings"
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${activeTab === 'settings' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Settings
                </button>
                <button
                    key="drawer"
                    onClick={() => setActiveTab('drawer')}
                    className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${activeTab === 'drawer' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Drawer
                </button>
            </div>

            {/* TAB 1: CONTENT */}
            {activeTab === 'content' && (
                <div className="space-y-6">
                    {/* Logo Section */}
                    <section className="space-y-4">
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
                                            const filePath = storeId ? `${storeId}/${fileName}` : `${fileName}`;

                                            const { error } = await supabase.storage
                                                .from('store-assets')
                                                .upload(filePath, file);

                                            if (error) return alert('Upload failed: ' + error.message);

                                            const { data: { publicUrl } } = supabase.storage
                                                .from('store-assets')
                                                .getPublicUrl(filePath);

                                            update('logoUrl', publicUrl);
                                        }}
                                    />
                                </label>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Width (px) <ResponsiveIndicator k="logoWidth" /></label>
                                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('logoWidth', '120px'))} onChange={e => update('logoWidth', e.target.value + 'px')} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Gap (px) <ResponsiveIndicator k="logoGap" /></label>
                                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={parseInt(getV('logoGap', '12px'))} onChange={e => update('logoGap', e.target.value + 'px')} />
                                </div>
                            </div>
                            <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 cursor-pointer">
                                <span className="font-bold uppercase tracking-widest text-[9px] flex items-center">
                                    Show Store Name <ResponsiveIndicator k="showStoreName" />
                                </span>
                                <input
                                    type="checkbox"
                                    checked={getV('showStoreName')}
                                    onChange={e => update('showStoreName', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </label>
                        </div>
                    </section>

                    {/* Menu Items */}
                    <section className="space-y-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center">Menu Items <ResponsiveIndicator k="menuItems" /></h3>
                            <button
                                onClick={() => {
                                    const newItems = [...menuItems, { id: Math.random().toString(36), label: 'New Link', type: 'page', value: 'home' }];
                                    update('menuItems', newItems);
                                }}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => {
                                const { active, over } = event;
                                if (active.id !== over.id) {
                                    const oldIndex = menuItems.findIndex((item) => item.id === active.id);
                                    const newIndex = menuItems.findIndex((item) => item.id === over.id);
                                    update('menuItems', arrayMove(menuItems, oldIndex, newIndex));
                                }
                            }}
                        >
                            <SortableContext items={menuItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {menuItems.map((item, idx) => (
                                        <SortableItem
                                            key={item.id}
                                            id={item.id}
                                            item={item}
                                            idx={idx}
                                            update={update}
                                            menuItems={menuItems}
                                            categories={categories}
                                            products={products}
                                            storePages={storePages}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </section>
                </div>
            )}

            {/* TAB 2: STYLE */}
            {activeTab === 'style' && (
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Colors</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <ColorInput label="Background" value={getV('bgColor')} onChange={v => update('bgColor', v)} />
                            <ColorInput label="Text" value={getV('textColor')} onChange={v => update('textColor', v)} />
                            <ColorInput label="Hover" value={getV('hoverColor')} onChange={v => update('hoverColor', v)} />
                            <ColorInput label="Border" value={getV('borderColor')} onChange={v => update('borderColor', v)} />
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
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Appearance</h3>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Shadow <ResponsiveIndicator k="shadow" /></label>
                            <select className="w-full px-2 py-1 bg-slate-50 border rounded text-xs" value={getV('shadow', 'none')} onChange={e => update('shadow', e.target.value)}>
                                <option value="none">None</option>
                                <option value="soft">Soft</option>
                                <option value="strong">Strong</option>
                            </select>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 3: SETTINGS */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</h3>
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
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Sticky Mode <ResponsiveIndicator k="stickyMode" /></label>
                            <div className="grid grid-cols-1 gap-2">
                                <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="radio" name="sticky" checked={getV('stickyMode', 'none') === 'none'} onChange={() => update('stickyMode', 'none')} />
                                    <span>Static (No Sticky)</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="radio" name="sticky" checked={getV('stickyMode') === 'always'} onChange={() => update('stickyMode', 'always')} />
                                    <span>Always Sticky</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="radio" name="sticky" checked={getV('stickyMode') === 'scroll'} onChange={() => update('stickyMode', 'scroll')} />
                                    <span>Sticky on Scroll</span>
                                </label>
                                <label className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                    <input type="radio" name="sticky" checked={getV('stickyMode') === 'hide'} onChange={() => update('stickyMode', 'hide')} />
                                    <span>Hide on Scroll</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4 pt-4 border-t border-slate-100">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Menu</h3>


                        {/* Drawer Direction */}
                        <div className="mb-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Drawer Slide Direction</label>
                            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                                <button
                                    onClick={() => forceGlobalUpdate('mobileMenuDirection', 'left')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all ${getV('mobileMenuDirection', 'right') === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Left
                                </button>
                                <button
                                    onClick={() => forceGlobalUpdate('mobileMenuDirection', 'right')}
                                    className={`flex-1 py-1 text-[10px] font-bold uppercase rounded transition-all ${getV('mobileMenuDirection', 'right') === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Right
                                </button>
                            </div>
                        </div>


                        <div className="flex flex-col space-y-2">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Show Hamburger On...</label>
                            <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span className="flex items-center"><Monitor className="h-3 w-3 mr-2 text-slate-400" /> PC</span>
                                <input type="checkbox" checked={settings.hamburgerPC} onChange={e => forceGlobalUpdate('hamburgerPC', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </label>
                            <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span className="flex items-center"><Tablet className="h-3 w-3 mr-2 text-slate-400" /> Tablet</span>
                                <input type="checkbox" checked={settings.hamburgerTablet} onChange={e => forceGlobalUpdate('hamburgerTablet', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </label>
                            <label className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                                <span className="flex items-center"><Smartphone className="h-3 w-3 mr-2 text-slate-400" /> Mobile</span>
                                <input type="checkbox" checked={settings.hamburgerMobile} onChange={e => forceGlobalUpdate('hamburgerMobile', e.target.checked)} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                            </label>
                        </div>
                    </section>
                </div>
            )}

            {/* TAB 4: MENU DRAWER */}
            {activeTab === 'drawer' && (
                <div className="p-4 space-y-6 animate-in fade-in duration-300">
                    {/* Drawer Settings */}
                    <div className="space-y-4">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Typography</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Font Size (px) <ResponsiveIndicator k="drawerFontSize" /></label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="range"
                                        min="12"
                                        max="32"
                                        className="flex-1"
                                        value={parseInt(getV('drawerFontSize', '16px'))}
                                        onChange={e => update('drawerFontSize', e.target.value + 'px')}
                                    />
                                    <span className="text-xs text-slate-500 w-8 text-right">{getV('drawerFontSize', '16px')}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Font Color</label>
                                <ColorInput label="Font Color" value={getV('drawerFontColor', '#000000')} onChange={v => update('drawerFontColor', v)} />
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Appearance</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Background Color</label>
                                <ColorInput label="BG Color" value={getV('drawerBgColor', '#ffffff')} onChange={v => update('drawerBgColor', v)} />
                            </div>

                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Glass UI (Blur) <ResponsiveIndicator k="drawerGlass" /></label>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={getV('drawerGlass', false)}
                                    onChange={e => update('drawerGlass', e.target.checked)}
                                />
                            </div>

                            {getV('drawerGlass', false) && (
                                <div className="animate-in fade-in duration-300">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">Blur Amount (px) <ResponsiveIndicator k="drawerBlur" /></label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="20"
                                            className="flex-1"
                                            value={parseInt(getV('drawerBlur', '10px'))}
                                            onChange={e => update('drawerBlur', e.target.value + 'px')}
                                        />
                                        <span className="text-xs text-slate-500 w-8 text-right">{getV('drawerBlur', '10px')}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-1 italic">* Requires transparent opacity in BG Color</p>
                                </div>
                            )}
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Elements</h3>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Show Store Logo <ResponsiveIndicator k="drawerShowLogo" /></label>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={getV('drawerShowLogo', true)}
                                    onChange={e => update('drawerShowLogo', e.target.checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Show Store Name <ResponsiveIndicator k="drawerShowName" /></label>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={getV('drawerShowName', true)}
                                    onChange={e => update('drawerShowName', e.target.checked)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center">Show Search Icon <ResponsiveIndicator k="drawerShowSearch" /></label>
                                <input
                                    type="checkbox"
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={getV('drawerShowSearch', false)}
                                    onChange={e => update('drawerShowSearch', e.target.checked)}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}
