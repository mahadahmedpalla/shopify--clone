import React from 'react';

export const CheckoutProperties = ({ settings, onUpdate }) => {
    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">General Colors</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Page Background</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={settings?.backgroundColor || '#ffffff'}
                                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                className="w-full text-xs border-slate-200 rounded"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings?.textColor || '#0f172a'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={settings?.textColor || '#0f172a'}
                                onChange={(e) => handleChange('textColor', e.target.value)}
                                className="w-full text-xs border-slate-200 rounded"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Buttons & Accents</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Primary Color (Buttons/Links)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings?.primaryColor || '#4f46e5'}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={settings?.primaryColor || '#4f46e5'}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="w-full text-xs border-slate-200 rounded"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Button Text Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings?.primaryTextColor || '#ffffff'}
                                onChange={(e) => handleChange('primaryTextColor', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer border-0"
                            />
                            <input
                                type="text"
                                value={settings?.primaryTextColor || '#ffffff'}
                                onChange={(e) => handleChange('primaryTextColor', e.target.value)}
                                className="w-full text-xs border-slate-200 rounded"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mt-4">
                <p className="text-[10px] text-blue-800 leading-tight">
                    <strong>Note:</strong> The layout of the checkout page is standardized for security and conversion optimization. You can customize colors to match your brand.
                </p>
            </div>
        </div>
    );
};
