import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../../../context/CartContext';

export const CartListRenderer = ({ style, content, isEditor }) => {
    const { cart } = useCart();

    // Stub implementation
    if (cart.length === 0 && !isEditor) return <div className="p-8 text-center text-slate-500">Your cart is empty</div>;

    return (
        <div className="w-full py-12 px-4">
            <h2 className="text-2xl font-bold mb-8">Shopping Cart</h2>
            <div className="space-y-4">
                {/* Basic list stub */}
                {(isEditor ? [1, 2] : cart).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center">
                                <ShoppingCart className="text-slate-300" />
                            </div>
                            <div>
                                <p className="font-bold">Product Name</p>
                                <p className="text-sm text-slate-500">$99.00</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
