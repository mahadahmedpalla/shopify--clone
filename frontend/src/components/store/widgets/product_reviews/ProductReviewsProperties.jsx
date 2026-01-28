import React from 'react';
import { Settings, Info } from 'lucide-react';

export const ProductReviewsProperties = ({ settings, onUpdate }) => {

    const handleChange = (key, value) => {
        onUpdate({
            ...settings,
            [key]: value
        });
    };

    return (
        <div className="space-y-6">
            {/* FUNCTIONALITY */}
            <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center">
                        <Settings className="w-3 h-3 mr-2 text-slate-400" />
                        Settings
                    </h4>
                </div>

                {/* layout mode - visual selector */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2">Display Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => handleChange('layoutMode', 'simple')}
                            className={`p-3 rounded-xl border text-left transition-all ${settings.layoutMode === 'simple'
                                ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            <div className={`w-full h-1.5 rounded-full mb-1.5 ${settings.layoutMode === 'simple' ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                            <div className={`w-3/4 h-1.5 rounded-full mb-1.5 ${settings.layoutMode === 'simple' ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                            <div className={`w-1/2 h-1.5 rounded-full ${settings.layoutMode === 'simple' ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                            <span className={`block mt-3 text-[10px] font-bold uppercase tracking-wider ${settings.layoutMode === 'simple' ? 'text-indigo-700' : 'text-slate-500'}`}>
                                Simple List
                            </span>
                        </button>

                        <button
                            onClick={() => handleChange('layoutMode', 'chart')}
                            className={`p-3 rounded-xl border text-left transition-all ${settings.layoutMode === 'chart'
                                ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                }`}
                        >
                            <div className="flex items-end space-x-0.5 mb-2 h-5">
                                <div className={`w-1.5 h-full rounded-sm ${settings.layoutMode === 'chart' ? 'bg-indigo-400' : 'bg-slate-300'}`} />
                                <div className={`w-1.5 h-3/4 rounded-sm ${settings.layoutMode === 'chart' ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                                <div className={`w-1.5 h-1/2 rounded-sm ${settings.layoutMode === 'chart' ? 'bg-indigo-200' : 'bg-slate-200'}`} />
                            </div>
                            <span className={`block mt-1 text-[10px] font-bold uppercase tracking-wider ${settings.layoutMode === 'chart' ? 'text-indigo-700' : 'text-slate-500'}`}>
                                Summary Chart
                            </span>
                        </button>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${settings.allowMedia ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Settings className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Media Uploads</span>
                                <span className="text-[10px] text-slate-400 block">Allow photos & videos</span>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.allowMedia ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.allowMedia ? 'translate-x-4' : ''}`} />
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.allowMedia || false}
                            onChange={(e) => handleChange('allowMedia', e.target.checked)}
                            className="hidden"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${settings.allowVerifiedOnly ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                <Info className="w-4 h-4" />
                            </div>
                            <div>
                                <span className="text-sm font-bold text-slate-700 block">Verified Only</span>
                                <span className="text-[10px] text-slate-400 block">Require Order ID</span>
                            </div>
                        </div>
                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${settings.allowVerifiedOnly ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${settings.allowVerifiedOnly ? 'translate-x-4' : ''}`} />
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.allowVerifiedOnly || false}
                            onChange={(e) => handleChange('allowVerifiedOnly', e.target.checked)}
                            className="hidden"
                        />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                        <span className="text-sm font-medium text-slate-600 pl-2">Hide if empty</span>
                        <input
                            type="checkbox"
                            checked={settings.hideIfEmpty || false}
                            onChange={(e) => handleChange('hideIfEmpty', e.target.checked)}
                            className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                    </label>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Default Sorting</label>
                    <div className="relative">
                        <select
                            value={settings.sortOrder || 'newest'}
                            onChange={(e) => handleChange('sortOrder', e.target.value)}
                            className="w-full appearance-none text-sm p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
                        >
                            <option value="newest">Newest First</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                            <Info className="h-4 w-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-slate-100 my-4" />

            {/* DESIGN */}
            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Design
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Star Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.starColor || '#FACC15'}
                                onChange={(e) => handleChange('starColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.starColor || '#FACC15'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Button Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.buttonColor || '#4F46E5'}
                                onChange={(e) => handleChange('buttonColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.buttonColor || '#4F46E5'}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Text Color</label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={settings.textColor || '#1F2937'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                            />
                            <span className="text-xs text-slate-400 font-mono">{settings.textColor || '#1F2937'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
