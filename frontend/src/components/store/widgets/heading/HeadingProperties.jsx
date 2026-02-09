
import React from 'react';
import { AlignLeft, AlignCenter, AlignRight, Bold, Type, Link as LinkIcon, Palette, Layout, MoveVertical } from 'lucide-react';
import { ViewModeBtn, ColorInput, getResponsiveValue } from '../Shared';

export function HeadingProperties({ settings, onUpdate, viewMode }) {

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

    const [activeTab, setActiveTab] = React.useState('content'); // content, typography, style, spacing

    return (
        <div className="space-y-6">
            {/* TABS */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
                {['content', 'typography', 'style', 'spacing'].map(tab => (
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
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Heading Text</label>
                        <textarea
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={settings.text || ''}
                            onChange={(e) => onUpdate({ ...settings, text: e.target.value })}
                            placeholder="Enter display text..."
                        />
                    </div>

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">HTML Tag & Presets</label>
                        <div className="grid grid-cols-6 gap-2">
                            {['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        // Auto-scale font size based on tag
                                        const sizes = { h1: 48, h2: 32, h3: 24, h4: 20, h5: 16, h6: 14 };
                                        onUpdate({ ...settings, htmlTag: tag, fontSize: sizes[tag] });
                                    }}
                                    className={`py-2 rounded-md text-xs font-bold uppercase border ${(settings.htmlTag || 'h2') === tag
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Selecting a tag auto-updates font size.</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <label className="flex items-center justify-between cursor-pointer mb-3">
                            <span className="text-xs font-bold text-slate-700 flex items-center">
                                <LinkIcon className="h-3 w-3 mr-2" />
                                Enable Link
                            </span>
                            <input type="checkbox" className="toggle toggle-indigo"
                                checked={settings.enableLink || false}
                                onChange={e => onUpdate({ ...settings, enableLink: e.target.checked })} />
                        </label>

                        {settings.enableLink && (
                            <div>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                    placeholder="https:// or /shop"
                                    value={settings.linkUrl || ''}
                                    onChange={(e) => onUpdate({ ...settings, linkUrl: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Accepts internal paths (/shop) or external URLs.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- TYPOGRAPHY TAB --- */}
            {activeTab === 'typography' && (
                <div className="space-y-4">
                    {/* Alignment */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Alignment ({viewMode})</label>
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                            {['left', 'center', 'right', 'justify'].map(align => (
                                <button
                                    key={align}
                                    onClick={() => updateStyle('alignment', align)}
                                    className={`flex-1 flex items-center justify-center py-2 rounded transition-all ${getVal('alignment', 'center') === align ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {align === 'left' && <AlignLeft className="h-4 w-4" />}
                                    {align === 'center' && <AlignCenter className="h-4 w-4" />}
                                    {align === 'right' && <AlignRight className="h-4 w-4" />}
                                    {align === 'justify' && <Layout className="h-4 w-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

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
                                value={getVal('fontSize', 32)} onChange={e => updateStyle('fontSize', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Line Height</span>
                            <input type="number" step="0.1" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.lineHeight || 1.2} onChange={e => onUpdate({ ...settings, lineHeight: e.target.value })} />
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Weight</span>
                            <select className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.fontWeight || '700'} onChange={e => onUpdate({ ...settings, fontWeight: e.target.value })}>
                                <option value="300">Light</option>
                                <option value="400">Regular</option>
                                <option value="500">Medium</option>
                                <option value="600">Semibold</option>
                                <option value="700">Bold</option>
                                <option value="800">Extra Bold</option>
                                <option value="900">Black</option>
                            </select>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-500 mb-1 block">Letter Spacing (px)</span>
                            <input type="number" step="0.5" className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                                value={settings.letterSpacing || 0} onChange={e => onUpdate({ ...settings, letterSpacing: parseFloat(e.target.value) })} />
                        </div>
                    </div>

                    {/* Transform */}
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Text Transform</label>
                        <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={settings.textTransform || 'none'} onChange={e => onUpdate({ ...settings, textTransform: e.target.value })}>
                            <option value="none">None</option>
                            <option value="uppercase">Uppercase</option>
                            <option value="lowercase">Lowercase</option>
                            <option value="capitalize">Capitalize</option>
                        </select>
                    </div>
                </div>
            )}

            {/* --- STYLE TAB --- */}
            {activeTab === 'style' && (
                <div className="space-y-5">
                    {/* Text Color */}
                    <div>
                        <label className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Text Gradient</span>
                            <input type="checkbox" className="toggle toggle-indigo scale-75"
                                checked={settings.useGradient || false}
                                onChange={e => onUpdate({ ...settings, useGradient: e.target.checked })} />
                        </label>

                        {settings.useGradient ? (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <ColorInput label="Start Color" value={settings.gradientStart || '#4f46e5'} onChange={v => onUpdate({ ...settings, gradientStart: v })} />
                                <ColorInput label="End Color" value={settings.gradientEnd || '#ec4899'} onChange={v => onUpdate({ ...settings, gradientEnd: v })} />
                            </div>
                        ) : (
                            <ColorInput label="Text Color" value={settings.textColor || '#1e293b'} onChange={v => onUpdate({ ...settings, textColor: v })} />
                        )}
                    </div>

                    {/* Text Shadow */}
                    <div>
                        <label className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Text Shadow</span>
                            <input type="checkbox" className="toggle toggle-indigo scale-75"
                                checked={settings.textShadow || false}
                                onChange={e => onUpdate({ ...settings, textShadow: e.target.checked })} />
                        </label>
                        {settings.textShadow && (
                            <ColorInput label="Shadow Color" value={settings.textShadowColor || 'rgba(0,0,0,0.2)'} onChange={v => onUpdate({ ...settings, textShadowColor: v })} />
                        )}
                    </div>

                    {/* Background */}
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
