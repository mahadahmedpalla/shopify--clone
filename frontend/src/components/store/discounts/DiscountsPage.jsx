import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { DiscountForm } from './DiscountForm';
import {
    Plus,
    Search,
    Percent,
    DollarSign,
    MoreHorizontal,
    Trash2,
    Edit,
    Calendar,
    Power
} from 'lucide-react';

export function DiscountsPage() {
    const { storeId } = useParams();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState(null);

    useEffect(() => {
        fetchDiscounts();
    }, [storeId]);

    const fetchDiscounts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('discounts')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching discounts:', error);
        } else {
            setDiscounts(data || []);
        }
        setLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this discount?')) return;

        const { error } = await supabase.from('discounts').delete().eq('id', id);
        if (error) alert('Error deleting discount');
        else fetchDiscounts();
    };

    const handleToggleStatus = async (discount) => {
        const { error } = await supabase
            .from('discounts')
            .update({ is_active: !discount.is_active })
            .eq('id', discount.id);

        if (error) alert('Error updating status');
        else fetchDiscounts();
    };

    const filteredDiscounts = discounts.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Discounts</h1>
                    <p className="text-slate-500 text-sm">Create and manage your store promotions</p>
                </div>
                <Button onClick={() => { setSelectedDiscount(null); setShowForm(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Discount
                </Button>
            </div>

            {/* Content */}
            <Card className="p-0 overflow-hidden border-slate-200">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search discounts..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Loading discounts...</div>
                    ) : filteredDiscounts.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <Percent className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1">No discounts found</h3>
                            <p className="text-slate-500 text-sm mb-6">Get started by creating your first promotion.</p>
                            <Button onClick={() => { setSelectedDiscount(null); setShowForm(true); }}>
                                Create Discount
                            </Button>
                        </div>
                    ) : (
                        filteredDiscounts.map((discount) => (
                            <div key={discount.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-3 rounded-xl border ${discount.is_active ? 'bg-green-50 border-green-200 text-green-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        {discount.discount_type === 'percentage' ? <Percent className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <h3 className={`font-bold text-sm ${discount.is_active ? 'text-slate-900' : 'text-slate-500'}`}>
                                                {discount.name}
                                            </h3>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${discount.is_active
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                                }`}>
                                                {discount.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-3">
                                            <span className="font-semibold text-indigo-600">
                                                {discount.discount_type === 'percentage' ? `${discount.value}% Off` : `$${discount.value} Off`}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {discount.applies_to === 'all' ? 'All Products' :
                                                    discount.applies_to === 'specific_products' ? 'Selected Products' : 'Selected Categories'}
                                            </span>
                                            {discount.ends_at && (
                                                <>
                                                    <span>•</span>
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        Ends {new Date(discount.ends_at).toLocaleDateString()}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleToggleStatus(discount)}
                                        className={`p-2 rounded-lg transition-colors ${discount.is_active ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title={discount.is_active ? 'Deactivate' : 'Activate'}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => { setSelectedDiscount(discount); setShowForm(true); }}
                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(discount.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {showForm && (
                <DiscountForm
                    storeId={storeId}
                    discount={selectedDiscount}
                    onSuccess={() => { setShowForm(false); fetchDiscounts(); }}
                    onCancel={() => setShowForm(false)}
                />
            )}
        </div>
    );
}
