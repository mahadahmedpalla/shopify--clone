import React from 'react';
import { AlignLeft, AlignCenter, Eye, EyeOff } from 'lucide-react';

export function ProductDetailProperties({ settings, onUpdate }) {
    return (
        <div className="space-y-6">
            {/* Display Options */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Display</label>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-medium text-slate-700">Show Stock Status</span>
                    <button
                        onClick={() => onUpdate({ ...settings, showStock: settings.showStock === false ? true : false })}
                        className={`p-1.5 rounded-lg transition-colors ${settings.showStock !== false ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
                    >
                        {settings.showStock !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-xs font-medium text-slate-700">Show Description</span>
                    <button
                        onClick={() => onUpdate({ ...settings, showDescription: settings.showDescription === false ? true : false })}
                        className={`p-1.5 rounded-lg transition-colors ${settings.showDescription !== false ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
                    >
                        {settings.showDescription !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Alignment */}
            <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Content Alignment</label>
                <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-xl">
                    <button
                        onClick={() => onUpdate({ ...settings, alignment: 'left' })}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-all ${settings.alignment !== 'center' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <AlignLeft className="h-4 w-4" />
                        <span>Left</span>
                    </button>
                    <button
                        onClick={() => onUpdate({ ...settings, alignment: 'center' })}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center space-x-2 transition-all ${settings.alignment === 'center' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <AlignCenter className="h-4 w-4" />
                        <span>Center</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
