import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../ui/Button';
import { CouponForm } from './CouponForm';
import { formatCurrency } from '../../../utils/currencyUtils';
import {
    Ticket,
    Plus,
    Search,
    Edit2,
    Trash2,
    MoreVertical,
    Calendar,
    Power,
    Copy,
    Check
} from 'lucide-react';

export function CouponsPage() {
    const { storeId } = useParams();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedId, setCopiedId] = useState(null);
    const [currency, setCurrency] = useState('USD');

    useEffect(() => {
        fetchCoupons();
    }, [storeId]);

    const fetchCoupons = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('coupons')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (data) setCoupons(data);
        setLoading(false);
    };

    useEffect(() => {
        if (storeId) {
            const fetchStoreSettings = async () => {
                const { data } = await supabase
                    .from('stores')
                    .select('currency')
                    .eq('id', storeId)
                    .single();
                if (data) setCurrency(data.currency || 'USD');
            };
            fetchStoreSettings();
        }
    }, [storeId]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        const { error } = await supabase.from('coupons').delete().eq('id', id);
        if (error) {
            alert('Error deleting coupon');
        } else {
            setCoupons(coupons.filter(c => c.id !== id));
        }
    };

    const handleToggleStatus = async (coupon) => {
        const newStatus = !coupon.is_active;
        const { error } = await supabase
            .from('coupons')
            .update({ is_active: newStatus })
            .eq('id', coupon.id);

        if (error) {
            alert('Error updating status');
        } else {
            setCoupons(coupons.map(c => c.id === coupon.id ? { ...c, is_active: newStatus } : c));
        }
    };

    const handleCopyCode = (code, id) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredCoupons = coupons.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
                    <p className="text-slate-500 mt-1">Manage discount codes and promotions</p>
                </div>
                <Button onClick={() => { setEditingCoupon(null); setIsFormOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Coupon
                </Button>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or code..."
                    className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="text-center py-12">Loading coupons...</div>
            ) : filteredCoupons.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Ticket className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No coupons found</h3>
                    <p className="text-slate-500 mb-6">Create your first coupon code to start driving sales.</p>
                    <Button onClick={() => { setEditingCoupon(null); setIsFormOpen(true); }}>
                        Create Coupon
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredCoupons.map(coupon => (
                        <div key={coupon.id} className={`bg-white p-6 rounded-xl border hover:shadow-md transition-all group ${!coupon.is_active ? 'border-slate-100 opacity-75' : 'border-slate-200'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${coupon.is_active ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Ticket className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            {coupon.name}
                                            <span
                                                onClick={() => handleCopyCode(coupon.code, coupon.id)}
                                                className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono text-xs rounded border border-slate-200 cursor-pointer hover:bg-slate-200 flex items-center gap-1 transition-colors"
                                                title="Click to copy"
                                            >
                                                {coupon.code}
                                                {copiedId === coupon.id ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 opacity-50" />}
                                            </span>
                                        </h3>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            {coupon.discount_type === 'percentage' ? `${coupon.value}% Off` : `${formatCurrency(coupon.value, currency)} Off`}
                                            {' • '}
                                            {coupon.applies_to === 'all' ? 'All Products' :
                                                coupon.applies_to === 'specific_products' ? `${coupon.included_product_ids?.length || 0} Products` :
                                                    `${coupon.included_category_ids?.length || 0} Categories`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Usage</div>
                                        <p className="text-sm font-bold text-slate-700">
                                            {coupon.usage_count}
                                            {coupon.usage_limit ? <span className="text-slate-400 font-normal"> / {coupon.usage_limit}</span> : <span className="text-slate-400 text-xs"> (∞)</span>}
                                        </p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />

                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleToggleStatus(coupon)}
                                            className={`p-2 rounded-lg transition-colors ${coupon.is_active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
                                            title={coupon.is_active ? "Deactivate" : "Activate"}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => { setEditingCoupon(coupon); setIsFormOpen(true); }}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(coupon.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <CouponForm
                    storeId={storeId}
                    coupon={editingCoupon}
                    onSuccess={() => { setIsFormOpen(false); fetchCoupons(); }}
                    onCancel={() => setIsFormOpen(false)}
                />
            )}
        </div>
    );
}
