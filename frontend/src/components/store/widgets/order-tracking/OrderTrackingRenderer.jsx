import React, { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Search, Loader2, Package, CheckCircle, Clock, AlertCircle, Truck, MessageSquare, Lock } from 'lucide-react';

export function OrderTrackingRenderer({ settings }) {
    const [orderId, setOrderId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    const [comments, setComments] = useState([]);

    const isValidUUID = (uuid) => {
        // Allow full UUID or partial hex string (min 8 chars)
        const regex = /^[0-9a-f]{8,}/i;
        return regex.test(uuid);
    };

    const handleTrack = async (e) => {
        e.preventDefault();
        const trimmedId = orderId.trim();

        if (!trimmedId) return;

        if (!isValidUUID(trimmedId)) {
            setError("Invalid Order ID. Please enter at least the first 8 characters.");
            return;
        }

        setLoading(true);
        setError(null);
        setOrderData(null);
        setComments([]);

        try {
            // 1. Fetch Order Status via secure RPC
            const { data: orderResult, error: orderError } = await supabase
                .rpc('track_order_status', { p_order_id: orderId.trim() });

            if (orderError) throw orderError;
            if (!orderResult || orderResult.length === 0) {
                throw new Error("Order not found. Please check the ID and try again.");
            }

            const order = orderResult[0];
            setOrderData(order);

            // 2. Fetch Public Comments if order found
            const { data: commentsResult, error: commentsError } = await supabase
                .from('order_comments')
                .select('*')
                .eq('order_id', order.id)
                .eq('is_customer_visible', true)
                .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;
            setComments(commentsResult || []);

        } catch (err) {
            console.error("Tracking Error:", err);
            setError(err.message || "Failed to track order");
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'paid': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending': return 'bg-slate-100 text-slate-800 border-slate-200';
            case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5" />;
            case 'shipped': return <Truck className="h-5 w-5" />;
            case 'cancelled': return <AlertCircle className="h-5 w-5" />;
            default: return <Clock className="h-5 w-5" />;
        }
    };

    // Styles from settings
    const containerStyle = {
        backgroundColor: settings.backgroundColor || '#ffffff',
        padding: `${settings.paddingY || 40}px ${settings.paddingX || 20}px`,
        textAlign: settings.alignment || 'center',
    };

    const inputStyle = {
        borderColor: settings.inputBorderColor || '#e2e8f0',
        borderRadius: `${settings.inputRadius || 8}px`,
    };

    const buttonStyle = {
        backgroundColor: settings.buttonColor || '#4f46e5',
        color: settings.buttonTextColor || '#ffffff',
        borderRadius: `${settings.buttonRadius || 8}px`,
    };

    return (
        <div style={containerStyle} className="w-full">
            <div className="max-w-xl mx-auto space-y-8">

                {/* Header */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900" style={{ color: settings.headingColor }}>
                        {settings.headingText || 'Track Your Order'}
                    </h2>
                    <p className="text-slate-500" style={{ color: settings.subheadingColor }}>
                        {settings.subheadingText || 'Enter your order ID to see the current status and updates.'}
                    </p>
                </div>

                {/* Input Form */}
                <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            value={orderId}
                            onChange={(e) => setOrderId(e.target.value)}
                            placeholder={settings.placeholderText || "e.g. 550e8400-e29b..."}
                            className="w-full pl-10 pr-4 py-3 border bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            style={inputStyle}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={buttonStyle}
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (settings.buttonText || 'Track Order')}
                    </button>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Order Result */}
                {orderData && (
                    <div className="text-left bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Order Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Order ID</div>
                                <div className="font-mono text-sm text-slate-700">{orderData.id.slice(0, 8)}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-full border flex items-center gap-2 capitalize font-medium ${getStatusColor(orderData.status)}`}>
                                {getStatusIcon(orderData.status)}
                                {orderData.status}
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="p-6 flex flex-wrap gap-8 border-b border-slate-100">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Placed</div>
                                <div className="text-slate-900 font-medium">
                                    {new Date(orderData.created_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Last Updated</div>
                                <div className="text-slate-900 font-medium">
                                    {new Date(orderData.updated_at).toLocaleDateString(undefined, {
                                        year: 'numeric', month: 'long', day: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total</div>
                                <div className="text-slate-900 font-medium">
                                    {orderData.currency} {orderData.total}
                                </div>
                            </div>
                        </div>

                        {/* Public Comments Timeline */}
                        <div className="p-6 bg-slate-50/30">
                            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />
                                Order Updates
                            </h3>

                            {comments.length === 0 ? (
                                <div className="text-sm text-slate-500 italic">No updates available yet.</div>
                            ) : (
                                <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="relative pl-8">
                                            {/* Timeline Dot */}
                                            <div className="absolute left-0 top-1.5 w-4.5 h-4.5 bg-white border-2 border-indigo-500 rounded-full z-10"></div>

                                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                                <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
                                                    <span className="font-bold text-indigo-600 uppercase tracking-wider">Update</span>
                                                    <span>•</span>
                                                    <span>
                                                        {new Date(comment.created_at).toLocaleString(undefined, {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {comment.message}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
