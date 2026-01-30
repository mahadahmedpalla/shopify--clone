import React, { useEffect } from 'react';
import { useCart } from '../../../../context/CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

export function CartDrawer({ settings }) {
    const { cart, removeFromCart, updateQuantity, isOpen, setIsOpen, cartTotal } = useCart();

    // -- SETTINGS --
    const imageShape = settings?.imageShape || 'rounded';
    const showTaxSummary = settings?.showTaxSummary !== false;
    const showDiscountSummary = settings?.showDiscountSummary !== false;
    // Price Display Settings
    const showUnitPrice = settings?.showUnitPrice !== false;
    const showItemSubtotal = settings?.showItemSubtotal !== false;

    // Text Alignment
    const textAlign = settings?.textAlignment || 'left';

    const getImgRound = () => imageShape === 'rounded' ? 'rounded-xl' : 'rounded-none';
    const getAlignClass = () => {
        if (textAlign === 'center') return 'text-center items-center';
        if (textAlign === 'right') return 'text-right items-end';
        return 'text-left items-start';
    }

    // Lock body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
    };

    const calculateSavings = () => {
        return cart.reduce((total, item) => {
            const price = parseFloat(item.price);
            const compareAt = parseFloat(item.compareAtPrice || item.compare_at_price || 0);
            if (compareAt > price) {
                return total + ((compareAt - price) * item.quantity);
            }
            return total;
        }, 0).toFixed(2);
    };

    const totalSavings = calculateSavings();

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

                {/* items... but first, announcement(s) */}

                {/* Announcement 1 */}
                {settings?.showAnnouncement1 !== false && settings?.announcement1Text && (
                    <div
                        className="px-6 py-3 border-b border-slate-50 relative"
                        style={{ backgroundColor: settings.announcement1Bg || '#eef2ff' }}
                    >
                        <p
                            className="text-sm text-center leading-relaxed"
                            style={{
                                color: settings.announcement1Color || '#4338ca',
                                fontWeight: settings.announcement1Weight === 'bold' ? 700 : settings.announcement1Weight === 'medium' ? 500 : 400
                            }}
                        >
                            {settings.announcement1Text}
                        </p>
                    </div>
                )}
                {/* Legacy support for previous 'drawerAnnouncement' field if used, or migrate it? */}
                {/* If user used old 'drawerAnnouncement', we treat it as Announcement 1 fallback if empty? 
                    Actually, let's just support it as a legacy check if Ann1 is missing.
                */}
                {!settings?.announcement1Text && settings?.drawerAnnouncement && (
                    <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100">
                        <p className="text-sm text-indigo-700 font-medium text-center leading-relaxed">
                            {settings.drawerAnnouncement}
                        </p>
                    </div>
                )}

                {/* Announcement 2 */}
                {settings?.showAnnouncement2 && settings?.announcement2Text && (
                    <div
                        className="px-6 py-3 border-b border-slate-50 relative"
                        style={{ backgroundColor: settings.announcement2Bg || '#fff1f2' }}
                    >
                        <p
                            className="text-sm text-center leading-relaxed"
                            style={{
                                color: settings.announcement2Color || '#be123c',
                                fontWeight: settings.announcement2Weight === 'bold' ? 700 : settings.announcement2Weight === 'medium' ? 500 : 400
                            }}
                        >
                            {settings.announcement2Text}
                        </p>
                    </div>
                )}


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
                                <div className={`h-24 w-24 bg-slate-100 flex-shrink-0 border border-slate-100 relative overflow-hidden ${getImgRound()}`}>
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
                                    <div className={`flex flex-col ${getAlignClass()}`}>
                                        <div className="flex justify-between items-start w-full">
                                            <div className={`flex flex-col ${getAlignClass()} flex-1`}>
                                                <h4 className="font-bold text-slate-900 line-clamp-2 text-sm">{item.name}</h4>
                                                {item.variantTitle && (
                                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.variantTitle}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.id, item.variantId)}
                                                className="text-slate-300 hover:text-red-500 p-1 -mt-1 -mr-1 ml-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {showUnitPrice && (
                                            <div className="flex flex-col mt-1">
                                                {(settings?.showCompareAtPrice && (item.compareAtPrice || item.compare_at_price) && parseFloat(item.compareAtPrice || item.compare_at_price) > parseFloat(item.price)) ? (
                                                    <div className={`flex items-baseline gap-2 ${getAlignClass() === 'text-right items-end' ? 'flex-row-reverse' : ''}`}>
                                                        <span
                                                            className="text-sm font-bold"
                                                            style={{ color: settings?.priceColor || '#64748b' }}
                                                        >
                                                            ${parseFloat(item.price).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs text-slate-400 line-through">
                                                            ${parseFloat(item.compareAtPrice || item.compare_at_price).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <p
                                                        className="text-sm font-medium"
                                                        style={{ color: settings?.priceColor || '#64748b' }}
                                                    >
                                                        ${parseFloat(item.price).toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        )}
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
                                        {showItemSubtotal && (
                                            <p className="font-bold text-indigo-600 text-sm">
                                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-slate-600 font-medium">
                                <span>Subtotal</span>
                                <span className="text-slate-900">${cartTotal.toFixed(2)}</span>
                            </div>



                            {showDiscountSummary && (
                                <div className="flex items-center justify-between text-sm text-emerald-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>Discount</span>
                                        {parseFloat(totalSavings) > 0 && (
                                            <span className="text-[10px] font-bold">
                                                (You saved)
                                            </span>
                                        )}
                                    </div>
                                    <span>${totalSavings}</span>
                                </div>
                            )}

                            {showTaxSummary && (
                                <div className="flex items-center justify-between text-sm text-slate-500">
                                    <span>Tax (Estimate)</span>
                                    <span>$0.00</span>
                                </div>
                            )}

                            <div className="flex items-center justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                                <span>Total</span>
                                <span>${calculateTotal()}</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 text-center">Shipping calculated at checkout</p>
                        <button
                            className="w-full py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                            style={{
                                backgroundColor: settings?.checkoutBtnBg || '#4f46e5',
                                color: settings?.checkoutBtnColor || '#ffffff',
                                fontWeight: settings?.checkoutBtnWeight === 'extrabold' ? 800 : settings?.checkoutBtnWeight === 'bold' ? 700 : settings?.checkoutBtnWeight === 'medium' ? 500 : 400
                            }}
                        >
                            CHECKOUT <span className="ml-2">→</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
