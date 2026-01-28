import React from 'react';
import {
    AlignLeft, AlignCenter, AlignRight, Eye, EyeOff, Layout,
    Smartphone, Monitor, Type, Image as ImageIcon, Box, Tag,
    Percent, DollarSign
} from 'lucide-react';

/* Simple components for the properties panel */
const Section = ({ title, children, icon: Icon }) => (
    <div className="space-y-4 border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center space-x-2">
            {Icon && <Icon className="h-3 w-3" />}
            <span>{title}</span>
        </label>
        {children}
    </div>
);

const Select = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 block">{label}</label>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.message || opt.label}</option>
            ))}
        </select>
    </div>
);

const Toggle = ({ label, checked, onChange }) => (
    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <button
            onClick={() => onChange(!checked)}
            className={`p-1.5 rounded-lg transition-colors ${checked ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}
        >
            {checked ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
    </div>
);

const ColorInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <div className="flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-mono uppercase">{value}</span>
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="h-6 w-8 rounded border border-slate-200 cursor-pointer overflow-hidden p-0"
            />
        </div>
    </div>
);

const NumberInput = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-16 p-1 text-xs border border-slate-200 rounded text-right bg-slate-50"
        />
    </div>
);

export function ProductDetailProperties({ settings, onUpdate }) {
    const update = (key, value) => onUpdate({ ...settings, [key]: value });

    return (
        <div className="space-y-2">

            {/* 1. MEDIA */}
            <Section title="Product Media" icon={ImageIcon}>
                <Select
                    label="Layout"
                    value={settings.mediaLayout || 'grid'}
                    onChange={(val) => update('mediaLayout', val)}
                    options={[
                        { value: 'grid', label: 'Grid' },
                        { value: 'slider', label: 'Slider/Carousel' },
                        { value: 'stacked', label: 'Stacked Vertical' }
                    ]}
                />
                <Select
                    label="Aspect Ratio"
                    value={settings.aspectRatio || 'square'}
                    onChange={(val) => update('aspectRatio', val)}
                    options={[
                        { value: 'auto', label: 'Auto (Original)' },
                        { value: 'square', label: 'Square (1:1)' },
                        { value: 'portrait', label: 'Portrait (3:4)' },
                        { value: 'landscape', label: 'Landscape (4:3)' }
                    ]}
                />
                <Select
                    label="Thumbnails Position"
                    value={settings.thumbPosition || 'bottom'}
                    onChange={(val) => update('thumbPosition', val)}
                    options={[
                        { value: 'bottom', label: 'Bottom' },
                        { value: 'left', label: 'Left' },
                        { value: 'right', label: 'Right' }, // Added right just in case
                        { value: 'hide', label: 'Hide Thumbnails' }
                    ]}
                />
                <div className="grid grid-cols-2 gap-2">
                    <Toggle label="Zoom Hover" checked={settings.enableZoom !== false} onChange={(v) => update('enableZoom', v)} />
                    <Toggle label="Lightbox" checked={settings.enableLightbox !== false} onChange={(v) => update('enableLightbox', v)} />
                </div>
            </Section>

            {/* 2. TITLE */}
            <Section title="Product Title" icon={Type}>
                <Select
                    label="Tag & Size"
                    value={`${settings.titleTag || 'h1'}-${settings.titleSize || '3xl'}`}
                    onChange={(val) => {
                        const [tag, size] = val.split('-');
                        onUpdate({ ...settings, titleTag: tag, titleSize: size });
                    }}
                    options={[
                        { value: 'h1-4xl', label: 'H1 - Extra Large' },
                        { value: 'h1-3xl', label: 'H1 - Large' },
                        { value: 'h2-2xl', label: 'H2 - Medium' },
                        { value: 'h3-xl', label: 'H3 - Small' }
                    ]}
                />
                <Select
                    label="Font Weight"
                    value={settings.titleWeight || 'bold'}
                    onChange={(val) => update('titleWeight', val)}
                    options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'bold', label: 'Bold' },
                        { value: 'extrabold', label: 'Extra Bold' }
                    ]}
                />
                <div className="flex gap-2">
                    <button
                        onClick={() => update('alignment', 'left')}
                        className={`flex-1 p-2 border rounded ${settings.alignment === 'left' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                        <AlignLeft className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                        onClick={() => update('alignment', 'center')}
                        className={`flex-1 p-2 border rounded ${settings.alignment === 'center' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                        <AlignCenter className="h-4 w-4 mx-auto" />
                    </button>
                    <button
                        onClick={() => update('alignment', 'right')}
                        className={`flex-1 p-2 border rounded ${settings.alignment === 'right' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                    >
                        <AlignRight className="h-4 w-4 mx-auto" />
                    </button>
                </div>
                <ColorInput label="Text Color" value={settings.titleColor || '#0f172a'} onChange={(v) => update('titleColor', v)} />
            </Section>

            {/* 3. PRICE */}
            <Section title="Price & Display" icon={DollarSign}>
                <Toggle label="Show Price" checked={settings.showPrice !== false} onChange={(v) => update('showPrice', v)} />
                <Toggle label="Show Discount Badge" checked={settings.showDiscount !== false} onChange={(v) => update('showDiscount', v)} />
                <ColorInput label="Price Color" value={settings.priceColor || '#4f46e5'} onChange={(v) => update('priceColor', v)} />
                <ColorInput label="Compare Price Color" value={settings.compareColor || '#94a3b8'} onChange={(v) => update('compareColor', v)} />
            </Section>

            {/* 4. DESCRIPTION */}
            <Section title="Description" icon={AlignLeft}>
                <Toggle label="Show Description" checked={settings.showDescription !== false} onChange={(v) => update('showDescription', v)} />
                <Select
                    label="Width"
                    value={settings.descWidth || 'full'}
                    onChange={(val) => update('descWidth', val)}
                    options={[
                        { value: 'full', label: 'Full Width' },
                        { value: 'compact', label: 'Compact / Narrow' }
                    ]}
                />
            </Section>

            {/* 5. STOCK */}
            <Section title="Stock Status" icon={Box}>
                <Toggle label="Show Stock Label" checked={settings.showStock !== false} onChange={(v) => update('showStock', v)} />
                {settings.showStock !== false && (
                    <>
                        <NumberInput label="Low Stock Threshold" value={settings.lowStockThreshold || 5} onChange={(v) => update('lowStockThreshold', v)} />
                        <ColorInput label="In Stock Color" value={settings.inStockColor || '#15803d'} onChange={(v) => update('inStockColor', v)} />
                        <ColorInput label="Low Stock Color" value={settings.lowStockColor || '#b45309'} onChange={(v) => update('lowStockColor', v)} />
                        <ColorInput label="Out of Stock Color" value={settings.outOfStockColor || '#b91c1c'} onChange={(v) => update('outOfStockColor', v)} />
                    </>
                )}
            </Section>





            {/* 8. RELATED PRODUCTS */}
            <Section title="Related Products" icon={Box}>
                <Toggle label="Show Related" checked={settings.showRelated !== false} onChange={(v) => update('showRelated', v)} />
                {settings.showRelated !== false && (
                    <>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-600">Section Title</label>
                            <input
                                type="text"
                                value={settings.relatedTitle || 'You might also like'}
                                onChange={(e) => update('relatedTitle', e.target.value)}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <NumberInput label="Limit Items" value={settings.relatedLimit || 4} onChange={(v) => update('relatedLimit', v)} />
                    </>
                )}
            </Section>

        </div >
    );
}
