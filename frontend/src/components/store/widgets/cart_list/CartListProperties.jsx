import React from 'react';

// Common options
const SIZES = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
    { label: 'Large', value: 'large' },
];

const SHAPES = [
    { label: 'Square', value: 'square' },
    { label: 'Rounded', value: 'rounded' },
];

const ALIGNMENTS = [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
];

const BADGE_STYLES = [
    { label: 'Pill', value: 'pill' },
    { label: 'Tag', value: 'tag' },
];

export const CartListProperties = ({ settings, onUpdate }) => {
    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="p-4 space-y-6">

            {/* Features Section */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Feature Visibility</h3>
                <div className="space-y-3">
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Discount Row</span>
                        <input
                            type="checkbox"
                            checked={settings?.showDiscountSummary !== false}
                            onChange={(e) => handleChange('showDiscountSummary', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Tax Estimate</span>
                        <input
                            type="checkbox"
                            checked={settings?.showTaxSummary !== false}
                            onChange={(e) => handleChange('showTaxSummary', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Item Row Style */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Item Row Style</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Image Size</label>
                        <select
                            value={settings?.imageSize || 'medium'}
                            onChange={(e) => handleChange('imageSize', e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-md"
                        >
                            {SIZES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Image Shape</label>
                        <select
                            value={settings?.imageShape || 'rounded'}
                            onChange={(e) => handleChange('imageShape', e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-md"
                        >
                            {SHAPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Text Alignment</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {ALIGNMENTS.map(a => (
                                <button
                                    key={a.value}
                                    onClick={() => handleChange('textAlignment', a.value)}
                                    className={`flex-1 text-xs py-1.5 rounded-md transition-all ${(settings?.textAlignment || 'left') === a.value
                                        ? 'bg-white shadow-sm text-slate-900 font-medium'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Price Display */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Price Display</h3>
                <div className="space-y-3">
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Unit Price</span>
                        <input
                            type="checkbox"
                            checked={settings?.showUnitPrice !== false}
                            onChange={(e) => handleChange('showUnitPrice', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Item Subtotal</span>
                        <input
                            type="checkbox"
                            checked={settings?.showItemSubtotal !== false}
                            onChange={(e) => handleChange('showItemSubtotal', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Discounted Badge</span>
                        <input
                            type="checkbox"
                            checked={settings?.showDiscountBadge !== false}
                            onChange={(e) => handleChange('showDiscountBadge', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>

                    {(settings?.showDiscountBadge !== false) && (
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Badge Style</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {BADGE_STYLES.map(s => (
                                    <button
                                        key={s.value}
                                        onClick={() => handleChange('badgeStyle', s.value)}
                                        className={`flex-1 text-xs py-1.5 rounded-md transition-all ${(settings?.badgeStyle || 'pill') === s.value
                                            ? 'bg-white shadow-sm text-slate-900 font-medium'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Summary Styles */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Summary Rows</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Row Spacing</label>
                        <select
                            value={settings?.summarySpacing || 'normal'}
                            onChange={(e) => handleChange('summarySpacing', e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-md"
                        >
                            <option value="tight">Tight</option>
                            <option value="normal">Normal</option>
                            <option value="relaxed">Relaxed</option>
                        </select>
                    </div>
                    <label className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Show Dividers</span>
                        <input
                            type="checkbox"
                            checked={settings?.summaryDividers !== false}
                            onChange={(e) => handleChange('summaryDividers', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </label>
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Drawer Content & Styling */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Drawer Announcements</h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Global</span>
                </div>

                {/* Announcement 1 */}
                <div className="space-y-4 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Announcement Bar 1</span>
                        <input
                            type="checkbox"
                            checked={settings?.showAnnouncement1 !== false}
                            onChange={(e) => handleChange('showAnnouncement1', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </div>
                    {settings?.showAnnouncement1 !== false && (
                        <div className="space-y-3">
                            <textarea
                                value={settings?.announcement1Text || ''}
                                onChange={(e) => handleChange('announcement1Text', e.target.value)}
                                className="w-full text-sm border-slate-200 rounded-md h-16"
                                placeholder="Free shipping on orders over $50!"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Background</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings?.announcement1Bg || '#eef2ff'} onChange={(e) => handleChange('announcement1Bg', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                        <input type="text" value={settings?.announcement1Bg || '#eef2ff'} onChange={(e) => handleChange('announcement1Bg', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings?.announcement1Color || '#4338ca'} onChange={(e) => handleChange('announcement1Color', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                        <input type="text" value={settings?.announcement1Color || '#4338ca'} onChange={(e) => handleChange('announcement1Color', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Font Weight</label>
                                <select
                                    value={settings?.announcement1Weight || 'medium'}
                                    onChange={(e) => handleChange('announcement1Weight', e.target.value)}
                                    className="w-full text-xs border-slate-200 rounded"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="bold">Bold</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Announcement 2 */}
                <div className="space-y-4 mb-6 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">Announcement Bar 2</span>
                        <input
                            type="checkbox"
                            checked={settings?.showAnnouncement2 === true}
                            onChange={(e) => handleChange('showAnnouncement2', e.target.checked)}
                            className="toggle checkbox-sm"
                        />
                    </div>
                    {settings?.showAnnouncement2 === true && (
                        <div className="space-y-3">
                            <textarea
                                value={settings?.announcement2Text || ''}
                                onChange={(e) => handleChange('announcement2Text', e.target.value)}
                                className="w-full text-sm border-slate-200 rounded-md h-16"
                                placeholder="Special discount code: SAVE20"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Background</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings?.announcement2Bg || '#fff1f2'} onChange={(e) => handleChange('announcement2Bg', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                        <input type="text" value={settings?.announcement2Bg || '#fff1f2'} onChange={(e) => handleChange('announcement2Bg', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={settings?.announcement2Color || '#be123c'} onChange={(e) => handleChange('announcement2Color', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                        <input type="text" value={settings?.announcement2Color || '#be123c'} onChange={(e) => handleChange('announcement2Color', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Font Weight</label>
                                <select
                                    value={settings?.announcement2Weight || 'medium'}
                                    onChange={(e) => handleChange('announcement2Weight', e.target.value)}
                                    className="w-full text-xs border-slate-200 rounded"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="medium">Medium</option>
                                    <option value="bold">Bold</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <hr className="border-slate-100" />

            {/* Checkout Button Styling */}
            <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-3">Checkout Button</h3>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Background</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={settings?.checkoutBtnBg || '#4f46e5'} onChange={(e) => handleChange('checkoutBtnBg', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                <input type="text" value={settings?.checkoutBtnBg || '#4f46e5'} onChange={(e) => handleChange('checkoutBtnBg', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] text-slate-400 mb-1">Text Color</label>
                            <div className="flex items-center gap-2">
                                <input type="color" value={settings?.checkoutBtnColor || '#ffffff'} onChange={(e) => handleChange('checkoutBtnColor', e.target.value)} className="h-8 w-8 rounded cursor-pointer border-0" />
                                <input type="text" value={settings?.checkoutBtnColor || '#ffffff'} onChange={(e) => handleChange('checkoutBtnColor', e.target.value)} className="w-full text-xs border-slate-200 rounded" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Font Weight</label>
                        <select
                            value={settings?.checkoutBtnWeight || 'bold'}
                            onChange={(e) => handleChange('checkoutBtnWeight', e.target.value)}
                            className="w-full text-xs border-slate-200 rounded"
                        >
                            <option value="normal">Normal</option>
                            <option value="medium">Medium</option>
                            <option value="bold">Bold</option>
                            <option value="extrabold">Extra Bold</option>
                        </select>
                    </div>
                </div>
            </div>

        </div>
    );
};
