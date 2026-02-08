import React, { useState } from 'react';
import {
    Layout, Box, Grid, List, Type, Image as ImageIcon,
    AlignLeft, AlignCenter, AlignRight,
    Check, MousePointerClick, Palette, MoveHorizontal
} from 'lucide-react';
import { ColorInput, getResponsiveValue, ViewModeBtn, MultiSelect, getFlattenedOptions } from '../Shared';

export function CategoryListProperties({ settings, onUpdate, categories, viewMode }) {
    const [activeTab, setActiveTab] = useState('content'); // 'content', 'layout', 'style'

    const update = (key, val) => {
        onUpdate({ ...settings, [key]: val });
    };

    const updateResponsive = (key, val) => {
        const columns = { ...settings.columns } || {};
        columns[viewMode] = val;
        onUpdate({ ...settings, columns });
    };

    // Helper to resolve responsive value
    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') {
            return settings[key] !== undefined ? settings[key] : defaultVal;
        }
        return getResponsiveValue(settings, viewMode, key, defaultVal);
    };

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

    const categoryOptions = getFlattenedOptions(categories || []);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('layout')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'layout' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Layout
                </button>
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'style' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Style
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* --- CONTENT TAB --- */}
                {activeTab === 'content' && (
                    <div className="space-y-6">
                        {/* Title */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Widget Title</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                value={settings.title || ''}
                                onChange={(e) => update('title', e.target.value)}
                                placeholder="e.g. Shop by Category"
                            />
                        </div>

                        {/* Category Source */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Category Source</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {[
                                    { id: 'all', label: 'All Top Level' },
                                    { id: 'selected', label: 'Selected' }
                                ].map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => update('categorySource', opt.id)}
                                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${settings.categorySource === opt.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Category Selection (if Selected) */}
                        {settings.categorySource === 'selected' && (
                            <MultiSelect
                                label="Select Categories"
                                options={categoryOptions}
                                selected={settings.selectedCategories || []}
                                onChange={(vals) => update('selectedCategories', vals)}
                            />
                        )}

                        {/* Sorting */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sort By</label>
                            <select
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.sortBy || 'manual'}
                                onChange={(e) => update('sortBy', e.target.value)}
                            >
                                <option value="manual">Manual Order (As Selected)</option>
                                <option value="name_asc">Name: A-Z</option>
                                <option value="name_desc">Name: Z-A</option>
                                <option value="newest">Newest First</option>
                                <option value="random">Random</option>
                            </select>
                            {settings.sortBy === 'manual' && settings.categorySource === 'selected' && (
                                <p className="text-[10px] text-slate-400 mt-1 italic">
                                    Tips: Selection order determines display order.
                                </p>
                            )}
                        </div>
                    </div>
                )}


                {/* --- LAYOUT TAB --- */}
                {activeTab === 'layout' && (
                    <div className="space-y-6">
                        {/* Layout Type */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Display Layout</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'horizontal', label: 'Horizontal Scroll', icon: <MoveHorizontal className="w-4 h-4 mb-1" /> },
                                    { id: 'grid', label: 'Grid', icon: <Grid className="w-4 h-4 mb-1" /> }
                                ].map(layout => (
                                    <button
                                        key={layout.id}
                                        onClick={() => update('layoutType', layout.id)}
                                        className={`p-3 border rounded-xl flex flex-col items-center justify-center text-xs transition-all ${settings.layoutType === layout.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        {layout.icon}
                                        {layout.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid Columns (Only if Grid OR needed for width calc in horizontal) */}
                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Columns / Items per Row</label>
                                <div className="flex space-x-1">
                                    <ViewModeBtn active={viewMode === 'desktop'} onClick={() => { }} icon={<Box className="w-3 h-3" />} />
                                    <span className="text-[10px] font-mono text-slate-400 uppercase self-center">{viewMode}</span>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <input
                                    type="range" min="1" max="8" step="1"
                                    className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    value={settings.columns?.[viewMode] || (viewMode === 'mobile' ? 2 : 4)}
                                    onChange={(e) => updateResponsive('columns', parseInt(e.target.value))}
                                />
                                <span className="text-xs font-mono font-bold text-indigo-600 w-6 text-right">
                                    {settings.columns?.[viewMode] || (viewMode === 'mobile' ? 2 : 4)}
                                </span>
                            </div>
                        </div>

                        {/* Spacing */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="w-3 h-3" /> Spacing & Gap
                            </h3>

                            {/* Row Gap */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                    Row Gap (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                </label>
                                <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                    value={getVal('rowGap', 16)} onChange={e => updateStyle('rowGap', parseInt(e.target.value))} />
                            </div>

                            {/* Column Gap */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                    Column Gap (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                </label>
                                <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                    value={getVal('columnGap', 16)} onChange={e => updateStyle('columnGap', parseInt(e.target.value))} />
                            </div>

                            {/* Section Padding */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                    Section Padding (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                </label>
                                <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                    value={getVal('sectionPadding', 20)} onChange={e => updateStyle('sectionPadding', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>
                )}


                {/* --- STYLE TAB --- */}
                {activeTab === 'style' && (
                    <div className="space-y-6">

                        {/* Visibility Toggles */}
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${settings.showImage !== false ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    {settings.showImage !== false && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={settings.showImage !== false} onChange={e => update('showImage', e.target.checked)} />
                                <span className="text-xs font-bold text-slate-600">Show Image</span>
                            </label>

                            <label className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 transition-colors ${settings.showTitle !== false ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                    {settings.showTitle !== false && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input type="checkbox" className="hidden" checked={settings.showTitle !== false} onChange={e => update('showTitle', e.target.checked)} />
                                <span className="text-xs font-bold text-slate-600">Show Title</span>
                            </label>
                        </div>

                        {/* Content Alignment */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Content Alignment</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['left', 'center', 'right'].map(align => (
                                    <button
                                        key={align}
                                        onClick={() => update('textAlign', align)}
                                        className={`flex-1 py-1.5 flex justify-center rounded-md transition-all ${settings.textAlign === align ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        {align === 'left' && <AlignLeft className="w-4 h-4" />}
                                        {align === 'center' && <AlignCenter className="w-4 h-4" />}
                                        {align === 'right' && <AlignRight className="w-4 h-4" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Image Settings */}
                        {settings.showImage !== false && (
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3" /> Image Settings
                                </h3>

                                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    {/* Aspect Ratio */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Aspect Ratio</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.aspectRatio || 'auto'} onChange={e => update('aspectRatio', e.target.value)}>
                                            <option value="auto">Auto</option>
                                            <option value="circle">Circle</option>
                                            <option value="1:1">Square (1:1)</option>
                                            <option value="3:4">Portrait (3:4)</option>
                                            <option value="4:5">Portrait (4:5)</option>
                                            <option value="16:9">Landscape (16:9)</option>
                                        </select>
                                    </div>

                                    {/* Image Fit */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Image Fit</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.imageFit || 'cover'} onChange={e => update('imageFit', e.target.value)}>
                                            <option value="cover">Cover (Crop to fill)</option>
                                            <option value="contain">Contain (Show all)</option>
                                        </select>
                                    </div>

                                    {/* Hover Effect */}
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hover Effect</label>
                                        <select className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={settings.hoverEffect || 'none'} onChange={e => update('hoverEffect', e.target.value)}>
                                            <option value="none">None</option>
                                            <option value="zoom">Zoom</option>
                                            <option value="overlay_fade">Overlay Fade (Title over Image)</option>
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}


                        {/* Card Style */}
                        <section className="space-y-4 pt-4 border-t border-slate-100">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Box className="w-3 h-3" /> Card Style
                            </h3>
                            <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <ColorInput label="Background" value={getVal('cardBackgroundColor', 'transparent')} onChange={val => updateStyle('cardBackgroundColor', val)} />

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Radius (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('cardBorderRadius', 0)} onChange={e => updateStyle('cardBorderRadius', parseInt(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                            Padding (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
                                        </label>
                                        <input type="number" className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                                            value={getVal('cardPadding', 0)} onChange={e => updateStyle('cardPadding', parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        </section>


                        {/* Typography */}
                        {settings.showTitle !== false && (
                            <section className="space-y-4 pt-4 border-t border-slate-100">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Type className="w-3 h-3" /> Typography: Title
                                </h3>
                                <div className="space-y-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    {/* Font Family */}
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

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center justify-between">
                                                Size (px) <span className="text-[8px] text-slate-300 font-normal uppercase">{viewMode}</span>
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
                                                <option value="font-bold">Bold</option>
                                            </select>
                                        </div>
                                    </div>
                                    <ColorInput label="Color" value={getVal('titleColor', '#1e293b')} onChange={val => updateStyle('titleColor', val)} />
                                </div>
                            </section>
                        )}

                    </div>
                )}

            </div>
        </div>
    );
}
