
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Check, Package, DollarSign, Tag } from 'lucide-react';

export function QuickEditVariantModal({ isOpen, variant, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        price: 0,
        quantity: 0,
        combination: {}
    });

    useEffect(() => {
        if (isOpen && variant) {
            setFormData({
                price: variant.price,
                quantity: variant.quantity,
                combination: { ...(variant.combination || {}) }
            });
        }
    }, [isOpen, variant]);

    if (!isOpen || !variant) return null;

    const handleSave = async () => {
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('product_variants')
                .update({
                    price: parseFloat(formData.price),
                    quantity: parseInt(formData.quantity) || 0,
                    combination: formData.combination
                })
                .eq('id', variant.id);

            if (updateError) throw updateError;
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full z-100">
                    <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Tag className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Quick Edit Variant</h3>
                                <p className="text-[10px] text-slate-400 font-mono uppercase">#{variant.id}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Attributes/Combination */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration</h4>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.keys(formData.combination).map((key) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{key}</label>
                                        <Input
                                            value={formData.combination[key]}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    combination: {
                                                        ...formData.combination,
                                                        [key]: e.target.value
                                                    }
                                                });
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                                    <DollarSign className="h-3 w-3 mr-1 text-slate-400" />
                                    Price
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center">
                                    <Package className="h-3 w-3 mr-1 text-slate-400" />
                                    Stock
                                </label>
                                <Input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-xs font-medium text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
                        )}
                    </div>

                    <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3">
                        <Button variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} isLoading={loading}>
                            <Check className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
