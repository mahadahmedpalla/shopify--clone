import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Plus, Trash2, Edit2, Image as ImageIcon, Tag, Save, Star, Percent, Settings, Database, Upload } from 'lucide-react';

export function ThemeDataManager({ themeId, onClose, refreshData }) {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'global'
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [themeSettings, setThemeSettings] = useState({});
    const [loading, setLoading] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [developerId, setDeveloperId] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [themeId]);

    const fetchData = async () => {
        setLoading(true);
        const [prodRes, catRes, themeRes] = await Promise.all([
            supabase.from('theme_products').select('*').eq('theme_id', themeId).order('name', { ascending: true }),
            supabase.from('theme_categories').select('*').eq('theme_id', themeId),
            supabase.from('themes').select('settings, developer_id').eq('id', themeId).single()
        ]);

        if (prodRes.data) setProducts(prodRes.data);
        if (catRes.data) setCategories(catRes.data);
        if (themeRes.data) {
            setThemeSettings(themeRes.data.settings || {});
            setDeveloperId(themeRes.data.developer_id);
        }
        setLoading(false);
    };

    const handleSaveGlobal = async () => {
        try {
            const { error } = await supabase
                .from('themes')
                .update({ settings: themeSettings })
                .eq('id', themeId);

            if (error) throw error;
            alert('Global mock settings saved!');
            refreshData();
        } catch (e) {
            alert('Error saving settings: ' + e.message);
        }
    };

    const updateProduct = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('theme_products')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setProducts(products.map(p => p.id === id ? { ...p, ...updates } : p));
            setEditingProduct(null);
            refreshData(); // Refresh builder data
        } catch (e) {
            alert('Error updating product: ' + e.message);
        }
    };

    const handleImageUpload = async (event) => {
        try {
            setUploading(true);
            const file = event.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const bucketName = 'themes';

            if (!developerId) throw new Error("Developer ID missing");

            const filePath = `${developerId}/${themeId}/${fileName}`;

            let { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            setEditingProduct({
                ...editingProduct,
                images: [data.publicUrl]
            });
        } catch (error) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteImage = async () => {
        if (!editingProduct?.images?.[0]) return;

        try {
            const imageUrl = editingProduct.images[0];
            const bucketName = 'themes';
            const urlObj = new URL(imageUrl);
            // Example path: /storage/v1/object/public/themes/devId/themeId/filename.ext
            // We need: devId/themeId/filename.ext
            // This depends on how Supabase constructs the public URL. 
            // Standard: .../themes/path/to/file
            const pathPart = urlObj.pathname.split(`/${bucketName}/`)[1];

            if (pathPart) {
                await supabase.storage.from(bucketName).remove([decodeURIComponent(pathPart)]);
            }

            setEditingProduct({
                ...editingProduct,
                images: []
            });
        } catch (err) {
            console.error('Error deleting image:', err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center space-x-2">
                    <Database className="h-5 w-5 text-indigo-600" />
                    <h2 className="font-bold text-slate-800">Mock Data Manager</h2>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full text-slate-500">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="flex border-b border-slate-200 bg-white shrink-0">
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'products' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('products')}
                >
                    Mock Products
                </button>
                <button
                    className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'global' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setActiveTab('global')}
                >
                    Global Settings
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
                ) : activeTab === 'global' ? (
                    <div className="space-y-6">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-4">
                                <Percent className="h-5 w-5 text-indigo-500" />
                                <h3 className="font-bold text-slate-800">Mock Discounts</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-slate-600 font-medium">Enable Global Sale</label>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={themeSettings?.mock?.discount?.active || false}
                                        onChange={(e) => setThemeSettings({
                                            ...themeSettings,
                                            mock: {
                                                ...themeSettings.mock,
                                                discount: {
                                                    ...themeSettings?.mock?.discount,
                                                    active: e.target.checked
                                                }
                                            }
                                        })}
                                    />
                                </div>
                                {themeSettings?.mock?.discount?.active && (
                                    <Input
                                        label="Discount Percentage"
                                        type="number"
                                        value={themeSettings?.mock?.discount?.value || 20}
                                        onChange={(e) => setThemeSettings({
                                            ...themeSettings,
                                            mock: {
                                                ...themeSettings.mock,
                                                discount: {
                                                    ...themeSettings?.mock?.discount,
                                                    value: parseInt(e.target.value) || 0
                                                }
                                            }
                                        })}
                                        icon={<Percent className="h-4 w-4" />}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center space-x-2 mb-4">
                                <Star className="h-5 w-5 text-yellow-500" />
                                <h3 className="font-bold text-slate-800">Mock Ratings</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-slate-600 font-medium">Enable Mock Reviews</label>
                                    <input
                                        type="checkbox"
                                        className="toggle toggle-primary toggle-sm"
                                        checked={themeSettings?.mock?.ratings?.active || false}
                                        onChange={(e) => setThemeSettings({
                                            ...themeSettings,
                                            mock: {
                                                ...themeSettings.mock,
                                                ratings: {
                                                    ...themeSettings?.mock?.ratings,
                                                    active: e.target.checked
                                                }
                                            }
                                        })}
                                    />
                                </div>
                                {themeSettings?.mock?.ratings?.active && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input
                                            label="Average Rating (0-5)"
                                            type="number"
                                            step="0.1"
                                            max="5"
                                            value={themeSettings?.mock?.ratings?.average || 4.5}
                                            onChange={(e) => setThemeSettings({
                                                ...themeSettings,
                                                mock: {
                                                    ...themeSettings.mock,
                                                    ratings: {
                                                        ...themeSettings?.mock?.ratings,
                                                        average: parseFloat(e.target.value) || 0
                                                    }
                                                }
                                            })}
                                        />
                                        <Input
                                            label="Review Count"
                                            type="number"
                                            value={themeSettings?.mock?.ratings?.count || 12}
                                            onChange={(e) => setThemeSettings({
                                                ...themeSettings,
                                                mock: {
                                                    ...themeSettings.mock,
                                                    ratings: {
                                                        ...themeSettings?.mock?.ratings,
                                                        count: parseInt(e.target.value) || 0
                                                    }
                                                }
                                            })}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button onClick={handleSaveGlobal} className="w-full">
                            <Save className="h-4 w-4 mr-2" />
                            Save Global Settings
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {editingProduct ? (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-right-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800">Edit Product</h3>
                                    <button onClick={() => setEditingProduct(null)} className="text-sm text-slate-500 hover:text-slate-800">Cancel</button>
                                </div>

                                <div className="space-y-4">
                                    <Input
                                        label="Product Name"
                                        value={editingProduct.name}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                    />
                                    <Input
                                        label="Price"
                                        type="number"
                                        value={editingProduct.price}
                                        onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })}
                                    />

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-700">Product Image</label>

                                        <div className="relative group">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 peer-focus:border-indigo-500 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {uploading ? (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                                    ) : editingProduct.images?.[0] ? (
                                                        <img src={editingProduct.images[0]} className="h-28 object-contain" alt="Preview" />
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 mb-2 text-slate-400" />
                                                            <p className="text-xs text-slate-500 font-semibold">Click or Drop Image</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    disabled={uploading}
                                                />
                                            </label>
                                            {editingProduct.images?.[0] && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleDeleteImage();
                                                    }}
                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete Image"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="text-center text-xs text-slate-400 mb-2">- OR -</div>

                                        <Input
                                            label="Image URL (Manual)"
                                            value={editingProduct.images?.[0] || ''}
                                            onChange={(e) => setEditingProduct({
                                                ...editingProduct,
                                                images: [e.target.value]
                                            })}
                                            placeholder="https://..."
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700">Category</label>
                                        <select
                                            className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={editingProduct.category_id || ''}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value || null })}
                                        >
                                            <option value="">Uncategorized</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <Button
                                        onClick={() => updateProduct(editingProduct.id, {
                                            name: editingProduct.name,
                                            price: editingProduct.price,
                                            images: editingProduct.images,
                                            category_id: editingProduct.category_id
                                        })}
                                        className="w-full mt-4"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {products.map(p => (
                                    <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between hover:border-indigo-300 transition-colors group">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-slate-100 rounded flex items-center justify-center overflow-hidden border border-slate-100">
                                                {p.images?.[0] ? <img src={p.images[0]} className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-slate-300" />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-800">{p.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">${p.price}</div>
                                            </div>
                                        </div>
                                        <Button size="xs" variant="ghost" onClick={() => setEditingProduct(p)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Edit2 className="h-3 w-3 text-slate-400 hover:text-indigo-600" />
                                        </Button>
                                    </div>
                                ))}
                                {products.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                                        <Tag className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                                        <div className="text-slate-500 text-sm font-medium">No mock products found.</div>
                                        <p className="text-xs text-slate-400 mt-1">Add them via Supabase or SQL migrations.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
