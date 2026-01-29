import React, { useEffect } from 'react';
import { useCart } from '../../../../context/CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export function CartDrawer() {
    const { cart, removeFromCart, updateQuantity, isOpen, setIsOpen, cartTotal } = useCart();

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Shopping Cart
                        <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs py-0.5 px-2 rounded-full">{cart.length} items</span>
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center">
                                <ShoppingBag className="h-8 w-8 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Your cart is empty</h3>
                                <p className="text-slate-500 text-sm">Looks like you haven't added anything yet.</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        cart.map((item, idx) => (
                            <div key={`${item.id}-${item.variantId || idx}`} className="flex gap-4">
                                {/* Image */}
                                <div className="h-24 w-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 relative">
                                    {item.image || item.images?.[0] ? (
                                        <img src={item.image || item.images[0]} alt={item.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                                            <ShoppingBag className="h-8 w-8" />
                                        </div>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-slate-900 line-clamp-2 text-sm">{item.name}</h4>
                                                {item.variantTitle && (
                                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.variantTitle}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.variantId)}
                                                className="text-slate-300 hover:text-red-500 p-1 -mt-1 -mr-1"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium text-slate-500 mt-1">${parseFloat(item.price).toFixed(2)}</p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center border border-slate-200 rounded-lg">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                                                className="p-1.5 hover:bg-slate-50 text-slate-500"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                                                className="p-1.5 hover:bg-slate-50 text-slate-500"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                        <p className="font-bold text-indigo-600 text-sm">
                                            ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                        <div className="flex items-center justify-between text-slate-600">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-900">${cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-slate-400 text-center">
                            Tax included and shipping calculated at checkout
                        </div>
                        <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center group">
                            Checkout
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
