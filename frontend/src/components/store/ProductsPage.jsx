
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { deleteStoreFiles } from '../../lib/storageHelper';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Plus, Package, Search, Trash2, Edit2, ToggleLeft, ToggleRight, Filter, Settings2, ChevronDown, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { CreateProductModal } from './CreateProductModal';
import { EditProductModal } from './EditProductModal';
import { AttributesManagerModal } from './AttributesManagerModal';
import { QuickEditVariantModal } from './QuickEditVariantModal';

export function ProductsPage() {
    const { storeId } = useParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [managingVariantsProduct, setManagingVariantsProduct] = useState(null);
    const [quickEditingVariant, setQuickEditingVariant] = useState(null);
    const [expandedProducts, setExpandedProducts] = useState(new Set());

    useEffect(() => {
        fetchData();
    }, [storeId]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Categories
        const { data: cats } = await supabase
            .from('product_categories')
            .select('id, name, parent_id')
            .eq('store_id', storeId);
        setCategories(cats || []);

        // Fetch Products with category names and variant count
        const { data: prods, error } = await supabase
            .from('products')
            .select(`
                *,
                product_categories (name),
                product_variants (*)
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

    const toggleExpand = (productId) => {
        const newExpanded = new Set(expandedProducts);
        if (newExpanded.has(productId)) newExpanded.delete(productId);
        else newExpanded.add(productId);
        setExpandedProducts(newExpanded);
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            // 1. Fetch media to clean up (Product Images AND Variant Images)
            const { data: productData } = await supabase
                .from('products')
                .select('image_urls, product_variants(image_urls)')
                .eq('id', id)
                .single();

            if (productData) {
                // Collect Product Images
                const productImages = productData.image_urls || [];
                if (productImages.length > 0) {
                    await deleteStoreFiles('products', productImages, storeId);
                }

                // Collect Variant Images (flatten array)
                const variantImages = productData.product_variants
                    ?.flatMap(v => v.image_urls || [])
                    .filter(Boolean) || [];

                if (variantImages.length > 0) {
                    await deleteStoreFiles('products', variantImages, storeId);
                }
            }
        } catch (err) {
            console.error('Error cleaning up media:', err);
            // Continue with deletion anyway
        }

        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else fetchData();
    };

    const handleDeleteVariant = async (id) => {
        if (!confirm('Are you sure you want to delete this variation?')) return;

        try {
            // 1. Fetch media to clean up
            const { data: variantData } = await supabase
                .from('product_variants')
                .select('image_urls')
                .eq('id', id)
                .single();

            if (variantData && variantData.image_urls?.length > 0) {
                await deleteStoreFiles('products', variantData.image_urls, storeId);
            }
        } catch (err) {
            console.error('Error cleaning up variant media:', err);
        }

        const { error } = await supabase.from('product_variants').delete().eq('id', id);
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
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="h-14 w-14 rounded-lg" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-32" />
                                                    <Skeleton className="h-3 w-48" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-md" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredProducts.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No products found. Add your first item!</td></tr>
                            ) : filteredProducts.map((p) => (
                                <React.Fragment key={p.id}>
                                    <tr className={`hover:bg-slate-50/80 transition-colors ${expandedProducts.has(p.id) ? 'bg-slate-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                {p.product_variants && p.product_variants.length > 0 && (
                                                    <button
                                                        onClick={() => toggleExpand(p.id)}
                                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {expandedProducts.has(p.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </button>
                                                )}
                                                <div className="h-14 w-14 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                                                    {p.image_urls && p.image_urls[0] ? (
                                                        <img src={p.image_urls[0]} alt={p.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <Package className="h-6 w-6 text-slate-300" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center">
                                                        <span className="font-bold text-slate-800 text-sm truncate max-w-[200px]">{p.name}</span>
                                                        {p.product_variants && p.product_variants.length > 0 && (
                                                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase border border-indigo-100">
                                                                {p.product_variants.length} Variants
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    onClick={() => setManagingVariantsProduct(p)}
                                                    title="Manage Variants"
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </button>
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

                                    {/* Variant Sub-rows */}
                                    {expandedProducts.has(p.id) && p.product_variants?.map((variant) => (
                                        <tr key={variant.id} className="bg-slate-50/30 border-l-4 border-l-indigo-500 animate-in slide-in-from-left-2 duration-200">
                                            <td className="px-6 py-3 pl-14">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-10 w-10 rounded-lg bg-white flex-shrink-0 overflow-hidden border border-slate-200 shadow-sm">
                                                        {variant.image_urls && variant.image_urls[0] ? (
                                                            <img src={variant.image_urls[0]} alt="Variant" className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <ImageIcon className="h-4 w-4 text-slate-200" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(variant.combination || {}).map(([k, v]) => (
                                                                <span key={k} className="text-[9px] font-bold uppercase bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 italic">
                                                                    {k}: {v}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <span className="text-[9px] font-mono text-slate-300 uppercase mt-0.5">#{variant.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Variation</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-sm font-bold text-slate-600">${parseFloat(variant.price || p.price).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`h-1.5 w-1.5 rounded-full ${variant.quantity > 5 ? 'bg-green-400' : 'bg-orange-400'}`} />
                                                    <span className="text-xs font-medium text-slate-600">{variant.quantity || 0} in stock</span>
                                                </div>
                                            </td>
                                            <td colSpan="2" className="px-6 py-3 text-right">
                                                <div className="flex items-center justify-end space-x-3">
                                                    <button
                                                        onClick={() => setQuickEditingVariant(variant)}
                                                        className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 uppercase tracking-tighter"
                                                    >
                                                        Quick Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteVariant(variant.id)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                        title="Delete variation"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
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

            {managingVariantsProduct && (
                <AttributesManagerModal
                    isOpen={!!managingVariantsProduct}
                    product={managingVariantsProduct}
                    storeId={storeId}
                    onClose={() => setManagingVariantsProduct(null)}
                    onSuccess={() => {
                        setManagingVariantsProduct(null);
                        fetchData();
                    }}
                />
            )}

            {quickEditingVariant && (
                <QuickEditVariantModal
                    isOpen={!!quickEditingVariant}
                    variant={quickEditingVariant}
                    onClose={() => setQuickEditingVariant(null)}
                    onSuccess={() => {
                        setQuickEditingVariant(null);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
}
