import React from 'react';

export function ProductGridProperties({ settings, onUpdate, categories, viewMode }) {
    const update = (key, val) => {
        onUpdate({ ...settings, [key]: val });
    };

    const updateResponsive = (key, val) => {
        const columns = { ...settings.columns };
        columns[viewMode] = val;
        onUpdate({ ...settings, columns });
    };

    return (
        <div className="space-y-6 pb-20">
            <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Content</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Section Title</label>
                    <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={settings.title || ''} onChange={e => update('title', e.target.value)} />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Collection Source</label>
                    <select
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                        value={settings.categoryId || 'all'}
                        onChange={e => update('categoryId', e.target.value)}
                    >
                        <option value="all">All Products</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Limit</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs" value={settings.limit || 8} onChange={e => update('limit', parseInt(e.target.value))} />
                </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Layout</h3>
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center">
                        Columns per row
                        <span className="ml-2 px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase">
                            {viewMode}
                        </span>
                    </label>
                    <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <button
                                key={n}
                                onClick={() => updateResponsive('columns', n)}
                                className={`flex-1 py-1 rounded text-[10px] font-bold transition-all ${settings.columns?.[viewMode] === n ? 'bg-white shadow text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
