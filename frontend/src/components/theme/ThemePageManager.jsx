import React, { useState } from 'react';
import { Plus, Trash2, Check, X, FileText, ShoppingBag, ShoppingCart, Home, Layers } from 'lucide-react';

const SYSTEM_PAGES = [
    { name: 'Home Page', slug: 'home', icon: Home },
    { name: 'Product Page', slug: 'pdp', icon: ShoppingBag },
    { name: 'Category Page', slug: 'shop', icon: Layers },
    { name: 'Cart Page', slug: 'cart', icon: ShoppingCart },
    { name: 'Checkout Page', slug: 'checkout', icon: FileText },
    { name: 'Refund Policy', slug: 'refund-policy', icon: FileText },
    { name: 'Shipping Policy', slug: 'shipping-policy', icon: FileText },
];

export function ThemePageManager({
    pages,
    activePageId,
    onSelectPage,
    onCreatePage,
    onDeletePage,
    onToggleInclude,
    onClose
}) {
    const [isCreating, setIsCreating] = useState(false);
    const [newPageName, setNewPageName] = useState('');

    const handleCreate = () => {
        if (!newPageName.trim()) return;
        onCreatePage(newPageName.trim());
        setNewPageName('');
        setIsCreating(false);
    };

    // Merge system pages with DB pages to get status
    const systemPageList = SYSTEM_PAGES.map(sysPage => {
        const dbPage = pages.find(p => p.slug === sysPage.slug);
        return {
            ...sysPage,
            id: dbPage?.id,
            is_included: dbPage?.is_included ?? false, // Default to false if not in DB yet? Or true? Plan said "Checkmark default pages". 
            // Actually, usually system pages are implicitly "there" but if we want to override them.
            // Let's assume if it exists in DB, we use that status. If not, it's "not customized" (maybe treated as true or false depending on logic).
            // Let's treat "missing from DB" as "Not Included" (using default platform/shadcn layout) OR "Included" (default).
            // User said "checkmark default pages showing that these pages are included".
            // So let's assume if dbPage exists and is_included is true => Checked.
        };
    });

    const customPages = pages.filter(p => !SYSTEM_PAGES.some(sp => sp.slug === p.slug));

    return (
        <div className="bg-white w-64 border-r border-slate-200 flex flex-col h-full absolute left-0 top-0 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="text-sm font-bold text-slate-800">Pages</h2>
                <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500">
                    <X className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-6">
                {/* System Pages */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2">System Pages</h3>
                    <div className="space-y-1">
                        {systemPageList.map(page => (
                            <div
                                key={page.slug}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                                    ${(activePageId === page.id || (!activePageId && page.slug === 'home')) ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}
                                `}
                                onClick={() => onSelectPage(page)}
                            >
                                <div className="flex items-center gap-2">
                                    <page.icon className="h-4 w-4 opacity-70" />
                                    <span>{page.name}</span>
                                </div>
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <label className="relative inline-flex items-center cursor-pointer group-hover:opacity-100 opacity-60 transition-opacity" title="Include in Theme">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={page.is_included}
                                            onChange={() => onToggleInclude(page.slug, !page.is_included)}
                                        />
                                        <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Custom Pages */}
                <div>
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-2 flex justify-between items-center">
                        Custom Pages
                    </h3>
                    <div className="space-y-1">
                        {customPages.map(page => (
                            <div
                                key={page.id}
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer
                                    ${activePageId === page.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-slate-50 text-slate-600'}
                                `}
                                onClick={() => onSelectPage(page)}
                            >
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 opacity-70" />
                                    <span className="truncate max-w-[120px]">{page.name}</span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete page "${page.name}"?`)) onDeletePage(page.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {customPages.length === 0 && (
                            <div className="text-xs text-slate-400 px-3 italic">No custom pages</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Actions */}
            <div className="p-3 border-t border-slate-100 bg-slate-50">
                {isCreating ? (
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            autoFocus
                            placeholder="Page Name..."
                            className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={newPageName}
                            onChange={e => setNewPageName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        />
                        <button onClick={handleCreate} disabled={!newPageName.trim()} className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">
                            <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setIsCreating(false)} className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                        <Plus className="h-3 w-3" /> Add Custom Page
                    </button>
                )}
            </div>
        </div>
    );
}
