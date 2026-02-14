import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, ShoppingBag, Loader2 } from 'lucide-react';
import { useStoreFavicon } from '../hooks/useStoreFavicon';

export function OrderSuccessPage({ customDomainStore }) {
    const { storeSubUrl, orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [store, setStore] = useState(customDomainStore || null);

    // Favicon
    useStoreFavicon(store);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Store (for branding/navigation if needed)
                if (!store && storeSubUrl) {
                    const { data: storeData } = await supabase
                        .from('stores')
                        .select('*')
                        .eq('sub_url', storeSubUrl)
                        .single();

                    if (storeData) setStore(storeData);
                } else if (!store && !customDomainStore) {
                    // Start of handling missing store
                    console.warn("No store context found for Order Success");
                }

                // 2. Fetch Order
                const token = new URLSearchParams(window.location.search).get('token');

                let orderData;
                let fetchError;

                if (token) {
                    // Use Secure RPC for guests
                    const { data, error } = await supabase.rpc('get_order_by_token', {
                        p_id: orderId,
                        p_token: token
                    }).single();
                    orderData = data;
                    fetchError = error;
                } else {
                    // Fallback for store owners (Standard RLS)
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*')
                        .eq('id', orderId)
                        .single();
                    orderData = data;
                    fetchError = error;
                }

                if (fetchError) throw fetchError;
                if (!orderData) throw new Error("Order not found");

                setOrder(orderData);

            } catch (err) {
                console.error("Error loading order:", err);
                setError(err);
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

                    {/* Debug Info */}
                    <div className="bg-red-50 p-4 rounded text-left text-xs text-red-600 mb-4 max-w-md mx-auto overflow-auto">
                        <p className="font-bold">Debug Info:</p>
                        <p>ID: {orderId}</p>
                        <p>Token: {new URLSearchParams(window.location.search).get('token')}</p>
                        {error && <p>Error: {error.message || JSON.stringify(error)}</p>}
                    </div>

                    <Link
                        to={customDomainStore ? '/' : `/s/${storeSubUrl}`}
                        className="inline-flex items-center text-indigo-600 font-bold hover:underline"
                    >
                        Return to Store
                    </Link>
                </div>
            </div>
        );
    }

    const { shipping_address, items, payment_method, subtotal, shipping_cost, total, discount_total, tax_total } = order;

    // Map flat DB columns to the structure expected by the UI
    const totals = {
        subtotal: subtotal,
        shippingCost: shipping_cost,
        total: total,
        discountTotal: discount_total,
        taxTotal: tax_total || 0,
        taxBreakdown: order.tax_breakdown || {}
    };

    // Parse if they are strings (depends on DB storage, usually JSONB comes as object)
    // Supabase JS client auto-parses JSONB columns.

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-slate-900 py-12 pb-24 px-4">
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
                        Order #{order.id.slice(0, 8)}
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
                                {items && items.map((item, idx) => (
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
                                            <div className="text-sm text-slate-400 mt-1">
                                                <p>Qty: {item.quantity}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span>
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(item.price)}
                                                    </span>
                                                    {item.originalPrice && item.originalPrice > item.price && (
                                                        <span className="line-through decoration-slate-400">
                                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(item.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(item.price * item.quantity)}
                                            </p>
                                            {item.originalPrice && item.originalPrice > item.price && (
                                                <p className="text-xs text-slate-400 line-through">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(item.originalPrice * item.quantity)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Totals */}
                            < div className="bg-slate-50 p-6 space-y-3" >
                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Subtotal</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(totals?.subtotal || 0)}
                                    </span>
                                </div>

                                {(totals?.discountTotal > 0) && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span className="font-medium">
                                            -{new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(totals.discountTotal)}
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between text-sm text-slate-600">
                                    <span>Shipping</span>
                                    <span className="font-medium">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(totals?.shippingCost || 0)}
                                    </span>
                                </div>

                                {/* Tax Breakdown */}
                                {totals.taxBreakdown && Object.keys(totals.taxBreakdown).length > 0 ? (
                                    Object.entries(totals.taxBreakdown).map(([code, data]) => {
                                        const amount = typeof data === 'number' ? data : data.amount;
                                        const rate = typeof data === 'object' ? data.rate : null;
                                        const type = typeof data === 'object' ? data.type : null;
                                        const count = typeof data === 'object' ? data.count : 0;
                                        const applyPerItem = typeof data === 'object' && data.apply_per_item !== undefined ? data.apply_per_item : true;

                                        // Currency formatting helper (defined inside map to access store)
                                        const currency = store?.currency || 'USD';
                                        const formatPrice = (price) => {
                                            return new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: currency,
                                            }).format(price);
                                        };

                                        let label = code;
                                        if (rate !== null && type) {
                                            if (type === 'percentage') {
                                                label = `${code} (${rate}%)`;
                                            } else {
                                                if (applyPerItem === false) {
                                                    label = `${code} (${formatPrice(Number(rate))} fixed)`;
                                                } else {
                                                    if (count > 1) {
                                                        label = `${code} (${count} x ${formatPrice(Number(rate))})`;
                                                    } else {
                                                        label = `${code} (${formatPrice(Number(rate))} ea)`;
                                                    }
                                                }
                                            }
                                        }

                                        return (
                                            <div key={code} className="flex justify-between text-sm text-slate-600">
                                                <span>{label}</span>
                                                <span className="font-medium">{formatPrice(amount)}</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    totals.taxTotal > 0 && (
                                        <div className="flex justify-between text-sm text-slate-600">
                                            <span>Tax</span>
                                            <span className="font-medium">{new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(totals.taxTotal)}</span>
                                        </div>
                                    )
                                )}

                                <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: store?.currency || 'USD' }).format(totals?.total || 0)}</span>
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
                        {/* Continue Shopping */}
                        <Link
                            to={customDomainStore ? '/' : `/s/${storeSubUrl}`}
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
