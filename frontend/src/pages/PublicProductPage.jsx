import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ShoppingCart, ArrowLeft, Star, Minus, Plus, Share2 } from 'lucide-react';
import { BlockRenderer } from '../components/store/widgets/BlockRenderer';
import { CartProvider, useCart } from '../context/CartContext';
import { CartDrawer } from '../components/store/widgets/cart/CartDrawer';

export function PublicProductPage() {
    const { storeSubUrl, productId } = useParams();
    const [store, setStore] = useState(null);
    const [product, setProduct] = useState(null);
    const [navbarBlock, setNavbarBlock] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('desktop');

    // Responsive Detection
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 640) setViewMode('mobile');
            else if (width < 1024) setViewMode('tablet');
            else setViewMode('desktop');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchData();
    }, [storeSubUrl, productId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Store
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('sub_url', storeSubUrl)
                .single();

            if (storeError || !storeData) throw new Error('Store not found');
            setStore(storeData);

            // 2. Fetch Product
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (prodError || !prodData) throw new Error('Product not found');
            setProduct(prodData);

            // 3. Fetch Home Page to get Navbar
            const { data: pageData } = await supabase
                .from('store_pages')
                .select('content')
                .eq('store_id', storeData.id)
                .eq('slug', 'home')
                .single();

            if (pageData?.content) {
                const nav = pageData.content.find(b => b.type === 'navbar');
                if (nav) setNavbarBlock(nav);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
    if (!product || !store) return <div className="min-h-screen flex items-center justify-center">Product Not Found</div>;

    return (
        <CartProvider storeKey={store.id}>
            <CartDrawer />
            <div className="min-h-screen bg-white">
                {/* Navbar */}
                {navbarBlock ? (
                    <BlockRenderer
                        type="navbar"
                        settings={navbarBlock.settings}
                        viewMode={viewMode}
                        store={store}
                    // Pass mock categories/products if needed for navbar links, 
                    // or ideally fetch them if navbar needs them. 
                    // For now we skip ensuring navbar links work 100% on PDP if they rely on props.
                    // But menuItems are usually specific.
                    />
                ) : (
                    <div className="p-4 border-b border-slate-100 mb-8">
                        <Link to={`/s/${storeSubUrl}`} className="flex items-center text-slate-600 hover:text-indigo-600">
                            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Store
                        </Link>
                    </div>
                )}

                <ProductDetailsContent product={product} />

            </div>
        </CartProvider>
    );
}

function ProductDetailsContent({ product }) {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Images */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100">
                        {product.images?.[selectedImage] ? (
                            <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">No Image</div>
                        )}
                    </div>
                    {product.images?.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {product.images.map((img, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedImage === idx ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-transparent hover:border-slate-200'}`}
                                >
                                    <img src={img} className="w-full h-full object-cover" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                        <div className="flex items-center space-x-2 mb-4">
                            <span className="text-2xl font-bold text-indigo-600">${parseFloat(product.price).toFixed(2)}</span>
                            {/* Simple Stock Indicator */}
                            {product.quantity > 0 ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wide">In Stock</span>
                            ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wide">Out of Stock</span>
                            )}
                        </div>
                        <p className="text-slate-600 leading-relaxed">{product.description || 'No description available for this product.'}</p>
                    </div>

                    <div className="h-px bg-slate-100 w-full mb-8" />

                    <div className="space-y-6">
                        {/* Quantity */}
                        <div>
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Quantity</label>
                            <div className="flex items-center w-32 border border-slate-200 rounded-xl">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="flex-1 text-center font-bold text-slate-900">{qty}</div>
                                <button
                                    onClick={() => setQty(Math.min(product.quantity || 99, qty + 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => addToCart(product, qty)}
                                disabled={product.quantity === 0}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                Add to Cart
                            </button>
                            <button className="p-4 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-colors">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
