import React, { useState, useEffect } from 'react';
import { ShoppingCart, Share2, Minus, Plus, Box } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';

export function ProductDetailRenderer({ settings, product, viewMode, isEditor, store }) {
    const { addToCart } = useCart();
    const [qty, setQty] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);

    // If no product is provided (e.g. in editor initial state without selection, or if generic), show placeholder
    // But usually StoreBuilder should pass a mock product or the first product if actual product unavailable?
    // In Editor, we might want to show a "Sample Product" if real one isn't passed.
    const displayProduct = product || {
        id: 'sample',
        name: 'Sample Product',
        price: 99.99,
        description: 'This is a sample product description to demonstrate the layout.',
        images: [], // Placeholder
        quantity: 10
    };

    const isMobile = viewMode === 'mobile';

    // Settings
    const showStock = settings?.showStock !== false; // Default true
    const showDescription = settings?.showDescription !== false; // Default true
    const align = settings?.alignment || 'left';

    // Handlers
    const handleAddToCart = () => {
        if (isEditor) return; // Disable in editor
        addToCart(displayProduct, qty);
    };

    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isMobile ? 'py-6' : ''}`}>
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 ${isMobile ? 'gap-6' : ''}`}>
                {/* Images Section */}
                <div className="space-y-4">
                    <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative group">
                        {displayProduct.images?.[selectedImage] ? (
                            <img src={displayProduct.images[selectedImage]} alt={displayProduct.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Box className="h-16 w-16 opacity-50" />
                            </div>
                        )}
                        {/* Zoom hint or badges could go here */}
                    </div>
                    {displayProduct.images?.length > 1 && (
                        <div className="grid grid-cols-4 gap-4">
                            {displayProduct.images.map((img, idx) => (
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

                {/* Info Section */}
                <div className={`flex flex-col ${align === 'center' ? 'items-center text-center' : 'items-start text-left'}`}>
                    <div className="mb-6 w-full">
                        <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">{displayProduct.name}</h1>
                        <div className={`flex items-center space-x-2 mb-4 ${align === 'center' ? 'justify-center' : ''}`}>
                            <span className="text-2xl font-bold text-indigo-600">${parseFloat(displayProduct.price).toFixed(2)}</span>
                            {showStock && (
                                <>
                                    {displayProduct.quantity > 0 ? (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded uppercase tracking-wide">In Stock</span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded uppercase tracking-wide">Out of Stock</span>
                                    )}
                                </>
                            )}
                        </div>
                        {showDescription && (
                            <p className="text-slate-600 leading-relaxed text-lg max-w-2xl">
                                {displayProduct.description || 'No description available for this product.'}
                            </p>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 w-full mb-8" />

                    <div className={`space-y-6 w-full ${align === 'center' ? 'max-w-md mx-auto' : ''}`}>
                        {/* Quantity */}
                        <div className={`${align === 'center' ? 'flex flex-col items-center' : ''}`}>
                            <label className="block text-sm font-bold text-slate-900 uppercase tracking-wide mb-2">Quantity</label>
                            <div className="flex items-center w-32 border border-slate-200 rounded-xl bg-white">
                                <button
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                    disabled={isEditor}
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <div className="flex-1 text-center font-bold text-slate-900">{qty}</div>
                                <button
                                    onClick={() => setQty(Math.min(displayProduct.quantity || 99, qty + 1))}
                                    className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                                    disabled={isEditor}
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={displayProduct.quantity === 0 || isEditor}
                                className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                            >
                                <ShoppingCart className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                                {isEditor ? 'Add to Cart (Disabled)' : 'Add to Cart'}
                            </button>
                            <button
                                className="p-4 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-colors"
                                disabled={isEditor}
                            >
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
