import React from 'react';
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import { Link } from 'react-router-dom';

export const CartListRenderer = ({ settings, isEditor, viewMode = 'desktop' }) => {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
    const isMobile = viewMode === 'mobile';

    // -- SETTINGS --
    const showDiscountSummary = settings?.showDiscountSummary !== false;
    const showTaxSummary = settings?.showTaxSummary !== false;

    // Item Style
    const imageSize = settings?.imageSize || 'medium'; // small, medium, large
    const imageShape = settings?.imageShape || 'rounded'; // square, rounded
    const textAlign = settings?.textAlignment || 'left'; // left, center, right

    // Price Display
    const showUnitPrice = settings?.showUnitPrice !== false;
    const showStrikePrice = settings?.showStrikePrice !== false;
    const showItemSubtotal = settings?.showItemSubtotal !== false;
    const showDiscountBadge = settings?.showDiscountBadge !== false;
    const badgeStyle = settings?.badgeStyle || 'pill';

    // Summary Style
    const summarySpacing = settings?.summarySpacing || 'normal';
    const summaryDividers = settings?.summaryDividers !== false;


    // -- HELPER CLASSES --
    const getImgW = () => {
        if (imageSize === 'small') return 'w-16 h-16';
        if (imageSize === 'large') return 'w-32 h-32';
        return 'w-24 h-24'; // medium
    }

    const getImgRound = () => imageShape === 'rounded' ? 'rounded-xl' : 'rounded-none';

    const getAlignClass = () => {
        if (textAlign === 'center') return 'text-center items-center';
        if (textAlign === 'right') return 'text-right items-end';
        return 'text-left items-start';
    }

    const getSpacingClass = () => {
        if (summarySpacing === 'tight') return 'space-y-2';
        if (summarySpacing === 'relaxed') return 'space-y-6';
        return 'space-y-4';
    }

    // -- DATA PREP --
    // In editor, show mock items if empty
    const displayCart = (isEditor && cart.length === 0) ? [
        { id: 'mock1', name: 'Sample Product', price: 99.00, originalPrice: 120.00, discountApplied: true, discountPct: 20, quantity: 1, variantTitle: 'Color: Red', image: null },
        { id: 'mock2', name: 'Another Item', price: 45.50, quantity: 2, image: null }
    ] : cart;

    const subtotal = isEditor && cart.length === 0 ? 190.00 : cartTotal;
    const estimatedTax = subtotal * 0.1; // Mock 10% tax for display

    if (displayCart.length === 0) {
        return (
            <div className="py-24 px-4 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Your cart is empty</h2>
                <p className="text-slate-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 ${isMobile ? 'py-6' : ''}`}>
            <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold text-slate-900 mb-8`}>Shopping Cart</h1>

            <div className={`grid grid-cols-1 ${viewMode === 'desktop' ? 'lg:grid-cols-3' : ''} gap-12`}>
                {/* Cart Items List */}
                <div className={`${viewMode === 'desktop' ? 'lg:col-span-2' : ''} space-y-8`}>
                    {displayCart.map((item, i) => (
                        <div key={i} className={`flex gap-6 ${isEditor ? 'pointer-events-none' : ''}`}>
                            {/* Image */}
                            <div className={`bg-slate-100 flex-shrink-0 relative overflow-hidden ${getImgW()} ${getImgRound()}`}>
                                {item.image || item.images?.[0] ? (
                                    <img src={item.image || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <ShoppingCart className="w-6 h-6" />
                                    </div>
                                )}
                            </div>

                            {/* Details */}
                            <div className={`flex-1 flex flex-col justify-between py-1`}>
                                <div className={`flex flex-col ${getAlignClass()}`}>
                                    <div className="flex justify-between w-full items-start">
                                        <div className={`flex flex-col ${getAlignClass()}`}>
                                            <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                                            {item.variantTitle && (
                                                <p className="text-sm text-slate-500 mt-1">{item.variantTitle}</p>
                                            )}
                                            {showDiscountBadge && item.discountApplied && (
                                                <span className={`
                                                    mt-2 text-xs font-bold px-2 py-0.5 uppercase tracking-wide
                                                    ${badgeStyle === 'pill' ? 'rounded-full' : 'rounded-md'}
                                                    bg-red-100 text-red-700
                                                `}>
                                                    Sale
                                                </span>
                                            )}
                                        </div>
                                        {/* Shows price if Right Aligned? No, price is usually separate. Keep separate for mobile structure? */}
                                    </div>

                                    {showUnitPrice && (
                                        <div className={`flex flex-wrap gap-2 items-baseline mt-2 ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : ''}`}>
                                            <p className="text-sm font-medium text-slate-600">
                                                ${parseFloat(item.price).toFixed(2)}
                                            </p>
                                            {showStrikePrice && item.originalPrice && (
                                                <p className="text-xs text-slate-400 line-through">
                                                    ${parseFloat(item.originalPrice).toFixed(2)}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    {/* Qty Control */}
                                    <div className={`flex items-center border border-slate-200 rounded-lg ${isEditor ? 'opacity-50' : ''}`}>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                                            className="p-2 hover:bg-slate-50 text-slate-500"
                                            disabled={isEditor}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="w-10 text-center font-bold text-sm">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                                            className="p-2 hover:bg-slate-50 text-slate-500"
                                            disabled={isEditor}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        {showItemSubtotal && (
                                            <p className="font-bold text-slate-900 text-lg">
                                                ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                            </p>
                                        )}
                                        <button
                                            onClick={() => removeFromCart(item.id, item.variantId)}
                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                            disabled={isEditor}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-50 rounded-2xl p-6 lg:sticky lg:top-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>

                        <div className={getSpacingClass()}>
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                            </div>

                            {showDiscountSummary && (
                                <div className="flex justify-between text-red-600">
                                    <span>Discount</span>
                                    <span>-$0.00</span>
                                </div>
                            )}

                            {showTaxSummary && (
                                <div className="flex justify-between text-slate-600">
                                    <span>Estimated Tax</span>
                                    <span>${estimatedTax.toFixed(2)}</span>
                                </div>
                            )}

                            {summaryDividers && <hr className="border-slate-200 my-4" />}

                            <div className="flex justify-between text-lg font-bold text-slate-900">
                                <span>Total</span>
                                <span>${(subtotal + (showTaxSummary ? estimatedTax : 0)).toFixed(2)}</span>
                            </div>
                        </div>

                        <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center group">
                            Checkout
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
