import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';

export function OrderSuccessPage() {
    const { storeSubUrl, orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Store (for branding/navigation if needed)
                const { data: storeData } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('sub_url', storeSubUrl)
                    .single();

                if (storeData) setStore(storeData);

                // 2. Fetch Order
                const { data: orderData, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                if (error) throw error;
                setOrder(orderData);

            } catch (err) {
                console.error("Error loading order:", err);
            } finally {
                setLoading(false);
            }
        };

        if (orderId) fetchData();
    }, [orderId, storeSubUrl]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans text-slate-900">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
                    <p className="text-slate-500 mb-6">We couldn't find the order you're looking for.</p>
                    <Link
                        to={`/s/${storeSubUrl}`}
                        className="inline-flex items-center text-indigo-600 font-bold hover:underline"
                    >
                        Return to Store
                    </Link>
                </div>
            </div>
        );
    }

    const { shipping_address, items_snapshot, totals, payment_method } = order;

    // Parse if they are strings (depends on DB storage, usually JSONB comes as object)
    // Supabase JS client auto-parses JSONB columns.

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm p-8 text-center border border-slate-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Thank you for your order!</h1>
                    <p className="text-slate-500">
                        Hi {shipping_address?.firstName || 'there'}, your order has been confirmed.
                    </p>
                    <div className="mt-4 inline-block px-4 py-1 bg-slate-100 rounded-full text-sm font-mono text-slate-600">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Order Details (Left 2 cols) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Items */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
                                <Package className="w-5 h-5 text-slate-400" />
                                <h2 className="font-bold text-lg">Order Summary</h2>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {items_snapshot && items_snapshot.map((item, idx) => (
                                    <div key={idx} className="p-6 flex items-center gap-4">
                                        <div className="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="w-6 h-6 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm truncate">{item.name}</h3>
                                            {item.variantTitle && (
                                                <p className="text-sm text-slate-500">{item.variantTitle}</p>
                                            )}
                                            <p className="text-sm text-slate-400 mt-1">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</p>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <p className="text-xs text-slate-400 line-through">${(item.originalPrice * item.quantity).toFixed(2)}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Totals */}
                            <div className="bg-slate-50 p-6 space-y-3">
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">${totals?.subtotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Shipping</span>
                                    <span className="font-medium">${totals?.shippingCost?.toFixed(2) || '0.00'}</span>
                                </div>
                                {(totals?.discountTotal > 0) && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span className="font-medium">-${totals.discountTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                                    <span>Total</span>
                                    <span>${totals?.total?.toFixed(2) || '0.00'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar (Right col) */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-slate-400" />
                                <h2 className="font-bold text-lg">Shipping Address</h2>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                                <p className="font-medium text-slate-900">{shipping_address?.firstName} {shipping_address?.lastName}</p>
                                <p>{shipping_address?.address1}</p>
                                {shipping_address?.address2 && <p>{shipping_address.address2}</p>}
                                <p>{shipping_address?.city}, {shipping_address?.country} {shipping_address?.zip}</p>
                                {shipping_address?.phone && <p className="pt-2 text-slate-400">{shipping_address.phone}</p>}
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <CreditCard className="w-5 h-5 text-slate-400" />
                                <h2 className="font-bold text-lg">Payment Method</h2>
                            </div>
                            <div className="text-sm text-slate-600">
                                {payment_method === 'cod' ? (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">Cash on Delivery</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900">Credit Card</span>
                                        <span className="text-slate-400">• • • • 4242</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Continue Shopping */}
                        <Link
                            to={`/s/${storeSubUrl}`}
                            className="block w-full py-4 bg-indigo-600 text-white font-bold rounded-xl text-center hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
