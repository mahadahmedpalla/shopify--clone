
import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Layout, Type } from 'lucide-react';
import { ColorInput, getResponsiveValue } from '../Shared';

export function TextProperties({ settings, onUpdate, viewMode }) {

    // Helper: Update responsive values
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

    const [activeTab, setActiveTab] = React.useState('content');

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                {['content', 'layout', 'typography', 'style', 'spacing'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* --- CONTENT TAB --- */}
            {activeTab === 'content' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Editor</label>
                        <textarea
                            rows={8}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-sans"
                            value={settings.text || ''}
                            onChange={(e) => onUpdate({ ...settings, text: e.target.value })}
                            placeholder="Type your text here..."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Line breaks are preserved.</p>
                    </div>
                </div>
            )}

            {/* --- LAYOUT TAB --- */}
            {activeTab === 'layout' && (
                <div className="space-y-5">
                    {/* Alignment */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Alignment ({viewMode})</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {['left', 'center', 'right', 'justify'].map(align => (
                                <button
                                    key={align}
                                    onClick={() => updateStyle('alignment', align)}
                                    className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${getVal('alignment', 'left') === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {align === 'left' && <AlignLeft className="h-4 w-4" />}
                                    {align === 'center' && <AlignCenter className="h-4 w-4" />}
                                    {align === 'right' && <AlignRight className="h-4 w-4" />}
                                    {align === 'justify' && <AlignJustify className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Max Width */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Max Width</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-3">
                            {['full', 'custom'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => onUpdate({ ...settings, maxWidthMode: mode })}
                                    className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-md transition-all ${settings.maxWidthMode === mode ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        {settings.maxWidthMode === 'custom' && (
                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Width (px)</span>
                                <input type="number" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                    value={settings.customWidth || 600}
                                    onChange={(e) => onUpdate({ ...settings, customWidth: parseInt(e.target.value) })}
                                />
                            </div>
                        )}
                    </div>

                    {/* Text Flow */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Text Flow</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={settings.textFlow || 'wrap'}
                            onChange={(e) => onUpdate({ ...settings, textFlow: e.target.value })}
                        >
                            <option value="wrap">Normal Wrap</option>
                            <option value="balance">Balanced (Headings/Short Text)</option>
                            <option value="pretty">Pretty (Avoid Orphans)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1">"Balanced" works best for centered short text.</p>
                    </div>
                </div>
            )}

            {/* --- TYPOGRAPHY TAB --- */}
            {activeTab === 'typography' && (
                <div className="space-y-4">
                    {/* Font Family */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Font Family</label>
                        <select
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={settings.fontFamily || 'Inter, sans-serif'}
                            onChange={(e) => onUpdate({ ...settings, fontFamily: e.target.value })}
                        >
                            <option value="Inter, sans-serif">Inter</option>
                            <option value="'Playfair Display', serif">Playfair Display</option>
                            <option value="'Roboto', sans-serif">Roboto</option>
                            <option value="'Open Sans', sans-serif">Open Sans</option>
                            <option value="'Montserrat', sans-serif">Montserrat</option>
                            <option value="'Lato', sans-serif">Lato</option>
                        </select>
                    </div>

                    {/* Sizes Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Size (px)</span>
                            <input type="number" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={getVal('fontSize', 16)} onChange={e => updateStyle('fontSize', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Line Height</span>
                            <input type="number" step="0.1" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.lineHeight || 1.6} onChange={e => onUpdate({ ...settings, lineHeight: e.target.value })} />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Weight</span>
                            <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.fontWeight || '400'} onChange={e => onUpdate({ ...settings, fontWeight: e.target.value })}>
                                <option value="300">Light</option>
                                <option value="400">Regular</option>
                                <option value="500">Medium</option>
                                <option value="600">Semibold</option>
                                <option value="700">Bold</option>
                            </select>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Letter Spacing (px)</span>
                            <input type="number" step="0.5" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.letterSpacing || 0} onChange={e => onUpdate({ ...settings, letterSpacing: parseFloat(e.target.value) })} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- STYLE TAB --- */}
            {activeTab === 'style' && (
                <div className="space-y-5">
                    <ColorInput label="Text Color" value={settings.textColor || '#334155'} onChange={v => onUpdate({ ...settings, textColor: v })} />

                    <div className="border-t border-slate-100 pt-4">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-3">Background & Box</label>
                        <ColorInput label="Background Color" value={settings.backgroundColor || 'transparent'} onChange={v => onUpdate({ ...settings, backgroundColor: v })} />

                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-slate-500">Opacity (Bg Only)</span>
                                <span className="text-[10px] text-slate-400">{settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 100}%</span>
                            </div>
                            <input type="range" min="0" max="100" className="w-full accent-indigo-600"
                                value={settings.backgroundOpacity !== undefined ? settings.backgroundOpacity : 100}
                                onChange={e => onUpdate({ ...settings, backgroundOpacity: parseInt(e.target.value) })} />
                        </div>

                        <div className="mt-4">
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] text-slate-500">Border Radius</span>
                                <span className="text-[10px] text-slate-400">{settings.borderRadius || 0}px</span>
                            </div>
                            <input type="range" min="0" max="100" className="w-full accent-indigo-600"
                                value={settings.borderRadius || 0}
                                onChange={e => onUpdate({ ...settings, borderRadius: parseInt(e.target.value) })} />
                        </div>
                    </div>
                </div>
            )}

            {/* --- SPACING TAB --- */}
            {activeTab === 'spacing' && (
                <div className="space-y-5">
                    {/* Padding */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Section Padding ({viewMode})</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Vertical (Y)</span>
                                <input type="range" min="0" max="200" className="w-full accent-indigo-600"
                                    value={getVal('paddingY', 0)} onChange={e => updateStyle('paddingY', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Horizontal (X)</span>
                                <input type="range" min="0" max="200" className="w-full accent-indigo-600"
                                    value={getVal('paddingX', 0)} onChange={e => updateStyle('paddingX', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>

                    {/* Margin */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Margin (Surrounding)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Top</span>
                                <input type="number" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                    value={getVal('marginTop', 0)} onChange={e => updateStyle('marginTop', parseInt(e.target.value))} />
                            </div>
                            <div>
                                <span className="text-[10px] text-slate-500 mb-1 block">Bottom</span>
                                <input type="number" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                    value={getVal('marginBottom', 0)} onChange={e => updateStyle('marginBottom', parseInt(e.target.value))} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
