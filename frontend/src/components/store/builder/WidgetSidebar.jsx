import React from 'react';
import { Search } from 'lucide-react';
import { WIDGET_CATEGORIES } from './widgetConstants';

export function WidgetSidebar({ previewMode, onAddWidget }) {
    return (
        <aside
            className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out overflow-hidden
            ${previewMode ? 'w-0 border-r-0 opacity-0' : 'w-64 opacity-100'}
        `}
        >
            <div className="p-4 border-b border-slate-100">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Widgets</h2>
                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-2.5 h-3 w-3 text-slate-400" />
                    <input type="text" placeholder="Search elements..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
                {WIDGET_CATEGORIES.map(cat => (
                    <div key={cat.name} className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">{cat.name}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {cat.widgets.map(w => (
                                <button
                                    key={w.type}
                                    onClick={() => onAddWidget(w.type)}
                                    className="group p-3 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-indigo-400 hover:shadow-md hover:shadow-indigo-500/10 transition-all active:scale-95"
                                >
                                    <div className="p-3 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        {w.icon}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{w.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}
