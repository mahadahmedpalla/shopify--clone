import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Package, MapPin, CreditCard, Calendar, Mail, Phone, User, ShoppingBag } from 'lucide-react';

export function OrderDetailModal({ order, isOpen, onClose }) {
    if (!isOpen || !order) return null;

    const modalRef = useRef(null);

    // Update document title for PDF filename
    React.useEffect(() => {
        const originalTitle = document.title;
        if (isOpen && order) {
            document.title = `Invoice #${order.id.slice(0, 8)}`;
        }
        return () => {
            document.title = originalTitle;
        };
    }, [isOpen, order]);

    const handlePrint = () => {
        window.print();
    };

    // Parse Helpers
    // Fallback if DB column is named 'items' or 'items_snapshot'
    const items = order.items || order.items_snapshot || [];
    const { shipping_address, payment_method, tax_breakdown } = order;

    // Totals
    const subtotal = order.subtotal || 0;
    const shippingCost = order.shipping_cost || 0;
    const taxTotal = order.tax_total || 0;
    const discountTotal = order.discount_total || 0;
    const total = order.total || 0;
    const currency = order.currency || 'USD';

    // Tax Breakdown Logic
    const taxBreakdown = order.tax_breakdown || {};

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 print:p-0 print:absolute print:inset-0 print:block">
            {/* Backdrop - Hide on print */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity print:hidden"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div
                ref={modalRef}
                className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto print:max-w-none print:max-h-none print:shadow-none print:rounded-none print:overflow-visible print:w-full print:h-auto"
            >
                {/* Header - No print background/buttons */}
                <div className="sticky top-0 z-10 bg-white border-b border-slate-100 p-6 flex items-center justify-between print:static print:border-none print:p-0 print:mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 print:text-3xl">Invoice #{order.id.slice(0, 8)}</h2>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1 print:text-slate-600">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(order.created_at).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                } print:border print:border-slate-300 print:bg-transparent print:text-slate-900`}>
                                {order.status}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 print:hidden">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 font-medium transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print Invoice
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8 print:p-0">

                    {/* Customer & Payment Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-12">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                                <User className="w-4 h-4 text-slate-400" /> Customer Details
                            </h3>
                            <div className="text-sm space-y-3">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Billing To</p>
                                    <p className="font-bold text-slate-900">{order.customer_name}</p>
                                    <p className="text-slate-600 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> {order.customer_email}
                                    </p>
                                    {order.customer_phone && (
                                        <p className="text-slate-600 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> {order.customer_phone}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Shipping & Payment */}
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
                                <MapPin className="w-4 h-4 text-slate-400" /> Shipping & Payment
                            </h3>
                            <div className="text-sm space-y-3">
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Shipping Address</p>
                                    <div className="text-slate-700">
                                        <p>{shipping_address?.address1}</p>
                                        {shipping_address?.address2 && <p>{shipping_address.address2}</p>}
                                        <p>{shipping_address?.city}, {shipping_address?.country} {shipping_address?.zip}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1 mt-3">Payment Method</p>
                                    <div className="flex items-center gap-2 text-slate-900 font-medium">
                                        <CreditCard className="w-4 h-4 text-slate-400" />
                                        {payment_method === 'cod' ? 'Cash on Delivery' : 'Credit Card'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items Table */}
                    <div className="border rounded-lg overflow-hidden border-slate-200 print:border-slate-300">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 print:bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Item</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {items?.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 border border-slate-200 rounded-md overflow-hidden bg-slate-50 print:hidden">
                                                    {item.image ? (
                                                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ShoppingBag className="h-5 w-5 m-2 text-slate-300" />
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{item.name}</div>
                                                    {item.variantTitle && (
                                                        <div className="text-xs text-slate-500">{item.variantTitle}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                                            {item.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                                            ${parseFloat(item.price).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                                            ${(item.price * item.quantity).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full md:w-1/2 lg:w-1/3 space-y-3 print:w-1/2">
                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Subtotal</span>
                                <span className="font-medium">${Number(subtotal).toFixed(2)}</span>
                            </div>

                            {discountTotal > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Discount</span>
                                    <span>-${Number(discountTotal).toFixed(2)}</span>
                                </div>
                            )}

                            <div className="flex justify-between text-sm text-slate-600">
                                <span>Shipping</span>
                                <span className="font-medium">${Number(shippingCost).toFixed(2)}</span>
                            </div>

                            {/* Tax Breakdown */}
                            {taxBreakdown && Object.keys(taxBreakdown).length > 0 ? (
                                Object.entries(taxBreakdown).map(([code, data]) => {
                                    const amount = typeof data === 'number' ? data : data.amount;
                                    const rate = typeof data === 'object' ? data.rate : null;
                                    const type = typeof data === 'object' ? data.type : null;
                                    const count = typeof data === 'object' ? data.count : 0;
                                    const applyPerItem = typeof data === 'object' && data.apply_per_item !== undefined ? data.apply_per_item : true;

                                    let label = code;
                                    if (rate !== null && type) {
                                        if (type === 'percentage') {
                                            label = `${code} (${rate}%)`;
                                        } else {
                                            if (applyPerItem === false) {
                                                label = `${code} ($${Number(rate).toFixed(2)} fixed)`;
                                            } else {
                                                if (count > 1) {
                                                    label = `${code} (${count} x $${Number(rate).toFixed(2)})`;
                                                } else {
                                                    label = `${code} ($${Number(rate).toFixed(2)} ea)`;
                                                }
                                            }
                                        }
                                    }

                                    return (
                                        <div key={code} className="flex justify-between text-sm text-slate-600">
                                            <span>{label}</span>
                                            <span className="font-medium">${Number(amount).toFixed(2)}</span>
                                        </div>
                                    );
                                })
                            ) : (
                                taxTotal > 0 && (
                                    <div className="flex justify-between text-sm text-slate-600">
                                        <span>Tax</span>
                                        <span className="font-medium">${Number(taxTotal).toFixed(2)}</span>
                                    </div>
                                )
                            )}

                            <div className="flex justify-between text-lg font-bold text-slate-900 pt-3 border-t border-slate-200 mt-2 print:border-slate-800">
                                <span>Total</span>
                                <span>${Number(total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        , document.body);
}
