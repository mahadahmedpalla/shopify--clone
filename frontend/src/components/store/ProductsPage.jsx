
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Plus, Package, Search, Trash2, Edit2 } from 'lucide-react';
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
        if (storeId) {
            fetchData();
        }
    }, [storeId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: cats } = await supabase.from('product_categories').select('*').eq('store_id', storeId);
            setCategories(cats || []);

            const { data: prods, error } = await supabase
                .from('products')
                .select('*, product_categories(name)')
                .eq('store_id', storeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(prods || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this product?')) return;
        await supabase.from('products').delete().eq('id', id);
        fetchData();
    };

    const filteredProducts = products.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Products</h1>
                    <p className="text-sm text-slate-500">Manage your store items.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                </Button>
            </div>

            <Card className="p-0">
                <div className="p-4 border-b border-slate-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b">
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-400">No products found.</td></tr>
                            ) : filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden border">
                                                {p.image_urls?.[0] ? <img src={p.image_urls[0]} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 m-2.5 text-slate-300" />}
                                            </div>
                                            <span className="font-medium text-slate-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{p.product_categories?.name || '---'}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-slate-900">${(p.price || 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{p.quantity || 0} units</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => setEditingProduct(p)} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
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
                onSuccess={() => { setIsCreateModalOpen(false); fetchData(); }}
                storeId={storeId}
                categories={categories}
            />

            {editingProduct && (
                <EditProductModal
                    isOpen={!!editingProduct}
                    product={editingProduct}
                    categories={categories}
                    onClose={() => setEditingProduct(null)}
                    onSuccess={() => { setEditingProduct(null); fetchData(); }}
                />
            )}
        </div>
    );
}
