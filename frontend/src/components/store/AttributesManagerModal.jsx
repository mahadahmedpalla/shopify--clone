
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Settings2, Plus, Trash2, Wand2, Package, Check, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';

const COMMON_ATTRIBUTES = ['Size', 'Color', 'Material', 'Style', 'Fit', 'Fabric'];

export function AttributesManagerModal({ isOpen, product, onClose, onSuccess }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Step 1 & 2: Selected Attributes and their values
    const [selectedAttributes, setSelectedAttributes] = useState([]); // { name: '', values: [] }

    // Step 3: Generated Variants
    const [variants, setVariants] = useState([]); // { combination: {}, price: 0, quantity: 0, image_urls: [] }

    useEffect(() => {
        if (isOpen && product) {
            fetchExistingData();
        }
    }, [isOpen, product]);

    const fetchExistingData = async () => {
        setLoading(true);
        // Fetch existing variants to pre-populate if they exist
        const { data, error } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', product.id);

        if (data && data.length > 0) {
            setVariants(data);
            // Derive attributes from existing combinations if needed, but let's start fresh for simplicity or complexity
        }
        setLoading(false);
    };

    if (!isOpen || !product) return null;

    const addAttribute = (name = '') => {
        if (selectedAttributes.some(a => a.name === name)) return;
        setSelectedAttributes([...selectedAttributes, { name, values: [] }]);
    };

    const removeAttribute = (index) => {
        const newAttrs = [...selectedAttributes];
        newAttrs.splice(index, 1);
        setSelectedAttributes(newAttrs);
    };

    const addValue = (attrIndex, val) => {
        if (!val.trim()) return;
        const newAttrs = [...selectedAttributes];
        if (newAttrs[attrIndex].values.includes(val.trim())) return;
        newAttrs[attrIndex].values.push(val.trim());
        setSelectedAttributes(newAttrs);
    };

    const removeValue = (attrIndex, valIndex) => {
        const newAttrs = [...selectedAttributes];
        newAttrs[attrIndex].values.splice(valIndex, 1);
        setSelectedAttributes(newAttrs);
    };

    const generateVariants = () => {
        if (selectedAttributes.length === 0) return;

        // Cartesian product logic
        const combinations = selectedAttributes.reduce((acc, attr) => {
            const result = [];
            attr.values.forEach(val => {
                if (acc.length === 0) {
                    result.push({ [attr.name]: val });
                } else {
                    acc.forEach(combo => {
                        result.push({ ...combo, [attr.name]: val });
                    });
                }
            });
            return result;
        }, []);

        const newVariants = combinations.map(combo => ({
            combination: combo,
            price: product.price,
            quantity: 0,
            image_urls: product.image_urls || []
        }));

        setVariants(newVariants);
        setStep(3);
    };

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Delete old variants for this product to avoid duplicates/conflicts
            await supabase.from('product_variants').delete().eq('product_id', product.id);

            // 2. Insert new variants
            const { error: insertError } = await supabase
                .from('product_variants')
                .insert(variants.map(v => ({
                    product_id: product.id,
                    combination: v.combination,
                    price: parseFloat(v.price),
                    quantity: parseInt(v.quantity) || 0,
                    image_urls: v.image_urls,
                    is_active: true
                })));

            if (insertError) throw insertError;

            onSuccess();
        } catch (err) {
            setError(err.message);
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
                        <StepIndicator active={step >= 1} number={1} label="Choose Attributes" />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                        <StepIndicator active={step >= 2} number={2} label="Set Values" />
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                        <StepIndicator active={step >= 3} number={3} label="Configure Variants" />
                    </div>

                    {/* Content */}
                    <div className="px-6 py-8 max-h-[60vh] overflow-y-auto bg-slate-50/30">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Common Attributes</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {COMMON_ATTRIBUTES.map(attr => (
                                                <button
                                                    key={attr}
                                                    onClick={() => addAttribute(attr)}
                                                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${selectedAttributes.some(a => a.name === attr)
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                                                        }`}
                                                >
                                                    {attr}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Custom Attribute</h4>
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
                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                {selectedAttributes.map((attr, attrIdx) => (
                                    <div key={attrIdx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-slate-800 flex items-center">
                                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3" />
                                                Values for {attr.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">
                                                {attr.values.length} Values
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 min-h-[40px] items-center">
                                            {attr.values.map((val, valIdx) => (
                                                <div key={valIdx} className="group flex items-center bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium">
                                                    {val}
                                                    <button onClick={() => removeValue(attrIdx, valIdx)} className="ml-2 text-slate-400 hover:text-red-500">
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                            <input
                                                type="text"
                                                placeholder="Type and press Enter..."
                                                className="bg-transparent border-none focus:ring-0 text-sm py-1.5 px-0 placeholder-slate-300"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        addValue(attrIdx, e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-400">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-slate-800">Generated Variants</h4>
                                    <p className="text-xs text-slate-500">Total variants: <b>{variants.length}</b></p>
                                </div>
                                <div className="space-y-4">
                                    {variants.map((v, vIdx) => (
                                        <div key={vIdx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group">
                                            <div className="flex flex-wrap items-center gap-6">
                                                {/* Labels */}
                                                <div className="flex-1 min-w-[150px]">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(v.combination).map(([k, val]) => (
                                                            <span key={k} className="text-[10px] font-bold uppercase tracking-tight bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 italic">
                                                                {k}: {val}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Price */}
                                                <div className="w-24">
                                                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Price</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                        <input
                                                            type="number"
                                                            className="w-full pl-5 pr-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            value={v.price}
                                                            onChange={(e) => {
                                                                const newV = [...variants];
                                                                newV[vIdx].price = e.target.value;
                                                                setVariants(newV);
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Stock */}
                                                <div className="w-20">
                                                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Stock</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                        value={v.quantity}
                                                        onChange={(e) => {
                                                            const newV = [...variants];
                                                            newV[vIdx].quantity = e.target.value;
                                                            setVariants(newV);
                                                        }}
                                                    />
                                                </div>

                                                {/* Image Override */}
                                                <div className="flex flex-col items-center">
                                                    <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Image</label>
                                                    <button className="h-10 w-10 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-200 transition-colors">
                                                        {v.image_urls && v.image_urls[0] ? (
                                                            <img src={v.image_urls[0]} alt="Variant" className="h-full w-full object-cover rounded-lg" />
                                                        ) : (
                                                            <ImageIcon className="h-4 w-4 text-slate-400" />
                                                        )}
                                                    </button>
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
                        </div>
                        <div className="flex space-x-3">
                            <Button variant="secondary" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            {step < 3 ? (
                                <Button onClick={() => setStep(step + 1)} disabled={selectedAttributes.length === 0}>
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

                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-xs font-medium border-t border-red-100">
                            {error}
                        </div>
                    )}
                </div>
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
