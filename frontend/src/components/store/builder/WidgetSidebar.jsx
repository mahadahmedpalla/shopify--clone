import React from 'react';
import { Search, Star, Trash2 } from 'lucide-react';
import { WIDGET_CATEGORIES } from './widgetConstants';

export function WidgetSidebar({ previewMode, onAddWidget, customWidgets = [], onDeleteCustom }) {
    const handleDelete = (e, widget) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${widget.name}"?`)) {
            onDeleteCustom(widget.id);
        }
    };

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
                {/* Custom Widgets Section */}
                {customWidgets && customWidgets.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1 flex items-center">
                            <Star className="w-3 h-3 mr-1 fill-amber-500" />
                            Your Custom Widgets
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {customWidgets.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => onAddWidget(w.type, w.settings)}
                                    className="group p-3 bg-amber-50/50 border border-amber-200 rounded-2xl flex flex-col items-center justify-center space-y-2 hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10 transition-all active:scale-95 relative"
                                >
                                    <div
                                        onClick={(e) => handleDelete(e, w)}
                                        className="absolute top-2 right-2 p-1.5 text-amber-300 hover:text-red-500 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </div>

                                    <div className="p-3 bg-white rounded-xl text-amber-500 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                        <Star className="h-4 w-4" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600 truncate w-full text-center">{w.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
