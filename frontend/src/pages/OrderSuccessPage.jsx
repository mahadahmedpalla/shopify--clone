import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, Package, Home, ChevronRight, ShoppingBag } from 'lucide-react';

export function OrderSuccessPage() {
    const { storeSubUrl, orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Store
                const { data: storeData } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('sub_url', storeSubUrl)
                    .single();

                if (!storeData) throw new Error("Store not found");
                setStore(storeData);

                // Fetch Order
                const { data: orderData } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('id', orderId)
                    .single();

                // Security check: simple verification (optional, real apps use auth)
                // If order doesn't exist or store mismatch
                if (!orderData || orderData.store_id !== storeData.id) {
                    throw new Error("Order not found");
                }

                setOrder(orderData);

            } catch (error) {
                console.error("Error loading order:", error);
                // Optionally redirect or show error
            } finally {
                setLoading(false);
            }
        };

        if (storeSubUrl && orderId) {
            fetchData();
        }
    }, [storeSubUrl, orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
                <p className="text-gray-500 mb-6">We couldn't find the order you're looking for.</p>
                <Link to={`/s/${storeSubUrl}`} className="px-6 py-3 bg-indigo-600 text-white rounded-lg">Return to Store</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Header / Brand */}
                <div className="text-center mb-8">
                    <Link to={`/s/${storeSubUrl}`} className="text-2xl font-black text-indigo-600 tracking-tight">
                        {store.name}
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Success Header */}
                    <div className="bg-green-50 p-8 text-center border-b border-green-100">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-green-900 mb-2">Thank you!</h1>
                        <p className="text-green-700">Your order has been placed successfully.</p>
                        <p className="text-sm text-green-600 mt-2">Order #{order.id.slice(0, 8)}</p>
                    </div>

                    {/* Order Details Grid */}
                    <div className="p-6 md:p-8 space-y-8">

                        {/* Customer & Shipping Info */}
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Information</h3>
                                <div className="text-gray-900">
                                    <p className="font-medium">{order.customer_email}</p>
                                    <p>{order.customer_phone}</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Shipping Address</h3>
                                <div className="text-gray-900">
                                    <p className="font-medium">{order.customer_name}</p>
                                    <p>{order.shipping_address?.address1}</p>
                                    {order.shipping_address?.address2 && <p>{order.shipping_address.address2}</p>}
                                    <p>
                                        {order.shipping_address?.city}, {order.shipping_address?.country} {order.shipping_address?.zip}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">Order Items</h3>
                            <div className="space-y-4">
                                {order.items && order.items.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-16 w-16 flex-shrink-0 border border-gray-200 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{item.name}</h4>
                                                {item.variantTitle && <p className="text-xs text-gray-500">{item.variantTitle}</p>}
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-100 pt-6">
                            <div className="flex justify-between text-sm mb-2 text-gray-600">
                                <span>Subtotal</span>
                                <span>{order.currency} {order.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2 text-gray-600">
                                <span>Shipping</span>
                                <span>{order.currency} {order.shipping_cost}</span>
                            </div>
                            {parseFloat(order.discount_total) > 0 && (
                                <div className="flex justify-between text-sm mb-2 text-green-600">
                                    <span>Discount</span>
                                    <span>- {order.currency} {order.discount_total}</span>
                                </div>
                            )}
                            {parseFloat(order.tax_total) > 0 && (
                                <div className="flex justify-between text-sm mb-2 text-gray-600">
                                    <span>Tax</span>
                                    <span>{order.currency} {order.tax_total}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-4">
                                <span className="text-lg font-bold text-gray-900">Total</span>
                                <span className="text-2xl font-bold text-gray-900">{order.currency} {order.total}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-6 text-center">
                            <Link
                                to={`/s/${storeSubUrl}`}
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
