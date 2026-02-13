import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../../../context/CartContext';
import { calculateOrderDiscount } from '../../../../utils/discountUtils';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';

// Currency Format Helper
const currency = settings?.storeCurrency || 'USD'; // Passed from parent or context if available? 
// Actually CartDrawer doesn't receive store prop directly in this file
// But we can get it from UseCart if we updated the context, OR we can accept it as prop.
// Let's assume for now we might need to pass it or default to USD.
// The previous files received `store` prop. 
// `PublicStorefront` renders `CartDrawer`? No, `CartDrawer` is usually globally rendered or by `CartProvider`?
// `CartProvider` is in `CartContext`.
// Let's check `CartContext` or where `CartDrawer` is detected.
// Ah, `PublicProductPage` renders `CartDrawer`? No, it renders `CartDrawer` is imported but not used? 
// Wait, `PublicProductPage` had `import { CartDrawer }` but I didn't see it used in the JSX I read (it was `BlockRenderer`).
// `PublicStorefront` likely uses it.

// For now, let's use a safe default or passed prop if we can.
// The `settings` prop comes from `cartSettings`. 
// We might need to inject currency into settings or context.
// Let's stick to 'USD' if not found, but better to use `store?.currency`.
// `CartDrawer` usage in `PublicStorefront`:
// <CartDrawer isOpen={isCartOpen} setIsOpen={setIsCartOpen} settings={cartStats} />
// We should update `PublicStorefront` to pass `store` or `currency` to `CartDrawer`.

// I will add `currency` prop to `CartDrawer` and use it.

export function CartDrawer({ settings, currency = 'USD' }) {
    const { cart, removeFromCart, updateQuantity, isOpen, setIsOpen, cartTotal, storeDiscounts } = useCart();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(price);
    };

    // ... (rest of the file using formatPrice)

    {
        showUnitPrice && (
            <div className="flex flex-col mt-1">
                {(settings?.showCompareAtPrice && (item.compareAtPrice || item.compare_at_price) && parseFloat(item.compareAtPrice || item.compare_at_price) > parseFloat(item.price)) ? (
                    <div className={`flex items-baseline gap-2 ${getAlignClass() === 'text-right items-end' ? 'flex-row-reverse' : ''}`}>
                        <span
                            className="text-sm font-bold"
                            style={{ color: settings?.priceColor || '#64748b' }}
                        >
                            {formatPrice(item.price)}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                            {formatPrice(item.compareAtPrice || item.compare_at_price)}
                        </span>
                    </div>
                ) : (
                    <p
                        className="text-sm font-medium"
                        style={{ color: settings?.priceColor || '#64748b' }}
                    >
                        {formatPrice(item.price)}
                    </p>
                )}
            </div>

        )
    }

    {/* Stock Warnings */ }
    {
        item.maxStock !== undefined && (
            <div className="mt-1">
                {item.maxStock === 0 ? (
                    <p className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded-md inline-block">
                        Out of stock
                    </p>
                ) : item.quantity > item.maxStock ? (
                    <p className="text-xs text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-md inline-block">
                        Only {item.maxStock} items left
                    </p>
                ) : null}
            </div>
        )
    }
                                    </div >

        <div className="flex items-center justify-between">
            <div className="flex items-center border border-slate-200 rounded-lg">
                <button
                    onClick={() => updateQuantity(item.id, item.variantId, item.quantity - 1)}
                    disabled={item.maxStock === 0}
                    className={`p-1.5 hover:bg-slate-50 text-slate-500 ${item.maxStock === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                <button
                    onClick={() => updateQuantity(item.id, item.variantId, item.quantity + 1)}
                    disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                    className={`p-1.5 hover:bg-slate-50 text-slate-500 transition-colors ${(item.maxStock !== undefined && item.quantity >= item.maxStock) ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title={(item.maxStock !== undefined && item.quantity >= item.maxStock) ? 'Max stock reached' : ''}
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
            {showItemSubtotal && (
                <p className="font-bold text-indigo-600 text-sm">
                    {formatPrice(parseFloat(item.price) * item.quantity)}
                </p>
            )}
        </div>
                                </div >
                            </div >
                        ))
                    )
}
                </div >

    {/* Footer */ }
{
    cart.length > 0 && (
        <div className="p-6 border-t border-slate-100 bg-slate-50 space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900">{formatPrice(cartTotal)}</span>
                </div>



                {showDiscountSummary && discountAmount > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-600 font-medium">
                        <div className="flex items-center gap-2">
                            <span>Discount</span>
                            {autoDiscount.discountName && (
                                <span className="text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full">
                                    {autoDiscount.discountName}
                                </span>
                            )}
                        </div>
                        <span>-{formatPrice(discountAmount)}</span>
                    </div>
                )}

                {showTaxSummary && (
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Tax (Estimate)</span>
                        <span>{formatPrice(0)}</span>
                    </div>
                )}

                <div className="flex items-center justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span>{formatPrice(parseFloat(calculateTotal()) - discountAmount)}</span>
                </div>
            </div>

            <p className="text-xs text-slate-400 text-center">Shipping calculated at checkout</p>
            <button
                onClick={() => {
                    setIsOpen(false);
                    if (storeSubUrl) {
                        navigate(`/s/${storeSubUrl}/checkout`);
                    } else {
                        navigate('/checkout');
                    }
                }}
                disabled={cart.some(item => item.maxStock !== undefined && item.quantity > item.maxStock)}
                className="w-full py-4 rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
                style={{
                    backgroundColor: settings?.checkoutBtnBg || '#4f46e5',
                    color: settings?.checkoutBtnColor || '#ffffff',
                    fontWeight: settings?.checkoutBtnWeight === 'extrabold' ? 800 : settings?.checkoutBtnWeight === 'bold' ? 700 : settings?.checkoutBtnWeight === 'medium' ? 500 : 400
                }}
            >
                {cart.some(item => item.maxStock !== undefined && item.quantity > item.maxStock)
                    ? 'FIX STOCK ISSUES TO CHECKOUT'
                    : <>CHECKOUT <span className="ml-2">→</span></>}
            </button>
        </div>
    )
}
            </div >
        </div >
    );
}
