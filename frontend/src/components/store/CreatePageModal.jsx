import React, { useState, useEffect } from 'react';
import { X, Globe } from 'lucide-react';

export function CreatePageModal({ isOpen, onClose, onSubmit, loading }) {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [isManualSlug, setIsManualSlug] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName('');
            setSlug('');
            setIsManualSlug(false);
        }
    }, [isOpen]);

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        if (!isManualSlug) {
            setSlug(newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !slug) return;
        onSubmit(name, slug);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="font-bold text-slate-800">Create New Page</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-200 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Page Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. About Us, Landing Page"
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Slug</label>
                        <div className="flex items-center">
                            <span className="px-3 py-2 bg-slate-100 border border-r-0 border-slate-200 rounded-l-lg text-slate-500 text-sm font-mono">/pages/</span>
                            <input
                                type="text"
                                value={slug}
                                onChange={(e) => {
                                    setSlug(e.target.value);
                                    setIsManualSlug(true);
                                }}
                                placeholder="about-us"
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-sm"
                            />
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400">The URL address where this page will be accessible.</p>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name || !slug || loading}
                            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? <span className="animate-spin">⏳</span> : <Globe className="w-4 h-4" />}
                            Create Page
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
