
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Settings2, Plus, Trash2, Wand2, Package, Check, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';

const COMMON_ATTRIBUTES = ['Size', 'Color', 'Material', 'Style', 'Fit', 'Fabric'];

export function AttributesManagerModal({ isOpen, product, storeId, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Custom attributes from DB
    const [customAttributesDB, setCustomAttributesDB] = useState([]);

    // Step 1: Selected Attributes (just names)
    const [selectedAttributes, setSelectedAttributes] = useState([]); // { name: '' }

    // Step 2: Configured Variants
    const [variants, setVariants] = useState([]); // { combination: { Size: 'Small' }, price: 0, ... }

    useEffect(() => {
        if (isOpen && product) {
            fetchInitialData();
        }
    }, [isOpen, product]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch custom attributes for this store
            const { data: dbAttrs, error: attrError } = await supabase
                .from('attributes')
                .select('name')
                .eq('store_id', storeId);

            if (attrError) throw attrError;
            setCustomAttributesDB(dbAttrs?.map(a => a.name) || []);

            // 2. Fetch existing variants to pre-populate
            const { data, error: variantError } = await supabase
                .from('product_variants')
                .select('*')
                .eq('product_id', product.id);

            if (variantError) throw variantError;
            if (data && data.length > 0) {
                setVariants(data);

                // Derive selected attribute names from existing variants
                const firstCombo = data[0].combination || {};
                const keys = Object.keys(firstCombo);
                const derived = keys.map(key => ({ name: key }));
                setSelectedAttributes(derived);
            }
        } catch (err) {
            console.error('Initial fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !product) return null;

    const addAttribute = async (name = '') => {
        const trimmedName = name.trim();
        if (!trimmedName || selectedAttributes.some(a => a.name === trimmedName)) return;

        // If it's a new "Custom" attribute (not in common or DB), save it to DB
        const isCommon = COMMON_ATTRIBUTES.includes(trimmedName);
        const isExistingCustom = customAttributesDB.includes(trimmedName);

        if (!isCommon && !isExistingCustom) {
            try {
                const { error } = await supabase
                    .from('attributes')
                    .insert([{ name: trimmedName, store_id: storeId }]);

                if (error) throw error;
                setCustomAttributesDB([...customAttributesDB, trimmedName]);
            } catch (err) {
                console.error('Failed to save attribute:', err);
            }
        }

        setSelectedAttributes([...selectedAttributes, { name: trimmedName }]);
    };

    const removeAttribute = (index) => {
        const newAttrs = [...selectedAttributes];
        newAttrs.splice(index, 1);
        setSelectedAttributes(newAttrs);
    };

    const prepareConfigStep = () => {
        if (selectedAttributes.length === 0) return;

        // If no variants exist, start with one blank one
        if (variants.length === 0) {
            const combo = {};
            selectedAttributes.forEach(a => combo[a.name] = '');
            setVariants([{
                combination: combo,
                price: product.price,
                quantity: 0,
                image_urls: product.image_urls || [],
                use_base_price: true
            }]);
        }
        setStep(2);
    };

    const removeVariant = (index) => {
        const newV = [...variants];
        newV.splice(index, 1);
        setVariants(newV);
    };

    const handleSave = async () => {
        if (variants.length === 0) {
            setError("No variants to save. Please add at least one variation.");
            return;
        }

        // Validation: Ensure all variants have at least one attribute filled
        const invalidVariant = variants.find(v => {
            const values = Object.values(v.combination);
            return values.length > 0 && values.some(val => !val || val.trim() === '');
        });

        if (invalidVariant) {
            setError("Some variations have empty attribute values. Please fill them in or remove those variants.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare payload
            const payload = variants.map(v => ({
                product_id: product.id,
                combination: v.combination,
                price: v.use_base_price ? product.price : parseFloat(v.price),
                quantity: parseInt(v.quantity) || 0,
                image_urls: v.image_urls,
                is_active: true,
                use_base_price: v.use_base_price ?? true
            }));

            // We use a "delete then insert" pattern. 
            // Warning: If insert fails, variants are deleted. 
            // Better to perform insert first, but unique constraints might interfere.
            // Since variants change sets (new subsets/supersets), absolute deletion is cleanest.

            const { error: delError } = await supabase.from('product_variants').delete().eq('product_id', product.id);
            if (delError) throw delError;

            const { error: insError } = await supabase.from('product_variants').insert(payload);

            if (insError) {
                // If insert fails after delete, it's a critical state.
                // We show a specialized error.
                if (insError.message?.includes('use_base_price')) {
                    throw new Error("Database Error: The 'use_base_price' column hasn't been added to your database yet. Please run the SQL command provided in the previous step.");
                }
                throw insError;
            }

            onSuccess();
        } catch (err) {
            console.error('Save error:', err);
            setError(err.message || "An unexpected error occurred while saving.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full z-50">
                    {/* Header */}
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Settings2 className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Manage Variants</h3>
                                <p className="text-xs text-slate-500 font-medium">Product: {product.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Stepper */}
                    <div className="px-6 py-4 bg-white border-b border-slate-50 flex items-center space-x-4">
                        <StepIndicator active={step === 1} number={1} label="Choose Attributes" />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                        <StepIndicator active={step === 2} number={2} label="Configure Variants" />
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Available Attributes</h4>
                                        <div className="space-y-4">
                                            {/* Common Attributes */}
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tight">Global Defaults</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {COMMON_ATTRIBUTES.map(attr => (
                                                        <AttributeButton
                                                            key={attr}
                                                            name={attr}
                                                            isSelected={selectedAttributes.some(a => a.name === attr)}
                                                            onClick={addAttribute}
                                                        />
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Custom Attributes DB */}
                                            {customAttributesDB.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-tight">Your Custom Attributes</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {customAttributesDB.map(attr => (
                                                            <AttributeButton
                                                                key={attr}
                                                                name={attr}
                                                                isSelected={selectedAttributes.some(a => a.name === attr)}
                                                                onClick={addAttribute}
                                                                isCustom
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Create New Attribute</h4>
                                        <div className="flex space-x-2">
                                            <Input
                                                id="custom-attr"
                                                placeholder="e.g. Storage, Style"
                                                className="flex-1"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addAttribute(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                            <Button onClick={() => {
                                                const el = document.getElementById('custom-attr');
                                                addAttribute(el.value);
                                                el.value = '';
                                            }}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">Newly created attributes will be saved for your store automatically.</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-700 mb-4">Selected Attributes</h4>
                                    {selectedAttributes.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">No attributes selected yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {selectedAttributes.map((attr, idx) => (
                                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="font-bold text-slate-700 text-sm">{attr.name}</span>
                                                    <button onClick={() => removeAttribute(idx)} className="text-red-400 hover:text-red-600 p-1">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-slate-800">Configure Variants</h4>
                                        <p className="text-xs text-slate-500">Set attribute values, price, and stock for each variation.</p>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => {
                                                const combo = {};
                                                selectedAttributes.forEach(a => combo[a.name] = '');
                                                setVariants([...variants, {
                                                    combination: combo,
                                                    price: product.price,
                                                    quantity: 0,
                                                    image_urls: product.image_urls || [],
                                                    use_base_price: true
                                                }]);
                                            }}
                                            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 px-3 py-1 rounded-lg flex items-center shadow-sm"
                                        >
                                            <Plus className="h-3 w-3 mr-1" />
                                            Add Another Variation
                                        </button>
                                        <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                            Total: {variants.length} Variants
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    {variants.map((v, vIdx) => (
                                        <div key={vIdx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:ring-2 active:ring-indigo-500">
                                            {/* Variant Identity Bar - NOW EDITABLE */}
                                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex flex-wrap gap-4">
                                                    {selectedAttributes.map((attr) => (
                                                        <div key={attr.name} className="flex items-center space-x-2">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{attr.name}:</span>
                                                            <input
                                                                type="text"
                                                                placeholder={`e.g. ${attr.name === 'Size' ? 'Large' : attr.name === 'Color' ? 'Yellow' : 'Value'}`}
                                                                className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-indigo-500 w-24"
                                                                value={v.combination[attr.name] || ''}
                                                                onChange={(e) => {
                                                                    const newV = [...variants];
                                                                    newV[vIdx].combination[attr.name] = e.target.value;
                                                                    setVariants(newV);
                                                                }}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">Variant #{vIdx + 1}</span>
                                                    <button
                                                        onClick={() => removeVariant(vIdx)}
                                                        title="Delete this variation"
                                                        className="text-red-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-6">
                                                {/* Variant Images */}
                                                <div className="md:col-span-4 space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Variant Gallery</label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(v.image_urls || []).map((url, imgIdx) => (
                                                            <div key={imgIdx} className="relative h-12 w-12 rounded-lg overflow-hidden border border-slate-200 group">
                                                                <img src={url} alt="Variant" className="h-full w-full object-cover" />
                                                                <button
                                                                    onClick={() => {
                                                                        const newV = [...variants];
                                                                        newV[vIdx].image_urls.splice(imgIdx, 1);
                                                                        setVariants(newV);
                                                                    }}
                                                                    className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <button
                                                            onClick={() => document.getElementById(`variant-upload-${vIdx}`).click()}
                                                            className="h-12 w-12 rounded-lg bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                        <input
                                                            type="file"
                                                            id={`variant-upload-${vIdx}`}
                                                            className="hidden"
                                                            multiple
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                const files = Array.from(e.target.files);
                                                                if (files.length > 0) {
                                                                    setLoading(true);
                                                                    try {
                                                                        const newUrls = [];
                                                                        for (const file of files) {
                                                                            const fileExt = file.name.split('.').pop();
                                                                            const fileName = `${storeId}/${Math.random()}.${fileExt}`;
                                                                            const filePath = `products/variants/${fileName}`;
                                                                            await supabase.storage.from('products').upload(filePath, file);
                                                                            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
                                                                            newUrls.push(publicUrl);
                                                                        }
                                                                        const newV = [...variants];
                                                                        newV[vIdx].image_urls = [...(newV[vIdx].image_urls || []), ...newUrls];
                                                                        setVariants(newV);
                                                                    } finally {
                                                                        setLoading(false);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Variant Pricing & Stock */}
                                                <div className="md:col-span-8 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Variant Price ($)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                disabled={v.use_base_price}
                                                                className={`w-full pl-6 pr-3 py-2 border rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all ${v.use_base_price ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white text-slate-900 border-slate-200'}`}
                                                                value={v.use_base_price ? product.price : (v.price || product.price)}
                                                                onChange={(e) => {
                                                                    const newV = [...variants];
                                                                    newV[vIdx].price = e.target.value;
                                                                    setVariants(newV);
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="mt-2 flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`price-link-${vIdx}`}
                                                                className="h-3 w-3 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                                checked={v.use_base_price !== false}
                                                                onChange={(e) => {
                                                                    const newV = [...variants];
                                                                    newV[vIdx].use_base_price = e.target.checked;
                                                                    setVariants(newV);
                                                                }}
                                                            />
                                                            <label htmlFor={`price-link-${vIdx}`} className="text-[10px] font-bold text-slate-500 uppercase tracking-tight cursor-pointer">Use Base Product Price</label>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Variant Stock</label>
                                                        <div className="relative">
                                                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                                                            <input
                                                                type="number"
                                                                className="w-full pl-10 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                                value={v.quantity || 0}
                                                                onChange={(e) => {
                                                                    const newV = [...variants];
                                                                    newV[vIdx].quantity = e.target.value;
                                                                    setVariants(newV);
                                                                }}
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <p className="mt-2 text-[10px] text-slate-400 font-medium italic">Unique inventory for this variation.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div>
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Back
                                </button>
                            )}
                            {step === 1 && variants.length > 0 && (
                                <button
                                    onClick={() => setStep(3)}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors"
                                >
                                    Skip to Configuration
                                </button>
                            )}
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            {step < 2 ? (
                                <Button
                                    onClick={prepareConfigStep}
                                    disabled={selectedAttributes.length === 0}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleSave} isLoading={loading}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Save Variants
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-xs font-medium border-t border-red-100">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}

function StepIndicator({ active, number, label }) {
    return (
        <div className={`flex items-center space-x-2 ${active ? 'opacity-100' : 'opacity-40'}`}>
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${active ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {number}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? 'text-indigo-600' : 'text-slate-500'}`}>
                {label}
            </span>
        </div>
    );
}

function AttributeButton({ name, isSelected, onClick, isCustom = false }) {
    return (
        <button
            type="button"
            onClick={() => onClick(name)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center ${isSelected
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                }`}
        >
            {isCustom && <div className="w-1 h-1 bg-amber-400 rounded-full mr-2" title="Store specific" />}
            {name}
        </button>
    );
}
