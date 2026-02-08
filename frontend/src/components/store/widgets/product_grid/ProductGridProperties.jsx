import React, { useState } from 'react';
import { LayoutGrid, FolderTree, ListChecks, Ban, Layers, Box, Columns, Type, Image as ImageIcon, Palette, MousePointerClick, MoveHorizontal, LayoutTemplate, Paintbrush } from 'lucide-react';
import { ColorInput, getResponsiveValue, ViewModeBtn } from '../Shared';

// Generic MultiSelect Component
const MultiSelect = ({ label, options, values, onChange, placeholder = "Select items..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (id) => {
        const newValues = values.includes(id)
            ? values.filter(v => v !== id)
            : [...values, id];
        onChange(newValues);
    };

    return (
        <div className="relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">{label}</label>
            <div
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs min-h-[34px] flex flex-wrap gap-1 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                {values.length === 0 && <span className="text-slate-400">{placeholder}</span>}
                {values.map(val => {
                    const opt = options.find(o => o.id === val);
                    return opt ? (
                        <span key={val} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px] items-center flex">
                            {opt.label}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleOption(val);
                                }}
                                className="ml-1 hover:text-indigo-900"
                            >
                                ×
                            </button>
                        </span>
                    ) : null;
                })}
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-hidden flex flex-col">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full px-3 py-2 border-b border-slate-100 text-xs focus:outline-none"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                    />
                    <div className="overflow-y-auto flex-1">
                        {filteredOptions.length === 0 ? (
                            <div className="p-3 text-xs text-slate-400 text-center">No matches found</div>
                        ) : (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`px-3 py-2 text-xs cursor-pointer hover:bg-slate-50 flex items-center ${values.includes(opt.id) ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-600'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleOption(opt.id);
                                    }}
                                >
                                    <div className={`w-3 h-3 rounded border mr-2 flex items-center justify-center ${values.includes(opt.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                        {values.includes(opt.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                    </div>
                                    {opt.label}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    );
};

export function ProductGridProperties({ settings, onUpdate, categories, products, viewMode }) {
    const [activeTab, setActiveTab] = useState('content'); // 'content', 'layout', 'style'

    // Ensure products is an array to avoid crashes if undefined
    const availableProducts = products || [];
    const update = (key, val) => {
        onUpdate({ ...settings, [key]: val });
    };

    const updateResponsive = (key, val) => {
        const columns = { ...settings.columns };
        columns[viewMode] = val;
        onUpdate({ ...settings, columns });
    };

    // Helper to resolve responsive value
    const getVal = (key, defaultVal) => getResponsiveValue(settings, viewMode, key, defaultVal);

    // Helper to update style based on viewMode (DESKTOP-FIRST Architecture)
    const updateStyle = (key, val) => {
        if (viewMode === 'desktop') {
            onUpdate({ ...settings, [key]: val }); // Desktop updates Base
        } else {
            const responsive = { ...settings.responsive } || {};
            if (!responsive[viewMode]) responsive[viewMode] = {};
            responsive[viewMode][key] = val;
            onUpdate({ ...settings, responsive });
        }
    };

    // Helper to render flattened categories with indentation
    const getFlattenedOptions = (items, parentId = null, depth = 0) => {
        let options = [];
        items
            .filter(item => {
                const itemParentId = item.parent_id || null;
                const targetParentId = parentId || null;
                return itemParentId == targetParentId;
            })
            .forEach(item => {
                options.push({ ...item, depth });
                options = [...options, ...getFlattenedOptions(items, item.id, depth + 1)];
            });
        return options;
    };



    // Data Seeding for Defaults
    React.useEffect(() => {
        if (!settings.rowGap && !settings.initialized) {
            onUpdate({
                ...settings,
                initialized: true,
                // DESKTOP (Base) Defaults
                rowGap: 35,
                columnGap: 14,
                sectionPadding: 85,
                itemsPerPage: 12,
                // Image
                aspectRatio: 'portrait',
                imageBorderRadius: 0,
                // Card
                cardContentPadding: 14,
                cardBorderRadius: 13
            });
        }
    }, [settings.initialized]);

    // Helper to check for overrides
    const hasOverride = (key) => {
        if (viewMode === 'desktop') return false; // Desktop is base
        return settings.responsive?.[viewMode]?.[key] !== undefined;
    };

    const OverrideBadge = () => (
        <span className="ml-1 px-1 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold rounded uppercase tracking-wider">
            Modified
        </span>
    );

    return (
        <div className="flex flex-col h-full">
            {/* TABS HEADER */}
            <div className="flex items-center p-1 bg-slate-100 rounded-lg mx-4 mt-4 mb-6">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'content' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Box className="w-3 h-3 mr-1.5" />
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('layout')}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'layout' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <LayoutTemplate className="w-3 h-3 mr-1.5" />
                    Layout
                </button>
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${activeTab === 'style' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Paintbrush className="w-3 h-3 mr-1.5" />
                    Style
                </button>
            </div>

            {/* SCROLLABLE CONTENT AREA */}
            <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-6">

                {/* --- TAB: CONTENT --- */}
                {activeTab === 'content' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Data Source Section */}
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Box className="w-3 h-3" /> Data Source
                            </h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Section Title</label>
                                <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={settings.title || ''} onChange={e => update('title', e.target.value)} />
                            </div>

                            {/* Source Selection */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Source Type</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => update('sourceType', 'all')}
                                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-all ${(!settings.sourceType || settings.sourceType === 'all') ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4 mb-1" />
                                        All
                                    </button>
                                    <button
                                        onClick={() => update('sourceType', 'category')}
                                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-all ${settings.sourceType === 'category' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <FolderTree className="w-4 h-4 mb-1" />
                                        Category
                                    </button>
                                    <button
                                        onClick={() => update('sourceType', 'products')}
                                        className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-md text-[10px] font-medium transition-all ${settings.sourceType === 'products' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <ListChecks className="w-4 h-4 mb-1" />
                                        Manual
                                    </button>
                                </div>
                            </div>

                            {/* Conditional Logic based on Source Type */}
                            {settings.sourceType === 'category' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Category</label>
                                    <select
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={settings.categoryId || ''}
                                        onChange={e => update('categoryId', e.target.value)}
                                    >
                                        <option value="">-- Select --</option>
                                        {getFlattenedOptions(categories).map(c => (
                                            <option key={c.id} value={c.id}>
                                                {'\u00A0'.repeat(c.depth * 4)} {c.depth > 0 ? '↳ ' : ''} {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {settings.sourceType === 'products' && (
                                <div className="animate-in fade-in zoom-in-95 duration-200">
                                    <MultiSelect
                                        label="Select Products"
                                        options={availableProducts.map(p => ({ id: p.id, label: p.name }))}
                                        values={settings.manualProductIds || []}
                                        onChange={vals => update('manualProductIds', vals)}
                                        placeholder="Search products..."
                                    />
                                </div>
                            )}

                            {/* Exclusions Logic (Only for All or Category) */}
                            {settings.sourceType !== 'products' && (
                                <div className="pt-4 border-t border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                                            <Ban className="w-3 h-3" />
                                            Exclusions
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={settings.enableExclusions || false}
                                                onChange={e => update('enableExclusions', e.target.checked)}
                                            />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                        </label>
                                    </div>

                                    {settings.enableExclusions && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Exclusion Type</label>
                                                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                                                    <button
                                                        onClick={() => update('exclusionType', 'products')}
                                                        className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded text-[10px] font-bold transition-all ${(!settings.exclusionType || settings.exclusionType === 'products') ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        <Box className="w-3 h-3 mr-1.5" />
                                                        Products
                                                    </button>
                                                    <button
                                                        onClick={() => update('exclusionType', 'categories')}
                                                        className={`flex-1 flex items-center justify-center py-1.5 px-2 rounded text-[10px] font-bold transition-all ${settings.exclusionType === 'categories' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                                    >
                                                        <Layers className="w-3 h-3 mr-1.5" />
                                                        Categories
                                                    </button>
                                                </div>
                                            </div>

                                            {(!settings.exclusionType || settings.exclusionType === 'products') ? (
                                                <MultiSelect
                                                    label="Select Products to Exclude"
                                                    options={availableProducts.map(p => ({ id: p.id, label: p.name }))}
                                                    values={settings.excludedProductIds || []}
                                                    onChange={vals => update('excludedProductIds', vals)}
                                                    placeholder="Search products..."
                                                />
                                            ) : (
                                                <MultiSelect
                                                    label="Select Categories to Exclude"
                                                    options={getFlattenedOptions(categories).map(c => ({
                                                        id: c.id,
                                                        label: `${'\u00A0'.repeat(c.depth * 4)}${c.depth > 0 ? '↳ ' : ''}${c.name}`
                                                    }))}
                                                    values={settings.excludedCategoryIds || []}
                                                    onChange={vals => update('excludedCategoryIds', vals)}
                                                    placeholder="Select categories..."
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Limit</label>
                                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={settings.limit || 8} onChange={e => update('limit', parseInt(e.target.value))} />
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtering & Sorting</h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sort By</label>
                                <select
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    value={settings.sortBy || 'newest'}
                                    onChange={e => update('sortBy', e.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="price_asc">Price: Low to High</option>
                                    <option value="price_desc">Price: High to Low</option>
                                    <option value="name_asc">Name: A-Z</option>
                                </select>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pagination</h3>
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Enable Pagination</label>
                                <input
                                    type="checkbox"
                                    checked={settings.enablePagination || false}
                                    onChange={e => update('enablePagination', e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                            </div>
                            {settings.enablePagination && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Items Per Page</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={settings.itemsPerPage || 12}
                                        onChange={e => update('itemsPerPage', parseInt(e.target.value))}
                                    />
                                </div>
                            )}
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ListChecks className="w-3 h-3" /> Display Options
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { id: 'showImage', label: 'Show Image', default: true },
                                    { id: 'showTitle', label: 'Show Title', default: true },
                                    { id: 'showPrice', label: 'Show Price', default: true },
                                    { id: 'showComparePrice', label: 'Compare Price', default: true },
                                    { id: 'showRating', label: 'Show Rating', default: false },
                                    { id: 'showSortingFilter', label: 'Show Sorting Filter', default: false },
                                    { id: 'showCategoryFilter', label: 'Show Category Filter', default: false },
                                    { id: 'showAddToCart', label: 'Add to Cart Button', default: true },
                                ].map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-600 uppercase">{item.label}</label>
                                        <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            checked={settings[item.id] !== undefined ? settings[item.id] : item.default}
                                            onChange={e => update(item.id, e.target.checked)} />
                                    </div>
                                ))}
                            </div>

                            {/* Add to Cart Behavior */}
                            {settings.showAddToCart !== false && (
                                <div className="mt-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Add to Cart Visibility</label>
                                    <select className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.addToCartBehavior || 'always'} onChange={e => update('addToCartBehavior', e.target.value)}>
                                        <option value="always">Always Visible</option>
                                        <option value="hover">Show on Hover</option>
                                    </select>
                                </div>
                            )}
                        </section>
                    </div>
                )}


                {/* --- TAB: LAYOUT --- */}
                {activeTab === 'layout' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Columns className="w-3 h-3" /> Grid Columns
                            </h3>

                            {/* Horizontal Scroll Toggle */}
                            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                                <label className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                                    <MoveHorizontal className="w-3 h-3" />
                                    Horizontal Scroll
                                </label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.enableHorizontalScroll || false}
                                        onChange={e => update('enableHorizontalScroll', e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            {/* Columns Control */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">
                                    Columns per row
                                    <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase">
                                        {viewMode}
                                    </span>
                                </label>
                                <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => updateResponsive('columns', n)}
                                            className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${settings.columns?.[viewMode] === n ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <MoveHorizontal className="w-3 h-3" /> Spacing & Gap
                            </h3>
                            {/* Gap Controls - Responsive */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                        <span>Row Gap (px) {hasOverride('rowGap') && <OverrideBadge />}</span>
                                        <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                    </label>
                                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={getVal('rowGap', 16)} onChange={e => updateStyle('rowGap', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                        <span>Col Gap (px) {hasOverride('columnGap') && <OverrideBadge />}</span>
                                        <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                    </label>
                                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                        value={getVal('columnGap', 16)} onChange={e => updateStyle('columnGap', parseInt(e.target.value))} />
                                </div>
                            </div>

                            {/* Section Padding */}
                            <div className="mt-3">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                    <span>Section Padding (px) {hasOverride('sectionPadding') && <OverrideBadge />}</span>
                                    <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                </label>
                                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    value={getVal('sectionPadding', 48)} onChange={e => updateStyle('sectionPadding', parseInt(e.target.value))} />
                            </div>

                            {/* Equal Height Toggle */}
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Equal Height Cards</label>
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={settings.equalHeight || false} onChange={e => update('equalHeight', e.target.checked)} />
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Image Layout
                            </h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Aspect Ratio</label>
                                <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    value={settings.aspectRatio || 'auto'} onChange={e => update('aspectRatio', e.target.value)}>
                                    <option value="auto">Auto (Original)</option>
                                    <option value="square">1:1 Square</option>
                                    <option value="portrait">4:5 Portrait</option>
                                    <option value="standard">3:4 Standard</option>
                                    <option value="landscape">16:9 Landscape</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Image Fit</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    {['cover', 'contain'].map(fit => (
                                        <button key={fit} onClick={() => update('imageFit', fit)}
                                            className={`flex-1 py-1 rounded text-[10px] font-bold uppercase transition-all ${settings.imageFit === fit ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                            {fit}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                )}


                {/* --- TAB: STYLE --- */}
                {activeTab === 'style' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section className="space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Palette className="w-3 h-3" /> Card Style
                            </h3>
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <ColorInput label="Background" value={getVal('cardBackgroundColor', 'transparent')} onChange={val => updateStyle('cardBackgroundColor', val)} />

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                        <span>Content Padding (px) {hasOverride('cardContentPadding') && <OverrideBadge />}</span>
                                        <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                    </label>
                                    <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                        value={getVal('cardContentPadding', 16)} onChange={e => updateStyle('cardContentPadding', parseInt(e.target.value))} />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                        <span>Card Wrapper Padding (px) {hasOverride('cardWrapperPadding') && <OverrideBadge />}</span>
                                        <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                    </label>
                                    <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                        value={getVal('cardWrapperPadding', 0)} onChange={e => updateStyle('cardWrapperPadding', parseInt(e.target.value))} />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            <span>Radius (px) {hasOverride('cardBorderRadius') && <OverrideBadge />}</span>
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('cardBorderRadius', 0)} onChange={e => updateStyle('cardBorderRadius', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Border (px)
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('cardBorderWidth', 0)} onChange={e => updateStyle('cardBorderWidth', parseInt(e.target.value))} />
                                    </div>
                                </div>
                                <ColorInput label="Border Color" value={getVal('cardBorderColor', '#e2e8f0')} onChange={val => updateStyle('cardBorderColor', val)} />
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shadow</label>
                                    <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                        value={settings.cardShadow || 'none'} onChange={e => update('cardShadow', e.target.value)}>
                                        <option value="none">None</option>
                                        <option value="sm">Small</option>
                                        <option value="md">Medium</option>
                                        <option value="lg">Large</option>
                                        <option value="xl">Extra Large</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" /> Image Style
                            </h3>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                    Image Radius (px)
                                    <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                </label>
                                <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                                    value={getVal('imageBorderRadius', 0)} onChange={e => updateStyle('imageBorderRadius', parseInt(e.target.value))} />
                            </div>
                        </section>

                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Type className="w-3 h-3" /> Typography
                            </h3>
                            {/* Main Title Typography */}
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-1 mb-2">Product Title</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Size (px)
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('titleFontSize', 14)} onChange={e => updateStyle('titleFontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.titleFontWeight || 'font-medium'} onChange={e => update('titleFontWeight', e.target.value)}>
                                            <option value="font-normal">Normal</option>
                                            <option value="font-medium">Medium</option>
                                            <option value="font-semibold">Semibold</option>
                                            <option value="font-bold">Bold</option>
                                        </select>
                                    </div>
                                </div>
                                <ColorInput label="Color" value={getVal('titleColor', '#1e293b')} onChange={val => updateStyle('titleColor', val)} />
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Font Family</label>
                                    <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                        value={settings.titleFontFamily || 'font-sans'} onChange={e => update('titleFontFamily', e.target.value)}>
                                        <option value="font-sans">Sans Serif</option>
                                        <option value="font-serif">Serif</option>
                                        <option value="font-mono">Monospace</option>
                                        <optgroup label="Google Fonts">
                                            <option value="Inter">Inter</option>
                                            <option value="Lato">Lato</option>
                                            <option value="Montserrat">Montserrat</option>
                                            <option value="Outfit">Outfit</option>
                                            <option value="Playfair Display">Playfair Display</option>
                                            <option value="Poppins">Poppins</option>
                                            <option value="Roboto">Roboto</option>
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            {/* Price Typography */}
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-1 mb-2">Main Price</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Size (px)
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('priceFontSize', 14)} onChange={e => updateStyle('priceFontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.priceFontWeight || 'font-bold'} onChange={e => update('priceFontWeight', e.target.value)}>
                                            <option value="font-normal">Normal</option>
                                            <option value="font-medium">Medium</option>
                                            <option value="font-semibold">Semibold</option>
                                            <option value="font-bold">Bold</option>
                                        </select>
                                    </div>
                                </div>
                                <ColorInput label="Color" value={getVal('priceColor', '#0f172a')} onChange={val => updateStyle('priceColor', val)} />
                            </div>

                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-200 pb-1 mb-2">Compare Price</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Size (px)
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('comparePriceFontSize', 12)} onChange={e => updateStyle('comparePriceFontSize', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.comparePriceFontWeight || 'font-normal'} onChange={e => update('comparePriceFontWeight', e.target.value)}>
                                            <option value="font-normal">Normal</option>
                                            <option value="font-medium">Medium</option>
                                            <option value="font-semibold">Semibold</option>
                                            <option value="font-bold">Bold</option>
                                        </select>
                                    </div>
                                </div>
                                <ColorInput label="Color" value={getVal('comparePriceColor', '#94a3b8')} onChange={val => updateStyle('comparePriceColor', val)} />
                            </div>
                        </section>

                        {/* Button Style */}
                        {(settings.showAddToCart !== false) && (
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <MousePointerClick className="w-3 h-3" /> Button Style
                                </h3>
                                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <ColorInput label="Background" value={getVal('buttonBgColor', '#4f46e5')} onChange={val => updateStyle('buttonBgColor', val)} />
                                    <ColorInput label="Text Color" value={getVal('buttonTextColor', '#ffffff')} onChange={val => updateStyle('buttonTextColor', val)} />

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                                Radius (px)
                                                <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                            </label>
                                            <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                                value={getVal('buttonBorderRadius', 4)} onChange={e => updateStyle('buttonBorderRadius', parseInt(e.target.value))} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                                Width
                                                <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                            </label>
                                            <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                                value={getVal('buttonWidth', 'full')} onChange={e => updateStyle('buttonWidth', e.target.value)}>
                                                <option value="full">Full Width</option>
                                                <option value="auto">Auto</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Font Family</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.buttonFontFamily || 'font-sans'} onChange={e => update('buttonFontFamily', e.target.value)}>
                                            <option value="font-sans">Sans Serif</option>
                                            <option value="font-serif">Serif</option>
                                            <option value="font-mono">Monospace</option>
                                            <optgroup label="Google Fonts">
                                                <option value="Inter">Inter</option>
                                                <option value="Lato">Lato</option>
                                                <option value="Montserrat">Montserrat</option>
                                                <option value="Outfit">Outfit</option>
                                                <option value="Playfair Display">Playfair Display</option>
                                                <option value="Poppins">Poppins</option>
                                                <option value="Roboto">Roboto</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Button Padding (px)
                                            <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="text" placeholder="e.g. 8px 16px" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('buttonPadding', '8px 16px') || ''} onChange={e => updateStyle('buttonPadding', e.target.value)} />
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
