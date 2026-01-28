import React from 'react';
import { Type, Grid, Box, DollarSign, ListFilter, Layers } from 'lucide-react';

/* Simple components for the properties panel */
const Section = ({ title, children, icon: Icon }) => (
    <div className="space-y-4 border-b border-slate-100 pb-6 mb-6 last:border-0 last:pb-0 last:mb-0">
        <label className="text-[10px] font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-2">
            {Icon && <Icon className="h-3 w-3 text-slate-400" />}
            <span>{title}</span>
        </label>
        {children}
    </div>
);

const NumberInput = ({ label, value, onChange, min = 1, max = 12 }) => (
    <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-16 p-1 text-xs border border-slate-200 rounded text-right bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500"
        />
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
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export const RelatedProductsProperties = ({ settings, onUpdate, categories = [] }) => {
    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-2">

            {/* CONTENT */}
            <Section title="Content" icon={Type}>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">Section Title</label>
                    <input
                        type="text"
                        value={settings.relatedTitle || ''}
                        onChange={(e) => handleChange('relatedTitle', e.target.value)}
                        placeholder="e.g. You might also like"
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                </div>
            </Section>

            {/* DATA SOURCE */}
            <Section title="Data Source" icon={ListFilter}>
                <Select
                    label="Products Source"
                    value={settings.source || 'same_category'}
                    onChange={(v) => handleChange('source', v)}
                    options={[
                        { value: 'same_category', label: 'Same as Current Product' },
                        { value: 'all_products', label: 'All Products (Random)' },
                        { value: 'specific_category', label: 'Specific Category' }
                    ]}
                />

                {settings.source === 'specific_category' && (
                    <Select
                        label="Select Category"
                        value={settings.targetCategoryId || ''}
                        onChange={(v) => handleChange('targetCategoryId', v)}
                        options={[
                            { value: '', label: 'Select a category...' },
                            ...categories.map(c => ({ value: c.id, label: c.name }))
                        ]}
                    />
                )}
            </Section>

            {/* LAYOUT */}
            <Section title="Layout" icon={Grid}>
                <Select
                    label="Display Mode"
                    value={settings.layoutMode || 'grid'}
                    onChange={(v) => handleChange('layoutMode', v)}
                    options={[
                        { value: 'grid', label: 'Grid (Multi-row)' },
                        { value: 'slider', label: 'Slider (Horizontal Scroll)' }
                    ]}
                />

                <NumberInput
                    label="Product Limit"
                    value={settings.relatedLimit || 4}
                    onChange={(v) => handleChange('relatedLimit', v)}
                    max={20}
                />

                <Select
                    label="Spacing (Gap)"
                    value={settings.itemGap || 'normal'}
                    onChange={(v) => handleChange('itemGap', v)}
                    options={[
                        { value: 'tight', label: 'Tight' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'loose', label: 'Loose' }
                    ]}
                />
            </Section>

            {/* DISPLAY */}
            <Section title="Display" icon={Box}>
                <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white">
                    <div className="flex items-center space-x-2">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700">Show Price</span>
                    </div>
                    <input
                        type="checkbox"
                        checked={settings.showPrice !== false}
                        onChange={(e) => handleChange('showPrice', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                </label>
            </Section>

        </div>
    );
};
