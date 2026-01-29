import React from 'react';
import { Type, Grid, Box, DollarSign, ListFilter, Layers, ArrowRight, LayoutGrid, Rows } from 'lucide-react';

/* Reusable UI Components for Polished Look */
const SectionHeader = ({ title, icon: Icon }) => (
    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center">
            {Icon && <Icon className="w-3 h-3 mr-2 text-slate-400" />}
            {title}
        </h4>
    </div>
);

const VisualSelector = ({ value, options, onChange }) => (
    <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
            <button
                key={opt.value}
                onClick={() => onChange(opt.value)}
                className={`p-3 rounded-xl border text-left transition-all ${value === opt.value
                    ? 'border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
            >
                <div className="mb-2 text-indigo-600">
                    {opt.icon}
                </div>
                <span className={`block text-[10px] font-bold uppercase tracking-wider ${value === opt.value ? 'text-indigo-700' : 'text-slate-500'
                    }`}>
                    {opt.label}
                </span>
                <span className="block text-[10px] text-slate-400 mt-1 leading-tight">
                    {opt.description}
                </span>
            </button>
        ))}
    </div>
);

const FancySelect = ({ label, value, onChange, options }) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-slate-500 block">{label}</label>
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full appearance-none text-sm p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700 transition-shadow"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ArrowRight className="h-3 w-3 rotate-90" />
            </div>
        </div>
    </div>
);

const ToggleCard = ({ label, subLabel, icon: Icon, check, onChange }) => (
    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer bg-white group">
        <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-colors ${check ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
                {Icon && <Icon className="w-4 h-4" />}
            </div>
            <div>
                <span className="text-sm font-bold text-slate-700 block">{label}</span>
                {subLabel && <span className="text-[10px] text-slate-400 block">{subLabel}</span>}
            </div>
        </div>
        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${check ? 'bg-indigo-600' : 'bg-slate-200'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${check ? 'translate-x-4' : ''}`} />
        </div>
        <input
            type="checkbox"
            checked={check}
            onChange={(e) => onChange(e.target.checked)}
            className="hidden"
        />
    </label>
);

export const RelatedProductsProperties = ({ settings, onUpdate, categories = [] }) => {
    const handleChange = (key, value) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="space-y-8">

            {/* SECTION 1: DATA SOURCE */}
            <div className="space-y-4">
                <SectionHeader title="Data Source" icon={ListFilter} />

                <div className="space-y-3">
                    <FancySelect
                        label="Product Source"
                        value={settings.source || 'same_category'}
                        onChange={(v) => handleChange('source', v)}
                        options={[
                            { value: 'same_category', label: 'Match Current Category (Dynamic)' },
                            { value: 'all_products', label: 'All Products (Random Mix)' },
                            { value: 'specific_category', label: 'Specific Category (Fixed)' }
                        ]}
                    />

                    {settings.source === 'specific_category' && (
                        <div className="pl-2 border-l-2 border-indigo-100 ml-1">
                            <FancySelect
                                label="Target Category"
                                value={settings.targetCategoryId || ''}
                                onChange={(v) => handleChange('targetCategoryId', v)}
                                options={[
                                    { value: '', label: 'Select a category...' },
                                    ...categories.map(c => ({ value: c.id, label: c.name }))
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* SECTION 2: LAYOUT */}
            <div className="space-y-4">
                <SectionHeader title="Layout Mode" icon={Grid} />

                <VisualSelector
                    value={settings.layoutMode || 'grid'}
                    onChange={(v) => handleChange('layoutMode', v)}
                    options={[
                        {
                            value: 'grid',
                            label: 'Grid',
                            description: 'Multi-row standard grid',
                            icon: <LayoutGrid className="w-5 h-5" />
                        },
                        {
                            value: 'slider',
                            label: 'Slider',
                            description: 'Horizontal scroll row',
                            icon: <Rows className="w-5 h-5" />
                        }
                    ]}
                />

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Limit</label>
                        <input
                            type="number"
                            min={1}
                            max={20}
                            value={settings.relatedLimit || 4}
                            onChange={(e) => handleChange('relatedLimit', parseInt(e.target.value))}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Gap</label>
                        <select
                            value={settings.itemGap || 'normal'}
                            onChange={(e) => handleChange('itemGap', e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:ring-indigo-500"
                        >
                            <option value="tight">Tight</option>
                            <option value="normal">Normal</option>
                            <option value="loose">Loose</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECTION 3: CONTENT & DISPLAY */}
            <div className="space-y-4">
                <SectionHeader title="Display Settings" icon={Type} />

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Section Title</label>
                        <input
                            type="text"
                            value={settings.relatedTitle || ''}
                            onChange={(e) => handleChange('relatedTitle', e.target.value)}
                            placeholder="You might also like..."
                            className="w-full p-3 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-shadow"
                        />
                    </div>

                    <ToggleCard
                        label="Show Price"
                        subLabel="Display product price"
                        icon={DollarSign}
                        check={settings.showPrice !== false}
                        onChange={(v) => handleChange('showPrice', v)}
                    />

                    <ToggleCard
                        label="Show Discount"
                        subLabel="Show sale price & savings"
                        icon={DollarSign}
                        check={settings.showDiscount === true}
                        onChange={(v) => handleChange('showDiscount', v)}
                    />

                    <ToggleCard
                        label="Show Rating"
                        subLabel="Display star rating"
                        icon={Box} // Using Box as generic icon if Star not imported, checking imports... Star is not imported in Properties. Using Type/Grid/Box available.
                        check={settings.showRating === true}
                        onChange={(v) => handleChange('showRating', v)}
                    />

                    <ToggleCard
                        label="Show Description"
                        subLabel="Show short description"
                        icon={Type}
                        check={settings.showDescription === true}
                        onChange={(v) => handleChange('showDescription', v)}
                    />
                </div>
            </div>

        </div>
    );
};
