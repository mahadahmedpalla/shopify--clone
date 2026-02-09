
import React from 'react';
import {
    Layout, Type, Image as ImageIcon, CheckSquare, AlignLeft, AlignCenter, AlignRight,
    Monitor, Tablet, Smartphone, Grid, Columns
} from 'lucide-react';
import { ViewModeBtn, ColorInput, getResponsiveValue } from '../Shared';

export function CategoryListProperties({ settings, onUpdate, categories, viewMode }) {

    // Helper to update style based on viewMode (Desktop is Base)
    const updateStyle = (key, val) => {
        if (viewMode === 'desktop') {
            onUpdate({ ...settings, [key]: val });
        } else {
            const responsive = { ...settings.responsive } || {};
            if (!responsive[viewMode]) responsive[viewMode] = {};
            responsive[viewMode][key] = val;
            onUpdate({ ...settings, responsive });
        }
    };

    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

    const updateResponsive = (key, val) => {
        const columns = { ...settings.columns } || {};
        columns[viewMode] = val;
        onUpdate({ ...settings, columns });
    };

    const handleCategorySelect = (catId) => {
        const current = settings.selectedCategories || [];
        if (current.includes(catId)) {
            onUpdate({ ...settings, selectedCategories: current.filter(id => id !== catId) });
        } else {
            onUpdate({ ...settings, selectedCategories: [...current, catId] });
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            onUpdate({ ...settings, selectedCategories: categories.map(c => c.id) });
        } else {
            onUpdate({ ...settings, selectedCategories: [] });
        }
    };

    const [activeTab, setActiveTab] = React.useState('content'); // content, layout, style

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
                {['content', 'layout', 'style'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- CONTENT TAB --- */}
            {activeTab === 'content' && (
                <div className="space-y-6">
                    {/* Source Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Category Source</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-4"
                            value={settings.categorySource || 'all'}
                            onChange={(e) => onUpdate({ ...settings, categorySource: e.target.value })}
                        >
                            <option value="all">All Categories</option>
                            <option value="selected">Manual Selection</option>
                        </select>
                    </div>

                    {/* Category List (Hierarchical) */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                                {settings.categorySource === 'all' ? 'All Categories Included' : 'Select Categories'}
                            </label>
                            {settings.categorySource === 'selected' && (
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        checked={categories.length > 0 && settings.selectedCategories?.length === categories.length}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Select All</span>
                                </label>
                            )}
                        </div>

                        <div className={`border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-white ${settings.categorySource === 'all' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                            {(() => {
                                // Build Tree
                                const buildTree = (cats) => {
                                    const map = {};
                                    cats.forEach(c => map[c.id] = { ...c, children: [] });
                                    const roots = [];
                                    cats.forEach(c => {
                                        if (c.parent_id && map[c.parent_id]) {
                                            map[c.parent_id].children.push(map[c.id]);
                                        } else {
                                            roots.push(map[c.id]);
                                        }
                                    });
                                    return roots;
                                };
                                const tree = buildTree(categories);

                                const renderItem = (cat, depth = 0) => (
                                    <React.Fragment key={cat.id}>
                                        <div className="flex items-center hover:bg-slate-50 border-b border-slate-50 last:border-0 py-2 pr-2 transition-colors"
                                            style={{ paddingLeft: `${(depth * 24) + 12}px` }}> {/* Indentation */}

                                            {/* Thread line for children */}
                                            {depth > 0 && (
                                                <div className="absolute left-0 w-px bg-slate-200 h-full" style={{ left: `${(depth * 24) + 4}px` }} />
                                            )}

                                            <input
                                                type="checkbox"
                                                checked={(settings.selectedCategories || []).includes(cat.id)}
                                                onChange={() => handleCategorySelect(cat.id)}
                                                disabled={settings.categorySource === 'all'}
                                                className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4 mr-3 shrink-0"
                                            />
                                            <span className={`text-sm truncate ${depth === 0 ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>
                                                {cat.name}
                                            </span>
                                        </div>
                                        {cat.children && cat.children.length > 0 && (
                                            <div className="relative">
                                                {cat.children.map(child => renderItem(child, depth + 1))}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );

                                if (categories.length === 0) {
                                    return <p className="p-4 text-center text-xs text-slate-400 italic">No categories found in store.</p>;
                                }

                                return tree.map(root => renderItem(root));
                            })()}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2">
                            {settings.categorySource === 'all'
                                ? "Switch to 'Manual Selection' above to include/exclude specific categories."
                                : "Drag and drop is not supported. Selection order determines manual sort order."}
                        </p>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Sort Order</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={settings.sortBy || 'manual'}
                            onChange={(e) => onUpdate({ ...settings, sortBy: e.target.value })}
                        >
                            <option value="manual">Manual (Selection Order)</option>
                            <option value="name_asc">Name A-Z</option>
                            <option value="newest">Newest First</option>
                            <option value="random">Random</option>
                        </select>
                    </div>

                    {/* Section Title */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Section Title (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g. Shop by Category"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={settings.sectionTitle || ''}
                            onChange={(e) => onUpdate({ ...settings, sectionTitle: e.target.value })}
                        />
                    </div>
                </div>
            )}

            {/* --- LAYOUT TAB --- */}
            {activeTab === 'layout' && (
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Layout Type</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => onUpdate({ ...settings, layout: 'horizontal' })}
                                className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${settings.layout === 'horizontal' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Columns className="h-4 w-4 mr-2" />
                                <span className="text-xs font-bold">Horizontal</span>
                            </button>
                            <button
                                onClick={() => onUpdate({ ...settings, layout: 'grid' })}
                                className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${settings.layout === 'grid' ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Grid className="h-4 w-4 mr-2" />
                                <span className="text-xs font-bold">Grid</span>
                            </button>
                        </div>
                    </div>

                    {settings.layout === 'grid' && (
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Columns</label>
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                <span>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}</span>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => updateResponsive('columns', Math.max(1, (settings.columns?.[viewMode] || 4) - 1))}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:border-indigo-500"
                                    >-</button>
                                    <span className="w-4 text-center">{settings.columns?.[viewMode] || 4}</span>
                                    <button
                                        onClick={() => updateResponsive('columns', Math.min(8, (settings.columns?.[viewMode] || 4) + 1))}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-slate-200 rounded hover:border-indigo-500"
                                    >+</button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Spacing</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-400 mb-1 block">Row Gap</span>
                                <input type="range" min="0" max="100" className="w-full accent-indigo-600"
                                    value={getVal('rowGap', 16)} onChange={e => updateStyle('rowGap', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 mb-1 block">Col Gap</span>
                                <input type="range" min="0" max="100" className="w-full accent-indigo-600"
                                    value={getVal('columnGap', 16)} onChange={e => updateStyle('columnGap', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Section Padding</label>
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <span className="text-[10px] text-slate-400 mb-1 block">Vertical (Y)</span>
                                <input type="range" min="0" max="200" className="w-full accent-indigo-600"
                                    value={getVal('sectionPaddingTop', 20)} // Simplification: using Top for both Y for now or just generic Y
                                    onChange={e => {
                                        updateStyle('sectionPaddingTop', parseInt(e.target.value));
                                        updateStyle('sectionPaddingBottom', parseInt(e.target.value));
                                    }} />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-400 mb-1 block">Horizontal (X)</span>
                                <input type="range" min="0" max="200" className="w-full accent-indigo-600"
                                    value={getVal('sectionPaddingX', 20)} onChange={e => updateStyle('sectionPaddingX', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Content Alignment</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {['left', 'center', 'right'].map(align => (
                                <button
                                    key={align}
                                    onClick={() => onUpdate({ ...settings, contentAlignment: align })}
                                    className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${(settings.contentAlignment || 'center') === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {align === 'left' && <AlignLeft className="h-4 w-4" />}
                                    {align === 'center' && <AlignCenter className="h-4 w-4" />}
                                    {align === 'right' && <AlignRight className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- STYLE TAB --- */}
            {activeTab === 'style' && (
                <div className="space-y-6">
                    {/* Toggles */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-700">Show Image</span>
                            <input type="checkbox" className="toggle toggle-indigo"
                                checked={settings.showImage !== false}
                                onChange={e => onUpdate({ ...settings, showImage: e.target.checked })} />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                            <span className="text-xs font-bold text-slate-700">Show Title</span>
                            <input type="checkbox" className="toggle toggle-indigo"
                                checked={settings.showTitle !== false}
                                onChange={e => onUpdate({ ...settings, showTitle: e.target.checked })} />
                        </label>
                    </div>

                    {/* Image Settings */}
                    {settings.showImage !== false && (
                        <div className="border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Image Style</label>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <span className="text-[10px] text-slate-500 mb-1 block">Ratio</span>
                                    <select
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.imageRatio || 'circle'}
                                        onChange={(e) => onUpdate({ ...settings, imageRatio: e.target.value })}
                                    >
                                        <option value="auto">Auto</option>
                                        <option value="circle">Circle</option>
                                        <option value="1:1">Square (1:1)</option>
                                        <option value="3:4">Portrait (3:4)</option>
                                        <option value="4:5">Portrait (4:5)</option>
                                        <option value="16:9">Wide (16:9)</option>
                                    </select>
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 mb-1 block">Fit</span>
                                    <select
                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.imageFit || 'cover'}
                                        onChange={(e) => onUpdate({ ...settings, imageFit: e.target.value })}
                                    >
                                        <option value="cover">Cover</option>
                                        <option value="contain">Contain</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Hover Effect</span>
                                <select
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={settings.hoverEffect || 'none'}
                                    onChange={(e) => onUpdate({ ...settings, hoverEffect: e.target.value })}
                                >
                                    <option value="none">None</option>
                                    <option value="zoom">Zoom Image</option>
                                    <option value="overlay">Overlay Title</option>
                                </select>
                            </div>

                            {settings.imageRatio !== 'circle' && (
                                <div className="mt-4">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-[10px] text-slate-500">Border Radius</span>
                                        <span className="text-[10px] text-slate-400">{getVal('imageBorderRadius', 8)}px</span>
                                    </div>
                                    <input type="range" min="0" max="40" className="w-full accent-indigo-600"
                                        value={getVal('imageBorderRadius', 8)} onChange={e => updateStyle('imageBorderRadius', parseInt(e.target.value))} />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Card Style */}
                    <div className="border-t border-slate-100 pt-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Card Style</label>
                        <ColorInput label="Background" value={getVal('cardBackgroundColor', 'transparent')} onChange={v => updateStyle('cardBackgroundColor', v)} />

                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-slate-500">Card Radius</span>
                                <span className="text-[10px] text-slate-400">{getVal('cardBorderRadius', 0)}px</span>
                            </div>
                            <input type="range" min="0" max="40" className="w-full accent-indigo-600"
                                value={getVal('cardBorderRadius', 0)} onChange={e => updateStyle('cardBorderRadius', parseInt(e.target.value))} />
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-slate-500">Card Padding</span>
                                <span className="text-[10px] text-slate-400">{getVal('cardPadding', 0)}px</span>
                            </div>
                            <input type="range" min="0" max="40" className="w-full accent-indigo-600"
                                value={getVal('cardPadding', 0)} onChange={e => updateStyle('cardPadding', parseInt(e.target.value))} />
                        </div>
                    </div>

                    {/* Typography */}
                    {settings.showTitle !== false && (
                        <div className="border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Title Style</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] text-slate-500 mb-1 block">Size</span>
                                    <input type="number" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('titleFontSize', 14)} onChange={e => updateStyle('titleFontSize', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <span className="text-[10px] text-slate-500 mb-1 block">Weight</span>
                                    <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.titleFontWeight || 'font-medium'} onChange={e => onUpdate({ ...settings, titleFontWeight: e.target.value })}>
                                        <option value="font-normal">Normal</option>
                                        <option value="font-medium">Medium</option>
                                        <option value="font-bold">Bold</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <ColorInput label="Color" value={getVal('titleColor', '#1e293b')} onChange={v => updateStyle('titleColor', v)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Section Background */}
                    <div className="border-t border-slate-100 pt-4">
                        <ColorInput label="Section Background" value={getVal('sectionBackgroundColor', 'transparent')} onChange={v => updateStyle('sectionBackgroundColor', v)} />
                    </div>
                </div>
            )}
        </div>
    );
}
