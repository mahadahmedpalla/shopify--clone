import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Package, Layers, Trash2, Plus, Image as ImageIcon } from 'lucide-react';

export function ThemeAssetsModal({ isOpen, onClose, themeId, mockSettings, onUpdateMockSettings }) {
    const [activeTab, setActiveTab] = useState('products'); // 'products' | 'categories'
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Forms
    const [skuForm, setSkuForm] = useState({ name: '', price: '', image_url: '' });
    const [catForm, setCatForm] = useState({ name: '' });

    useEffect(() => {
        if (isOpen && themeId) {
            fetchAssets();
        }
    }, [isOpen, themeId]);

    const fetchAssets = async () => {
        setLoading(true);
        const { data: prods } = await supabase.from('theme_products').select('*').eq('theme_id', themeId).order('created_at', { ascending: false });
        const { data: cats } = await supabase.from('theme_categories').select('*').eq('theme_id', themeId).order('created_at', { ascending: false });
        setProducts(prods || []);
        setCategories(cats || []);
        setLoading(false);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!skuForm.name) return;

        const { data, error } = await supabase.from('theme_products').insert({
            theme_id: themeId,
            name: skuForm.name,
            price: parseFloat(skuForm.price) || 0,
            images: skuForm.image_url ? [skuForm.image_url] : []
        }).select().single();

        if (data) {
            setProducts([data, ...products]);
            setSkuForm({ name: '', price: '', image_url: '' });
        }
    };

    const handleDeleteProduct = async (id) => {
        await supabase.from('theme_products').delete().eq('id', id);
        setProducts(products.filter(p => p.id !== id));
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!catForm.name) return;

        const { data, error } = await supabase.from('theme_categories').insert({
            theme_id: themeId,
            name: catForm.name
        }).select().single();

        if (data) {
            setCategories([data, ...categories]);
            setCatForm({ name: '' });
        }
    };

    const handleDeleteCategory = async (id) => {
        await supabase.from('theme_categories').delete().eq('id', id);
        setCategories(categories.filter(c => c.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 z-50">
                    <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
                        <button onClick={onClose} type="button" className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none">
                            <span className="sr-only">Close</span>
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="sm:flex sm:items-start w-full">
                        <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-bold text-gray-900 mb-4">Manage Mock Data</h3>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-6">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('products')}
                                        className={`${activeTab === 'products' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                    >
                                        <Package className="h-4 w-4 mr-2" />
                                        Mock Products
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('categories')}
                                        className={`${activeTab === 'categories' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                                    >
                                        <Layers className="h-4 w-4 mr-2" />
                                        Mock Categories
                                    </button>
                                </nav>
                            </div>

                            {activeTab === 'products' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Create Form */}
                                    <div className="bg-gray-50 p-4 rounded-lg h-fit">
                                        <h4 className="font-medium text-gray-900 mb-4">Add Product</h4>
                                        <form onSubmit={handleAddProduct} className="space-y-3">
                                            <Input
                                                label="Name"
                                                value={skuForm.name}
                                                onChange={e => setSkuForm({ ...skuForm, name: e.target.value })}
                                                placeholder="e.g. Summer Shirt"
                                            />
                                            <Input
                                                label="Price"
                                                type="number"
                                                value={skuForm.price}
                                                onChange={e => setSkuForm({ ...skuForm, price: e.target.value })}
                                                placeholder="0.00"
                                            />
                                            <Input
                                                label="Image URL"
                                                value={skuForm.image_url}
                                                onChange={e => setSkuForm({ ...skuForm, image_url: e.target.value })}
                                                placeholder="https://..."
                                            />
                                            <Button type="submit" className="w-full" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Product
                                            </Button>
                                        </form>
                                    </div>

                                    {/* List */}
                                    <div className="md:col-span-2 max-h-[400px] overflow-y-auto">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {products.length === 0 ? (
                                                <p className="text-gray-500 italic">No mock products added yet.</p>
                                            ) : products.map(prod => (
                                                <div key={prod.id} className="border rounded-lg p-3 flex items-start space-x-3 bg-white shadow-sm">
                                                    <div className="h-12 w-12 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-400">
                                                        {prod.images && prod.images[0] ? (
                                                            <img src={prod.images[0]} alt={prod.name} className="h-full w-full object-cover" />
                                                        ) : <ImageIcon className="h-6 w-6" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{prod.name}</p>
                                                        <p className="text-xs text-green-600 font-bold">${prod.price}</p>
                                                    </div>
                                                    <button onClick={() => handleDeleteProduct(prod.id)} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'categories' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Create Form */}
                                    <div className="bg-gray-50 p-4 rounded-lg h-fit">
                                        <h4 className="font-medium text-gray-900 mb-4">Add Category</h4>
                                        <form onSubmit={handleAddCategory} className="space-y-3">
                                            <Input
                                                label="Name"
                                                value={catForm.name}
                                                onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                                                placeholder="e.g. Summer Collection"
                                            />
                                            <Button type="submit" className="w-full" size="sm">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Category
                                            </Button>
                                        </form>
                                    </div>

                                    {/* List */}
                                    <div className="md:col-span-2">
                                        <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden bg-white">
                                            {categories.length === 0 ? (
                                                <li className="p-4 text-gray-500 italic">No mock categories added yet.</li>
                                            ) : categories.map(cat => (
                                                <li key={cat.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                                    <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-gray-400 hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'mock_settings' && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                                        <h4 className="font-bold text-indigo-900 mb-2">Mock Data Simulation</h4>
                                        <p className="text-sm text-indigo-700">
                                            Enable these settings to visualize how your theme handles discounts and ratings, even if your mock products don't have this data.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                            <div>
                                                <h5 className="font-bold text-gray-900">Mock Discounts</h5>
                                                <p className="text-sm text-gray-500">Simulate a store-wide sale (approx. 20% off)</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={mockSettings?.enableDiscounts || false}
                                                    onChange={(e) => onUpdateMockSettings({ ...mockSettings, enableDiscounts: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                                            <div>
                                                <h5 className="font-bold text-gray-900">Mock Ratings</h5>
                                                <p className="text-sm text-gray-500">Simulate 3.5 - 5 star ratings for all products</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={mockSettings?.enableRatings || false}
                                                    onChange={(e) => onUpdateMockSettings({ ...mockSettings, enableRatings: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
