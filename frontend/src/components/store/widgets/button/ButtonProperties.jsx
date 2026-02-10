import React, { useState } from 'react';
import { Type, Layout, Palette, MousePointer, ExternalLink, Box } from 'lucide-react';
import * as Icons from 'lucide-react';
import { ColorInput, ViewModeBtn } from '../Shared';

export function ButtonProperties({ settings, onUpdate, viewMode }) {
    const [activeTab, setActiveTab] = useState('content');

    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

    const handleResponsiveChange = (key, value) => {
        const responsive = settings.responsive || {};
        const currentMode = responsive[viewMode] || {};

        onUpdate({
            ...settings,
            responsive: {
                ...responsive,
                [viewMode]: {
                    ...currentMode,
                    [key]: value
                }
            }
        });
    };

    const getVal = (key, defaultVal) => {
        if (viewMode === 'desktop') return settings[key] !== undefined ? settings[key] : defaultVal;
        return settings.responsive?.[viewMode]?.[key] !== undefined ? settings.responsive?.[viewMode]?.[key] : (settings[key] || defaultVal);
    };

    // Icon Search
    const [iconSearch, setIconSearch] = useState('');
    const filteredIcons = Object.keys(Icons).filter(icon =>
        icon.toLowerCase().includes(iconSearch.toLowerCase())
    ).slice(0, 50);

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'content' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('layout')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'layout' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Layout
                </button>
                <button
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'style' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Style
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">

                {/* CONTENT TAB */}
                {activeTab === 'content' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Button Text</label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    value={settings.text || ''}
                                    onChange={(e) => handleChange('text', e.target.value)}
                                    placeholder="Click me"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Link URL</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                        value={settings.linkUrl || ''}
                                        onChange={(e) => handleChange('linkUrl', e.target.value)}
                                        placeholder="/shop or https://..."
                                    />
                                    <button
                                        className={`p-2 rounded-lg border ${settings.openInNewTab ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                        onClick={() => handleChange('openInNewTab', !settings.openInNewTab)}
                                        title="Open in new tab"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block">Icon</label>

                            <div className="flex items-center space-x-4 mb-2">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={settings.iconPosition === 'left'}
                                        onChange={() => handleChange('iconPosition', 'left')}
                                        className="text-indigo-600"
                                    />
                                    <span className="text-xs text-slate-600">Left</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={settings.iconPosition === 'right'}
                                        onChange={() => handleChange('iconPosition', 'right')}
                                        className="text-indigo-600"
                                    />
                                    <span className="text-xs text-slate-600">Right</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        checked={settings.iconPosition === 'only'}
                                        onChange={() => handleChange('iconPosition', 'only')}
                                        className="text-indigo-600"
                                    />
                                    <span className="text-xs text-slate-600">Icon Only</span>
                                </label>
                            </div>

                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs mb-2"
                                placeholder="Search icons..."
                                value={iconSearch}
                                onChange={(e) => setIconSearch(e.target.value)}
                            />

                            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                                <button
                                    onClick={() => handleChange('iconName', '')}
                                    className={`p-2 rounded hover:bg-slate-100 flex items-center justify-center border ${!settings.iconName ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'}`}
                                    title="No Icon"
                                >
                                    <span className="text-[10px]">None</span>
                                </button>
                                {filteredIcons.map(iconName => {
                                    const Icon = Icons[iconName];
                                    return (
                                        <button
                                            key={iconName}
                                            onClick={() => handleChange('iconName', iconName)}
                                            className={`p-2 rounded hover:bg-slate-100 flex items-center justify-center border ${settings.iconName === iconName ? 'border-indigo-500 bg-indigo-50' : 'border-transparent'}`}
                                            title={iconName}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </button>
                                    );
                                })}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gap</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={getVal('iconGap', 8)}
                                    onChange={(e) => handleResponsiveChange('iconGap', parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>0px</span>
                                    <span>{getVal('iconGap', 8)}px</span>
                                    <span>50px</span>
                                </div>
                            </div>

                        </div>
                    </div>
                )}

                {/* LAYOUT TAB */}
                {activeTab === 'layout' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Alignment */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Alignment</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['left', 'center', 'right'].map((align) => (
                                    <button
                                        key={align}
                                        onClick={() => handleResponsiveChange('alignment', align)}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${getVal('alignment', 'center') === align ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {align}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Width Mode */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Width</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                                {['auto', 'fixed', 'full'].map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => handleResponsiveChange('widthMode', mode)}
                                        className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${getVal('widthMode', 'auto') === mode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>

                            {getVal('widthMode') === 'fixed' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Custom Width (px)</label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="600"
                                        value={getVal('customWidth', 150)}
                                        onChange={(e) => handleResponsiveChange('customWidth', parseInt(e.target.value))}
                                        className="w-full accent-indigo-600"
                                    />
                                    <div className="text-right text-[10px] text-slate-400">{getVal('customWidth', 150)}px</div>
                                </div>
                            )}
                        </div>

                        {/* Spacing */}
                        <div className="border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Padding</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Horizontal (X)</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('paddingX', 24)}
                                        onChange={(e) => handleResponsiveChange('paddingX', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Vertical (Y)</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('paddingY', 12)}
                                        onChange={(e) => handleResponsiveChange('paddingY', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Margin</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Top</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('marginTop', 0)}
                                        onChange={(e) => handleResponsiveChange('marginTop', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Bottom</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('marginBottom', 0)}
                                        onChange={(e) => handleResponsiveChange('marginBottom', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Left</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('marginLeft', 0)}
                                        onChange={(e) => handleResponsiveChange('marginLeft', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Right</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('marginRight', 0)}
                                        onChange={(e) => handleResponsiveChange('marginRight', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STYLE TAB */}
                {activeTab === 'style' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <ColorInput label="Background" value={settings.backgroundColor || '#4f46e5'} onChange={(v) => handleChange('backgroundColor', v)} />
                            <ColorInput label="Text Color" value={settings.textColor || '#ffffff'} onChange={(v) => handleChange('textColor', v)} />
                        </div>

                        {/* Hover Colors */}
                        <div className="grid grid-cols-2 gap-4">
                            <ColorInput label="Hover Bg" value={settings.hoverBackgroundColor || '#4338ca'} onChange={(v) => handleChange('hoverBackgroundColor', v)} />
                            <ColorInput label="Hover Text" value={settings.hoverTextColor || '#ffffff'} onChange={(v) => handleChange('hoverTextColor', v)} />
                        </div>

                        {/* Gradient Toggle */}
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Use Gradient</label>
                            <input
                                type="checkbox"
                                checked={settings.useGradient || false}
                                onChange={(e) => handleChange('useGradient', e.target.checked)}
                                className="toggle-checkbox"
                            />
                        </div>
                        {settings.useGradient && (
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gradient String</label>
                                <input
                                    type="text"
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                                    value={settings.gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)'}
                                    onChange={(e) => handleChange('gradient', e.target.value)}
                                />
                            </div>
                        )}

                        {/* Typography */}
                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Typography</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Size (px)</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('fontSize', 16)}
                                        onChange={(e) => handleResponsiveChange('fontSize', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-400 mb-1 block">Weight</label>
                                    <select
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={getVal('fontWeight', '600')}
                                        onChange={(e) => handleResponsiveChange('fontWeight', e.target.value)}
                                    >
                                        <option value="400">Normal</option>
                                        <option value="500">Medium</option>
                                        <option value="600">SemiBold</option>
                                        <option value="700">Bold</option>
                                        <option value="800">ExtraBold</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-400 mb-1 block">Font Family</label>
                                <select
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                    value={settings.fontFamily || 'Inter, sans-serif'}
                                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                                >
                                    <option value="Inter, sans-serif">Inter</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="'Open Sans', sans-serif">Open Sans</option>
                                    <option value="'Lato', sans-serif">Lato</option>
                                    <option value="'Playfair Display', serif">Playfair Display</option>
                                    <option value="'Montserrat', sans-serif">Montserrat</option>
                                </select>
                            </div>
                        </div>

                        {/* Borders & Rounding */}
                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Corner Radius</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.borderRadius !== undefined ? settings.borderRadius : 8}
                                        onChange={(e) => handleChange('borderRadius', parseInt(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Border Width</label>
                                    <input
                                        type="number"
                                        className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                        value={settings.borderWidth || 0}
                                        onChange={(e) => handleChange('borderWidth', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                            {settings.borderWidth > 0 && (
                                <ColorInput label="Border Color" value={settings.borderColor || '#e2e8f0'} onChange={(v) => handleChange('borderColor', v)} />
                            )}
                        </div>

                        {/* Shadow & Effects */}
                        <div className="border-t border-slate-100 pt-4 space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Shadow</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {['none', 'sm', 'md', 'lg', 'xl', 'soft', 'glow'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleChange('shadow', opt)}
                                            className={`py-1 rounded text-[10px] capitalize border ${settings.shadow === opt ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Hover Scale</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                    value={settings.hoverScale || 1}
                                    onChange={(e) => handleChange('hoverScale', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
