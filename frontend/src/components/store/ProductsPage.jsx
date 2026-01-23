
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Plus, Package, Search, Trash2, Edit2, ToggleLeft, ToggleRight, Filter } from 'lucide-react';
import { CreateProductModal } from './CreateProductModal';
import { EditProductModal } from './EditProductModal';

export function ProductsPage() {
    const { storeId } = useParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        fetchData();
    }, [storeId]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Categories for the dropdown/display
        const { data: cats } = await supabase
            .from('product_categories')
            .select('id, name')
            .eq('store_id', storeId);
        setCategories(cats || []);

        // Fetch Products with category names
        const { data: prods, error } = await supabase
            .from('products')
            .select(`
                *,
                product_categories (name)
            `)
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching products:', error);
        else setProducts(prods || []);
        setLoading(false);
    };

    const handleToggleStatus = async (product) => {
        const { error } = await supabase
            .from('products')
            .update({ is_active: !product.is_active })
            .eq('id', product.id);

        if (error) alert('Failed to update status');
        else fetchData();
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else fetchData();
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                    <p className="text-slate-500 text-sm">Manage your inventory, pricing and store display.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    Add Product
                </Button>
            </div>

            <Card className="p-0">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                <th className="px-6 py-4">Product Info</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Inventory</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">Loading inventory...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No products found. Add your first item!</td></tr>
                            ) : filteredProducts.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-14 w-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                                {p.image_url ? (
                                                    <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-slate-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{p.name}</span>
                                                <span className="text-[10px] font-mono text-slate-400 uppercase">#{p.id}</span>
                                                <p className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">{p.description}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 px-2 py-1 bg-slate-100 rounded-md">
                                            {p.product_categories?.name || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-slate-900">${p.price.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <span className={`h-2 w-2 rounded-full ${p.quantity > 10 ? 'bg-green-500' : p.quantity > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                                            <span className="text-sm font-medium text-slate-700">{p.quantity} units</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(p)}
                                            className={`flex items-center space-x-1.5 transition-colors ${p.is_active ? 'text-green-600' : 'text-slate-400'}`}
                                        >
                                            {p.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{p.is_active ? 'Active' : 'Inactive'}</span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => setEditingProduct(p)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProduct(p.id)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateProductModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchData();
                }}
                storeId={storeId}
                categories={categories}
            />

            {editingProduct && (
                <EditProductModal
                    isOpen={!!editingProduct}
                    product={editingProduct}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => {
                        setEditingProduct(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
