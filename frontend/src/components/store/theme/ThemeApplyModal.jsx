import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { X, Check, AlertTriangle, ArrowRight } from 'lucide-react';

export function ThemeApplyModal({ isOpen, onClose, theme, storeId, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [themePages, setThemePages] = useState([]);
    const [storePages, setStorePages] = useState([]);
    const [selectedPages, setSelectedPages] = useState([]); // Array of slugs
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (isOpen && theme) {
            fetchPages();
        }
    }, [isOpen, theme]);

    const fetchPages = async () => {
        setLoading(true);

        // 1. Fetch Theme Pages
        const { data: tPages } = await supabase
            .from('theme_pages')
            .select('*')
            .eq('theme_id', theme.theme.id);

        // 2. Fetch Store Pages
        const { data: sPages } = await supabase
            .from('store_pages')
            .select('*')
            .eq('store_id', storeId);

        setThemePages(tPages || []);
        setStorePages(sPages || []);

        // Default: Select all theme pages
        if (tPages) {
            setSelectedPages(tPages.filter(p => p.is_included).map(p => p.slug));
        }

        setLoading(false);
    };

    const handleTogglePage = (slug) => {
        if (selectedPages.includes(slug)) {
            setSelectedPages(selectedPages.filter(s => s !== slug));
        } else {
            setSelectedPages([...selectedPages, slug]);
        }
    };

    const handleApply = async () => {
        if (!confirm(`Are you sure you want to update ${selectedPages.length} pages? This will overwrite existing layouts for these pages.`)) return;

        setApplying(true);
        const errors = [];

        try {
            // 1. Iterate selected pages and Update/Create
            for (const slug of selectedPages) {
                const themePage = themePages.find(p => p.slug === slug);
                const existingStorePage = storePages.find(p => p.slug === slug);

                if (!themePage) continue;

                // Determine page type
                let pageType = themePage.type;
                if (['refund-policy', 'shipping-policy'].includes(slug)) pageType = 'legal';
                else if (['home', 'shop', 'pdp', 'cart', 'checkout', 'thank-you'].includes(slug)) pageType = 'system';
                else pageType = 'custom';

                const payload = {
                    store_id: storeId,
                    name: themePage.name,
                    slug: themePage.slug,
                    type: pageType,
                    content: themePage.content, // Copy content directly (including asset URLs)
                    is_published: true
                };

                // Remove ID if exists in payload to let DB generate new one or keep existing
                delete payload.id;

                let error;
                if (existingStorePage) {
                    // Update content only
                    const { error: err } = await supabase
                        .from('store_pages')
                        .update({ content: payload.content })
                        .eq('id', existingStorePage.id);
                    error = err;
                } else {
                    // Insert new page
                    const { error: err } = await supabase
                        .from('store_pages')
                        .insert([payload]);
                    error = err;
                }

                if (error) {
                    console.error(`Error applying page ${slug}:`, error);
                    errors.push(slug);
                }
            }

            // 2. Set Theme as Active in store_themes
            // Deactivate all
            await supabase
                .from('store_themes')
                .update({ is_active: false })
                .eq('store_id', storeId);

            // Activate current
            await supabase
                .from('store_themes')
                .update({ is_active: true })
                .eq('store_id', storeId)
                .eq('theme_id', theme.theme.id);

            if (errors.length > 0) {
                alert(`Theme applied, but failed to update pages: ${errors.join(', ')}`);
            } else {
                alert('Theme applied successfully! Your store pages have been updated.');
                onSuccess();
                onClose();
            }

        } catch (err) {
            console.error('Critical error applying theme:', err);
            alert('Failed to apply theme completely.');
        } finally {
            setApplying(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-800">Apply Theme: {theme?.theme?.name}</h3>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-md">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-amber-700 font-medium">
                                        Warning: Overwriting Store Content
                                    </p>
                                    <p className="text-xs text-amber-600 mt-1">
                                        Applying this theme will <strong>overwrite the layout and content</strong> of the selected pages.
                                        Images from the theme will be used. You can replace them later.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-400">Loading pages...</div>
                        ) : (
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 p-3 flex justify-between items-center border-b border-slate-200">
                                    <span className="text-sm font-bold text-slate-700">Select Pages to Apply</span>
                                    <div className="space-x-3 text-xs">
                                        <button
                                            onClick={() => setSelectedPages(themePages.map(p => p.slug))}
                                            className="text-indigo-600 hover:text-indigo-800 font-medium"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            onClick={() => setSelectedPages([])}
                                            className="text-slate-500 hover:text-slate-700 font-medium"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                                <div className="max-h-[300px] overflow-y-auto p-2 space-y-2 bg-white">
                                    {themePages.filter(p => p.is_included).map(page => {
                                        const isExisting = storePages.some(sp => sp.slug === page.slug);
                                        const isSelected = selectedPages.includes(page.slug);

                                        return (
                                            <div
                                                key={page.id}
                                                onClick={() => handleTogglePage(page.slug)}
                                                className={`
                                                flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all select-none
                                                ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50/20'
                                                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                                    }
                                            `}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className={`
                                                    h-5 w-5 rounded border flex items-center justify-center transition-colors
                                                    ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}
                                                `}>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-800 text-sm">{page.name}</h4>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-[10px] text-slate-400">/{page.slug}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pl-4">
                                                    {isExisting ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                                                            Overwrite
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 uppercase tracking-wider">
                                                            Create New
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            <strong>{selectedPages.length}</strong> pages selected
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="secondary" onClick={onClose} disabled={applying}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleApply}
                                isLoading={applying}
                                disabled={selectedPages.length === 0 || loading}
                            >
                                Apply Pages
                                <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
