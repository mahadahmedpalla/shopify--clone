
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Package, Upload, Camera, LayoutGrid, Settings2, Trash2, Layers, Plus } from 'lucide-react';

export function CreateProductModal({ isOpen, onClose, onSuccess, storeId, categories }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [systemAttributes, setSystemAttributes] = useState([]);

    // Product State
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: ''
    });

    // Variations State
    const [selectedAttributes, setSelectedAttributes] = useState([]); // [{id, name, values: []}]
    const [variants, setVariants] = useState([{ combination: {}, price: '', quantity: '' }]);
    const [showVariations, setShowVariations] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchAttributes();
        }
    }, [isOpen]);

    const fetchAttributes = async () => {
        try {
            const { data, error } = await supabase.from('attributes').select('*');
            if (error) throw error;
            setSystemAttributes(data || []);
        } catch (err) {
            console.error('Error fetching attributes:', err);
        }
    };

    if (!isOpen) return null;

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const newFiles = [...imageFiles, ...files];
            setImageFiles(newFiles);
            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (index) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);
        const newPreviews = [...imagePreviews];
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const addAttribute = (attr) => {
        if (selectedAttributes.find(a => a.id === attr.id)) return;
        setSelectedAttributes([...selectedAttributes, { ...attr, values: [] }]);
    };

    const removeAttribute = (id) => {
        setSelectedAttributes(selectedAttributes.filter(a => a.id !== id));
    };

    const updateAttributeValues = (id, valueString) => {
        const values = valueString.split(',').map(v => v.trim()).filter(v => v !== '');
        setSelectedAttributes(selectedAttributes.map(a => a.id === id ? { ...a, values } : a));
    };

    // Generate combinations whenever attributes change
    useEffect(() => {
        if (!showVariations || selectedAttributes.length === 0) {
            setVariants([{ combination: {}, price: variants[0]?.price || '', quantity: variants[0]?.quantity || '' }]);
            return;
        }

        const generateCombinations = (attrs, current = {}, index = 0) => {
            if (index === attrs.length) {
                return [current];
            }
            const attr = attrs[index];
            if (!attr.values || attr.values.length === 0) {
                return generateCombinations(attrs, current, index + 1);
            }
            let results = [];
            attr.values.forEach(val => {
                results = results.concat(generateCombinations(attrs, { ...current, [attr.name]: val }, index + 1));
            });
            return results;
        };

        const activeAttrs = selectedAttributes.filter(a => a.values && a.values.length > 0);
        if (activeAttrs.length === 0) {
            setVariants([{ combination: {}, price: variants[0]?.price || '', quantity: variants[0]?.quantity || '' }]);
            return;
        }

        const combs = generateCombinations(activeAttrs);
        setVariants(combs.map(c => ({
            combination: c,
            price: variants[0]?.price || '',
            quantity: variants[0]?.quantity || ''
        })));
    }, [selectedAttributes, showVariations]);

    const updateVariant = (index, field, value) => {
        const newVariants = [...variants];
        if (newVariants[index]) {
            newVariants[index][field] = value;
            setVariants(newVariants);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const uploadedUrls = [];
            for (const file of imageFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${storeId}/${Math.random()}.${fileExt}`;
                const filePath = `products/${fileName}`;
                const { error: uploadError } = await supabase.storage.from('products').upload(filePath, file);
                if (uploadError) throw new Error('Image upload failed');
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
                uploadedUrls.push(publicUrl);
            }

            // 1. Create Product Parent
            const { data: product, error: productError } = await supabase
                .from('products')
                .insert([{
                    store_id: storeId,
                    name: formData.name,
                    description: formData.description,
                    category_id: formData.category_id || null,
                    image_urls: uploadedUrls,
                    is_active: true,
                    // Store sum for legacy/quick view
                    price: parseFloat(variants[0]?.price) || 0,
                    quantity: variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0)
                }])
                .select()
                .single();

            if (productError) throw productError;

            // 2. Create Variants
            const variantPayload = variants.map(v => ({
                product_id: product.id,
                price: parseFloat(v.price) || 0,
                quantity: parseInt(v.quantity) || 0,
                combination: v.combination || {},
                is_active: true
            }));

            const { error: variantError } = await supabase.from('product_variants').insert(variantPayload);
            if (variantError) throw variantError;

            onSuccess(product);
            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', category_id: '' });
        setImageFiles([]);
        setImagePreviews([]);
        setSelectedAttributes([]);
        setVariants([{ combination: {}, price: '', quantity: '' }]);
        setShowVariations(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={handleClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-xl px-4 pt-5 pb-4 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-8 z-50">
                    <div className="absolute top-4 right-4">
                        <button onClick={handleClose} type="button" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-2xl font-bold text-slate-900 flex items-center">
                            <Package className="h-6 w-6 mr-3 text-indigo-600" />
                            Launch New Product
                        </h3>
                        <p className="text-slate-500 mt-1">Define your product and its sellable variations.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                            <div className="space-y-6">
                                <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">General Identity</h4>
                                <Input label="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="e.g., Premium Leather Jacket" />
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                                    <textarea className="w-full rounded-xl border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 h-32 text-sm p-4 border" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tell the story of this product..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                                    <select className="w-full rounded-xl border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 text-sm p-2.5 border bg-white" value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                                        <option value="">Ungrouped</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Visual Gallery</h4>
                                <div className="flex flex-wrap gap-3">
                                    {imagePreviews.map((p, i) => (
                                        <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden shadow-sm group">
                                            <img src={p} className="h-full w-full object-cover" alt="Preview" />
                                            <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => document.getElementById('p-imgs').click()} className="h-20 w-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                                        <Camera className="h-5 w-5 mb-1" />
                                        <span className="text-[9px] font-bold">Add Photo</span>
                                    </button>
                                    <input type="file" id="p-imgs" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h4 className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Product Dimensions</h4>
                                    <p className="text-xs text-slate-400 mt-1">Enable sizes, colors, or custom attributes for this product.</p>
                                </div>
                                <div className="flex items-center space-x-2 bg-slate-50 p-1 rounded-lg">
                                    <button type="button" onClick={() => setShowVariations(false)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!showVariations ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Simple</button>
                                    <button type="button" onClick={() => setShowVariations(true)} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${showVariations ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Complex</button>
                                </div>
                            </div>

                            {showVariations ? (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2">
                                        {systemAttributes.map(attr => (
                                            <button
                                                key={attr.id}
                                                type="button"
                                                onClick={() => addAttribute(attr)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedAttributes.find(a => a.id === attr.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-600 italic' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                                            >
                                                + {attr.name}
                                            </button>
                                        ))}
                                    </div>

                                    {selectedAttributes.map(attr => (
                                        <div key={attr.id} className="flex items-start space-x-4 bg-slate-50 p-4 rounded-xl">
                                            <div className="pt-2"><Settings2 className="h-4 w-4 text-slate-400" /></div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">{attr.name} Values</label>
                                                <input
                                                    className="w-full bg-transparent border-b border-slate-200 focus:border-indigo-500 transition-colors text-sm py-1 outline-none"
                                                    placeholder="Enter values separated by comma (e.g. Small, Medium, Large)"
                                                    onChange={(e) => updateAttributeValues(attr.id, e.target.value)}
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeAttribute(attr.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    ))}

                                    {variants.length > 0 && selectedAttributes.some(a => a.values && a.values.length > 0) && (
                                        <div className="overflow-hidden border border-slate-100 rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 italic text-slate-500">
                                                    <tr>
                                                        <th className="px-4 py-3">Variant Combination</th>
                                                        <th className="px-4 py-3">Price ($)</th>
                                                        <th className="px-4 py-3 text-right">Inventory</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {variants.map((v, i) => (
                                                        <tr key={i} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-3 font-bold text-slate-700">
                                                                {Object.entries(v.combination || {}).length > 0
                                                                    ? Object.entries(v.combination).map(([k, val]) => `${k}: ${val}`).join(' / ')
                                                                    : 'Default Variant'}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <input type="number" step="0.01" className="w-20 bg-transparent border-b border-indigo-100 focus:border-indigo-400 outline-none font-bold" value={v.price} onChange={(e) => updateVariant(i, 'price', e.target.value)} required />
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-mono">
                                                                <input type="number" className="w-16 bg-transparent border-b border-indigo-100 focus:border-indigo-400 outline-none text-right font-bold" value={v.quantity} onChange={(e) => updateVariant(i, 'quantity', e.target.value)} required />
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                    <Input label="Master Price ($)" type="number" step="0.01" value={variants[0].price} onChange={(e) => updateVariant(0, 'price', e.target.value)} required placeholder="0.00" />
                                    <Input label="Master Inventory" type="number" value={variants[0].quantity} onChange={(e) => updateVariant(0, 'quantity', e.target.value)} required placeholder="0" />
                                </div>
                            )}
                        </div>

                        {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-xl border border-red-100">{error}</p>}

                        <div className="flex space-x-4 pt-6">
                            <Button type="submit" className="flex-1 py-4 text-base shadow-xl shadow-indigo-100" isLoading={loading}>
                                <Layers className="h-5 w-5 mr-3" />
                                Deploy Product
                            </Button>
                            <Button type="button" variant="secondary" className="px-8" onClick={handleClose}>Cancel</Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
