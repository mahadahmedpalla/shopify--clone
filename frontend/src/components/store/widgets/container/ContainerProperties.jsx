import React, { useState } from 'react';
import {
    Layout, Maximize, Smartphone, Monitor, Tablet,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    ArrowDown, ArrowRight, Grid, Type, PaintBucket,
    Box
} from 'lucide-react';

export function ContainerProperties({ settings, onChange, viewMode = 'desktop' }) {
    const [activeTab, setActiveTab] = useState('layout'); // layout, sizing, spacing, style

    const updateSetting = (key, value) => {
        onChange({ ...settings, [key]: value });
    };

    const updateResponsiveSetting = (key, value) => {
        // key = 'direction', 'gap', 'padding', 'alignItems', 'justifyContent'
        const current = settings[key] || {};
        onChange({
            ...settings,
            [key]: { ...current, [viewMode]: value }
        });
    };

    const getResponsiveValue = (key, fallback) => {
        return settings[key]?.[viewMode] || settings[key]?.['desktop'] || fallback;
    };

    return (
        <div className="space-y-6">
            {/* View Mode Indicator (Passive) */}
            <div className="flex items-center justify-center p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-bold uppercase tracking-widest gap-2">
                {viewMode === 'mobile' && <Smartphone className="w-4 h-4" />}
                {viewMode === 'tablet' && <Tablet className="w-4 h-4" />}
                {viewMode === 'desktop' && <Monitor className="w-4 h-4" />}
                Editing {viewMode} Layout
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                {[
                    { id: 'layout', label: 'Layout', icon: Layout },
                    { id: 'sizing', label: 'Sizing', icon: Maximize },
                    { id: 'spacing', label: 'Spacing', icon: Grid },
                    { id: 'style', label: 'Style', icon: PaintBucket }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-3 text-xs font-medium border-b-2 transition-colors flex flex-col items-center gap-1 ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Content */}
            <div className="space-y-4">
                {activeTab === 'layout' && (
                    <>
                        {/* Direction */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Direction</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => updateResponsiveSetting('direction', 'row')}
                                    className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm ${getResponsiveValue('direction', 'column') === 'row' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <ArrowRight className="w-4 h-4 mr-2" /> Horizontal
                                </button>
                                <button
                                    onClick={() => updateResponsiveSetting('direction', 'column')}
                                    className={`flex items-center justify-center px-4 py-2 border rounded-md text-sm ${getResponsiveValue('direction', 'column') === 'column' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-slate-200 text-slate-600'
                                        }`}
                                >
                                    <ArrowDown className="w-4 h-4 mr-2" /> Vertical
                                </button>
                            </div>
                        </div>

                        {/* Align Items */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Align Items</label>
                            <div className="flex bg-slate-100 rounded-md p-1">
                                {[
                                    { val: 'start', icon: AlignLeft },
                                    { val: 'center', icon: AlignCenter },
                                    { val: 'end', icon: AlignRight },
                                    { val: 'stretch', icon: AlignJustify }
                                ].map(opt => (
                                    <button
                                        key={opt.val}
                                        onClick={() => updateResponsiveSetting('alignItems', opt.val)}
                                        className={`flex-1 flex items-center justify-center py-1.5 rounded transition-all ${getResponsiveValue('alignItems', 'start') === opt.val ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'
                                            }`}
                                        title={opt.val}
                                    >
                                        <opt.icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Justify Content */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Justify Content</label>
                            <select
                                value={getResponsiveValue('justifyContent', 'start')}
                                onChange={(e) => updateResponsiveSetting('justifyContent', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md bg-white"
                            >
                                <option value="start">Start</option>
                                <option value="center">Center</option>
                                <option value="end">End</option>
                                <option value="between">Space Between</option>
                                <option value="around">Space Around</option>
                            </select>
                        </div>

                        {/* Gap */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                                Gap
                                <span className="text-slate-400 font-normal">{getResponsiveValue('gap', 0)}px</span>
                            </label>
                            <input
                                type="range"
                                min="0" max="100"
                                value={getResponsiveValue('gap', 0)}
                                onChange={(e) => updateResponsiveSetting('gap', parseInt(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                        </div>

                        {/* Wrap */}
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Wrap Items</label>
                            <input
                                type="checkbox"
                                checked={settings.wrap || false}
                                onChange={(e) => updateSetting('wrap', e.target.checked)}
                                className="toggle-checkbox"
                            />
                        </div>
                    </>
                )}

                {activeTab === 'sizing' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Width</label>
                            <select
                                value={settings.widthMode || 'auto'}
                                onChange={(e) => updateSetting('widthMode', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md mb-2"
                            >
                                <option value="auto">Auto</option>
                                <option value="full">Full Width (100%)</option>
                                <option value="screen">Screen Width (100vw)</option>
                                <option value="container">Container (Max-width)</option>
                                <option value="custom">Custom</option>
                            </select>
                            {settings.widthMode === 'custom' && (
                                <input
                                    type="text"
                                    placeholder="e.g. 500px or 50%"
                                    value={settings.width || ''}
                                    onChange={(e) => updateSetting('width', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                />
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Height</label>
                            <select
                                value={settings.heightMode || 'auto'}
                                onChange={(e) => updateSetting('heightMode', e.target.value)}
                                className="w-full p-2 text-sm border border-slate-200 rounded-md mb-2"
                            >
                                <option value="auto">Auto</option>
                                <option value="fit">Fit Content</option>
                                <option value="screen">Screen Height (100vh)</option>
                                <option value="custom">Custom</option>
                            </select>
                            {settings.heightMode === 'custom' && (
                                <input
                                    type="text"
                                    placeholder="e.g. 400px"
                                    value={settings.height || ''}
                                    onChange={(e) => updateSetting('height', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Min Height</label>
                                <input
                                    type="text"
                                    value={settings.minHeight || ''}
                                    onChange={(e) => updateSetting('minHeight', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                    placeholder="px"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Max Width</label>
                                <input
                                    type="text"
                                    value={settings.maxWidth || ''}
                                    onChange={(e) => updateSetting('maxWidth', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                    placeholder="px"
                                />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'spacing' && (
                    <>
                        <div className="space-y-4">
                            {/* Padding */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    Padding
                                    <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">{viewMode}</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Top', 'Right', 'Bottom', 'Left'].map(side => (
                                        <div key={side} className="flex items-center border border-slate-200 rounded-md bg-white">
                                            <span className="text-[10px] text-slate-400 pl-2 w-8">{side[0]}</span>
                                            <input
                                                type="number"
                                                className="w-full p-1.5 text-sm outline-none bg-transparent"
                                                placeholder="0"
                                                value={settings.padding?.[viewMode]?.[side.toLowerCase()] || ''}
                                                onChange={(e) => {
                                                    const currentPad = settings.padding || {};
                                                    const modePad = currentPad[viewMode] || {};
                                                    updateSetting('padding', {
                                                        ...currentPad,
                                                        [viewMode]: { ...modePad, [side.toLowerCase()]: e.target.value }
                                                    });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Margin */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                                    Margin
                                    <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">{viewMode}</span>
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Top', 'Right', 'Bottom', 'Left'].map(side => (
                                        <div key={side} className="flex items-center border border-slate-200 rounded-md bg-white">
                                            <span className="text-[10px] text-slate-400 pl-2 w-8">{side[0]}</span>
                                            <input
                                                type="number"
                                                className="w-full p-1.5 text-sm outline-none bg-transparent"
                                                placeholder="0"
                                                value={settings.margin?.[viewMode]?.[side.toLowerCase()] || ''}
                                                onChange={(e) => {
                                                    const currentMar = settings.margin || {};
                                                    const modeMar = currentMar[viewMode] || {};
                                                    updateSetting('margin', {
                                                        ...currentMar,
                                                        [viewMode]: { ...modeMar, [side.toLowerCase()]: e.target.value }
                                                    });
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'style' && (
                    <>
                        <div className="space-y-4">
                            {/* Background */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Background Color</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={settings.backgroundColor || '#ffffff'}
                                        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                        className="h-9 w-9 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.backgroundColor || '#ffffff'}
                                        onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                                        className="flex-1 p-2 text-sm border border-slate-200 rounded-md"
                                    />
                                </div>
                            </div>

                            {/* Border */}
                            <div className="space-y-2 border-t pt-4">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Border</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400">Width</label>
                                        <input
                                            type="number"
                                            value={settings.borderWidth || 0}
                                            onChange={(e) => updateSetting('borderWidth', e.target.value)}
                                            className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-400">Radius</label>
                                        <input
                                            type="number"
                                            value={settings.borderRadius || 0}
                                            onChange={(e) => updateSetting('borderRadius', e.target.value)}
                                            className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-2">
                                    <input
                                        type="color"
                                        value={settings.borderColor || '#000000'}
                                        onChange={(e) => updateSetting('borderColor', e.target.value)}
                                        className="h-8 w-8 p-0 border-0 rounded cursor-pointer"
                                    />
                                    <select
                                        value={settings.borderStyle || 'solid'}
                                        onChange={(e) => updateSetting('borderStyle', e.target.value)}
                                        className="flex-1 text-sm border border-slate-200 rounded-md"
                                    >
                                        <option value="solid">Solid</option>
                                        <option value="dashed">Dashed</option>
                                        <option value="dotted">Dotted</option>
                                    </select>
                                </div>
                            </div>

                            {/* Shadow */}
                            <div className="space-y-2 border-t pt-4">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Shadow</label>
                                <select
                                    value={settings.shadow || 'none'}
                                    onChange={(e) => updateSetting('shadow', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                >
                                    <option value="none">None</option>
                                    <option value="sm">Small</option>
                                    <option value="md">Medium</option>
                                    <option value="lg">Large</option>
                                    <option value="xl">Extra Large</option>
                                    <option value="inner">Inner</option>
                                </select>
                            </div>
                            {/* Position & Overflow */}
                            <div className="space-y-2 border-t pt-4">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Overflow</label>
                                <select
                                    value={settings.overflow || 'visible'}
                                    onChange={(e) => updateSetting('overflow', e.target.value)}
                                    className="w-full p-2 text-sm border border-slate-200 rounded-md"
                                >
                                    <option value="visible">Visible</option>
                                    <option value="hidden">Hidden</option>
                                    <option value="scroll">Scroll</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
