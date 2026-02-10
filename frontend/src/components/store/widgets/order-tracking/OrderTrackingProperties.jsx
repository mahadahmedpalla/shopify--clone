import React, { useState } from 'react';
import { ColorInput } from '../Shared';

export function OrderTrackingProperties({ settings, onUpdate }) {
    const [activeTab, setActiveTab] = useState('content');

    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

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
                    onClick={() => setActiveTab('style')}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'style' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Style
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
                {activeTab === 'content' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Heading Text</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={settings.headingText || ''}
                                onChange={(e) => handleChange('headingText', e.target.value)}
                                placeholder="Track Your Order"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Subheading Text</label>
                            <textarea
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm resize-none h-20"
                                value={settings.subheadingText || ''}
                                onChange={(e) => handleChange('subheadingText', e.target.value)}
                                placeholder="Enter your order ID..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Input Placeholder</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={settings.placeholderText || ''}
                                onChange={(e) => handleChange('placeholderText', e.target.value)}
                                placeholder="e.g. 550e8400..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Button Text</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                                value={settings.buttonText || ''}
                                onChange={(e) => handleChange('buttonText', e.target.value)}
                                placeholder="Track Order"
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'style' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        {/* Text Colors */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-100 pb-2">Typography Colors</label>
                            <div className="grid grid-cols-2 gap-4">
                                <ColorInput label="Heading Color" value={settings.headingColor || '#0f172a'} onChange={(v) => handleChange('headingColor', v)} />
                                <ColorInput label="Subheading Color" value={settings.subheadingColor || '#64748b'} onChange={(v) => handleChange('subheadingColor', v)} />
                            </div>
                        </div>

                        {/* Button Style */}
                        <div className="space-y-4 border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-100 pb-2">Button Style</label>
                            <div className="grid grid-cols-2 gap-4">
                                <ColorInput label="Button Bg" value={settings.buttonColor || '#4f46e5'} onChange={(v) => handleChange('buttonColor', v)} />
                                <ColorInput label="Button Text" value={settings.buttonTextColor || '#ffffff'} onChange={(v) => handleChange('buttonTextColor', v)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Button Radius</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={settings.buttonRadius || 8}
                                    onChange={(e) => handleChange('buttonRadius', parseInt(e.target.value))}
                                    className="w-full accent-indigo-600"
                                />
                            </div>
                        </div>

                        {/* Layout */}
                        <div className="space-y-4 border-t border-slate-100 pt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block border-b border-slate-100 pb-2">Layout</label>
                            <ColorInput label="Background Color" value={settings.backgroundColor || '#ffffff'} onChange={(v) => handleChange('backgroundColor', v)} />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Padding Y</label>
                                    <input type="number" className="w-full text-xs p-2 border rounded" value={settings.paddingY || 40} onChange={(e) => handleChange('paddingY', parseInt(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Padding X</label>
                                    <input type="number" className="w-full text-xs p-2 border rounded" value={settings.paddingX || 20} onChange={(e) => handleChange('paddingX', parseInt(e.target.value))} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Alignment</label>
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    {['left', 'center', 'right'].map((align) => (
                                        <button
                                            key={align}
                                            onClick={() => handleChange('alignment', align)}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${settings.alignment === align ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {align}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
